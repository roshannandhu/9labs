/**
 * Small, shape-agnostic helpers that turn a flat list of timestamped leads into what the
 * Dashboard draws: a daily/weekly series, a period total, a day-over-day % change, a weekday
 * breakdown, or a count grouped by some key (service, book, budget…). Nothing here knows about
 * enquiries, books or quizzes specifically — the Dashboard passes in `.createdAt` strings and a
 * `keyOf` function.
 */
const DAY = 86_400_000;

const startOfDay = (t: number): number => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Day-index of an ISO date relative to `now`'s day: 0 = today, 1 = yesterday, … */
const dayOffset = (iso: string, now: number): number => Math.round((startOfDay(now) - startOfDay(new Date(iso).getTime())) / DAY);

/** Only the timestamps that fall within the last `days` days (today included). */
export function withinDays(dates: string[], days: number, now = Date.now()): string[] {
  return dates.filter((iso) => {
    const off = dayOffset(iso, now);
    return off >= 0 && off < days;
  });
}

/**
 * Counts bucketed into `bucketDays`-wide buckets covering the last `days` days, oldest first —
 * a ready-made sparkline/line series. `days` need not divide evenly by `bucketDays`; the oldest
 * bucket simply covers whatever remains.
 */
export function bucketCounts(dates: string[], days: number, bucketDays = 1, now = Date.now()): { date: string; count: number }[] {
  const buckets = Math.max(1, Math.ceil(days / bucketDays));
  const counts = new Array(buckets).fill(0) as number[];
  for (const iso of dates) {
    const off = dayOffset(iso, now);
    if (off < 0 || off >= days) continue;
    const fromEnd = Math.floor(off / bucketDays);
    counts[buckets - 1 - fromEnd]++;
  }
  const today = startOfDay(now);
  return counts.map((count, i) => {
    const bucketsFromEnd = buckets - 1 - i;
    const date = new Date(today - bucketsFromEnd * bucketDays * DAY).toISOString().slice(0, 10);
    return { date, count };
  });
}

/** How many fall in the last `days` days (today included). */
export const periodTotal = (dates: string[], days: number, now = Date.now()): number => withinDays(dates, days, now).length;

/** The same count for the `days`-long period immediately before the current one. */
export function previousPeriodTotal(dates: string[], days: number, now = Date.now()): number {
  return dates.filter((iso) => {
    const off = dayOffset(iso, now);
    return off >= days && off < days * 2;
  }).length;
}

/** Signed % change, current vs. previous period. `null` = no previous baseline to compare against. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Counts per weekday (Mon→Sun) within the last `days` days. */
export function byWeekday(dates: string[], days: number, now = Date.now()): number[] {
  const out = new Array(7).fill(0) as number[];
  for (const iso of withinDays(dates, days, now)) {
    const jsDay = new Date(iso).getDay(); // 0 = Sun … 6 = Sat
    out[(jsDay + 6) % 7]++; // → 0 = Mon … 6 = Sun
  }
  return out;
}

/** Groups `items` by `keyOf` and counts each group — the shape every "by X" bar list needs. */
export function countBy<T>(items: T[], keyOf: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = keyOf(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}
