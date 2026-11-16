import { test } from "node:test";
import assert from "node:assert/strict";
import { maxReachable, totalsFor } from "./analyze.ts";
import { site } from "../../content/site.ts";

/** A non-number weight (seen live as NaN from a transient bad input or a stale hot-reload state —
 * JSON can't even encode NaN, so it never survives a save/reload, only a live in-memory slip)
 * must never reach a rendered number: `src/app/(studio)/admin/quiz/page.tsx`'s HeatOverview
 * renders `maxReachable()`'s output directly as `{v}`, with no further guard. */
test("maxReachable and totalsFor ignore a non-finite weight instead of poisoning the total with NaN", () => {
  const bad = {
    services: site.services,
    quiz: {
      ...site.quiz,
      questions: [{ id: "q1", label: "Q1", q: "Pick one", options: [{ id: "a", label: "A", weights: { strategy: NaN, social: 2 } }] }],
    },
  };

  const max = maxReachable(bad);
  assert.ok(Number.isFinite(max.strategy ?? 0), "maxReachable must not return NaN for an activity with a NaN weight");
  assert.equal(max.social, 2);

  const totals = totalsFor(bad, { q1: ["a"] });
  assert.ok(Number.isFinite(totals.strategy ?? 0), "totalsFor must not return NaN for a chosen option with a NaN weight");
  assert.equal(totals.social, 2);
});
