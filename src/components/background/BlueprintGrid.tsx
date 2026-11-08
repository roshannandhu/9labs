"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed blueprint grid behind the whole page (pure CSS layers, see globals.css):
 * minor + major lines, plus marks at some crossings, a slow drift, a vignette, and a
 * brighter "hot" grid revealed in a soft circle around the cursor, lines near the hero 9
 * lit as if by its glow, and a ±4 px mouse parallax. Fades to a fainter level after the
 * hero so it never competes with the sections below.
 */
export function BlueprintGrid() {
  const root = useRef<HTMLDivElement>(null);
  const hot = useRef<HTMLDivElement>(null);
  const lit = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const r = root.current;
    const h = hot.current;
    const g = lit.current;
    if (!r || !h || !g) return;
    const nine = document.querySelector<HTMLElement>("[data-hero-nine]");
    let raf = 0;
    let mx = -999;
    let my = -999;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const apply = () => {
      raf = 0;
      h.style.setProperty("--mx", `${mx}px`);
      h.style.setProperty("--my", `${my}px`);
      if (mx > -999) {
        r.style.setProperty("--px", `${((mx / window.innerWidth) * 2 - 1) * -4}px`);
        r.style.setProperty("--py", `${((my / window.innerHeight) * 2 - 1) * -4}px`);
      }
      if (nine) {
        const b = nine.getBoundingClientRect();
        g.style.setProperty("--nx", `${b.left + b.width / 2}px`);
        g.style.setProperty("--ny", `${b.top + b.height * 0.5}px`);
        g.style.setProperty("--nr", `${Math.max(160, b.height * 0.75)}px`);
      }
      const fade = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
      r.style.setProperty("--bp-opacity", String(1 - fade * 0.45));
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
      <div className="bp-plus" />
      <div ref={hot} className="bp-hot">
        <div className="bp-grid bp-grid--hot" />
      </div>
      <div ref={lit} className="bp-lit">
        <div className="bp-grid bp-grid--hot" />
      </div>
      <div className="bp-vignette" />
    </div>
  );
}
