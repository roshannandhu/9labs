/**
 * The quiz's result shape, shared by the AI chain and the non-AI backup (docs/AI_RAG_SYSTEM.md §5) —
 * everything that renders a result (the overlay, the Inbox drawer, the admin Test tab) only ever
 * handles this one type, never "AI result" and "backup result" as two different shapes. Isomorphic
 * (no `"server-only"`): `src/lib/quiz/backup.ts` runs client-side too.
 */
export type QuizAnswers = Record<string, string[]>;
/** Free-text "Other" answers, keyed by question id. */
export type QuizOther = Record<string, string>;

export type QuizFit = "best" | "also" | "consider";
export type QuizResultMatch = { slug: string; fit: QuizFit; how: string };
export type QuizResultStep = { title: string; text: string };
export type QuizResultTags = { goal?: string; who?: string; when?: string };
export type QuizSource = "groq" | "gemini" | "backup";

export type AiQuizResult = {
  /** 2–3 sentences, "what you want," in the client's own words. */
  wants: string;
  /** 3–6 short phrases quoted from their answers/Other, for the result's glow effect. */
  highlights: string[];
  /** 1–3 matches, best first. */
  matches: QuizResultMatch[];
  /** Always 3. */
  steps: QuizResultStep[];
  tags: QuizResultTags;
  source: QuizSource;
};
