/** Pure date/name rules for the lead archive (src/server/archive.ts), kept here so they can be tested. */

export const ARCHIVE_PREFIX = "archives/";
export const ARCHIVE_NAME = /^archive_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}__[\dTZ-]+\.json$/;

export type ArchiveCounts = { enquiries: number; bookRequests: number; quizResults: number; outbox: number };
/** Rows are stored exactly as the database holds them (snake_case columns). */
export type ArchiveRow = Record<string, unknown> & { id: string; created_at: string };
export type ArchiveFile = { version: 1; kind: "archive"; from: string; to: string; createdAt: string; counts: ArchiveCounts; enquiries: ArchiveRow[]; bookRequests: ArchiveRow[]; quizResults: ArchiveRow[]; outbox: ArchiveRow[] };
export type ArchiveListItem = { name: string; size: number; at: string };
export type ArchiveRun = { archived: { name: string; counts: ArchiveCounts } } | { skipped: string };

/** Rows created before this instant are old enough: the first day of (this month − months), UTC. */
export function archiveCutoff(now: Date, months: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - Math.max(1, Math.floor(months)), 1));
}

/** The calendar month (UTC) that `iso` falls in: [start, end) plus the inclusive last day for the file name. */
export function monthOf(iso: string): { start: Date; end: Date; lastDay: Date } {
  const d = new Date(iso);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return { start, end, lastDay: new Date(end.getTime() - 86_400_000) };
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/** e.g. "archive_2026-05-01_to_2026-05-31__20261101T000012Z.json" — the range it covers, then when it was made. */
export function archiveName(start: Date, lastDay: Date, at: Date): string {
  return `archive_${day(start)}_to_${day(lastDay)}__${at.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "")}.json`;
}

export const sameCounts = (a: ArchiveCounts, b: ArchiveCounts) => a.enquiries === b.enquiries && a.bookRequests === b.bookRequests && a.quizResults === b.quizResults && a.outbox === b.outbox;

/** The daily slot: only the first 15-minute cron tick after 00:00 UTC runs the archive. */
export const isArchiveSlot = (now: Date) => now.getUTCHours() === 0 && now.getUTCMinutes() < 15;
