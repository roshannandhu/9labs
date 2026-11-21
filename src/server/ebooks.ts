import "server-only";
import type { Ebook } from "@/content/site";
import type { DeliverySettings } from "@/content/types";
import { buildEbookMail } from "@/lib/ebooks/mail";
import { isPdfRef, refKey } from "@/lib/fileRefs";
import { mailLayout, paragraphs } from "@/lib/mail";
import { signToken, verifyToken } from "@/lib/tokens";
import { getPublished, readWorkspace } from "./content";
import { env } from "./env";
import { type BookRequestRow, findBookRequest, pendingBookRequestsForRetry, spendDownload, updateBookRequest } from "./leads";
import { sendMail } from "./mail";
import { getObject } from "./r2";

/** Only a real PDF upload counts: an editor-written ref pointing at backups/ or archives/ must never be mailed out. */
const pdfKeyOf = (ref: string | undefined) => (isPdfRef(ref) ? refKey(ref) : undefined);

const effectiveDeliveryMode = (book: Pick<Ebook, "deliveryMode">, d: DeliverySettings) => (book.deliveryMode === "inherit" ? d.deliveryMode : book.deliveryMode);

export type DownloadCheck = { ok: true; book: { title: string; subtitle: string; oneLiner: string; slug: string }; expiresAt: string | null; left: number } | { ok: false; reason: "invalid" | "expired" | "used" | "missing" };

type TokenClaims = { id: string; v: number; exp: number };

export async function checkDownload(token: string): Promise<DownloadCheck> {
  const claims = verifyToken<TokenClaims>(token, env().APP_SECRET, { allowExpired: true });
  if (!claims) return { ok: false, reason: "invalid" };
  if (claims.exp < Date.now() / 1000) return { ok: false, reason: "expired" };

  const request = await findBookRequest(claims.id);
  if (!request || request.status !== "sent" || request.token_version !== claims.v) return { ok: false, reason: "invalid" };

  const published = await getPublished();
  const left = published.delivery.maxDownloads - request.link_downloads;
  if (left <= 0) return { ok: false, reason: "used" };

  const book = published.site.ebooks.find((b) => b.slug === request.book_slug);
  if (!book || !book.pdfFileId) return { ok: false, reason: "missing" };

  return { ok: true, book: { title: book.title, subtitle: book.subtitle, oneLiner: book.oneLiner, slug: book.slug }, expiresAt: request.expires_at, left };
}

export type ConsumeResult = { ok: true; file: Response; filename: string } | { ok: false; reason: "invalid" | "expired" | "used" | "missing" };

/** Atomically uses up one download of a signed link, then resolves the PDF to stream — the POST /download counterpart to the read-only checkDownload above. */
export async function consumeDownload(token: string): Promise<ConsumeResult> {
  const claims = verifyToken<TokenClaims>(token, env().APP_SECRET, { allowExpired: true });
  if (!claims) return { ok: false, reason: "invalid" };
  if (claims.exp < Date.now() / 1000) return { ok: false, reason: "expired" };

  const published = await getPublished();
  const request = await findBookRequest(claims.id);
  const book = published.site.ebooks.find((b) => b.slug === request?.book_slug);
  const pdfKey = pdfKeyOf(book?.pdfFileId);
  if (!book || !pdfKey) return { ok: false, reason: "missing" };

  // open the file first: a storage hiccup must not use up one of the visitor's downloads
  const file = await getObject(pdfKey);
  if (file.status !== 200 || !file.body) return { ok: false, reason: "missing" };

  const used = await spendDownload(claims.id, claims.v, published.delivery.maxDownloads);
  if (!used) {
    await file.body.cancel().catch(() => {});
    return { ok: false, reason: "used" };
  }
  return { ok: true, file, filename: `${book.slug || "e-book"}.pdf` };
}

export type DeliverResult = { ok: true; used: string } | { ok: false; error: string };

/**
 * Sends a book to whoever asked for it — as an attachment, a private link, or both, following the
 * book's own rule or the general one. Always reads the **published** site, so a draft still being
 * edited can never leak into an e-mail. There is no manual approval any more: this always runs.
 */
export async function deliverBookRequest(requestId: string): Promise<DeliverResult> {
  const request = await findBookRequest(requestId);
  if (!request) return { ok: false, error: "This request no longer exists." };

  const fail = async (error: string): Promise<DeliverResult> => {
    await updateBookRequest(request.id, { status: "failed", error: error.slice(0, 300), attempts: request.attempts + 1, lastAttemptAt: new Date().toISOString() });
    return { ok: false, error };
  };

  const published = await getPublished();
  const book = published.site.ebooks.find((b) => b.slug === request.book_slug);
  if (!book) return fail("The book for this request no longer exists.");

  const pdfKey = pdfKeyOf(book.pdfFileId);
  if (!pdfKey) {
    // Not a failed delivery: the request waits (no attempt used up) and goes out as soon as a published
    // version of the book has its PDF — Publish sends waiting requests at once (retryPendingDeliveries).
    const draftBook = (await readWorkspace("draft"))?.data.site.ebooks.find((b) => b.slug === request.book_slug);
    const error = pdfKeyOf(draftBook?.pdfFileId)
      ? `“${book.title}”'s PDF is uploaded but not published yet. Press Publish and it sends right away.`
      : `“${book.title}” has no PDF yet. Upload one on the book's page, then Publish, and it sends right away.`;
    await updateBookRequest(request.id, { status: "pending", error, lastAttemptAt: new Date().toISOString() });
    return { ok: false, error };
  }

  const fileRes = await getObject(pdfKey);
  if (fileRes.status !== 200 || !fileRes.body) return fail("The PDF file could not be found. Upload it again.");
  const fileBytes = new Uint8Array(await fileRes.arrayBuffer());

  const delivery = published.delivery;
  let mode = effectiveDeliveryMode(book, delivery);
  let used = mode === "both" ? "Attachment and link" : mode === "attachment" ? "Attachment" : "Link";
  if (fileBytes.byteLength > delivery.attachmentMaxMb * 1024 * 1024 && mode !== "link") {
    mode = "link";
    used = `Link (the PDF is larger than ${delivery.attachmentMaxMb} MB, so it was not attached)`;
  }

  const version = request.token_version + 1;
  const expiresDate = new Date(Date.now() + delivery.linkDays * 86_400_000);
  const token = signToken({ id: request.id, v: version, exp: Math.floor(expiresDate.getTime() / 1000) }, env().APP_SECRET);
  const link = mode === "attachment" ? undefined : `${env().SITE_URL}/download/?t=${token}`;

  const mail = buildEbookMail(published.site, published.email, { name: request.name, bookTitle: book.title, link, expires: link ? expiresDate : undefined });
  const attachments = mode === "link" ? undefined : [{ filename: `${book.slug || "e-book"}.pdf`, content: Buffer.from(fileBytes).toString("base64"), mimeType: "application/pdf" }];

  const sent = await sendMail({ kind: "ebook", to: request.email, subject: mail.subject, html: mail.html, text: mail.text, attachments });
  if (!sent.ok) return fail(sent.error ?? "The e-mail could not be sent.");

  await updateBookRequest(request.id, {
    status: "sent",
    deliveryUsed: used,
    sentAt: new Date().toISOString(),
    expiresAt: link ? expiresDate.toISOString() : null,
    error: "",
    tokenVersion: version,
    linkDownloads: 0,
    attempts: request.attempts + 1,
    lastAttemptAt: new Date().toISOString(),
  });
  return { ok: true, used };
}

export async function alertAdminNewRequest(request: Pick<BookRequestRow, "name" | "email" | "phone" | "company">, bookTitle: string, waiting: boolean): Promise<void> {
  const published = await getPublished();
  if (!published.delivery.adminAlert) return;
  const to = published.delivery.adminAlertTo || published.site.contact.email;
  if (!to) return;
  const lines = [`Name: ${request.name}`, `E-mail: ${request.email}`, request.phone ? `Phone: ${request.phone}` : "", request.company ? `Company: ${request.company}` : "", `Book: ${bookTitle}`].filter(Boolean).join("\n");
  await sendMail({
    kind: "ebook-alert",
    to,
    subject: waiting ? `New e-book request (not sent yet): ${bookTitle}` : `E-book sent: ${bookTitle}`,
    html: mailLayout({ company: "Nine Labs Admin", heading: waiting ? "A new e-book request is waiting on a PDF" : "An e-book was sent", bodyHtml: paragraphs(lines) }),
    text: lines,
  });
}

/**
 * Retries requests that haven't gone out yet (no PDF at the time, or a send failure). The 15-minute cron
 * waits 15 minutes between tries; a Publish (`now`) tries everything waiting at once — that's when a PDF appears.
 */
export async function retryPendingDeliveries(limit: number, now = false): Promise<void> {
  const rows = await pendingBookRequestsForRetry(limit, now);
  for (const row of rows) {
    // one bad row (R2 or DB hiccup) must not stop the rest of the batch — or the cron tick after it
    try {
      const result = await deliverBookRequest(row.id);
      if (result.ok) {
        const published = await getPublished();
        const book = published.site.ebooks.find((b) => b.slug === row.book_slug);
        await alertAdminNewRequest(row, book?.title ?? row.book_slug, false);
      }
    } catch (err) {
      console.error("[ebooks] retry failed for", row.id, err instanceof Error ? err.message : err);
    }
  }
}
