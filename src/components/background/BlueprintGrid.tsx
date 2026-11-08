"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed blueprint grid behind the whole page (pure CSS layers, see globals.css):
 * minor + major lines, a slow drift, a vignette, and a
 * brighter "hot" grid revealed in a soft circle around the cursor, and a ±4 px mouse parallax. Fades to a fainter level after the
 * hero so it never competes with the sections below.
 */
export function BlueprintGrid() {
  const root = useRef<HTMLDivElement>(null);
  const hot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = root.current;
    const h = hot.current;
    if (!r || !h) return;
    let raf = 0;
    let mx = -999;
    let my = -999;
    const fine = window.matchMedia("(pointer: fine)").matches;
    // Write a custom property only when its value really changes: every write to a masked,
    // full-screen layer forces a repaint, which is what made phones flicker on scroll.
    const last = new Map<string, string>();
    const put = (el: HTMLElement, k: string, v: string) => {
      const key = k + (el === h ? "h" : "r");
      if (last.get(key) === v) return;
      last.set(key, v);
      el.style.setProperty(k, v);
    };

    const apply = () => {
      raf = 0;
      put(h, "--mx", `${mx}px`);
      put(h, "--my", `${my}px`);
      if (mx > -999) {
        r.style.setProperty("--px", `${((mx / window.innerWidth) * 2 - 1) * -4}px`);
        r.style.setProperty("--py", `${((my / window.innerHeight) * 2 - 1) * -4}px`);
      }
      // fades well past the hero so it never competes with the content below (brief: "more faintly")
      const fade = Math.min(1, window.scrollY / (window.innerHeight * 0.75));
      put(r, "--bp-opacity", (1 - fade * 0.72).toFixed(2));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX;
      my = e.clientY;
      schedule();
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} className="bp-root" aria-hidden="true">
      <div className="bp-grid" />
      <div ref={hot} className="bp-hot">
        <div className="bp-grid bp-grid--hot" />
      </div>
      <div className="bp-vignette" />
    </div>
  );
}
