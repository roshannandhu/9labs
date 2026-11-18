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

/** Always writes the outbox row itself, so no call site has to remember to. */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  if (!smtpConfigured()) {
    await insertOutbox({ kind: input.kind, to: input.to, subject: input.subject, html: input.html, text: input.text, status: "logged" });
    return { ok: true };
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_FROM_NAME, MAIL_REPLY_TO } = env();
  try {
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
