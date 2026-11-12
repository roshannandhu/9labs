import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

/**
 * Where e-mails go.
 *  - SMTP_HOST set: the company mailbox (e.g. admin@<domain>) over SMTP.
 *  - not set (local development): nothing is sent; each message is written to data/outbox/ as a
 *    JSON file so the flows can be tried and tested without a mailbox.
 */
export const OUTBOX_DIR = path.resolve(process.cwd(), "data/outbox");

type MailLike = { data: Record<string, unknown>; message: { messageId: () => string } };

function outboxTransport() {
  return nodemailer.createTransport({
    name: "outbox",
    version: "1.0.0",
    send(mail: MailLike, done: (err: Error | null, info?: unknown) => void) {
      try {
        fs.mkdirSync(OUTBOX_DIR, { recursive: true });
        const d = mail.data;
        const attachments = ((d.attachments as { filename?: string; content?: unknown; path?: string }[] | undefined) ?? []).map((a) => ({
          filename: a.filename,
          bytes: Buffer.isBuffer(a.content) ? a.content.length : a.path ? fs.statSync(a.path).size : undefined,
        }));
        const record = { at: new Date().toISOString(), from: d.from, to: d.to, replyTo: d.replyTo, subject: d.subject, text: d.text, html: d.html, attachments };
        const file = path.join(OUTBOX_DIR, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
        fs.writeFileSync(file, JSON.stringify(record, null, 2));
        console.log(`[mail] no SMTP configured — saved "${String(d.subject)}" for ${String(d.to)} to ${path.relative(process.cwd(), file)}`);
        done(null, { messageId: mail.message.messageId(), accepted: [d.to], rejected: [] });
      } catch (err) {
        done(err as Error);
      }
    },
  } as never);
}

export const smtpConfigured = () => Boolean(process.env.SMTP_HOST);

export function createTransport() {
  if (!smtpConfigured()) return outboxTransport();
  const port = Number(process.env.SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

export const mailFromAddress = () => process.env.MAIL_FROM || process.env.SMTP_USER || "admin@ninelabs.example";
