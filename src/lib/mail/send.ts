import type { Payload } from "payload";

export const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** `{{name}}` placeholders in admin-written e-mail text. Unknown ones are removed. */
export const template = (text: string, values: Record<string, string>) => text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => values[k] ?? "");

/** Plain text (paragraphs separated by an empty line) → e-mail-safe HTML paragraphs. */
export const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

type Layout = { company: string; heading?: string; bodyHtml: string; button?: { label: string; url: string }; footer?: string };

/** One simple, branded e-mail layout (tables + inline styles: what mail programs understand). */
export function layout({ company, heading, bodyHtml, button, footer }: Layout) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f1eaf3;font-family:Arial,Helvetica,sans-serif;color:#0e0c20">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1eaf3;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="height:6px;background:#6f55e8;background:linear-gradient(90deg,#8c53fe,#5ce0e6);font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 8px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#6f55e8;font-weight:bold">${esc(company)}</td></tr>
<tr><td style="padding:0 32px 28px;font-size:15.5px">
${heading ? `<h1 style="margin:8px 0 18px;font-size:22px;line-height:1.25;color:#0e0c20">${esc(heading)}</h1>` : ""}
${bodyHtml}
${button ? `<p style="margin:26px 0 8px"><a href="${esc(button.url)}" style="display:inline-block;background:#6f55e8;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:999px">${esc(button.label)}</a></p><p style="margin:0;font-size:12px;color:#776f86;word-break:break-all">${esc(button.url)}</p>` : ""}
</td></tr>
${footer ? `<tr><td style="padding:18px 32px 26px;border-top:1px solid #eee6f0;font-size:12px;line-height:1.5;color:#776f86">${esc(footer).replace(/\n/g, "<br>")}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
}

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromName?: string;
  replyTo?: string;
  attachments?: { filename: string; path?: string; content?: Buffer; contentType?: string }[];
};

/** Send through the configured mailbox (or, without SMTP, into data/outbox/). Throws if sending fails. */
export async function sendMail(payload: Payload, m: Mail) {
  const from = m.fromName ? `"${m.fromName.replace(/["\r\n]/g, "")}" <${payload.email.defaultFromAddress}>` : undefined;
  await payload.sendEmail({
    to: m.to,
    subject: m.subject.replace(/[\r\n]+/g, " "),
    html: m.html,
    text: m.text,
    ...(from ? { from } : {}),
    ...(m.replyTo ? { replyTo: m.replyTo } : {}),
    ...(m.attachments?.length ? { attachments: m.attachments } : {}),
  });
}
