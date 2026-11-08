import { GLYPHS, NINE_VB, type GlyphKey } from "./nine-path";

/**
 * Concept A — "Neon" (also the instant poster for the 3D concept).
 * A bold font 9 built like a channel letter: a dark glass body, a neon tube running around
 * the glyph outline (blue core, purple halo, white-hot centre) and light that travels along
 * it. 100% SVG + CSS — pathLength="1" lets CSS draw it on before any JavaScript loads.
 */
export function NineNeon({ className = "", glyph = "sora" }: { className?: string; glyph?: GlyphKey }) {
  const d = GLYPHS[glyph].d;
  const vb = `0 0 ${NINE_VB.w} ${NINE_VB.h}`;
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${NINE_VB.w} / ${NINE_VB.h}` }} aria-hidden="true">
      {/* Soft blue→purple aura behind the 9 */}
      <div
        className="nine-glow absolute -inset-[30%] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--nl-blue) 32%, transparent), color-mix(in srgb, var(--nl-purple) 15%, transparent) 55%, transparent 78%)",
          filter: "blur(30px)",
        }}
      />

      {/* Halo + glass body */}
      <svg viewBox={vb} className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <filter id="nine-halo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <linearGradient id="nine-body" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#141c3d" />
            <stop offset="0.55" stopColor="#0a0e20" />
            <stop offset="1" stopColor="#120c26" />
          </linearGradient>
          <radialGradient id="nine-inner" cx="0.5" cy="0.38" r="0.62">
            <stop offset="0" style={{ stopColor: "var(--nl-blue)" }} stopOpacity="0.28" />
            <stop offset="1" style={{ stopColor: "var(--nl-purple)" }} stopOpacity="0.06" />
          </radialGradient>
        </defs>
        <path d={d} className="nine-glow" fill="var(--nl-purple)" fillOpacity="0.5" stroke="var(--nl-blue)" strokeOpacity="0.5" strokeWidth="26" filter="url(#nine-halo)" />
        <g className="construct-fade" style={{ animationDelay: "1.4s", animationDuration: "1.2s" }}>
          {/* emboldened channel body */}
          <path d={d} fill="url(#nine-body)" stroke="url(#nine-body)" strokeWidth="16" strokeLinejoin="round" />
          <path d={d} fill="url(#nine-inner)" />
        </g>
      </svg>

      {/* Neon tube around the outline */}
      <svg viewBox={vb} className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <filter id="nine-tube-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="nine-spark" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <linearGradient id="nine-core" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--nl-blue-soft)" }} />
            <stop offset="45%" style={{ stopColor: "var(--nl-blue)" }} />
            <stop offset="80%" style={{ stopColor: "var(--nl-blue)" }} />
            <stop offset="100%" style={{ stopColor: "var(--nl-purple)" }} />
          </linearGradient>
        </defs>
        <path d={d} pathLength={1} className="nine-draw" fill="none" stroke="var(--nl-blue)" strokeWidth="14" strokeLinejoin="round" filter="url(#nine-tube-glow)" />
        <path d={d} pathLength={1} className="nine-draw" fill="none" stroke="url(#nine-core)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} pathLength={1} className="nine-draw" fill="none" stroke="#f1f5ff" strokeOpacity="0.9" strokeWidth="1.8" strokeLinejoin="round" />
        <path d={d} pathLength={1} className="nine-shimmer" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" filter="url(#nine-spark)" />
        <path d={d} pathLength={1} className="nine-shimmer nine-shimmer--b" fill="none" stroke="var(--nl-purple)" strokeWidth="7" strokeLinecap="round" filter="url(#nine-spark)" />
      </svg>
    </div>
  );
}
