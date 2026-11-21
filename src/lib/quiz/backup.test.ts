import { test } from "node:test";
import assert from "node:assert/strict";
import { runBackup, scoreServices } from "./backup.ts";
import { buildQuizLines, buildQuizWhatsappText } from "./whatsapp.ts";
import { site } from "../../content/site.ts";

const topOf = (scores: Map<string, number>) => [...scores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

test("scoreServices: concrete words rank the service that owns them top", () => {
  assert.equal(topOf(scoreServices("product photography and event coverage", site.services)), "photography-events-filming");
  assert.equal(topOf(scoreServices("press release and media relations", site.services)), "pr-communications");
});

test("runBackup: a clear picked answer matches its service with no hand-mapping (ads → advertising)", () => {
  const result = runBackup(site, { goal: ["sales"] }, {});
  assert.ok(result);
  assert.equal(result.source, "backup");
  assert.equal(result.answers.find((a) => a.q === "goal")?.slug, "advertising");
});

test("runBackup: typed 'Other' words are matched to a service with no mapping (photography)", () => {
  const result = runBackup(site, {}, { make: "I need product photography for my online shop" });
  assert.ok(result);
  assert.equal(result.answers[0].own, true);
  assert.equal(result.answers[0].slug, "photography-events-filming");
});

test("runBackup: a vague typed answer still routes via its question's domain (tech → AI/IT)", () => {
  const result = runBackup(site, {}, { tech: "we copy orders from WhatsApp into Excel by hand every night" });
  assert.ok(result);
  assert.ok(["ai-consultancy", "it-consultancy"].includes(result.answers[0].slug ?? ""), String(result.answers[0].slug));
});

test("runBackup: one row per answered question, in quiz order; 'how' uses the option's own line", () => {
  const result = runBackup(site, { goal: ["sales"], when: ["month"] }, { make: "I need product photography for my online shop" });
  assert.ok(result);
  assert.deepEqual(result.answers.map((a) => a.q), ["goal", "make", "when"]);
  assert.equal(result.answers[0].how, site.quiz.questions.find((q) => q.id === "goal")!.options.find((o) => o.id === "sales")!.solves);
  assert.equal(result.answers[1].own, true);
});

test("runBackup: highlights quote the picked labels, in order, deduplicated, capped at 6", () => {
  const result = runBackup(site, { who: ["startup"], goal: ["sales"], where: ["social"], online: ["zero"], make: ["photo"], event: ["soon"], tech: ["little"] }, {});
  assert.ok(result);
  assert.equal(result.highlights.length, 6);
  assert.deepEqual(result.highlights, ["A new business or startup", "More customers and sales", "On social media", "We are starting from zero", "Photos and video", "Yes, within 3 months"]);
});

test("runBackup: a typed Other answer joins highlights alongside picked labels", () => {
  const result = runBackup(site, { who: ["startup"] }, { goal: "Honestly just trying to figure out where to even start" });
  assert.ok(result);
  assert.deepEqual(result.highlights, ["A new business or startup", "Honestly just trying to figure out where to even start"]);
});

test("runBackup: match count follows result.matches (up to 5), best first, never padded, 9 rows for 9 answers", () => {
  const all = { who: ["startup"], goal: ["sales"], where: ["social"], online: ["zero"], make: ["photo"], event: ["soon"], tech: ["little"], budget: ["unsure"], when: ["asap"] };
  const result = runBackup({ ...site, quiz: { ...site.quiz, result: { ...site.quiz.result, matches: 5 } } }, all, {});
  assert.ok(result);
  assert.ok(result.matches.length >= 1 && result.matches.length <= 5);
  assert.equal(result.matches[0].fit, "best");
  assert.equal(result.answers.length, 9);
});

test("runBackup: nothing the visitor said matches any service → null (the true last resort)", () => {
  const blank = { services: site.services, quiz: { ...site.quiz, questions: [{ id: "x", label: "", q: "", options: [{ id: "a", label: "" }, { id: "b", label: "" }] }] } };
  assert.equal(runBackup(blank, { x: ["a"] }, {}), null);
});

test("buildQuizWhatsappText: no percentages, just numbered titles between the admin's intro/outro", () => {
  const result = runBackup(site, { who: ["startup"] }, {});
  assert.ok(result);
  const text = buildQuizWhatsappText(site, buildQuizLines(site.quiz.questions, { who: ["startup"] }, {}), result);
  assert.match(text, /^Hi Nine Labs!/);
  assert.doesNotMatch(text, /%/);
  assert.match(text, /Suggested for us: 1\) /);
});
