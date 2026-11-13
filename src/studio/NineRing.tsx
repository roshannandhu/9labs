"use client";

import { useState } from "react";

export type RingSegment = { key: string; label: string; value: number };

/** A ring of nine segments, one per activity, thicker where demand is higher. Hover/tap a segment to see its number. */
export function NineRing({ segments, onSelect }: { segments: RingSegment[]; onSelect?: (key: string) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const gap = 3;
  const each = circumference / Math.max(1, segments.length);
  const max = Math.max(1, ...segments.map((s) => s.value));
  const shown = hover !== null ? segments[hover] : null;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 120" className="h-[150px] w-[150px]" role="img" aria-label="Demand by activity">
        <g transform="rotate(-90 60 60)">
          {segments.map((s, i) => {
            const thickness = 4 + (6 + 10 * (s.value / max)) * (s.value > 0 ? 1 : 0.3);
            return (
              <circle
                key={s.key}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={hover === i ? "var(--st-purple)" : "var(--st-indigo)"}
                strokeOpacity={hover === null || hover === i ? 0.92 : 0.3}
                strokeWidth={thickness}
                strokeDasharray={`${each - gap} ${circumference - (each - gap)}`}
                strokeDashoffset={-(i * each)}
                style={{ cursor: onSelect ? "pointer" : "default", transition: "stroke-opacity .15s" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect?.(s.key)}
              />
            );
          })}
        </g>
        <text x="60" y="57" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight={600} fontSize="10.5" fill="var(--st-ink)">
          {shown ? shown.label : "Demand"}
        </text>
        <text x="60" y="71" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight={500} fontSize="9.5" fill="var(--st-sub)">
          {shown ? `${shown.value} leads` : "by activity"}
        </text>
      </svg>
    </div>
  );
}
