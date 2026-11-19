import { test } from "node:test";
import assert from "node:assert/strict";
import { ARCHIVE_NAME, archiveCutoff, archiveName, isArchiveSlot, monthOf, sameCounts } from "./archive.ts";

test("cutoff is the first of the month, N months back (UTC), and never less than 1 month", () => {
  assert.equal(archiveCutoff(new Date("2026-11-18T10:00:00Z"), 6).toISOString(), "2026-05-01T00:00:00.000Z");
  assert.equal(archiveCutoff(new Date("2026-03-02T00:00:00Z"), 6).toISOString(), "2025-09-01T00:00:00.000Z");
  assert.equal(archiveCutoff(new Date("2026-11-18T10:00:00Z"), 0).toISOString(), "2026-10-01T00:00:00.000Z");
});

test("a row's month and the file name cover the whole calendar month", () => {
  const m = monthOf("2026-02-14T09:30:00Z");
  assert.equal(m.start.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(m.end.toISOString(), "2026-03-01T00:00:00.000Z");
  const name = archiveName(m.start, m.lastDay, new Date("2026-08-01T00:00:12.345Z"));
  assert.equal(name, "archive_2026-02-01_to_2026-02-28__20260801T000012Z.json");
  assert.match(name, ARCHIVE_NAME);
  assert.doesNotMatch("../secret.json", ARCHIVE_NAME);
});

test("rows are only deleted when the file read back has the same counts", () => {
  const c = { enquiries: 2, bookRequests: 1, quizResults: 0, outbox: 3 };
  assert.equal(sameCounts(c, { ...c }), true);
  assert.equal(sameCounts(c, { ...c, outbox: 2 }), false);
});

test("runs once a day, in the first tick after midnight UTC", () => {
  assert.equal(isArchiveSlot(new Date("2026-11-18T00:07:00Z")), true);
  assert.equal(isArchiveSlot(new Date("2026-11-18T00:15:00Z")), false);
  assert.equal(isArchiveSlot(new Date("2026-11-18T13:00:00Z")), false);
});
