import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { json, overLimit, readForm } from "@/lib/forms/guard";
import { serverResult } from "@/lib/quiz/server";

const schema = z.object({
  ref: z.string().min(8).max(64).regex(/^[A-Za-z0-9-]+$/),
  answers: z.record(z.string().max(64), z.array(z.string().max(64)).max(20)).optional(),
  action: z.enum(["whatsapp"]).optional(),
});

/**
 * Saves a finished quiz for the admin (Quiz → Quiz results), in the background.
 * First call: `{ref, answers}` when the result appears. Later: `{ref, action: "whatsapp"}` when
 * the visitor taps "Send on WhatsApp", so the admin can see who followed through.
 */
export async function POST(req: Request) {
  const form = await readForm(req, schema);
  if (form.error) return form.error;
  const { ref, answers, action } = form.data;
  const payload = await getPayload({ config });
  if (await overLimit(payload, req, "quiz", 30, 600)) return json({ ok: false }, 429);

  const existing = (await payload.find({ collection: "quiz-submissions", where: { ref: { equals: ref } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];

  if (action) {
    if (existing && existing.action !== "email") await payload.update({ collection: "quiz-submissions", id: existing.id, data: { action }, overrideAccess: true });
    return json({ ok: true });
  }
  if (!answers || existing) return json({ ok: true });

  const { result, answered, answers: clean } = await serverResult(answers);
  if (!answered) return json({ ok: true });
  await payload.create({
    collection: "quiz-submissions",
    overrideAccess: true,
    data: {
      ref,
      top: result.matches[0]?.service.title ?? "",
      matches: result.matches.map((m) => `${m.service.short} ${m.score}%`).join(" · "),
      summary: [result.summary, "", ...result.lines].join("\n"),
      answers: clean,
      action: "none",
      status: "new",
    },
  });
  return json({ ok: true });
}
