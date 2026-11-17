import { z } from "zod";
import { quizLeadFields } from "@/lib/quiz/mail";
import { cleanPhone, cleanQuizInput } from "@/lib/quiz/result";
import { getPublished } from "@/server/content";
import { clientIp, overLimit, readForm } from "@/server/guard";
import { HttpError, route } from "@/server/http";
import { findQuizResultByRef, insertQuizResultIfNew, updateQuizResultByRef } from "@/server/leads";

export const dynamic = "force-dynamic";

const schema = z.object({
  ref: z
    .string()
    .min(1)
    .max(24)
    .regex(/^[A-Za-z0-9-]+$/),
  action: z.literal("whatsapp"),
  name: z.string().trim().min(2).max(80),
  phone: z.string().max(32).transform((p, ctx) => cleanPhone(p) ?? (ctx.addIssue({ code: "custom", message: "Enter a valid phone number." }), z.NEVER)),
  answers: z
    .record(z.string().max(80), z.array(z.string().max(80)).max(12))
    .refine((a) => Object.keys(a).length <= 30, "Too many answers.")
    .default({}),
  other: z
    .record(z.string().max(80), z.string().max(2000))
    .refine((o) => Object.keys(o).length <= 30, "Too many answers.")
    .default({}),
});

/** The WhatsApp form step: adds name + phone (and "opened WhatsApp") to the lead saved at finish. If that
 *  save never landed, the lead is created here from the answers, with the built-in result. */
export const POST = route(async (req: Request) => {
  if (await overLimit("quiz-action", clientIp(req), 60, 3600)) throw new HttpError(429, "Too many requests — please try again later.");
  const body = await readForm(req, schema);
  const contact = { name: body.name, phone: body.phone };

  const existing = await findQuizResultByRef(body.ref);
  if (existing) {
    await updateQuizResultByRef(body.ref, existing.action === "email" ? contact : { ...contact, action: body.action });
  } else {
    const { site } = await getPublished();
    const input = cleanQuizInput(site, body.answers, body.other);
    const lead = quizLeadFields(site, input.answers, input.other);
    await insertQuizResultIfNew({ ref: body.ref, top: lead.top, matches: lead.matches, summary: lead.summary, answers: input.answers, other: input.other, ai: lead.ai, source: lead.source, action: body.action, ...contact });
  }

  return new Response(null, { status: 204 });
});
