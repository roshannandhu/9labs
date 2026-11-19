"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True once `ref` is within ~1.5 screens of the viewport — long before it can be seen — so heavy
 * below-the-fold animation setup (GSAP timelines, ScrollTriggers) can wait instead of blocking the
 * page while it hydrates. Reloads, back/forward and #links are true at once: the browser may restore
 * the scroll position past the element.
 */
export function useNear(ref: RefObject<Element | null>, enabled = true): boolean {
  const [near, setNear] = useState(() => {
    if (!enabled || typeof window === "undefined") return !enabled;
    const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
    return !!location.hash || window.scrollY > 0 || (!!nav && nav.type !== "navigate");
  });
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setNear(true);
        io.disconnect();
      }
    }, { rootMargin: "150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near]);
  return near;
}
