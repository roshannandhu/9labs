"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/scroll";
import { useDemo } from "@/components/providers/DemoSettings";
import { LogoMark, LogoTagline, aPath } from "@/components/brand/LogoMark";
import { introPlaying, markIntroDone } from "./introBus";

/**
 * Landing animation — "The Hidden 9" (~4 s, once per session, skippable), on the logo's own
 * lavender, in the logo's own colours.
 *
 *  1. "LABS" rises in — an ordinary word.
 *  2. The 9 appears above and falls onto the A. On impact the A gives way and becomes the
 *     triangle leg, the 9 bounces once and settles: the logo, "L9BS".
 *  3. A light sweep crosses the wordmark; "NINE LABS / SOLUTIONS" spreads in underneath.
 *  4. The lavender screen shrinks into the nav's lavender logo badge while the logo flies onto
 *     the nav logo; only then does the hero start (it waits on `markIntroDone`).
 *
 * The overlay is server-rendered and shown by CSS only while `<html data-intro="playing">`
 * (set pre-paint by the layout's boot script), so the site never flashes underneath it.
 * Reduced motion, or a second visit this session: no overlay — the logo is simply in the nav.
 */
export function LogoIntro() {
  const { reduced, ready } = useDemo();
  const bg = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!introPlaying() || reduced) {
      markIntroDone();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off unmount once client settings are known
      setGone(true);
      return;
    }
    // capture the elements now: timeline callbacks may run after the overlay has unmounted
    const wrap = mark.current;
    const tagEl = tag.current;
    const hintEl = hint.current;
    const bgEl = bg.current;
    const svg = wrap?.querySelector("svg");
    if (!wrap || !svg) return;
    const part = (p: string) => svg.querySelector<SVGElement>(`[data-part="${p}"]`);
    const A = part("A");
    const lenis = getLenis();
    lenis?.stop();

    let skipped = false;
    let fly: gsap.core.Timeline | null = null;
    let guard = 0;
    const finish = () => {
      window.clearTimeout(guard);
      markIntroDone();
      lenis?.start();
      setGone(true);
    };
    // Safety net: never leave a visitor stuck behind the overlay (throttled/low-power devices,
    // background tabs). The intro normally ends in ~4 s.
    guard = window.setTimeout(() => {
      tl.kill();
      fly?.kill();
      finish();
    }, 8000);

    const morph = { t: 0 };
    const HIT = 1.6; // the moment the 9 lands on the A
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(
      [part("L"), A, part("B"), part("S")],
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, stagger: 0.07 },
      0.1,
    )
      // the 9 shows up above the word and drops onto the A…
      .fromTo(part("nine"), { y: -330, opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" }, HIT - 0.45)
      .fromTo(part("nine"), { y: -330 }, { y: 0, duration: 0.45, ease: "power3.in" }, HIT - 0.45)
      // …the A gives way and becomes the triangle leg
      .to(
        morph,
        {
          t: 1,
          duration: 0.34,
          ease: "power3.out",
          onUpdate: () => A?.setAttribute("d", aPath(morph.t)),
        },
        HIT,
      )
      .set(A, { opacity: 0 }, HIT + 0.34)
      .set(part("leg"), { opacity: 1 }, HIT + 0.34)
      // the impact: the 9 bounces once, the word dips under it
      .to(part("nine"), { y: -16, duration: 0.14, ease: "power2.out" }, HIT)
      .to(part("nine"), { y: 0, duration: 0.22, ease: "power2.in" }, HIT + 0.14)
      .to([part("L"), part("B"), part("S")], { y: 5, duration: 0.08, ease: "power1.out", yoyo: true, repeat: 1 }, HIT)
      // light sweep + tagline
      .fromTo(part("sweep"), { attr: { x: -220 }, opacity: 1 }, { attr: { x: 740 }, duration: 0.9, ease: "power2.inOut" }, HIT + 0.4)
      .fromTo(tagEl, { opacity: 0, "--tag-track": "1.3em" }, { opacity: 1, "--tag-track": "0.54em", duration: 0.9 }, HIT + 0.45)
      .fromTo(hintEl, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.6)
      .to({}, { duration: 0.3 })
      // the lavender screen shrinks into the nav badge; the logo flies onto the nav logo
      .add(() => {
        const badge = document.querySelector<HTMLElement>("[data-logo-9]");
        const target = badge?.querySelector("svg")?.getBoundingClientRect();
        const box = badge?.getBoundingClientRect();
        const from = wrap.getBoundingClientRect();
        const dur = skipped ? 0.45 : 0.9;
        fly = gsap.timeline({ onComplete: finish });
        fly.to([tagEl, hintEl], { opacity: 0, y: 8, duration: 0.3, ease: "power2.in" }, 0);
        if (target && box && target.width > 0) {
          fly.to(
            wrap,
            {
              x: target.left + target.width / 2 - (from.left + from.width / 2),
              y: target.top + target.height / 2 - (from.top + from.height / 2),
              scale: target.width / from.width,
              duration: dur,
              ease: "expo.inOut",
            },
            0.08,
          );
          const W = window.innerWidth;
          const H = window.innerHeight;
          const r = getComputedStyle(badge!).borderTopLeftRadius || "12px";
          fly.fromTo(
            bgEl,
            { clipPath: "inset(0px 0px 0px 0px round 0px)" },
            {
              clipPath: `inset(${box.top}px ${W - box.right}px ${H - box.bottom}px ${box.left}px round ${r})`,
              duration: dur,
              ease: "expo.inOut",
            },
            0.08,
          );
        } else {
          fly.to([wrap, bgEl], { opacity: 0, duration: 0.4 }, 0.08);
        }
      });

    // Any input skips ahead (fast-forwards to the fly-in; nothing is cut off mid-way).
    const skip = () => {
      if (skipped) return;
      skipped = true;
      tl.timeScale(6);
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", skip, opts);
    window.addEventListener("wheel", skip, opts);
    window.addEventListener("touchmove", skip, opts);
    window.addEventListener("keydown", skip);

    return () => {
      window.clearTimeout(guard);
      tl.kill();
      fly?.kill();
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
      window.removeEventListener("keydown", skip);
      lenis?.start();
    };
  }, [ready, reduced]);

  if (gone) return null;
  return (
    <div className="logo-intro fixed inset-0 z-[150] items-center justify-center" aria-hidden="true">
      <div ref={bg} className="logo-intro__bg absolute inset-0" />
      {/* the tagline is sized in % of this box (= the wordmark's width), as in the logo file */}
      <div className="logo-lockup relative w-[min(86vw,580px)]">
        <div ref={mark} className="logo-intro__mark will-change-transform">
          <LogoMark className="block h-auto w-full overflow-visible" />
        </div>
        <div ref={tag} className="logo-intro__tag">
          <LogoTagline />
        </div>
      </div>
      <p ref={hint} className="logo-intro__hint absolute bottom-8 left-0 right-0 text-center">
        Tap to skip
      </p>
    </div>
  );
}
