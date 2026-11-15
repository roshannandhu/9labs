import "server-only";
import type { BookRequest, BookRequestStatus, Enquiry, FollowUp, OutboxKind, OutboxMail, QuizAction, QuizResult } from "@/content/types";
import { db } from "./db";

export const newId = (prefix: string): string => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

const LIST_CAP = 5000;

/* ------------------------------------------------------------------ */
/*  Enquiries                                                           */
/* ------------------------------------------------------------------ */

type EnquiryRow = {
  id: string;
  ref: string;
  name: string;
  company: string;
  service: string;
  service_title: string;
  needs: string[];
  budget: string;
  timeline: string;
  message: string;
  channel: "whatsapp" | "email";
  status: FollowUp;
  notes: string;
  created_at: string;
};

const enquiryFromRow = (r: EnquiryRow): Enquiry => ({ id: r.id, ref: r.ref, name: r.name, company: r.company, service: r.service, serviceTitle: r.service_title, needs: r.needs, budget: r.budget, timeline: r.timeline, message: r.message, channel: r.channel, status: r.status, notes: r.notes, createdAt: r.created_at });

export async function listEnquiries(): Promise<Enquiry[]> {
  const { data, error } = await db().from("enquiries").select("*").order("created_at", { ascending: false }).limit(LIST_CAP);
  if (error) throw error;
  return (data as EnquiryRow[]).map(enquiryFromRow);
}

export async function insertEnquiry(input: Omit<Enquiry, "id" | "status" | "notes" | "createdAt">): Promise<Enquiry> {
  const row = { id: newId("enq"), ref: input.ref, name: input.name, company: input.company, service: input.service, service_title: input.serviceTitle, needs: input.needs, budget: input.budget, timeline: input.timeline, message: input.message, channel: input.channel, status: "new", notes: "" };
  const { data, error } = await db().from("enquiries").insert(row).select().single();
  if (error) throw error;
  return enquiryFromRow(data as EnquiryRow);
}

/* ------------------------------------------------------------------ */
/*  E-book requests                                                     */
/* ------------------------------------------------------------------ */

export type BookRequestRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  book_slug: string;
  status: BookRequestStatus;
  delivery_used: string;
  sent_at: string | null;
  expires_at: string | null;
  downloads: number;
  link_downloads: number;
  token_version: number;
  error: string;
  notes: string;
  consent: boolean;
  source: string;
  attempts: number;
  last_attempt_at: string | null;
  created_at: string;
};

export const bookRequestFromRow = (r: BookRequestRow): BookRequest => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, company: r.company, bookSlug: r.book_slug, status: r.status, deliveryUsed: r.delivery_used, sentAt: r.sent_at, expiresAt: r.expires_at, downloads: r.downloads, linkDownloads: r.link_downloads, tokenVersion: r.token_version, error: r.error, notes: r.notes, consent: r.consent, source: r.source, createdAt: r.created_at });

export async function listBookRequests(): Promise<BookRequest[]> {
  const { data, error } = await db().from("book_requests").select("*").order("created_at", { ascending: false }).limit(LIST_CAP);
  if (error) throw error;
  return (data as BookRequestRow[]).map(bookRequestFromRow);
}

export async function findBookRequest(id: string): Promise<BookRequestRow | null> {
  const { data, error } = await db().from("book_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as BookRequestRow | null;
}

/** A still-open request for the same book from the same e-mail within the window — the "asked again" case. */
export async function findRecentBookRequest(email: string, bookSlug: string, sinceIso: string): Promise<BookRequestRow | null> {
  const { data, error } = await db().from("book_requests").select("*").ilike("email", email).eq("book_slug", bookSlug).neq("status", "rejected").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as BookRequestRow | null;
}

export async function insertBookRequest(input: { name: string; email: string; phone: string; company: string; bookSlug: string; source: string; consent: boolean }): Promise<BookRequestRow> {
  const row = { id: newId("req"), name: input.name, email: input.email, phone: input.phone, company: input.company, book_slug: input.bookSlug, status: "pending", delivery_used: "", sent_at: null, expires_at: null, downloads: 0, link_downloads: 0, token_version: 1, error: "", notes: "", consent: input.consent, source: input.source, attempts: 0, last_attempt_at: null };
  const { data, error } = await db().from("book_requests").insert(row).select().single();
  if (error) throw error;
  return data as BookRequestRow;
}

export type BookRequestPatch = Partial<{ name: string; phone: string; company: string; status: BookRequestStatus; deliveryUsed: string; sentAt: string | null; expiresAt: string | null; downloads: number; linkDownloads: number; tokenVersion: number; error: string; attempts: number; lastAttemptAt: string | null }>;

export async function updateBookRequest(id: string, patch: BookRequestPatch): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.company !== undefined) row.company = patch.company;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.deliveryUsed !== undefined) row.delivery_used = patch.deliveryUsed;
  if (patch.sentAt !== undefined) row.sent_at = patch.sentAt;
  if (patch.expiresAt !== undefined) row.expires_at = patch.expiresAt;
  if (patch.downloads !== undefined) row.downloads = patch.downloads;
  if (patch.linkDownloads !== undefined) row.link_downloads = patch.linkDownloads;
  if (patch.tokenVersion !== undefined) row.token_version = patch.tokenVersion;
  if (patch.error !== undefined) row.error = patch.error;
  if (patch.attempts !== undefined) row.attempts = patch.attempts;
  if (patch.lastAttemptAt !== undefined) row.last_attempt_at = patch.lastAttemptAt;
  const { error } = await db().from("book_requests").update(row).eq("id", id);
  if (error) throw error;
}

/** Uses up one download of a signed link, atomically (`supabase/migrations/0001_init.sql`). */
export async function useDownload(id: string, version: number, maxDownloads: number): Promise<BookRequestRow | null> {
  const { data, error } = await db().rpc("use_download", { p_id: id, p_version: version, p_max: maxDownloads });
  if (error) throw error;
  const rows = data as BookRequestRow[];
  return rows?.[0] ?? null;
}

export async function pendingBookRequestsForRetry(limit: number): Promise<BookRequestRow[]> {
  const retryAfter = new Date(Date.now() - 15 * 60_000).toISOString();
  const notOlderThan = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const { data, error } = await db()
    .from("book_requests")
    .select("*")
    .in("status", ["pending", "failed"])
    .lt("attempts", 5)
    .gte("created_at", notOlderThan)
    .or(`last_attempt_at.is.null,last_attempt_at.lt.${retryAfter}`)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data as BookRequestRow[];
}

/* ------------------------------------------------------------------ */
/*  Quiz results                                                        */
/* ------------------------------------------------------------------ */

type QuizResultRow = { id: string; ref: string; top: string; matches: string; summary: string; answers: Record<string, string[]>; action: QuizAction; email: string; status: FollowUp; notes: string; created_at: string };

const quizResultFromRow = (r: QuizResultRow): QuizResult => ({ id: r.id, ref: r.ref, top: r.top, matches: r.matches, summary: r.summary, answers: r.answers, action: r.action, email: r.email, status: r.status, notes: r.notes, createdAt: r.created_at });

export async function listQuizResults(): Promise<QuizResult[]> {
  const { data, error } = await db().from("quiz_results").select("*").order("created_at", { ascending: false }).limit(LIST_CAP);
  if (error) throw error;
  return (data as QuizResultRow[]).map(quizResultFromRow);
}

export async function findQuizResultByRef(ref: string): Promise<QuizResultRow | null> {
  const { data, error } = await db().from("quiz_results").select("*").eq("ref", ref).maybeSingle();
  if (error) throw error;
  return data as QuizResultRow | null;
}

/** Inserts a fresh result, or does nothing if this ref was already saved (the visitor re-sent the same finish). */
export async function insertQuizResultIfNew(input: { ref: string; top: string; matches: string; summary: string; answers: Record<string, string[]> }): Promise<void> {
  const row = { id: newId("quiz"), ref: input.ref, top: input.top, matches: input.matches, summary: input.summary, answers: input.answers, action: "none", email: "", status: "new", notes: "" };
  const { error } = await db().from("quiz_results").upsert(row, { onConflict: "ref", ignoreDuplicates: true });
  if (error) throw error;
}

export async function updateQuizResultByRef(ref: string, patch: Partial<{ action: QuizAction; email: string }>): Promise<void> {
  const { error } = await db().from("quiz_results").update(patch).eq("ref", ref);
  if (error) throw error;
}

export async function recentQuizEmailCount(email: string, sinceIso: string): Promise<number> {
  const { count, error } = await db().from("quiz_results").select("id", { count: "exact", head: true }).ilike("email", email).gte("created_at", sinceIso);
  if (error) throw error;
  return count ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Leads: shared                                                        */
/* ------------------------------------------------------------------ */

export async function deleteLead(kind: "enquiry" | "book" | "quiz", id: string): Promise<void> {
  const table = kind === "enquiry" ? "enquiries" : kind === "book" ? "book_requests" : "quiz_results";
  const { error } = await db().from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function clearSampleLeads(): Promise<void> {
  await Promise.all([
    db().from("enquiries").delete().like("id", "%_sample_%"),
    db().from("book_requests").delete().like("id", "%_sample_%"),
    db().from("quiz_results").delete().like("id", "%_sample_%"),
  ]);
}

export async function deleteAllLeads(): Promise<void> {
  await Promise.all([db().from("enquiries").delete().neq("id", ""), db().from("book_requests").delete().neq("id", ""), db().from("quiz_results").delete().neq("id", ""), db().from("outbox").delete().neq("id", "")]);
}

/* ------------------------------------------------------------------ */
/*  Outbox                                                               */
/* ------------------------------------------------------------------ */

type OutboxRow = { id: string; kind: OutboxKind; to_email: string; subject: string; html: string; text: string; status: "sent" | "failed" | "logged"; error: string; created_at: string };

const outboxFromRow = (r: OutboxRow): OutboxMail => ({ id: r.id, kind: r.kind, to: r.to_email, subject: r.subject, html: r.html, text: r.text, createdAt: r.created_at, status: r.status, error: r.error || undefined });

export async function listOutbox(): Promise<OutboxMail[]> {
  const { data, error } = await db().from("outbox").select("id, kind, to_email, subject, text, status, error, created_at").order("created_at", { ascending: false }).limit(LIST_CAP);
  if (error) throw error;
  return (data as Omit<OutboxRow, "html">[]).map((r) => outboxFromRow({ ...r, html: "" }));
}

export async function findOutboxHtml(id: string): Promise<string | null> {
  const { data, error } = await db().from("outbox").select("html").eq("id", id).maybeSingle();
  if (error) throw error;
  return data?.html ?? null;
}

/** The most recent outbox mail of this kind sent to this address — for "the e-mail they received". */
export async function findLatestOutboxByEmailKind(email: string, kind: OutboxKind): Promise<OutboxMail | null> {
  const { data, error } = await db().from("outbox").select("*").ilike("to_email", email).eq("kind", kind).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? outboxFromRow(data as OutboxRow) : null;
}

export async function insertOutbox(input: { kind: OutboxKind; to: string; subject: string; html: string; text: string; status: "sent" | "failed" | "logged"; error?: string }): Promise<void> {
  const row = { id: newId("mail"), kind: input.kind, to_email: input.to, subject: input.subject, html: input.html, text: input.text, status: input.status, error: input.error ?? "" };
  const { error } = await db().from("outbox").insert(row);
  if (error) throw error;
}
