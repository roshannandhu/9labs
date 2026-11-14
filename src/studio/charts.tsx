"use client";

import { Fragment, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useCountUp } from "./motion";

/**
 * The Dashboard's chart kit: hand-written SVG/HTML, no charting library. Every multi-series chart
 * carries a legend, a hover/keyboard tooltip and a "Table" fallback view (the dataviz skill's
 * baseline for accessibility) — text stays in ink colours, only the marks themselves carry a
 * series colour, and colour always follows the series' identity, never its row or rank.
 */

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
    <button type="button" onClick={onToggle} className="st-btn st-btn-ghost !h-8 !px-3 text-[12px]">
      {open ? "Chart" : "Table"}
    </button>
  );
}

/* ------------------------------------------------------------------ stat-tile sparkline */

/** A bare trend line for a stat tile — no axes, no labels, the number beside it is the point. */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 72;
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
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="shrink-0" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r={3} fill={color} stroke="var(--st-panel)" strokeWidth={2} />}
    </svg>
  );
}

/** One KPI: a series-coloured dot + mono label, a count-up value with its trend line, and a vs-last-period delta. */
export function StatTile({ label, value, delta, compareLabel, spark, color, href }: { label: string; value: number; delta: number | null; compareLabel: string; spark: number[]; color: string; href?: string }) {
  const shown = useCountUp(value);
  const content = (
    <>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
        <span className="st-micro truncate">{label}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="font-digits text-[26px] font-black text-st-ink sm:text-[30px]">{shown}</span>
        <Sparkline values={spark.length ? spark : [0, 0]} color={color} />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px]">
        {delta === null ? (
          <span className="rounded-full bg-st-panel-3 px-1.5 py-0.5 font-medium text-st-dim">New</span>
        ) : (
          <span className={`font-medium ${delta >= 0 ? "text-st-good" : "text-st-danger"}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
        <span className="truncate text-st-dim">{compareLabel}</span>
      </div>
    </>
  );
  const cls = "st-panel block p-4 text-left transition-shadow hover:shadow-[var(--st-glow)]";
  return href ? (
    <Link href={href} className={cls}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  );
}

/* ------------------------------------------------------------------ line chart */

export type LineSeries = { id: string; label: string; color: string; points: { date: string; count: number }[] };

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function LineChart({ series, height = 220 }: { series: LineSeries[]; height?: number }) {
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
    () => series.map((s) => ({ id: s.id, color: s.color, d: s.points.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.count).toFixed(1)}`).join(" ") })),
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
              <line x1={xAt(active)} x2={xAt(active)} y1={padT} y2={padT + innerH} stroke="var(--st-dim)" strokeWidth={1} />
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
      <p className="sr-only">Use the left and right arrow keys to move along the chart.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ segmented bar (part-to-whole) */

export type SegmentPart = { key: string; label: string; value: number; color: string };

/** One whole split into parts — no baseline, so no end is square. `tall` prints the share inside a wide-enough part; a part at 0 draws nothing. */
export function SegmentedBar({ parts, tall }: { parts: SegmentPart[]; tall?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const total = Math.max(1, parts.reduce((s, p) => s + p.value, 0));
  const shown = parts.filter((p) => p.value > 0);
  const h = tall ? 28 : 8;

  return (
    <div>
      <div className={`flex overflow-hidden rounded-full`} style={{ height: h, gap: 2 }}>
        {shown.map((p) => {
          const pct = (p.value / total) * 100;
          return (
            <button
              key={p.key}
              type="button"
              onMouseEnter={() => setActive(p.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(p.key)}
              onBlur={() => setActive(null)}
              aria-label={`${p.label}: ${p.value} (${Math.round(pct)}%)`}
              className="relative flex items-center justify-start overflow-hidden outline-none"
              style={{ width: `${pct}%`, background: p.color, opacity: active === null || active === p.key ? 1 : 0.55 }}
            >
              {tall && pct >= 14 && (
                <span className="truncate px-2.5 text-[11px] font-semibold text-white">{Math.round(pct)}%</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2.5">
        <Legend items={shown.map((p) => ({ label: `${p.label} · ${p.value}`, color: p.color }))} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ ranked horizontal bars */

export type BarItem = { key: string; label: string; icon?: React.ReactNode; value: number; segments?: { label: string; value: number; color: string }[] };

/** Horizontal bars — one colour per bar (nominal categories), or stacked segments when `segments` is set. `ranked` (default) sorts descending; pass false to keep the given order (budgets, timelines). */
export function BarList({ items, color, unit = "", ranked = true }: { items: BarItem[]; color: string; unit?: string; ranked?: boolean }) {
  const sorted = useMemo(() => (ranked ? [...items].sort((a, b) => b.value - a.value) : items), [items, ranked]);
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
          <div key={item.key} className="grid grid-cols-[minmax(100px,34%)_1fr_auto] items-center gap-2.5" aria-label={`${item.label}: ${item.value}${unit}`}>
            <span className="flex min-w-0 items-center gap-1.5 truncate text-[12.5px] text-st-ink" title={item.label}>
              {item.icon && <span className="shrink-0 text-st-dim">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </span>
            <span className="flex h-[14px] overflow-hidden rounded-full bg-st-panel-2">
              {item.segments?.length
                ? item.segments.map((s, i) => <span key={s.label} className={`h-full rounded-full ${i > 0 ? "ml-0.5" : ""}`} style={{ width: `${Math.max(0, (s.value / max) * 100)}%`, background: s.color }} />)
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

/* ------------------------------------------------------------------ heatmap (busiest times) */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Weekday × hour grid — rounded cells, a purple intensity ramp, a scale legend, hover/focus tooltip, and a Table fallback. */
export function Heatmap({ grid, columns }: { grid: number[][]; columns: string[] }) {
  const uid = useId();
  const [table, setTable] = useState(false);
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const max = Math.max(1, ...grid.flat());
  const colsPerCell = 24 / columns.length;

  const bucketed = useMemo(
    () =>
      grid.map((row) => {
        const out = new Array(columns.length).fill(0) as number[];
        row.forEach((v, h) => {
          out[Math.floor(h / colsPerCell)] += v;
        });
        return out;
      }),
    [grid, columns.length, colsPerCell],
  );

  const shade = (v: number) => {
    if (v === 0) return "var(--st-panel-2)";
    const share = v / max;
    const step = share > 0.8 ? 100 : share > 0.6 ? 85 : share > 0.4 ? 65 : share > 0.15 ? 45 : 25;
    return `color-mix(in oklab, var(--st-purple) ${step}%, var(--st-panel-2))`;
  };

  const colLabel = (i: number) => (columns.length === 24 ? `${String(i).padStart(2, "0")}:00` : columns[i]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-st-dim">
          Fewer
          {[25, 45, 65, 85, 100].map((s) => (
            <span key={s} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: `color-mix(in oklab, var(--st-purple) ${s}%, var(--st-panel-2))` }} aria-hidden="true" />
          ))}
          More
        </div>
        <TableToggle open={table} onToggle={() => setTable((t) => !t)} />
      </div>

      {table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr>
                <th className="py-1 pr-2 text-left font-medium text-st-dim"> </th>
                {columns.map((c, i) => (
                  <th key={c} className="px-1 py-1 text-center font-medium text-st-dim">
                    {colLabel(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((day, r) => (
                <tr key={day}>
                  <td className="py-1 pr-2 text-st-sub">{day}</td>
                  {bucketed[r].map((v, c) => (
                    <td key={c} className="px-1 py-1 text-center text-st-ink">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `28px repeat(${columns.length}, minmax(10px, 1fr))`, minWidth: columns.length * 14 + 28 }}>
            <span />
            {columns.map((c, i) => (
              <span key={c} className="text-center font-mono text-[9px] text-st-dim">
                {columns.length <= 8 ? colLabel(i) : i % 3 === 0 ? colLabel(i) : ""}
              </span>
            ))}
            {WEEKDAYS.map((day, r) => (
              <Fragment key={day}>
                <span className="self-center text-[10.5px] text-st-dim">{day}</span>
                {bucketed[r].map((v, c) => (
                  <button
                    key={`${day}-${c}`}
                    type="button"
                    onMouseEnter={() => setActive({ row: r, col: c })}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive({ row: r, col: c })}
                    onBlur={() => setActive(null)}
                    aria-label={`${WEEKDAYS[r]} · ${colLabel(c)} · ${v} lead${v === 1 ? "" : "s"}`}
                    className="h-[14px] rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-st-purple"
                    style={{ background: shade(v) }}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {!table && active && (
        <p id={`${uid}-tip`} className="mt-2 text-[12px] text-st-sub">
          <span className="font-medium text-st-ink">
            {WEEKDAYS[active.row]} · {colLabel(active.col)}
          </span>{" "}
          — {bucketed[active.row][active.col]} lead{bucketed[active.row][active.col] === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
