"use client";

import { useId, useMemo, useState } from "react";
import { Box } from "./ui";

/**
 * The Dashboard's chart kit: hand-written SVG/HTML, no charting library. Every multi-series chart
 * carries a legend, a hover/keyboard tooltip and a "Table" fallback view (the dataviz skill's
 * baseline for accessibility) — text stays in ink colours, only the marks themselves carry a
 * series colour, and colour always follows the series' identity, never its row or rank.
 */

/** Card chrome for a chart: a title, an optional help line, and a right-aligned toggle (e.g. "Table"). */
export function ChartCard({ title, help, right, children }: { title: string; help?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box title={title} help={help} right={right}>
      {children}
    </Box>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  if (items.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-[12px] text-st-sub">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: it.color }} aria-hidden="true" />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function TableToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="st-btn !h-8 !px-3 text-[12px]">
      {open ? "Chart" : "Table"}
    </button>
  );
}

/* ------------------------------------------------------------------ stat-tile sparkline */

/** A bare 12-point trend line for a stat tile — no axes, no labels, the number beside it is the point. */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 96;
  const h = 28;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = values.length > 1 ? (i / (values.length - 1)) * w : w;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r={3} fill={color} stroke="var(--st-panel)" strokeWidth={2} />}
    </svg>
  );
}

/* ------------------------------------------------------------------ line chart */

export type LineSeries = { id: string; label: string; color: string; points: { date: string; count: number }[] };

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function LineChart({ series, height = 220 }: { series: LineSeries[]; height?: number }) {
  const uid = useId();
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);

  const w = 640;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 22;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;
  const n = series[0]?.points.length ?? 0;
  const max = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.count)));

  const xAt = (i: number) => padL + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const yAt = (v: number) => padT + innerH - (v / max) * innerH;

  const paths = useMemo(
    () =>
      series.map((s) => ({
        id: s.id,
        color: s.color,
        d: s.points.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.count).toFixed(1)}`).join(" "),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- xAt/yAt are derived from the same series/max each render
    [series, max, innerW, innerH],
  );

  const gridLines = [0, 0.5, 1];
  const active = hover ?? (focused ? n - 1 : null);

  const moveTo = (clientX: number, svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const i = Math.round(ratio * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-3">
        <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
        <TableToggle open={table} onToggle={() => setTable((t) => !t)} />
      </div>

      {table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-st-dim">
                <th className="py-1 pr-3 font-medium">Date</th>
                {series.map((s) => (
                  <th key={s.id} className="py-1 pr-3 font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(series[0]?.points ?? []).map((p, i) => (
                <tr key={p.date} className="border-t border-st-border">
                  <td className="py-1 pr-3 text-st-sub">{shortDate(p.date)}</td>
                  {series.map((s) => (
                    <td key={s.id} className="py-1 pr-3 text-st-ink">
                      {s.points[i]?.count ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${w} ${height}`}
          className="w-full touch-none"
          role="img"
          aria-label="Leads over time"
          tabIndex={0}
          onMouseMove={(e) => moveTo(e.clientX, e.currentTarget)}
          onMouseLeave={() => setHover(null)}
          onTouchMove={(e) => e.touches[0] && moveTo(e.touches[0].clientX, e.currentTarget)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n - 1) - 1));
            if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? 0) + 1));
          }}
        >
          {gridLines.map((g) => (
            <line key={g} x1={padL} x2={w - padR} y1={padT + innerH * (1 - g)} y2={padT + innerH * (1 - g)} stroke="var(--st-border)" strokeWidth={1} />
          ))}
          {paths.map((p) => (
            <path key={p.id} d={p.d} fill="none" stroke={p.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {series.map((s) => {
            const last = s.points[s.points.length - 1];
            if (!last) return null;
            return <circle key={s.id} cx={xAt(n - 1)} cy={yAt(last.count)} r={3.5} fill={s.color} stroke="var(--st-panel)" strokeWidth={2} />;
          })}
          {active !== null && (
            <>
              <line x1={xAt(active)} x2={xAt(active)} y1={padT} y2={padT + innerH} stroke="var(--st-dim)" strokeWidth={1} strokeDasharray="0" />
              {series.map((s) => (
                <circle key={s.id} cx={xAt(active)} cy={yAt(s.points[active]?.count ?? 0)} r={4} fill={s.color} stroke="var(--st-panel)" strokeWidth={2} />
              ))}
            </>
          )}
          <text x={padL} y={height - 6} fontSize="10" fill="var(--st-dim)">
            {series[0]?.points[0] ? shortDate(series[0].points[0].date) : ""}
          </text>
          <text x={w - padR} y={height - 6} fontSize="10" fill="var(--st-dim)" textAnchor="end">
            {series[0]?.points[n - 1] ? shortDate(series[0].points[n - 1].date) : ""}
          </text>
        </svg>
      )}

      {!table && active !== null && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-st-panel-2 px-3 py-2 text-[12px]">
          <span className="font-medium text-st-ink">{series[0]?.points[active] ? shortDate(series[0].points[active].date) : ""}</span>
          {series.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-st-sub">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
              {s.label}: <strong className="text-st-ink">{s.points[active]?.count ?? 0}</strong>
            </span>
          ))}
        </div>
      )}
      <p id={`${uid}-hint`} className="sr-only">
        Use the left and right arrow keys to move along the chart.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ ranked horizontal bars */

export type BarItem = { key: string; label: string; value: number; segments?: { label: string; value: number; color: string }[] };

/** Ranked horizontal bars — one colour per bar (nominal categories), or stacked segments when `segments` is set. */
export function BarList({ items, color, unit = "" }: { items: BarItem[]; color: string; unit?: string }) {
  const sorted = useMemo(() => [...items].sort((a, b) => b.value - a.value), [items]);
  const max = Math.max(1, ...sorted.map((i) => i.value));
  const hasSegments = sorted.some((i) => i.segments?.length);
  const segmentColors = hasSegments ? Array.from(new Map(sorted.flatMap((i) => i.segments ?? []).map((s) => [s.label, s.color])), ([label, c]) => ({ label, color: c })) : [];

  if (sorted.length === 0) return <p className="text-[13px] text-st-sub">Nothing yet.</p>;

  return (
    <div>
      {hasSegments && (
        <div className="mb-2">
          <Legend items={segmentColors} />
        </div>
      )}
      <div className="grid gap-2.5">
        {sorted.map((item) => (
          <div key={item.key} className="grid grid-cols-[minmax(90px,30%)_1fr_auto] items-center gap-2.5">
            <span className="truncate text-[12.5px] text-st-ink" title={item.label}>
              {item.label}
            </span>
            <span className="flex h-[16px] overflow-hidden rounded-full bg-st-panel-2">
              {item.segments?.length
                ? item.segments.map((s, i) => <span key={s.label} className={`h-full ${i > 0 ? "ml-0.5" : ""}`} style={{ width: `${Math.max(0, (s.value / max) * 100)}%`, background: s.color, borderRadius: 999 }} />)
                : item.value > 0 && <span className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: color }} />}
            </span>
            <span className="w-10 shrink-0 text-right text-[12px] font-medium text-st-ink">
              {item.value}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ stacked columns (busiest days) */

export type ColumnSeries = { id: string; label: string; color: string; values: number[] };

export function ColumnChart({ categories, series, height = 160 }: { categories: string[]; series: ColumnSeries[]; height?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const totals = categories.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const barW = 24;

  return (
    <div>
      <div className="mb-2">
        <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
      </div>
      <div className="flex items-end justify-between gap-1.5" style={{ height }}>
        {categories.map((cat, i) => {
          const colH = (totals[i] / max) * (height - 24);
          return (
            <button
              key={cat}
              type="button"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-lg py-1 outline-none focus-visible:bg-st-panel-2"
              aria-label={`${cat}: ${series.map((s) => `${s.label} ${s.values[i] ?? 0}`).join(", ")}`}
            >
              <div className="flex flex-col-reverse overflow-hidden rounded-t-[4px]" style={{ width: barW, height: Math.max(2, colH) }}>
                {series.map((s, si) => {
                  const segH = totals[i] > 0 ? ((s.values[i] ?? 0) / totals[i]) * colH : 0;
                  if (segH <= 0) return null;
                  return <span key={s.id} className={si > 0 ? "mt-0.5" : ""} style={{ height: Math.max(0, segH - (si > 0 ? 2 : 0)), background: s.color, opacity: active === null || active === i ? 1 : 0.4 }} />;
                })}
              </div>
              <span className="text-[11px] text-st-dim">{cat}</span>
            </button>
          );
        })}
      </div>
      {active !== null && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-st-panel-2 px-3 py-2 text-[12px]">
          <span className="font-medium text-st-ink">{categories[active]}</span>
          {series.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-st-sub">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
              {s.label}: <strong className="text-st-ink">{s.values[active] ?? 0}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ meter list */

export type MeterItem = { key: string; label: string; value: number; total: number };

/** A name, a bar and a figure per row, bars aligned — for "what share did each outcome get". */
export function MeterList({ items, color }: { items: MeterItem[]; color: string }) {
  return (
    <div className="grid gap-2.5">
      {items.map((it) => {
        const pct = it.total > 0 ? Math.round((it.value / it.total) * 100) : 0;
        return (
          <div key={it.key} className="grid grid-cols-[minmax(110px,40%)_1fr_auto] items-center gap-2.5">
            <span className="truncate text-[12.5px] text-st-ink">{it.label}</span>
            <span className="h-[10px] overflow-hidden rounded-full" style={{ background: `color-mix(in oklab, ${color} 18%, var(--st-panel-2))` }}>
              <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </span>
            <span className="w-16 shrink-0 text-right text-[12px] font-medium text-st-ink">
              {pct}% · {it.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
