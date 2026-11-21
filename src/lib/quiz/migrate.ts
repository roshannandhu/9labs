import { site as defaults, type QuizQuestion } from "@/content/site";

/**
 * One-time, in-place migration for a saved workspace blob (pre-`deepMerge`, so it's whatever shape
 * was actually on disk — may be old/partial). Turns on "own words" where it was never set, and gives
 * an untouched default answer its built-in `solves` line. The old `weights`/`pointsTo` fields (if any
 * linger in old saved data) are simply ignored now — the matcher works them out from the answer text.
 * Safe no-op on anything that doesn't look like quiz content.
 */
export function migrateQuizOptionsInPlace(raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  const site = (raw as { site?: unknown }).site;
  if (!site || typeof site !== "object") return;
  const questions = (site as { quiz?: { questions?: unknown } }).quiz?.questions;
  if (!Array.isArray(questions)) return;

  for (const q of questions) {
    const options = (q as { options?: unknown })?.options;
    if (!Array.isArray(options)) continue;
    // own words on every question unless the admin switched it off (a saved `false`)
    const question = q as Partial<QuizQuestion>;
    if (question.allowOther === undefined) question.allowOther = true;
    const def = defaults.quiz.questions.find((d) => d.id === question.id);
    for (const o of options) {
      if (!o || typeof o !== "object") continue;
      const opt = o as { id?: string; solves?: string };
      // the built-in "what we say" line, for a saved answer that is still the default one
      const d = def?.options.find((x) => x.id === opt.id);
      if (opt.solves === undefined && d?.solves) opt.solves = d.solves;
    }
  }
}
