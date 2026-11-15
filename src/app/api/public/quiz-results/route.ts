import { z } from "zod";
import { scoreQuiz, type QuizAnswers } from "@/lib/quiz/score";
import { getPublished } from "@/server/content";
import { clientIp, overLimit, readForm } from "@/server/guard";
import { HttpError, route } from "@/server/http";
import { insertQuizResultIfNew } from "@/server/leads";

export const dynamic = "force-dynamic";

const schema = z.object({
  ref: z
    .string()
    .min(1)
    .max(24)
    .regex(/^[A-Za-z0-9-]+$/),
  answers: z
    .record(z.string(), z.array(z.string().max(80)).max(12))
    .refine((a) => Object.keys(a).length <= 30, "Too many answers."),
});

/** A finished quiz is saved once for the admin; skips refs it already has (the visitor re-sent the same finish). */
export const POST = route(async (req: Request) => {
  if (await overLimit("quiz-results", clientIp(req), 30, 3600)) throw new HttpError(429, "Too many requests — please try again later.");
  const body = await readForm(req, schema);

  const published = await getPublished();
  const result = scoreQuiz(published.site, body.answers as QuizAnswers);
  await insertQuizResultIfNew({ ref: body.ref, top: result.matches[0]?.service.title ?? "", matches: result.matches.map((m) => `${m.service.short} ${m.score}%`).join(" · "), summary: [result.summary, "", ...result.lines].join("\n"), answers: body.answers });

  return new Response(null, { status: 204 });
});
