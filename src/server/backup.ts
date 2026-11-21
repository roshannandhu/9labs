import "server-only";
import { defaultWorkspace } from "@/content/defaults";
import { seedSampleData } from "@/lib/sample";
import { normalizeWorkspace } from "@/lib/workspace";
import type { BookRequest, Enquiry, OutboxMail, QuizResult, Workspace } from "@/content/types";
import { db } from "./db";
import { purgeAfterContentChange } from "./purge";
import { HttpError } from "./http";
import { readWorkspace, setPublishedMemo } from "./content";
import { deleteAllLeads, deleteLeadsNotIn, listBookRequests, listEnquiries, listQuizResults, upsertBookRequests, upsertEnquiries, upsertOutboxRows, upsertQuizResults } from "./leads";

export type Backup = { version: 2; exportedAt: string; draft: Workspace; published: Workspace; enquiries: Enquiry[]; bookRequests: BookRequest[]; quizResults: QuizResult[] };

export async function exportBackup(): Promise<Backup> {
  const [draftRow, publishedRow, enquiries, bookRequests, quizResults] = await Promise.all([readWorkspace("draft"), readWorkspace("published"), listEnquiries(), listBookRequests(), listQuizResults()]);
  return { version: 2, exportedAt: new Date().toISOString(), draft: draftRow?.data ?? defaultWorkspace(), published: publishedRow?.data ?? defaultWorkspace(), enquiries, bookRequests, quizResults };
}

/** Upserts the workspace and leads first, then deletes leads not in the file — a failure halfway loses nothing already restored. The team is untouched. */
export async function restoreBackup(raw: unknown): Promise<void> {
  if (!raw || typeof raw !== "object" || (raw as Backup).version !== 2) throw new HttpError(422, "This doesn't look like a Nine Labs backup file.");
  const b = raw as Backup;

  const draft = normalizeWorkspace(b.draft);
  const published = normalizeWorkspace(b.published);
  const now = new Date().toISOString();

  const { error: draftErr } = await db().from("workspace").upsert({ id: "draft", data: draft, rev: 1, updated_at: now, updated_by: "restore" });
  if (draftErr) throw draftErr;
  const { error: pubErr } = await db().from("workspace").upsert({ id: "published", data: published, rev: 1, updated_at: now, updated_by: "restore" });
  if (pubErr) throw pubErr;

  await Promise.all([upsertEnquiries(b.enquiries ?? []), upsertBookRequests(b.bookRequests ?? []), upsertQuizResults(b.quizResults ?? [])]);
  await Promise.all([
    deleteLeadsNotIn("enquiries", (b.enquiries ?? []).map((e) => e.id)),
    deleteLeadsNotIn("book_requests", (b.bookRequests ?? []).map((r) => r.id)),
    deleteLeadsNotIn("quiz_results", (b.quizResults ?? []).map((r) => r.id)),
  ]);

  setPublishedMemo(published);
  await purgeAfterContentChange();
}

export async function resetAll(): Promise<void> {
  const fresh = defaultWorkspace();
  const now = new Date().toISOString();
  const { error } = await db()
    .from("workspace")
    .upsert([
      { id: "draft", data: fresh, rev: 1, updated_at: now, updated_by: "reset" },
      { id: "published", data: fresh, rev: 1, updated_at: now, updated_by: "reset" },
    ]);
  if (error) throw error;
  await Promise.all([deleteAllLeads(), db().from("versions").delete().neq("id", "00000000-0000-0000-0000-000000000000"), db().from("rate_hits").delete().neq("key", "")]);
  setPublishedMemo(fresh);
  await purgeAfterContentChange();
}

export async function loadSampleData(): Promise<void> {
  const sample = seedSampleData<{ enquiries: Enquiry[]; bookRequests: BookRequest[]; quizResults: QuizResult[]; outbox: OutboxMail[] }>({ enquiries: [], bookRequests: [], quizResults: [], outbox: [] });
  await Promise.all([upsertEnquiries(sample.enquiries), upsertBookRequests(sample.bookRequests), upsertQuizResults(sample.quizResults), upsertOutboxRows(sample.outbox)]);
}
