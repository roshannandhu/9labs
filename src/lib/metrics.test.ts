import { test } from "node:test";
import assert from "node:assert/strict";
import { bucketCounts, byWeekday, countBy, pctChange, periodTotal, previousPeriodTotal, withinDays } from "./metrics.ts";

const DAY = 86_400_000;
const now = new Date("2026-11-14T12:00:00.000Z").getTime();
const daysAgo = (n: number) => new Date(now - n * DAY).toISOString();

test("withinDays keeps only the last N days, today included", () => {
  const dates = [daysAgo(0), daysAgo(1), daysAgo(6), daysAgo(7), daysAgo(30)];
  assert.deepEqual(withinDays(dates, 7, now), [daysAgo(0), daysAgo(1), daysAgo(6)]);
});

test("bucketCounts places each date in the right oldest-first bucket", () => {
  const dates = [daysAgo(0), daysAgo(0), daysAgo(3), daysAgo(6)];
  const series = bucketCounts(dates, 7, 1, now);
  assert.equal(series.length, 7);
  assert.equal(series[6].count, 2); // today, last bucket
  assert.equal(series[3].count, 1); // 3 days ago
  assert.equal(series[0].count, 1); // 6 days ago, first bucket
  assert.equal(series.reduce((n, b) => n + b.count, 0), 4);
});

test("bucketCounts groups multi-day buckets and stays oldest-first", () => {
  const dates = [daysAgo(0), daysAgo(1), daysAgo(8), daysAgo(89)];
  const series = bucketCounts(dates, 90, 7, now);
  assert.equal(series.length, 13); // ceil(90/7)
  assert.equal(series[12].count, 2); // this week: today + yesterday
  assert.equal(series[11].count, 1); // 8 days ago falls in the previous 7-day bucket
  assert.equal(series[0].count, 1); // the oldest bucket covers day 89
});

test("periodTotal and previousPeriodTotal split into two equal, non-overlapping windows", () => {
  const dates = [daysAgo(0), daysAgo(2), daysAgo(6), daysAgo(7), daysAgo(9), daysAgo(13), daysAgo(14)];
  assert.equal(periodTotal(dates, 7, now), 3); // days 0,2,6
  assert.equal(previousPeriodTotal(dates, 7, now), 3); // days 7,9,13
});

test("pctChange: 0 baseline with new activity is null (no baseline to compare), 0 vs 0 is 0", () => {
  assert.equal(pctChange(5, 0), null);
  assert.equal(pctChange(0, 0), 0);
  assert.equal(pctChange(15, 10), 50);
  assert.equal(pctChange(5, 10), -50);
});

test("byWeekday maps Sunday to the last slot (Mon..Sun)", () => {
  const sunday = new Date("2026-11-15T10:00:00.000Z"); // a Sunday
  const monday = new Date("2026-11-16T10:00:00.000Z"); // a Monday
  const counts = byWeekday([sunday.toISOString(), monday.toISOString()], 7, monday.getTime());
  assert.equal(counts[6], 1); // Sunday
  assert.equal(counts[0], 1); // Monday
  assert.equal(counts.reduce((a, b) => a + b, 0), 2);
});

test("countBy groups and counts by key", () => {
  const items = [{ k: "a" }, { k: "b" }, { k: "a" }, { k: "a" }];
  assert.deepEqual(countBy(items, (i) => i.k), { a: 3, b: 1 });
});
