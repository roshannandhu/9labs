import "server-only";
import { env, smtpConfigured } from "./env";

export type SendMailInput = {
  /** The outbox row's `kind` — not yet used (see note below). */
  kind: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: string; mimeType?: string }[];
};
export type SendMailResult = { ok: boolean; error?: string };

/**
 * TODO (Phase 2, once `src/server/leads.ts` exists): insert the `outbox` row here (status
 * "sent" / "failed" / "logged") before returning, so every call site gets it automatically.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  if (!smtpConfigured()) return { ok: true };

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_FROM_NAME } = env();
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
        reply: input.replyTo,
        attachments: input.attachments,
      },
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not send the e-mail." };
  }
}
