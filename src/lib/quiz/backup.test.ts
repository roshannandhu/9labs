import { test } from "node:test";
import assert from "node:assert/strict";
import { runBackup } from "./backup.ts";
import { buildQuizLines, buildQuizWhatsappText } from "./whatsapp.ts";
import { site } from "../../content/site.ts";

test("runBackup: votes tally per pointsTo, ties break toward the lower card number", () => {
  // goal=smarter -> ai (card 8), tech=little -> it (card 9); a clean 1-1 tie, ai must win
  const result = runBackup(site, { goal: ["smarter"], tech: ["little"] }, {});
  assert.ok(result);
  assert.equal(result.matches[0].slug, "ai-consultancy");
  assert.equal(result.matches[0].fit, "best");
  assert.equal(result.source, "backup");
});

test("runBackup: no answers still returns a ranked (if arbitrary) list, never throws", () => {
  const result = runBackup(site, {}, {});
  assert.ok(result);
  assert.equal(result.matches.length, 3);
});

test("runBackup: nothing anywhere has a pointsTo is the true last-resort null", () => {
  const blank = { services: site.services, quiz: { ...site.quiz, questions: site.quiz.questions.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o, pointsTo: null })) })) } };
  assert.equal(runBackup(blank, { who: ["startup"] }, {}), null);
});

test("runBackup + buildQuizLines: a zero-signal pick (pointsTo: null) plus Other text still ranks, and the text is echoed verbatim", () => {
  const result = runBackup(site, { event: ["none"] }, { event: "We're planning something unusual, not a normal event" });
  assert.ok(result);
  assert.equal(result.matches.length, 3); // tied at 0 votes, still a ranked (arbitrary) list

  const lines = buildQuizLines(site.quiz.questions, { event: ["none"] }, { event: "We're planning something unusual, not a normal event" });
  assert.ok(lines.some((l) => l.includes("We're planning something unusual, not a normal event")));
});

test("buildQuizWhatsappText: no percentages, just numbered titles between the admin's intro/outro", () => {
  const result = runBackup(site, { who: ["startup"] }, {});
  assert.ok(result);
  const text = buildQuizWhatsappText(site, buildQuizLines(site.quiz.questions, { who: ["startup"] }, {}), result);
  assert.match(text, /^Hi Nine Labs!/);
  assert.doesNotMatch(text, /%/);
  assert.match(text, /Suggested for us: 1\) /);
});
