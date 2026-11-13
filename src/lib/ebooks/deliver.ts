"use client";

import type { Ebook } from "@/content/site";
import type { BookRequest, DeliverySettings, EbookEmailSettings } from "@/content/types";
import type { SiteData } from "@/content/types";
import { getFile } from "@/lib/files";
import { mailLayout, mailTemplate, paragraphs } from "@/lib/mail";
import { addOutboxMail, bumpEbookCounter, getState, updateBookRequest } from "@/lib/store";

export const DELIVERY_OPTIONS: { label: string; value: DeliverySettings["deliveryMode"] }[] = [
  { label: "A private download link", value: "link" },
  { label: "The PDF attached to the e-mail", value: "attachment" },
  { label: "Both: attached and a link", value: "both" },
];

export const effectiveApproval = (book: Pick<Ebook, "approvalMode">, delivery: DeliverySettings) => (book.approvalMode === "inherit" ? delivery.approvalMode : book.approvalMode);
export const effectiveDeliveryMode = (book: Pick<Ebook, "deliveryMode">, delivery: DeliverySettings) => (book.deliveryMode === "inherit" ? delivery.deliveryMode : book.deliveryMode);

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const longDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** A download link is just a base64 payload the site itself can read back — there is no server to sign it against. */
export function makeDownloadToken(requestId: string, version: number, days: number): string {
  const payload = JSON.stringify({ id: requestId, v: version, exp: Date.now() + days * 86_400_000 });
  return btoa(unescape(encodeURIComponent(payload)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export function readDownloadToken(token: string): { id: string; v: number; exp: number } | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return null;
  }
}

export type LinkState = { ok: true; request: BookRequest; book: Ebook; left: number } | { ok: false; reason: "invalid" | "expired" | "used" | "missing" };

export function checkDownloadLink(token: string): LinkState {
  const claims = readDownloadToken(token);
  if (!claims) return { ok: false, reason: "invalid" };
  const { bookRequests, published } = getState();
  const request = bookRequests.find((r) => r.id === claims.id);
  if (!request || request.status !== "sent" || request.tokenVersion !== claims.v) return { ok: false, reason: "invalid" };
  if (claims.exp < Date.now()) return { ok: false, reason: "expired" };
  const left = published.delivery.maxDownloads - request.linkDownloads;
  if (left <= 0) return { ok: false, reason: "used" };
  const book = published.site.ebooks.find((b) => b.slug === request.bookSlug);
  if (!book || !book.pdfFileId) return { ok: false, reason: "missing" };
  return { ok: true, request, book, left };
}

/** Counts a visitor's actual download (the download page calls this once the file starts saving). */
export function recordDownload(requestId: string) {
  const { bookRequests, published } = getState();
  const request = bookRequests.find((r) => r.id === requestId);
  if (!request) return;
  updateBookRequest(requestId, { downloads: request.downloads + 1, linkDownloads: request.linkDownloads + 1 });
  const book = published.site.ebooks.find((b) => b.slug === request.bookSlug);
  if (book) bumpEbookCounter(book.id, "downloads", 1);
}

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

export type DeliverResult = { ok: true; used: string } | { ok: false; error: string };

/**
 * Sends a book to whoever asked for it — as an attachment, a private link, or both, following
 * the book's own rule or the general one. Reads the **published** site (what is actually live),
 * so a draft still being edited can never leak into an e-mail. "Sending" writes to the Outbox.
 */
export async function deliverBookRequest(requestId: string): Promise<DeliverResult> {
  const { bookRequests, published } = getState();
  const request = bookRequests.find((r) => r.id === requestId);
  if (!request) return { ok: false, error: "This request no longer exists." };
  const book = published.site.ebooks.find((b) => b.slug === request.bookSlug);
  const fail = (error: string): DeliverResult => {
    updateBookRequest(request.id, { status: "failed", error: error.slice(0, 300) });
    return { ok: false, error };
  };
  if (!book) return fail("The book for this request no longer exists.");
  if (!book.pdfFileId) return fail(`“${book.title}” has no PDF yet. Upload one on the book's page (Cover & PDF), then send again.`);
  const file = await getFile(book.pdfFileId);
  if (!file) return fail("The PDF file could not be found. Upload it again.");

  const delivery = published.delivery;
  let mode = effectiveDeliveryMode(book, delivery);
  let used = mode === "both" ? "Attachment and link" : mode === "attachment" ? "Attachment" : "Link";
  const tooBig = file.size > delivery.attachmentMaxMb * 1024 * 1024;
  if (tooBig && mode !== "link") {
    mode = "link";
    used = `Link (the PDF is larger than ${delivery.attachmentMaxMb} MB, so it was not attached)`;
  }

  const version = request.tokenVersion + 1;
  const expires = new Date(Date.now() + delivery.linkDays * 86_400_000);
  const link = mode === "attachment" ? undefined : `/download/?t=${makeDownloadToken(request.id, version, delivery.linkDays)}`;

  const mail = buildEbookMail(published.site, published.email, { name: request.name, bookTitle: book.title, link, expires: link ? expires : undefined });
  addOutboxMail({ kind: "ebook", to: request.email, subject: mail.subject, html: mail.html, text: mail.text });

  const firstSend = request.status !== "sent";
  updateBookRequest(request.id, {
    status: "sent",
    deliveryUsed: used,
    sentAt: new Date().toISOString(),
    expiresAt: link ? expires.toISOString() : null,
    error: "",
    tokenVersion: version,
    linkDownloads: 0,
  });
  if (firstSend) bumpEbookCounter(book.id, "sent", 1);
  return { ok: true, used };
}

export function alertAdminNewRequest(request: Pick<BookRequest, "name" | "email" | "phone" | "company">, bookTitle: string, waiting: boolean) {
  const { published } = getState();
  if (!published.delivery.adminAlert) return;
  const to = published.delivery.adminAlertTo || published.site.contact.email;
  if (!to) return;
  const lines = [`Name: ${request.name}`, `E-mail: ${request.email}`, request.phone ? `Phone: ${request.phone}` : "", request.company ? `Company: ${request.company}` : "", `Book: ${bookTitle}`].filter(Boolean).join("\n");
  addOutboxMail({
    kind: "ebook-alert",
    to,
    subject: waiting ? `New e-book request to approve: ${bookTitle}` : `E-book sent: ${bookTitle}`,
    html: mailLayout({ company: "Nine Labs Admin", heading: waiting ? "A new e-book request is waiting" : "An e-book was sent", bodyHtml: paragraphs(lines) }),
    text: lines,
  });
}
