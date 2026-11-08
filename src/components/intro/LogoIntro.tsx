"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/scroll";
import { useDemo } from "@/components/providers/DemoSettings";
import { LogoMark, LogoTagline } from "@/components/brand/LogoMark";
import { introPlaying, markIntroDone } from "./introBus";

/**
 * Landing animation — "The Hidden 9" (~3 s, once per session, skippable).
 *
 *  1. L, B and S rise into place, leaving a gap where the A should be.
 *  2. The 9 drops into the gap with a soft bounce; the triangle leg slides in and locks — the A
 *     was a 9 all along. A small flash marks the lock.
 *  3. A light sweep runs across the wordmark, the S's two node dots glow, and
 *     "NINE LABS / SOLUTIONS" spreads in underneath.
 *  4. The logo flies to the nav (top-left) and lands exactly on the real nav logo, the overlay
 *     fades, and only then does the hero start (it waits on `markIntroDone`).
 *
 * The overlay is server-rendered and shown by CSS only while `<html data-intro="playing">`
 * (set pre-paint by the layout's boot script), so the site never flashes underneath it.
 * Reduced motion, or a second visit this session: no overlay — the logo is simply in the nav.
 */
export function LogoIntro() {
  const { reduced, ready } = useDemo();
  const root = useRef<HTMLDivElement>(null);
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
    const wrap = mark.current;
    const svg = wrap?.querySelector("svg");
    if (!wrap || !svg) return;
    const part = (p: string) => svg.querySelector<SVGElement>(`[data-part="${p}"]`);
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
    // background tabs). The intro normally ends in ~3 s.
    guard = window.setTimeout(() => {
      tl.kill();
      fly?.kill();
      finish();
    }, 7000);

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(part("L"), { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.1)
      .fromTo(part("B"), { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.18)
      .fromTo(part("S"), { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.26)
      // the 9 drops into the A's slot…
      .fromTo(part("nine"), { y: -210, opacity: 1 }, { y: 0, opacity: 1, duration: 0.75, ease: "bounce.out" }, 0.55)
      // …and the triangle leg locks it in
      .fromTo(part("leg"), { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 1.05)
      .fromTo(part("flash"), { opacity: 0.85, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 0, scale: 1.4, duration: 0.6, ease: "power2.out" }, 1.3)
      // gradient sweep + node dots + tagline
      .fromTo(part("sweep"), { attr: { x: -220 }, opacity: 1 }, { attr: { x: 740 }, duration: 0.9, ease: "power2.inOut" }, 1.25)
      .fromTo(part("dots"), { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, 1.55)
      .to(part("dots"), { opacity: 0, duration: 0.5, ease: "power1.in" }, 2.05)
      .fromTo(tag.current, { opacity: 0, "--tag-track": "1.3em" }, { opacity: 1, "--tag-track": "0.62em", duration: 0.9 }, 1.35)
      .fromTo(hint.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.6)
      .to({}, { duration: 0.25 })
      // fly onto the nav logo
      .add(() => {
        const target = document.querySelector<HTMLElement>("[data-logo-9] svg");
        const from = wrap.getBoundingClientRect();
        const to = target?.getBoundingClientRect();
        fly = gsap.timeline({ onComplete: finish });
        fly.to([tag.current, hint.current], { opacity: 0, y: 8, duration: 0.3, ease: "power2.in" }, 0);
        if (to && to.width > 0) {
          fly.to(
            wrap,
            {
              x: to.left + to.width / 2 - (from.left + from.width / 2),
              y: to.top + to.height / 2 - (from.top + from.height / 2),
              scale: to.width / from.width,
              duration: skipped ? 0.45 : 0.9,
              ease: "expo.inOut",
            },
            0.08,
          );
        } else {
          fly.to(wrap, { opacity: 0, duration: 0.4 }, 0.08);
        }
        fly.to(bg.current, { opacity: 0, duration: skipped ? 0.3 : 0.55, ease: "power1.out" }, skipped ? 0.1 : 0.45);
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
    <div ref={root} className="logo-intro fixed inset-0 z-[150] items-center justify-center" aria-hidden="true">
      <div ref={bg} className="logo-intro__bg absolute inset-0" />
      <div className="relative flex flex-col items-center px-6">
        <div ref={mark} className="logo-intro__mark w-[min(80vw,580px)] will-change-transform">
          <LogoMark className="block h-auto w-full overflow-hidden" />
        </div>
        <div ref={tag} className="mt-6 sm:mt-8">
          <LogoTagline className="[--tag-size:clamp(11px,2.6vw,17px)]" />
        </div>
      </div>
      <p ref={hint} className="logo-intro__hint absolute bottom-8 left-0 right-0 text-center">
        Tap to skip
      </p>
    </div>
  );
}
