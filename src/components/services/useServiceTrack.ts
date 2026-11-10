"use client";

import { useRef, useState, type RefObject } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { getLenis } from "@/lib/scroll";
import { site } from "@/content/site";
import { particleBus, heroTarget, digitTarget, picTarget, allNineTarget } from "@/components/particles/bus";

const services = site.services;
const N = services.length; // 9
const SNAP_IDLE_MS = 130;
const SNAP_DURATION = 0.5;

/**
 * Drives the particle swarm continuously from the services track's own scroll position — no pin,
 * fully reversible, the one technique used end to end. Three small, disjoint scroll ranges hand
 * off to one another automatically (a scrubbed ScrollTrigger only calls `onUpdate` while *its own*
 * progress is actually changing, so there's never a moment two of them are both writing):
 *   - **lead-in**: hero → digit "1" → the first picture, as the track scrolls up to the top
 *   - **track**: picture → picture, continuously, across all nine scenes
 *   - **finale**: the ninth picture → the "all nine" 9, as the finale section scrolls into view
 * While inside the track, scrolling that comes to rest partway between two scenes glides the rest
 * of the way (Lenis's own smooth `scrollTo`) so every scene still ends up filling the screen, the
 * way a native swipe/snap page would — without an actual CSS/JS scroll lock anywhere.
 *
 * Returns the current (rounded) active scene index 0..8, updated only when it changes — scenes
 * use it for their own light "once settled" flourish, never for anything continuous.
 */
export function useServiceTrack(trackRef: RefObject<HTMLElement | null>, finaleRef: RefObject<HTMLElement | null>): number {
  const { reduced } = useDemo();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);

  useGSAP(() => {
    if (reduced) return;
    const track = trackRef.current;
    const finale = finaleRef.current;
    if (!track || !finale) return;

    let lastPos = 0;
    const writeLeadIn = (progress: number) => {
      particleBus.dir = 1;
      if (progress < 0.5) {
        particleBus.from = heroTarget;
        particleBus.to = digitTarget(1);
        particleBus.u = progress / 0.5;
      } else {
        particleBus.from = digitTarget(1);
        particleBus.to = picTarget(services[0].icon);
        particleBus.u = (progress - 0.5) / 0.5;
      }
    };
    const writeTrack = (progress: number) => {
      const pos = Math.min(N - 1, Math.max(0, progress * (N - 1)));
      const dir = pos >= lastPos ? 1 : -1;
      lastPos = pos;
      const index = Math.min(N - 1, Math.floor(pos));
      const frac = pos - index;
      const toIndex = Math.min(N - 1, index + 1);
      if (frac <= 0.001 || frac >= 0.999) {
        const snapIndex = frac >= 0.999 ? toIndex : index;
        particleBus.from = picTarget(services[snapIndex].icon);
        particleBus.to = picTarget(services[snapIndex].icon);
        particleBus.u = 0;
      } else {
        particleBus.from = picTarget(services[index].icon);
        particleBus.to = picTarget(services[toIndex].icon);
        particleBus.dir = dir;
        particleBus.u = frac;
      }
      const rounded = Math.round(pos);
      if (rounded !== activeRef.current) {
        activeRef.current = rounded;
        setActiveIndex(rounded);
      }
    };
    const writeFinale = (progress: number) => {
      particleBus.dir = 1;
      particleBus.from = picTarget(services[N - 1].icon);
      particleBus.to = allNineTarget;
      particleBus.u = progress;
    };

    const leadIn = ScrollTrigger.create({
      trigger: track,
      start: "top bottom",
      end: "top top",
      scrub: true,
      onUpdate: (s) => writeLeadIn(s.progress),
      onRefresh: (s) => writeLeadIn(s.progress),
    });
    const main = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (s) => writeTrack(s.progress),
      onRefresh: (s) => writeTrack(s.progress),
    });
    const fin = ScrollTrigger.create({
      trigger: finale,
      start: "top bottom",
      end: "top 30%",
      scrub: true,
      onUpdate: (s) => writeFinale(s.progress),
      onRefresh: (s) => writeFinale(s.progress),
    });

    // snap-settle: once scrolling stops partway between two scenes, glide the rest of the way
    let idle: number | null = null;
    const onScroll = () => {
      if (idle != null) window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        const p = main.progress;
        if (p <= 0 || p >= 1) return; // resting at either end already — the other triggers own this
        const pos = p * (N - 1);
        const nearest = Math.round(pos);
        if (Math.abs(pos - nearest) < 0.015) return;
        const targetY = main.start + (nearest / (N - 1)) * (main.end - main.start);
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(targetY, { duration: SNAP_DURATION, easing: (t: number) => 1 - (1 - t) ** 3 });
        else window.scrollTo({ top: targetY, behavior: "smooth" });
      }, SNAP_IDLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      leadIn.kill();
      main.kill();
      fin.kill();
      window.removeEventListener("scroll", onScroll);
      if (idle != null) window.clearTimeout(idle);
    };
  }, [reduced]);

  return activeIndex;
}
