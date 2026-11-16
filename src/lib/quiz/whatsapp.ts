import type { QuizQuestion, SiteData } from "@/content/site";
import type { AiQuizResult, QuizAnswers, QuizOther } from "./types";

/** "Question: answer, answer" lines — relocated from the old scoreQuiz (archive/quiz-scoring-legacy),
 *  now also echoing any typed "Other" text for that question, quoted so it reads as the client's own
 *  words. Shared by the WhatsApp message and the admin's lead view. */
export function buildQuizLines(questions: QuizQuestion[], answers: QuizAnswers, other: QuizOther): string[] {
  return questions
    .map((q) => {
      const parts = q.options.filter((o) => answers[q.id]?.includes(o.id)).map((o) => o.label);
      const typed = other[q.id]?.trim();
      if (typed) parts.push(`"${typed}"`);
      return parts.length ? `${q.label}: ${parts.join(", ")}` : null;
    })
    .filter((l): l is string => l !== null);
}

/** The WhatsApp message: admin's intro, the answer lines, the suggested services (no percentages —
 *  the AI/backup result gives fit labels, not scores), admin's outro. */
export function buildQuizWhatsappText(site: Pick<SiteData, "services" | "quiz">, lines: string[], result: AiQuizResult): string {
  const { result: r } = site.quiz;
  const suggested = result.matches
    .map((m, i) => {
      const s = site.services.find((sv) => sv.slug === m.slug);
      return s ? `${i + 1}) ${s.title}` : null;
    })
    .filter((s): s is string => s !== null)
    .join(", ");
  return [r.whatsappIntro, "", ...lines.map((l) => `• ${l}`), "", `Suggested for us: ${suggested}`, "", r.whatsappOutro].join("\n").trim();
}
