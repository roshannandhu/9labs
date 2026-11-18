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

test("runBackup: no answers still returns one match, never pads, never throws", () => {
  const result = runBackup(site, {}, {});
  assert.ok(result);
  assert.equal(result.matches.length, 1);
  assert.deepEqual(result.answers, []);
});

test("runBackup: nothing anywhere has a pointsTo is the true last-resort null", () => {
  const blank = { services: site.services, quiz: { ...site.quiz, questions: site.quiz.questions.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o, pointsTo: null })) })) } };
  assert.equal(runBackup(blank, { who: ["startup"] }, {}), null);
});

test("runBackup + buildQuizLines: a zero-signal pick (pointsTo: null) plus Other text still ranks, and the text is echoed verbatim", () => {
  const result = runBackup(site, { event: ["none"] }, { event: "We're planning something unusual, not a normal event" });
  assert.ok(result);
  // the pick points nowhere, so the typed text (it names an event) is keyword-matched and votes
  assert.ok(result.answers[0].slug);
  assert.equal(result.matches[0].slug, result.answers[0].slug);
  // "none" has no pointsTo, so it contributes nothing to highlights — only the typed text does
  assert.deepEqual(result.highlights, ["We're planning something unusual, not a normal event"]);

  const lines = buildQuizLines(site.quiz.questions, { event: ["none"] }, { event: "We're planning something unusual, not a normal event" });
  assert.ok(lines.some((l) => l.includes("We're planning something unusual, not a normal event")));
});

test("runBackup: highlights quote the picked answers' own labels, in order, deduplicated, capped at 6 — no AI, just echo", () => {
  const result = runBackup(site, { who: ["startup"], goal: ["sales"], where: ["social"], online: ["zero"], make: ["photo"], event: ["soon"], tech: ["little"] }, {});
  assert.ok(result);
  assert.equal(result.highlights.length, 6); // capped
  assert.deepEqual(result.highlights, ["A new business or startup", "More customers and sales", "On social media", "We are starting from zero", "Photos and video", "Yes, within 3 months"]);
});

test("runBackup: a typed Other answer joins highlights alongside picked labels", () => {
  const result = runBackup(site, { who: ["startup"] }, { goal: "Honestly just trying to figure out where to even start" });
  assert.ok(result);
  assert.deepEqual(result.highlights, ["A new business or startup", "Honestly just trying to figure out where to even start"]);
});

test("buildQuizWhatsappText: no percentages, just numbered titles between the admin's intro/outro", () => {
  const result = runBackup(site, { who: ["startup"] }, {});
  assert.ok(result);
  const text = buildQuizWhatsappText(site, buildQuizLines(site.quiz.questions, { who: ["startup"] }, {}), result);
  assert.match(text, /^Hi Nine Labs!/);
  assert.doesNotMatch(text, /%/);
  assert.match(text, /Suggested for us: 1\) /);
});

test("runBackup: one row per answered question — picks use the option's `solves`, typed-only answers are keyword-matched", () => {
  const result = runBackup(site, { goal: ["sales"], when: ["month"] }, { make: "I need product photography for my online shop" });
  assert.ok(result);
  assert.deepEqual(result.answers.map((a) => a.q), ["goal", "make", "when"], "quiz order");
  assert.equal(result.answers[0].how, site.quiz.questions.find((q) => q.id === "goal")!.options.find((o) => o.id === "sales")!.solves);
  assert.equal(result.answers[0].slug, "advertising");
  assert.equal(result.answers[1].own, true);
  assert.equal(result.answers[1].slug, "photography-events-filming");
  assert.equal(result.answers[2].slug, null, "'when' answers point nowhere");
});

test("runBackup: the number of matches follows result.matches, up to 5", () => {
  const all = { who: ["startup"], goal: ["sales"], where: ["social"], online: ["zero"], make: ["photo"], event: ["soon"], tech: ["little"], budget: ["unsure"], when: ["asap"] };
  const result = runBackup({ ...site, quiz: { ...site.quiz, result: { ...site.quiz.result, matches: 5 } } }, all, {});
  assert.ok(result);
  assert.equal(result.matches.length, 5);
  assert.equal(result.answers.length, 9);
});

test("answerRows: typed words lean to the services their question is about", () => {
  const result = runBackup(site, {}, { tech: "we copy orders from WhatsApp into Excel by hand every night" });
  assert.ok(result);
  assert.ok(["ai-consultancy", "it-consultancy"].includes(result.answers[0].slug ?? ""), String(result.answers[0].slug));
});
