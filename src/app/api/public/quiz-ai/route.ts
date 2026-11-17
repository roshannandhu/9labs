import { z } from "zod";
import { quizLeadFields } from "@/lib/quiz/mail";
import { cleanQuizInput } from "@/lib/quiz/result";
import { runQuizAi } from "@/server/ai/run";
import { getPublished } from "@/server/content";
import { env } from "@/server/env";
import { clientIp, looksAutomated, overLimit, readForm } from "@/server/guard";
import { HttpError, json, route } from "@/server/http";
import { insertQuizResultIfNew } from "@/server/leads";

export const dynamic = "force-dynamic";

const schema = z.object({
  ref: z
    .string()
    .min(1)
    .max(24)
    .regex(/^[A-Za-z0-9-]+$/),
  answers: z
    .record(z.string().max(80), z.array(z.string().max(80)).max(12))
    .refine((a) => Object.keys(a).length <= 30, "Too many answers."),
  other: z
    .record(z.string().max(80), z.string().max(2000))
    .refine((o) => Object.keys(o).length <= 30, "Too many answers.")
    .default({}),
  trap: z.string().max(200).default(""),
  elapsedMs: z.number().default(0),
});

/**
 * The quiz result, AI first (docs/AI_RAG_SYSTEM.md §3): per-IP limit, a whole-site daily cap and a
 * honeypot decide whether the AI runs at all — a blocked or automated visitor still gets the built-in
 * result, never an error. The lead is saved here, server-side, with the exact result shown.
 */
export const POST = route(async (req: Request) => {
  const ip = clientIp(req);
  if (await overLimit("quiz-ai", ip, 10, 3600)) throw new HttpError(429, "Too many requests — please try again later.");
  const body = await readForm(req, schema);

  const published = await getPublished();
  const site = published.site;
  const { answers, other } = cleanQuizInput(site, body.answers, body.other);

  const automated = looksAutomated(body.trap, body.elapsedMs, 3000);
  const overCap = !automated && (await overLimit("quiz-ai-day", "site", env().AI_DAILY_CAP, 86_400));
  const outcome = await runQuizAi(automated || overCap ? { ...site, quiz: { ...site.quiz, ai: { ...site.quiz.ai, enabled: false } } } : site, answers, other, body.ref);

  const lead = quizLeadFields(site, answers, other, { ai: outcome.result, source: outcome.source });
  // a failed save must not also cost the visitor their result: show it, and say so loudly in the logs
  let saved = automated;
  if (!automated) {
    try {
      await insertQuizResultIfNew({ ref: body.ref, top: lead.top, matches: lead.matches, summary: lead.summary, answers, other, ai: lead.ai, source: lead.source });
      saved = true;
    } catch (err) {
      console.error("quiz-ai: lead NOT saved", body.ref, err instanceof Error ? err.message : err);
    }
  }

  return json({ result: outcome.result, source: outcome.source, saved });
});
