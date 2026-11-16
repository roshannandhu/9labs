import type { SiteData } from "@/content/types";
import type { QuizAnswers } from "./types";

type QuizSite = Pick<SiteData, "services" | "quiz">;

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** A plausible random visitor — for the admin's Test tab "Random visitor" button. */
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
