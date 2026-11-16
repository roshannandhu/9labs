import { z } from "zod";
import { quizLeadFields } from "@/lib/quiz/mail";
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
  const { ai, source, top, matches, summary } = quizLeadFields(published.site, body.answers);
  await insertQuizResultIfNew({ ref: body.ref, top, matches, summary, answers: body.answers, ai, source });

  return new Response(null, { status: 204 });
});
