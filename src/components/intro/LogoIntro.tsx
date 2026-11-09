"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/scroll";
import { useDemo } from "@/components/providers/DemoSettings";
import { LogoMark, LogoTagline } from "@/components/brand/LogoMark";
import { introPlaying, markIntroDone } from "./introBus";

/**
 * Landing animation — "The Hidden 9" (~3 s, once per session, skippable), on the logo's lavender.
 *
 *  1. The logo is on screen without its 9 (L, the A's triangle, B, S), still. The 9 is invisible.
 *  2. Only the 9 moves: it appears above and falls into the A and the 9 settles with one small bounce: the logo, "L9BS".
 *  3. "NINE LABS / SOLUTIONS" fades in underneath.
 *  4. The logo flies to the nav (top-left) and lands exactly on the nav logo; the overlay fades.
 *     Only then does the hero start (it waits on `markIntroDone`).
 *
 * The overlay is server-rendered and shown by CSS only while `<html data-intro="playing">`
 * (set pre-paint by the layout's boot script), so the logo is there from the first paint and the
 * site never flashes underneath. Reduced motion, or a second visit this session: no overlay.
 * `?intro` in the URL replays it.
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
    const nine = part("nine");
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

    const HIT = 1.15; // the moment the 9 lands on the A
    const tl = gsap.timeline();
    // Safety net: never leave a visitor stuck behind the overlay (throttled/low-power devices,
    // background tabs). The intro normally ends in ~3 s.
    guard = window.setTimeout(() => {
      tl.kill();
      fly?.kill();
      finish();
    }, 8000);

    tl.set(nine, { y: -330, opacity: 0 }, 0)
      .to(nine, { opacity: 1, duration: 0.2, ease: "none" }, HIT - 0.5)
      .to(nine, { y: 0, duration: 0.5, ease: "power3.in" }, HIT - 0.5)
      // one small bounce
      .to(nine, { y: -14, duration: 0.13, ease: "power2.out" }, HIT)
      .to(nine, { y: 0, duration: 0.2, ease: "power2.in" }, HIT + 0.13)
      .fromTo(tagEl, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, HIT + 0.4)
      .fromTo(hintEl, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.4)
      .to({}, { duration: 0.45 })
      // fly onto the nav logo, overlay fades
      .add(() => {
        const target = document.querySelector<HTMLElement>("[data-logo-9] svg")?.getBoundingClientRect();
        const from = wrap.getBoundingClientRect();
        const dur = skipped ? 0.45 : 0.85;
        fly = gsap.timeline({ onComplete: finish });
        fly.to([tagEl, hintEl], { opacity: 0, duration: 0.25, ease: "power2.in" }, 0);
        if (target && target.width > 0) {
          fly.to(
            wrap,
            {
              x: target.left + target.width / 2 - (from.left + from.width / 2),
              y: target.top + target.height / 2 - (from.top + from.height / 2),
              scale: target.width / from.width,
              duration: dur,
              ease: "expo.inOut",
            },
            0.05,
          );
        } else {
          fly.to(wrap, { opacity: 0, duration: 0.4 }, 0.05);
        }
        fly.to(bgEl, { opacity: 0, duration: dur * 0.6, ease: "power1.out" }, 0.05 + dur * 0.4);
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
      <div className="logo-lockup relative w-[min(84vw,580px)]">
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
