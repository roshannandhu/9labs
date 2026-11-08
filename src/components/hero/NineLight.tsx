"use client";

import { useEffect, useRef } from "react";
import { GLYPHS, NINE_VB, type GlyphKey } from "./nine-path";

/**
 * The hero 9, "built from light": one clean glyph filled with electric-blue light, a lighter
 * core, a neon-purple glow outside the edges and a thin highlight where light catches the
 * top-left edges. Pure SVG + CSS (see `.nine-*` in globals.css), so it paints with the HTML.
 *
 * Intro (CSS keyframes): a spark traces the outline (0.6–1.6 s), then light floods the glyph
 * from the bottom up with a glowing wave crest (1.4–2.4 s) and the glow blooms to purple.
 * At rest it breathes (~5 s), a light band slides across every ~8 s, and on desktop a soft
 * hotspot follows the cursor inside the fill. The fill is opaque, so orbit items that pass
 * behind the 9 are really hidden.
 */
export function NineLight({ className = "", glyph = "sora" }: { className?: string; glyph?: GlyphKey }) {
  const d = GLYPHS[glyph].d;
  const svg = useRef<SVGSVGElement>(null);
  const hot = useRef<SVGCircleElement>(null);

  // Cursor hotspot (fine pointers only). ponytail: maps the pointer through the unskewed box,
  // so the spot sits up to ~7% off at the very top/bottom of the leaning 9 — invisible on a
  // 110-unit soft spot. Use getScreenCTM().inverse() if it ever needs to be exact.
  useEffect(() => {
    const el = svg.current;
    const spot = hot.current;
    if (!el || !spot || !window.matchMedia("(pointer: fine)").matches) return;
    const host = el.closest("section") ?? el;
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const x = ((px - r.left) / r.width) * NINE_VB.w;
      const y = ((py - r.top) / r.height) * NINE_VB.h;
      const near = x > -60 && x < NINE_VB.w + 60 && y > 30 && y < NINE_VB.h - 10;
      spot.setAttribute("cx", x.toFixed(1));
      spot.setAttribute("cy", y.toFixed(1));
      spot.style.opacity = near ? "1" : "0";
    };
    const onMove = (e: Event) => {
      const p = e as PointerEvent;
      if (p.pointerType !== "mouse") return;
      px = p.clientX;
      py = p.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      spot.style.opacity = "0";
    };
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // A gentle wave for the rising light's crest (one period = 65 units).
  const crest = `M-80 0${" q16 -10 32.5 0 t32.5 0".repeat(10)} V720 H-80 Z`;

  return (
    <div className={`nine-lean relative ${className}`} style={{ aspectRatio: `${NINE_VB.w} / ${NINE_VB.h}` }} aria-hidden="true">
      {/* Soft blue → purple aura that bleeds past the hero's edges */}
      <div className="nine-aura pointer-events-none absolute -inset-[45%] rounded-full" />

      <svg ref={svg} viewBox={`0 0 ${NINE_VB.w} ${NINE_VB.h}`} className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <filter id="nl-halo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="nl-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <radialGradient id="nl-fill" gradientUnits="userSpaceOnUse" cx="190" cy="250" r="360">
            <stop offset="0" style={{ stopColor: "var(--nl-blue-soft)" }} />
            <stop offset="0.42" style={{ stopColor: "var(--nl-blue)" }} />
            <stop offset="1" style={{ stopColor: "color-mix(in oklab, var(--nl-blue) 62%, var(--nl-purple))" }} />
          </radialGradient>
          <linearGradient id="nl-edge" x1="0" y1="0" x2="0.75" y2="0.75">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nl-band" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="nl-hot">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.5" style={{ stopColor: "var(--nl-blue-soft)" }} stopOpacity="0.25" />
            <stop offset="1" style={{ stopColor: "var(--nl-blue-soft)" }} stopOpacity="0" />
          </radialGradient>
          <clipPath id="nl-clip">
            <path d={d} />
          </clipPath>
        </defs>

        {/* Outer glow: purple at the edges, blooms when the light reaches the top, then breathes */}
        <path d={d} className="nine-halo" fill="var(--nl-purple)" fillOpacity="0.55" stroke="var(--nl-blue)" strokeOpacity="0.55" strokeWidth="30" filter="url(#nl-halo)" />

        <g clipPath="url(#nl-clip)">
          {/* Light floods the glyph from the bottom up */}
          <g className="nine-flood">
            <path d={crest} fill="url(#nl-fill)" />
            <path d={crest.split(" V720")[0]} className="nine-crest" fill="none" stroke="#fff" strokeWidth="5" filter="url(#nl-soft)" />
          </g>
          {/* Slow diagonal light band */}
          <g transform="rotate(18 200 300)">
            <rect className="nine-sheen" x="-260" y="-120" width="150" height="840" fill="url(#nl-band)" />
          </g>
          {/* Cursor hotspot */}
          <circle ref={hot} className="nine-hot" cx="200" cy="300" r="120" fill="url(#nl-hot)" />
          {/* Light catching the top-left edges (only the inner half shows: the group is clipped) */}
          <path d={d} className="nine-edge" fill="none" stroke="url(#nl-edge)" strokeWidth="6" />
        </g>

        {/* The pen: outline trace + spark, melting into the edge highlight */}
        <path d={d} pathLength={1} className="nine-trace" fill="none" stroke="var(--nl-blue-soft)" strokeWidth="2" strokeLinejoin="round" />
        <path d={d} pathLength={1} className="nine-spark" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" filter="url(#nl-soft)" />
      </svg>
    </div>
  );
}
