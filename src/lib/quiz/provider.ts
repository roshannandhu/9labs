import { analyze, type QuizAnswer } from "./mockEngine";

/**
 * Provider-neutral entry point for The 9 Quiz.
 * Demo: a local mock with a short "thinking" delay.
 * Production: replace the body with a call to POST /api/quiz (Gemini, Groq or another
 * model — to be decided), returning the same QuizAnswer shape. The UI does not change.
 */
export async function generateQuizAnswer(input: string): Promise<QuizAnswer> {
  const wait = 2200 + Math.random() * 600;
  await new Promise((r) => setTimeout(r, wait));
  return analyze(input);
}

export type { QuizAnswer };
