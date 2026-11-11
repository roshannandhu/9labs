import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { json, overLimit, readForm } from "@/lib/forms/guard";
import { serverResult } from "@/lib/quiz/server";
import { esc, layout, paragraphs, sendMail } from "@/lib/mail/send";
import { waLink } from "@/content/site";

const schema = z.object({
  ref: z.string().min(8).max(64).regex(/^[A-Za-z0-9-]+$/),
  email: z.string().trim().toLowerCase().max(200).regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
  answers: z.record(z.string().max(64), z.array(z.string().max(64)).max(20)),
});

/**
 * "E-mail me this plan": sends the visitor their quiz result from the company mailbox and keeps
 * their address with the saved result. The e-mail is built only from the admin's own wording and
 * tightly limited per visitor, so the form cannot be used to send arbitrary text to strangers.
 */
export async function POST(req: Request) {
  const form = await readForm(req, schema);
  if (form.error) return form.error;
  const { ref, email, answers } = form.data;
  const payload = await getPayload({ config });
  if (await overLimit(payload, req, "quiz-email", 3, 900)) return json({ error: "Please try again in a few minutes." }, 429);

  // at most two plan e-mails to one address per day
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const recent = await payload.count({ collection: "quiz-submissions", where: { and: [{ email: { equals: email } }, { updatedAt: { greater_than: dayAgo } }] }, overrideAccess: true });
  if (recent.totalDocs >= 2) return json({ ok: true });

  const { site, result, answered, answers: clean } = await serverResult(answers);
  if (!answered || !site.quiz.result.emailEnabled) return json({ error: "Not available." }, 400);

  const t = site.quiz.result;
  const chat = waLink(site.contact.whatsappNumber, result.whatsappText);
  const matchesHtml = result.matches
    .map((m, i) => `<p style="margin:0 0 14px;line-height:1.55"><strong style="color:#0e0c20">${i + 1}. ${esc(m.service.title)} — ${m.score}%</strong><br>${esc(m.why)}</p>`)
    .join("");
  const stepsHtml = result.steps.map((s, i) => `<p style="margin:0 0 12px;line-height:1.55"><strong style="color:#6f55e8">0${i + 1}</strong> <strong style="color:#0e0c20">${esc(s.title)}</strong><br>${esc(s.text)}</p>`).join("");
  try {
    await sendMail(payload, {
      to: email,
      subject: `${t.label} — ${site.name}`,
      fromName: site.name,
      html: layout({ company: site.name, heading: t.heading, bodyHtml: paragraphs(result.summary) + matchesHtml + stepsHtml, button: { label: t.whatsappCta, url: chat }, footer: `You asked for this plan on ${site.url.replace(/^https?:\/\//, "")}.` }),
      text: [t.heading, result.summary, ...result.matches.map((m, i) => `${i + 1}. ${m.service.title} — ${m.score}%\n${m.why}`), ...result.steps.map((s, i) => `0${i + 1} ${s.title}\n${s.text}`), `${t.whatsappCta}: ${chat}`].join("\n\n"),
    });
  } catch (err) {
    payload.logger.error({ err }, "Quiz plan e-mail failed");
    return json({ error: "The e-mail could not be sent. Please try WhatsApp instead." }, 502);
  }

  const existing = (await payload.find({ collection: "quiz-submissions", where: { ref: { equals: ref } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
  const data = { email, action: "email" as const };
  if (existing) await payload.update({ collection: "quiz-submissions", id: existing.id, data, overrideAccess: true });
  else {
    await payload.create({
      collection: "quiz-submissions",
      overrideAccess: true,
      data: { ref, top: result.matches[0]?.service.title ?? "", matches: result.matches.map((m) => `${m.service.short} ${m.score}%`).join(" · "), summary: [result.summary, "", ...result.lines].join("\n"), answers: clean, status: "new", ...data },
    });
  }
  return json({ ok: true });
}
