import "server-only";
import type { OutboxKind } from "@/content/types";
import { env, smtpConfigured } from "./env";
import { insertOutbox } from "./leads";

export type SendMailInput = {
  kind: OutboxKind;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: string; mimeType?: string }[];
};
export type SendMailResult = { ok: boolean; error?: string };

async function sendViaResend(apiKey: string, from: string, input: SendMailInput, replyTo?: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: replyTo || undefined,
      attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content, content_type: a.mimeType })),
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(`Resend refused the e-mail (${res.status}): ${detail?.message ?? res.statusText}`);
  }
}

/** Always writes the outbox row itself, so no call site has to remember to. */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  if (!smtpConfigured()) {
    await insertOutbox({ kind: input.kind, to: input.to, subject: input.subject, html: input.html, text: input.text, status: "logged" });
    return { ok: true };
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_FROM_NAME, MAIL_REPLY_TO } = env();
  try {
    if (SMTP_HOST === "smtp.resend.com") {
      // Resend over HTTPS (its SMTP password is the API key). SMTP needs raw sockets, which the deployed
      // Worker bundle can't load ("Dynamic require of cloudflare:sockets"), so nothing was ever sent.
      await sendViaResend(SMTP_PASS, `${MAIL_FROM_NAME} <${MAIL_FROM}>`, input, input.replyTo || MAIL_REPLY_TO);
      await insertOutbox({ kind: input.kind, to: input.to, subject: input.subject, html: input.html, text: input.text, status: "sent" });
      return { ok: true };
    }
    const { WorkerMailer } = await import("worker-mailer");
    await WorkerMailer.send(
      {
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        startTls: SMTP_PORT !== 465,
        credentials: { username: SMTP_USER, password: SMTP_PASS },
      },
      {
        from: { name: MAIL_FROM_NAME, email: MAIL_FROM },
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply: input.replyTo || MAIL_REPLY_TO || undefined,
        attachments: input.attachments,
      },
    );
    await insertOutbox({ kind: input.kind, to: input.to, subject: input.subject, html: input.html, text: input.text, status: "sent" });
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Could not send the e-mail.";
    await insertOutbox({ kind: input.kind, to: input.to, subject: input.subject, html: input.html, text: input.text, status: "failed", error });
    return { ok: false, error };
  }
}
