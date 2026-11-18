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
/** One answered question on the result: what they said, and how Nine Labs solves that exact point. */
export type QuizAnswerRow = {
  /** Question id. */
  q: string;
  /** Their pick(s), and/or their own words. */
  said: string;
  /** True when `said` includes words they typed themselves. */
  own?: boolean;
  how: string;
  /** The service that solves it; null for answers like "when" that point nowhere. */
  slug: string | null;
};

export type AiQuizResult = {
  /** 2–3 sentences, "what you want," in the client's own words. */
  wants: string;
  /** 3–6 short phrases quoted from their answers/Other, for the result's glow effect. */
  highlights: string[];
  /** One row per answered question, in quiz order. */
  answers: QuizAnswerRow[];
  /** 1–5 matches (admin: result.matches), best first. */
  matches: QuizResultMatch[];
  /** Usually 3. */
  steps: QuizResultStep[];
  tags: QuizResultTags;
  source: QuizSource;
};
