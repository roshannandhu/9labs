import { GLYPHS, NINE_VB, type GlyphKey } from "./nine-path";

export const LEAN = 7; // degrees: the 9 leans forward, top to the right

/**
 * A soft ambient crosshair behind the 9 — a quiet hint of "planned, then built" rather than
 * a technical drawing: a horizontal and vertical guide, one soft circle, and the 7° lean axis.
 * No readouts, dimensions or registration marks — those read as engineering, not as a creative
 * studio's mark-making. Same 400×600 coordinate system as the glyph; this layer stays upright
 * while the 9 leans, and settles to a whisper once the 9 is lit.
 */
export function BlueprintConstruction({ className = "", glyph = "sora" }: { className?: string; glyph?: GlyphKey }) {
  const { x0, y0, x1, y1 } = GLYPHS[glyph].bounds;
  const cx = (x0 + x1) / 2;
  const r = (x1 - x0) / 2;
  const cy = y0 + r * 0.98;
  const line = { fill: "none", stroke: "white", vectorEffect: "non-scaling-stroke" as const, strokeWidth: 1 };
  const dl = (i: number) => ({ animationDelay: `${0.1 + i * 0.1}s` });
  // The 9 leans 7° around y = 309 (see .nine-lean): its axis runs from (bx, y1) to (tx, y0).
  const t7 = Math.tan((LEAN * Math.PI) / 180);
  const bx = cx - t7 * (y1 - 309);
  const tx = cx + t7 * (309 - y0);

  return (
    <svg viewBox={`0 0 ${NINE_VB.w} ${NINE_VB.h}`} className={`pointer-events-none overflow-visible ${className}`} aria-hidden="true">
      <g className="construct-settle">
        <path d={`M -40 ${cy} H 440`} pathLength={1} className="construct-draw" {...line} strokeOpacity="0.1" style={dl(0)} />
        <path d={`M ${cx} 24 V 588`} pathLength={1} className="construct-draw" {...line} strokeOpacity="0.1" style={dl(1)} />
        <circle cx={cx} cy={cy} r={r + 22} pathLength={1} className="construct-draw" {...line} strokeOpacity="0.08" style={dl(2)} />
        {/* 7° lean axis, a quiet nod to the 9's own tilt */}
        <path d={`M ${bx} ${y1 + 18} L ${tx + t7 * 24} ${y0 - 6}`} pathLength={1} className="construct-draw" {...line} stroke="var(--nl-purple)" strokeOpacity="0.4" style={dl(3)} />
      </g>
    </svg>
  );
}
