import "server-only";
import { getSite } from "../content/getSite";
import { scoreQuiz, type QuizAnswers } from "./score";

/**
 * Work a quiz out on the server from the visitor's answers. Only answers that exist in the
 * admin's current questions are kept, so nothing a visitor sends can end up in a saved result
 * or an e-mail except the admin's own wording.
 */
export async function serverResult(raw: Record<string, string[]>) {
  const site = await getSite();
  const answers: QuizAnswers = {};
  for (const q of site.quiz.questions) {
    const ids = (raw[q.id] ?? []).filter((id) => q.options.some((o) => o.id === id));
    if (ids.length) answers[q.id] = q.multi ? ids : ids.slice(0, 1);
  }
  const result = scoreQuiz(site, answers);
  return { site, answers, result, answered: Object.keys(answers).length };
}
