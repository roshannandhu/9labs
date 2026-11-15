import { z } from "zod";
import { scoreQuiz, type QuizAnswers } from "@/lib/quiz/score";
import { buildQuizPlanMail } from "@/lib/quiz/mail";
import { getPublished } from "@/server/content";
import { clientIp, overLimit, readForm } from "@/server/guard";
import { HttpError, json, route } from "@/server/http";
import { findQuizResultByRef, insertQuizResultIfNew, recentQuizEmailCount, updateQuizResultByRef } from "@/server/leads";
import { sendMail } from "@/server/mail";

export const dynamic = "force-dynamic";

const schema = z.object({
  ref: z
    .string()
    .min(1)
    .max(24)
    .regex(/^[A-Za-z0-9-]+$/),
  email: z.string().email().max(254),
  answers: z
    .record(z.string(), z.array(z.string().max(80)).max(12))
    .refine((a) => Object.keys(a).length <= 30, "Too many answers."),
});

export const POST = route(async (req: Request) => {
  if (await overLimit("quiz-email", clientIp(req), 5, 3600)) throw new HttpError(429, "Too many requests — please try again later.");
  const body = await readForm(req, schema);

  const published = await getPublished();
  if (!published.site.quiz.result.emailEnabled) throw new HttpError(422, "Not available.");

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  if ((await recentQuizEmailCount(body.email, dayAgo)) >= 2) return json({ ok: true });

  const result = scoreQuiz(published.site, body.answers as QuizAnswers);
  const mail = buildQuizPlanMail(published.site, result);
  await sendMail({ kind: "quiz-plan", to: body.email, subject: mail.subject, html: mail.html, text: mail.text });

  const existing = await findQuizResultByRef(body.ref);
  if (existing) await updateQuizResultByRef(body.ref, { email: body.email, action: "email" });
  else await insertQuizResultIfNew({ ref: body.ref, top: result.matches[0]?.service.title ?? "", matches: result.matches.map((m) => `${m.service.short} ${m.score}%`).join(" · "), summary: [result.summary, "", ...result.lines].join("\n"), answers: body.answers });

  return json({ ok: true });
});
