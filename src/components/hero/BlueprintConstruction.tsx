import { GLYPHS, NINE_VB, type GlyphKey } from "./nine-path";

export const LEAN = 7; // degrees: the 9 leans forward, top to the right

/**
 * Drafting lines around the 9 (bounding box, axes, guide circle on the bowl, dimensions,
 * the 7° lean guide, registration marks). They draw first, then the 9 is traced and filled
 * with light over them — "we plan and build with precision" — and settle to a whisper.
 * Same 400×600 coordinate system as the glyph; this layer stays upright while the 9 leans.
 */
export function BlueprintConstruction({ className = "", glyph = "sora" }: { className?: string; glyph?: GlyphKey }) {
  const { x0, y0, x1, y1 } = GLYPHS[glyph].bounds;
  const w = x1 - x0;
  const cx = (x0 + x1) / 2;
  const r = w / 2;
  const cy = y0 + r * 0.98;
  const line = { fill: "none", stroke: "white", vectorEffect: "non-scaling-stroke" as const, strokeWidth: 1 };
  const label = "font-mono text-[10px] tracking-[0.18em] fill-white/45";
  const dl = (i: number) => ({ animationDelay: `${0.05 + i * 0.06}s` });
  // The 9 leans 7° around y = 309 (see .nine-lean): its axis runs from (bx, y1) to (tx, y0).
  const t7 = Math.tan((LEAN * Math.PI) / 180);
  const bx = cx - t7 * (y1 - 309);
  const tx = cx + t7 * (309 - y0);
  const ar = 74; // angle arc radius

  return (
    <svg viewBox={`0 0 ${NINE_VB.w} ${NINE_VB.h}`} className={`pointer-events-none overflow-visible ${className}`} aria-hidden="true">
      <g className="construct-settle">
      <path d={`M -40 ${cy} H 440`} pathLength={1} className="construct-draw" {...line} strokeOpacity="0.14" style={dl(0)} />
      <path d={`M ${cx} 24 V 588`} pathLength={1} className="construct-draw" {...line} strokeOpacity="0.14" style={dl(1)} />
      <circle cx={cx} cy={cy} r={r + 22} pathLength={1} className="construct-draw" {...line} strokeOpacity="0.09" style={dl(2)} />
      <circle cx={cx} cy={cy} r={r} className="construct-fade" {...line} strokeOpacity="0.18" strokeDasharray="2 7" style={dl(3)} />
      <path d={`M 10 ${y1} H 390`} pathLength={1} className="construct-draw" {...line} strokeOpacity="0.14" style={dl(4)} />
      <path d={`M 10 ${y0} H 390`} pathLength={1} className="construct-draw" {...line} strokeOpacity="0.1" style={dl(5)} />
      <rect x={x0} y={y0} width={w} height={y1 - y0} className="construct-fade" {...line} strokeOpacity="0.08" strokeDasharray="3 6" style={dl(6)} />

      <g className="construct-fade" style={dl(7)}>
        <path d={`M ${x0} 30 H ${x1} M ${x0} 22 V 38 M ${x1} 22 V 38`} {...line} strokeOpacity="0.4" />
        <text x={cx} y={16} textAnchor="middle" className={label}>
          {Math.round(w)}
        </text>
      </g>
      <g className="construct-fade" style={dl(8)}>
        <path d={`M ${cx} ${cy} L ${cx + r * Math.cos(Math.PI / 4)} ${cy - r * Math.sin(Math.PI / 4)}`} {...line} strokeOpacity="0.35" />
        <circle cx={cx} cy={cy} r={2.4} fill="white" fillOpacity="0.5" />
        <text x={cx + r * 0.42} y={cy - r * 0.62} className={label}>
          R {Math.round(r)}
        </text>
      </g>
      <g className="construct-fade" style={dl(9)}>
        <path d={`M 396 ${y0} V ${y1} M 388 ${y0} H 404 M 388 ${y1} H 404`} {...line} strokeOpacity="0.36" />
        <text x={412} y={(y0 + y1) / 2} className={label} transform={`rotate(90 412 ${(y0 + y1) / 2})`} textAnchor="middle">
          {Math.round(y1 - y0)}
        </text>
      </g>
      <g className="construct-fade" style={dl(10)} {...line} strokeOpacity="0.4">
        <path d="M 4 40 V 24 H 20" />
        <path d="M 380 24 H 396 V 40" />
        <path d="M 4 572 V 588 H 20" />
        <path d="M 380 588 H 396 V 572" />
      </g>
      <g className="construct-fade" style={dl(11)}>
        <text x={4} y={606} className={label}>
          NL—09 · REV.B
        </text>
        <text x={396} y={606} className={label} textAnchor="end">
          {GLYPHS[glyph].label.toUpperCase()}
        </text>
        <text x={4} y={-6} className={label}>
          24.89° N · 55.16° E · DUBAI SOUTH
        </text>
      </g>

      {/* 7° lean: vertical guide, the lean axis, and the angle between them */}
      <path d={`M ${bx} ${y1 + 18} V ${y0 - 6}`} pathLength={1} className="construct-draw" {...line} strokeOpacity="0.22" style={dl(12)} />
      <path d={`M ${bx} ${y1 + 18} L ${tx + t7 * 24} ${y0 - 6}`} pathLength={1} className="construct-draw" {...line} stroke="var(--nl-purple)" strokeOpacity="0.55" style={dl(13)} />
      <g className="construct-fade" style={dl(14)}>
        <path
          d={`M ${bx} ${y1 - ar} A ${ar} ${ar} 0 0 1 ${bx + ar * Math.sin((LEAN * Math.PI) / 180)} ${y1 - ar * Math.cos((LEAN * Math.PI) / 180)}`}
          {...line}
          stroke="var(--nl-purple)"
          strokeOpacity="0.7"
        />
        <text x={bx + 14} y={y1 - ar - 10} className="font-mono text-[11px] tracking-[0.12em]" fill="var(--nl-purple)" fillOpacity="0.85">
          7°
        </text>
      </g>
      </g>
    </svg>
  );
}
