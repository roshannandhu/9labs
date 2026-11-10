"use client";

import { useState, type RefObject } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";

/**
 * 0 → 1 as a section scrolls up into view — from its top entering the bottom of the viewport to
 * its top reaching `end` — then holds at 1 for the rest of the scroll. Never pins, never locks:
 * it's a plain read of scroll position (via a non-pinned, scrubbed ScrollTrigger), the same
 * technique every scene uses instead of a timer or an auto-play. Reduced motion: always 1 (every
 * scene renders already finished, no motion).
 *
 * `end` is always a string literal at the call site (never a value that changes across renders),
 * so it's read once, inside the effect — not a dependency.
 */
export function useSceneProgress(ref: RefObject<HTMLElement | null>, end = "top 35%"): number {
  const { reduced } = useDemo();
  const [progress, setProgress] = useState(0);

  useGSAP(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end,
      scrub: true,
      onUpdate: (s) => setProgress(s.progress),
      onRefresh: (s) => setProgress(s.progress),
    });
    return () => st.kill();
  }, [reduced]);

  return reduced ? 1 : progress;
}
