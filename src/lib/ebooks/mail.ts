import type { SiteData } from "@/content/site";
import type { EbookEmailSettings } from "@/content/types";
import { mailLayout, mailTemplate, paragraphs } from "@/lib/mail";

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const longDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function buildEbookMail(site: SiteData, email: EbookEmailSettings, o: { name: string; bookTitle: string; link?: string; expires?: Date }) {
  const values = { name: firstName(o.name), bookTitle: o.bookTitle, downloadLink: o.link ?? "", expiryDate: o.expires ? longDate(o.expires) : "", company: site.name };
  const body = mailTemplate(email.body, values);
  const note = o.link && o.expires ? `This link is personal and works until ${longDate(o.expires)}.` : "";
  return {
    subject: mailTemplate(email.subject, values),
    html: mailLayout({
      company: site.name,
      bodyHtml: paragraphs(body) + (note ? `<p style="margin:0 0 4px;font-size:13px;color:#776f86">${note}</p>` : ""),
      button: o.link ? { label: email.buttonLabel, url: o.link } : undefined,
      footer: email.footer,
    }),
    text: [body, o.link ? `${email.buttonLabel}: ${o.link}` : "", note, email.footer].filter(Boolean).join("\n\n"),
  };
}
