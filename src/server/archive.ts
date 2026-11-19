import "server-only";
import { ARCHIVE_NAME, ARCHIVE_PREFIX, type ArchiveCounts, type ArchiveFile, type ArchiveListItem, type ArchiveRow as Row, type ArchiveRun, archiveCutoff, archiveName, monthOf, sameCounts } from "@/lib/archive";
import { getPublished } from "./content";
import { db } from "./db";
import { r2Configured } from "./env";
import { HttpError } from "./http";
import { getObject, listObjects, putObject } from "./r2";

const TABLES = { enquiries: "enquiries", bookRequests: "book_requests", quizResults: "quiz_results", outbox: "outbox" } as const;
type Part = keyof typeof TABLES;
const PARTS = Object.keys(TABLES) as Part[];

async function oldestBefore(table: string, cutoffIso: string): Promise<string | null> {
  const { data, error } = await db().from(table).select("created_at").lt("created_at", cutoffIso).order("created_at", { ascending: true }).limit(1);
  if (error) throw error;
  return (data?.[0]?.created_at as string | undefined) ?? null;
}

/** Every row in [from, to), paged — PostgREST returns at most 1000 rows per request. */
async function rowsBetween(table: string, fromIso: string, toIso: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let i = 0; ; i += 1000) {
    const { data, error } = await db().from(table).select("*").gte("created_at", fromIso).lt("created_at", toIso).order("created_at", { ascending: true }).range(i, i + 999);
    if (error) throw error;
    out.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) return out;
  }
}

async function deleteIds(table: string, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 200) {
    const { error } = await db().from(table).delete().in("id", ids.slice(i, i + 200));
    if (error) throw error;
  }
}

const countsOf = (f: Pick<ArchiveFile, Part>): ArchiveCounts => ({ enquiries: f.enquiries.length, bookRequests: f.bookRequests.length, quizResults: f.quizResults.length, outbox: f.outbox.length });

/**
 * Moves the oldest whole calendar month of leads older than the admin's retention setting into one
 * private R2 file, then deletes exactly those rows (by id) from the database — but only after the file
 * has been read back and its counts match. One month per run; any failure leaves the data where it is.
 */
export async function runArchive(opts: { force?: boolean } = {}): Promise<ArchiveRun> {
  const { retention } = await getPublished();
  if (!retention.enabled && !opts.force) return { skipped: "Auto-clean is switched off." };
  if (!r2Configured() && process.env.NODE_ENV === "production") return { skipped: "File storage (R2) isn't set up yet, so nothing was moved." };

  const now = new Date();
  const cutoff = archiveCutoff(now, retention.months).toISOString();
  const oldest = (await Promise.all(PARTS.map((p) => oldestBefore(TABLES[p], cutoff)))).filter((v): v is string => Boolean(v)).sort()[0];
  if (!oldest) return { skipped: `Nothing older than ${retention.months} months.` };

  const month = monthOf(oldest);
  const from = month.start.toISOString();
  const to = month.end.toISOString();
  const [enquiries, bookRequests, quizResults, outbox] = await Promise.all(PARTS.map((p) => rowsBetween(TABLES[p], from, to)));
  const file: ArchiveFile = { version: 1, kind: "archive", from, to, createdAt: now.toISOString(), counts: { enquiries: 0, bookRequests: 0, quizResults: 0, outbox: 0 }, enquiries, bookRequests, quizResults, outbox };
  file.counts = countsOf(file);

  const name = archiveName(month.start, month.lastDay, now);
  await putObject(`${ARCHIVE_PREFIX}${name}`, JSON.stringify(file), "application/json");

  // read it back before anything is deleted
  const back = await readArchive(name);
  if (!sameCounts(countsOf(back), file.counts)) throw new Error("The archive file didn't read back correctly, so nothing was deleted.");

  for (const p of PARTS) await deleteIds(TABLES[p], file[p].map((r) => r.id));
  return { archived: { name, counts: file.counts } };
}

export async function listArchives(): Promise<ArchiveListItem[]> {
  const items = await listObjects(ARCHIVE_PREFIX);
  return items
    .map((o) => ({ name: o.key.slice(ARCHIVE_PREFIX.length), size: o.size, at: o.at }))
    .filter((o) => ARCHIVE_NAME.test(o.name))
    .sort((a, b) => b.name.localeCompare(a.name));
}

export async function readArchive(name: string): Promise<ArchiveFile> {
  if (!ARCHIVE_NAME.test(name)) throw new HttpError(400, "Not an archive file.");
  const res = await getObject(`${ARCHIVE_PREFIX}${name}`);
  if (res.status !== 200) throw new HttpError(404, "That archive file wasn't found.");
  const parsed = (await res.json()) as ArchiveFile;
  if (parsed?.kind !== "archive") throw new HttpError(422, "That file isn't a Nine Labs archive.");
  return parsed;
}
