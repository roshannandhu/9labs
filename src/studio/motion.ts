"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion, type Variants } from "motion/react";

export const EASE = [0.16, 1, 0.3, 1] as const;
export const DUR = { micro: 0.12, base: 0.22, panel: 0.42, draw: 0.7 };
export const SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;

/** A panel's enter animation, staggered by its position in a list (`i * 40ms`). */
export const fadeUp = (i: number): Variants => ({
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, delay: i * 0.04, ease: EASE } },
});

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Counts a number up from 0 on mount/change — the Dashboard's KPI values. Instant under reduced motion. */
export function useCountUp(value: number, ms = 900): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion skips the animation and jumps straight to the final value
      setShown(value);
      return;
    }
    const start = performance.now();
    const base = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setShown(Math.round(base + (value - base) * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduced]);

  return shown;
}
