/**
 * Builds branded HTML e-mails. There is no real mailbox in this build — every e-mail this
 * produces is handed to `addOutboxMail()` (`src/lib/store.ts`) instead of actually being sent;
 * the publish phase swaps that one call for a Cloudflare Worker over the client's SMTP mailbox.
 */
export const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** `{{name}}`-style placeholders in admin-written e-mail text. Unknown ones are removed. */
export const mailTemplate = (text: string, values: Record<string, string>) => text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => values[k] ?? "");

/** Plain text (blank line = new paragraph) → e-mail-safe HTML paragraphs. */
export const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

export type MailLayout = { company: string; heading?: string; bodyHtml: string; button?: { label: string; url: string }; footer?: string };

/** One simple, branded e-mail layout (tables + inline styles — what mail clients actually render). */
export function mailLayout({ company, heading, bodyHtml, button, footer }: MailLayout) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f1eaf3;font-family:Arial,Helvetica,sans-serif;color:#0e0c20">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1eaf3;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="height:6px;background:linear-gradient(90deg,#8c53fe,#5ce0e6);font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 8px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#6f55e8;font-weight:bold">${esc(company)}</td></tr>
<tr><td style="padding:0 32px 28px;font-size:15.5px">
${heading ? `<h1 style="margin:8px 0 18px;font-size:22px;line-height:1.25;color:#0e0c20">${esc(heading)}</h1>` : ""}
${bodyHtml}
${button ? `<p style="margin:26px 0 8px"><a href="${esc(button.url)}" style="display:inline-block;background:#6f55e8;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:999px">${esc(button.label)}</a></p><p style="margin:0;font-size:12px;color:#776f86;word-break:break-all">${esc(button.url)}</p>` : ""}
</td></tr>
${footer ? `<tr><td style="padding:18px 32px 26px;border-top:1px solid #eee6f0;font-size:12px;line-height:1.5;color:#776f86">${esc(footer).replace(/\n/g, "<br>")}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
}

/** Plain-text fallback matching an HTML e-mail's content, for the Outbox's text view. */
export const mailText = (parts: (string | undefined | null | false)[]) => parts.filter(Boolean).join("\n\n");
