import { site as defaults, type IconKey, type QuizQuestion, type Service } from "@/content/site";

/**
 * Which activity an option's old weights pointed to hardest — the tie-break is the same one
 * `scoreQuiz` already used for ranking matches: highest weight wins, a tie goes to the lower
 * service card number. `null` when every weight is 0 or absent (nothing to point to).
 */
export function derivePointsTo(weights: Partial<Record<IconKey, number>> | undefined, services: Service[]): IconKey | null {
  if (!weights) return null;
  const top = services.slice().sort((a, b) => (weights[b.icon] ?? 0) - (weights[a.icon] ?? 0) || a.n - b.n)[0];
  return top && (weights[top.icon] ?? 0) > 0 ? top.icon : null;
}

/**
 * One-time, in-place migration for a saved workspace blob (pre-`deepMerge`, so it's whatever shape
 * was actually on disk — may be old/partial). Fills `pointsTo` on any quiz option that has `weights`
 * but no `pointsTo` yet (leaving `weights` untouched), turns on "own words" where it was never set,
 * and gives untouched default answers their built-in `solves` line. Safe no-op on anything that doesn't look
 * like quiz content.
 */
export function migrateQuizOptionsInPlace(raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  const site = (raw as { site?: unknown }).site;
  if (!site || typeof site !== "object") return;
  const services = (site as { services?: unknown }).services;
  const questions = (site as { quiz?: { questions?: unknown } }).quiz?.questions;
  if (!Array.isArray(services) || !Array.isArray(questions)) return;

  for (const q of questions) {
    const options = (q as { options?: unknown })?.options;
    if (!Array.isArray(options)) continue;
    // own words on every question unless the admin switched it off (a saved `false`)
    const question = q as Partial<QuizQuestion>;
    if (question.allowOther === undefined) question.allowOther = true;
    const def = defaults.quiz.questions.find((d) => d.id === question.id);
    for (const o of options) {
      if (!o || typeof o !== "object") continue;
      const opt = o as { id?: string; weights?: Partial<Record<IconKey, number>>; pointsTo?: IconKey | null; solves?: string };
      if (opt.pointsTo === undefined && opt.weights) opt.pointsTo = derivePointsTo(opt.weights, services as Service[]);
      // the built-in "how we help" line, for a saved answer that is still the default one
      const d = def?.options.find((x) => x.id === opt.id);
      if (opt.solves === undefined && d?.solves && (d.pointsTo ?? null) === (opt.pointsTo ?? null)) opt.solves = d.solves;
    }
  }
}
