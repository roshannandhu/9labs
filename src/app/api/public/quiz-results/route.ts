import { z } from "zod";
import { quizLeadFields } from "@/lib/quiz/mail";
import { cleanQuizInput } from "@/lib/quiz/result";
import { getPublished } from "@/server/content";
import { clientIp, overLimit, readForm } from "@/server/guard";
import { HttpError, route } from "@/server/http";
import { insertQuizResultIfNew } from "@/server/leads";

export const dynamic = "force-dynamic";

const schema = z.object({
  ref: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9-]+$/),
  answers: z
    .record(z.string().max(80), z.array(z.string().max(80)).max(12))
    .refine((a) => Object.keys(a).length <= 30, "Too many answers."),
  other: z
    .record(z.string().max(80), z.string().max(2000))
    .refine((o) => Object.keys(o).length <= 30, "Too many answers.")
    .default({}),
});

/**
 * The fallback save: the overlay only calls this when /quiz-ai didn't answer (which saves the lead
 * itself), so the lead is never lost. Skips refs it already has — the AI row always wins.
 */
export const POST = route(async (req: Request) => {
  if (await overLimit("quiz-results", clientIp(req), 30, 3600)) throw new HttpError(429, "Too many requests — please try again later.");
  const body = await readForm(req, schema);

  const published = await getPublished();
  const { answers, other } = cleanQuizInput(published.site, body.answers, body.other);
  const { ai, source, top, matches, summary } = quizLeadFields(published.site, answers, other);
  await insertQuizResultIfNew({ ref: body.ref, top, matches, summary, answers, other, ai, source });

  return new Response(null, { status: 204 });
});
