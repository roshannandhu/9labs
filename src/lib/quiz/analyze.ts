import type { IconKey } from "@/content/site";
import type { SiteData } from "@/content/types";
import { scoreQuiz, type QuizAnswers } from "./score";

type QuizSite = Pick<SiteData, "services" | "quiz">;

/** Raw points per activity for one set of answers — the Quiz Lab's live scoreboard. */
export function totalsFor(site: QuizSite, a: QuizAnswers): Record<IconKey, number> {
  const totals = {} as Record<IconKey, number>;
  for (const q of site.quiz.questions) {
    for (const o of q.options) {
      if (!a[q.id]?.includes(o.id)) continue;
      for (const [k, w] of Object.entries(o.weights) as [IconKey, number][]) totals[k] = (totals[k] ?? 0) + w;
    }
  }
  return totals;
}

/** The most points any single answer could ever add to one activity (for the heat overview's scale). */
export function maxReachable(site: QuizSite): Record<IconKey, number> {
  const max = {} as Record<IconKey, number>;
  for (const q of site.quiz.questions) {
    const perActivity: Partial<Record<IconKey, number>> = {};
    for (const o of q.options) {
      for (const [k, w] of Object.entries(o.weights) as [IconKey, number][]) {
        if (q.multi && !o.only) perActivity[k] = (perActivity[k] ?? 0) + w; // several answers can stack
        else perActivity[k] = Math.max(perActivity[k] ?? 0, w); // single-choice: only one answer counts
      }
    }
    for (const [k, v] of Object.entries(perActivity) as [IconKey, number][]) max[k] = (max[k] ?? 0) + v;
  }
  return max;
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** A plausible random visitor — for "Try it → Random visitor" and the balance check. */
export function randomAnswers(site: QuizSite, rng: () => number = Math.random): QuizAnswers {
  const out: QuizAnswers = {};
  for (const q of site.quiz.questions) {
    if (!q.options.length) continue;
    if (!q.multi) {
      out[q.id] = [pickRandom(q.options, rng).id];
      continue;
    }
    const n = 1 + Math.floor(rng() * Math.min(3, q.options.length));
    const pool = [...q.options];
    const picked: typeof q.options = [];
    for (let i = 0; i < n && pool.length; i++) picked.push(...pool.splice(Math.floor(rng() * pool.length), 1));
    const only = picked.find((o) => o.only);
    out[q.id] = (only ? [only] : picked).map((o) => o.id);
  }
  return out;
}

export type BalanceReport = {
  trials: number;
  firstCount: Record<IconKey, number>;
  shownCount: Record<IconKey, number>;
  neverFirst: IconKey[];
  tieAtTop: number;
};

/**
 * Runs many random visitors through the quiz and reports how often each activity comes first or
 * is shown at all, and how often a tie at the top was broken only by card order — a fairness
 * check, not a forecast of real visitors.
 */
export function balanceReport(site: QuizSite, trials = 2000, rng: () => number = Math.random): BalanceReport {
  const firstCount = {} as Record<IconKey, number>;
  const shownCount = {} as Record<IconKey, number>;
  let tieAtTop = 0;
  for (let i = 0; i < trials; i++) {
    const answers = randomAnswers(site, rng);
    const totals = totalsFor(site, answers);
    const values = Object.values(totals);
    const top = values.length ? Math.max(...values) : 0;
    if (top > 0 && values.filter((v) => v === top).length > 1) tieAtTop++;

    const result = scoreQuiz(site, answers);
    result.matches.forEach((m, idx) => {
      shownCount[m.service.icon] = (shownCount[m.service.icon] ?? 0) + 1;
      if (idx === 0) firstCount[m.service.icon] = (firstCount[m.service.icon] ?? 0) + 1;
    });
  }
  const neverFirst = site.services.map((s) => s.icon).filter((icon) => !firstCount[icon]);
  return { trials, firstCount, shownCount, neverFirst, tieAtTop };
}
