import fs from "fs";
import path from "path";
import type { Payload } from "payload";
import type { Ebook, EbookFile, Lead } from "@/payload-types";
import { sign, verify } from "../auth/tokens";
import { DELIVERY_DEFAULTS, EBOOK_EMAIL } from "../mail/defaults";
import { esc, layout, paragraphs, sendMail, template } from "../mail/send";

type Mode = "link" | "attachment" | "both";
type Delivery = typeof DELIVERY_DEFAULTS;

const EBOOK_DIR = path.resolve(process.cwd(), "uploads/ebooks");
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/**
 * Where a book's PDF lives. This is the one place that knows the files are on local disk; when
 * the host is chosen and files move to cloud storage, only this function and `openEbook` change.
 */
export function ebookPath(file: Pick<EbookFile, "filename">): string | null {
  if (!file.filename) return null;
  const p = path.resolve(EBOOK_DIR, file.filename);
  // never follow a file name out of the e-books folder
  if (!p.startsWith(EBOOK_DIR + path.sep) || !fs.existsSync(p)) return null;
  return p;
}

/** The sending settings (Books → Book settings), with the built-in values for anything not set. */
export async function deliverySettings(payload: Payload) {
  const s = await payload.findGlobal({ slug: "ebook-settings", depth: 0, overrideAccess: true });
  const d = s.delivery ?? {};
  const e = s.email ?? {};
  const delivery: Delivery = {
    approvalMode: d.approvalMode === "auto" ? "auto" : "manual",
    deliveryMode: d.deliveryMode === "attachment" || d.deliveryMode === "both" ? d.deliveryMode : "link",
    attachmentMaxMb: d.attachmentMaxMb || DELIVERY_DEFAULTS.attachmentMaxMb,
    linkDays: d.linkDays || DELIVERY_DEFAULTS.linkDays,
    maxDownloads: d.maxDownloads || DELIVERY_DEFAULTS.maxDownloads,
    senderName: d.senderName || DELIVERY_DEFAULTS.senderName,
    replyTo: d.replyTo || "",
    adminAlert: d.adminAlert !== false,
    adminAlertTo: d.adminAlertTo || "",
  };
  const email = {
    subject: e.subject || EBOOK_EMAIL.subject,
    body: e.body || EBOOK_EMAIL.body,
    buttonLabel: e.buttonLabel || EBOOK_EMAIL.buttonLabel,
    footer: e.footer ?? EBOOK_EMAIL.footer,
  };
  return { delivery, email };
}

export const approvalFor = (book: Pick<Ebook, "approvalMode">, d: Delivery): "auto" | "manual" => (book.approvalMode === "auto" || book.approvalMode === "manual" ? book.approvalMode : d.approvalMode);
const modeFor = (book: Pick<Ebook, "deliveryMode">, d: Delivery): Mode => (book.deliveryMode === "link" || book.deliveryMode === "attachment" || book.deliveryMode === "both" ? book.deliveryMode : d.deliveryMode);

type LinkClaims = { sub?: string; v?: number };
const linkToken = (lead: Pick<Lead, "id">, version: number, days: number) => sign({ sub: String(lead.id), v: version }, "ebook-download", days * 86_400);

export type LinkState = { ok: true; lead: Lead; book: Ebook; file: string; left: number } | { ok: false; reason: "invalid" | "expired" | "used" | "missing" };

/**
 * Check a personal download link: it must be signed by us, not expired, be the lead's current
 * link (a re-sent e-mail replaces the old one) and still have downloads left.
 */
export async function checkLink(payload: Payload, token: string): Promise<LinkState> {
  const claims = await verify<LinkClaims>(token, "ebook-download");
  if (!claims?.sub) return { ok: false, reason: "invalid" };
  const lead = await payload.findByID({ collection: "leads", id: claims.sub, depth: 2, overrideAccess: true, disableErrors: true });
  if (!lead || lead.status !== "sent" || (lead.tokenVersion ?? 1) !== claims.v) return { ok: false, reason: "invalid" };
  if (lead.expiresAt && new Date(lead.expiresAt).getTime() < Date.now()) return { ok: false, reason: "expired" };
  const { delivery } = await deliverySettings(payload);
  const left = delivery.maxDownloads - (lead.linkDownloads ?? 0);
  if (left <= 0) return { ok: false, reason: "used" };
  const book = typeof lead.book === "object" ? lead.book : null;
  const fileDoc = book && typeof book.file === "object" ? book.file : null;
  const file = fileDoc ? ebookPath(fileDoc) : null;
  if (!book || !file) return { ok: false, reason: "missing" };
  return { ok: true, lead, book, file, left };
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const longDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Build the e-mail a visitor receives for a book (also used by "Send me a test"). */
export async function buildEbookMail(payload: Payload, o: { name: string; bookTitle: string; link?: string; expires?: Date }) {
  const { delivery, email } = await deliverySettings(payload);
  const company = (await payload.findGlobal({ slug: "company", depth: 0, overrideAccess: true })).name || "Nine Labs Solutions";
  const values = { name: firstName(o.name), bookTitle: o.bookTitle, downloadLink: o.link ?? "", expiryDate: o.expires ? longDate(o.expires) : "", company };
  const body = template(email.body, values);
  const note = o.link && o.expires ? `This link is personal and works until ${longDate(o.expires)}.` : "";
  return {
    delivery,
    subject: template(email.subject, values),
    html: layout({
      company,
      bodyHtml: paragraphs(body) + (note ? `<p style="margin:0 0 4px;font-size:13px;color:#776f86">${esc(note)}</p>` : ""),
      button: o.link ? { label: email.buttonLabel, url: o.link } : undefined,
      footer: email.footer,
    }),
    text: [body, o.link ? `${email.buttonLabel}: ${o.link}` : "", note, email.footer].filter(Boolean).join("\n\n"),
  };
}

/**
 * Send a book to the person who asked for it — as an attachment, a private link, or both,
 * following the book's own setting or the general one. Used by Approve & send, Resend and
 * automatic sending. The request is marked Sent, or Failed with the reason.
 */
export async function deliverLead(payload: Payload, leadId: number | string): Promise<{ ok: true; used: string } | { ok: false; error: string }> {
  const lead = await payload.findByID({ collection: "leads", id: leadId, depth: 2, overrideAccess: true, disableErrors: true });
  if (!lead) return { ok: false, error: "This request no longer exists." };
  const book = typeof lead.book === "object" ? lead.book : null;
  const fail = async (error: string) => {
    await payload.update({ collection: "leads", id: lead.id, data: { status: "failed", error: error.slice(0, 300) }, overrideAccess: true });
    return { ok: false as const, error };
  };
  if (!book) return fail("The book for this request no longer exists.");
  const fileDoc = typeof book.file === "object" ? book.file : null;
  const file = fileDoc ? ebookPath(fileDoc) : null;
  if (!fileDoc || !file) return fail(`“${book.title}” has no PDF yet. Upload one on the book's page (Cover & PDF), then send again.`);

  const { delivery } = await deliverySettings(payload);
  let mode = modeFor(book, delivery);
  let used: string = mode === "both" ? "Attachment and link" : mode === "attachment" ? "Attachment" : "Link";
  const tooBig = (fileDoc.filesize ?? 0) > delivery.attachmentMaxMb * 1024 * 1024;
  if (tooBig && mode !== "link") {
    mode = "link";
    used = `Link (the PDF is larger than ${delivery.attachmentMaxMb} MB, so it was not attached)`;
  }

  const version = (lead.tokenVersion ?? 1) + 1;
  const expires = new Date(Date.now() + delivery.linkDays * 86_400_000);
  const link = mode === "attachment" ? undefined : `${siteUrl()}/download/${await linkToken(lead, version, delivery.linkDays)}`;

  try {
    const mail = await buildEbookMail(payload, { name: lead.name, bookTitle: book.title, link, expires: link ? expires : undefined });
    await sendMail(payload, {
      to: lead.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      fromName: delivery.senderName,
      replyTo: delivery.replyTo || undefined,
      attachments: mode === "link" ? undefined : [{ filename: `${book.slug || "e-book"}.pdf`, path: file, contentType: "application/pdf" }],
    });
  } catch (err) {
    payload.logger.error({ err }, "E-book e-mail failed");
    return fail(`The e-mail could not be sent: ${err instanceof Error ? err.message : "unknown error"}`);
  }

  const firstSend = lead.status !== "sent";
  await payload.update({
    collection: "leads",
    id: lead.id,
    overrideAccess: true,
    data: { status: "sent", deliveryUsed: used, sentAt: new Date().toISOString(), expiresAt: link ? expires.toISOString() : null, error: null, tokenVersion: version, linkDownloads: 0 },
  });
  if (firstSend) await payload.update({ collection: "ebooks", id: book.id, data: { sent: (book.sent ?? 0) + 1 }, overrideAccess: true });
  return { ok: true, used };
}

/** Tell the admin a new request is waiting (Books → Book settings → Sending → alerts). */
export async function alertAdmin(payload: Payload, lead: Pick<Lead, "id" | "name" | "email" | "phone" | "company">, bookTitle: string, waiting: boolean) {
  const { delivery } = await deliverySettings(payload);
  if (!delivery.adminAlert) return;
  const company = await payload.findGlobal({ slug: "company", depth: 0, overrideAccess: true });
  const to = delivery.adminAlertTo || company.contact?.email;
  if (!to) return;
  const admin = (process.env.NEXT_PUBLIC_ADMIN_URL || siteUrl()).replace(/\/$/, "");
  const lines = [`Name: ${lead.name}`, `E-mail: ${lead.email}`, lead.phone ? `Phone: ${lead.phone}` : "", lead.company ? `Company: ${lead.company}` : "", `Book: ${bookTitle}`].filter(Boolean).join("\n");
  try {
    await sendMail(payload, {
      to,
      subject: waiting ? `New e-book request to approve: ${bookTitle}` : `E-book sent: ${bookTitle}`,
      text: `${lines}\n\n${waiting ? "Open the request to approve and send it" : "Open the request"}: ${admin}/admin/collections/leads/${lead.id}`,
      html: layout({
        company: "Nine Labs Admin",
        heading: waiting ? "A new e-book request is waiting" : "An e-book was sent",
        bodyHtml: paragraphs(lines),
        button: { label: waiting ? "Open and approve" : "Open the request", url: `${admin}/admin/collections/leads/${lead.id}` },
      }),
    });
  } catch (err) {
    payload.logger.error({ err }, "Admin alert e-mail failed");
  }
}
