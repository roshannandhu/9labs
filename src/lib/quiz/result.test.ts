import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAiReply, cleanPhone, cleanQuizInput, extractJson } from "./result.ts";
import { site } from "../../content/site.ts";

const rules = { slugs: site.services.map((s) => s.slug), allowPrices: false, sourceTexts: ["More customers and sales", "we sell handmade candles"] };
const good = {
  wants: "You want more customers for your handmade candles.",
  highlights: ["handmade candles", "invented phrase"],
  matches: [
    { slug: "advertising", fit: "best", how: "Ads put your candles in front of buyers." },
    { slug: "digital-social-media-marketing", fit: "best", how: "Social keeps them coming back." },
  ],
  steps: [
    { title: "Talk", text: "Tell us about your shop." },
    { title: "Plan", text: "We map the campaign." },
    { title: "Grow", text: "We run it and report back." },
    { title: "Extra", text: "Dropped — only 3 kept." },
  ],
  tags: { goal: "more sales" },
};

test("checkAiReply: a good reply passes, trimmed to the contract", () => {
  const r = checkAiReply("```json\n" + JSON.stringify(good) + "\n```", rules, "groq");
  assert.ok(r.ok);
  assert.equal(r.result.source, "groq");
  assert.equal(r.result.steps.length, 3);
  assert.equal(r.result.matches[0].fit, "best");
  assert.equal(r.result.matches[1].fit, "also", "only the first match may be 'best'");
  assert.deepEqual(r.result.highlights, ["handmade candles"], "highlights the client never said are dropped");
});

test("checkAiReply: unknown service slug is rejected (no invented services)", () => {
  const r = checkAiReply(JSON.stringify({ ...good, matches: [{ slug: "crypto-mining", fit: "best", how: "x" }] }), rules, "groq");
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.detail : "", /unknown service/);
});

test("checkAiReply: prices, deadlines and guarantees are blocked unless allowed", () => {
  for (const how of ["Packages start at AED 2,500.", "It costs $500 a month.", "Results within 30 days.", "Guaranteed top ranking."]) {
    const reply = JSON.stringify({ ...good, matches: [{ slug: "advertising", fit: "best", how }] });
    const r = checkAiReply(reply, rules, "gemini");
    assert.equal(r.ok, false, how);
    assert.equal(!r.ok && r.reason, "blocked", how);
  }
  const allowed = checkAiReply(JSON.stringify({ ...good, matches: [{ slug: "advertising", fit: "best", how: "Packages start at AED 2,500." }] }), { ...rules, allowPrices: true }, "groq");
  assert.ok(allowed.ok);
});

test("checkAiReply: ordinary wording isn't mistaken for a price or promise", () => {
  const how = "We plan three campaigns, test 2 ad formats and grow your 10k followers.";
  assert.ok(checkAiReply(JSON.stringify({ ...good, matches: [{ slug: "advertising", fit: "best", how }] }), rules, "groq").ok);
});

test("checkAiReply: not JSON / wrong shape / too few steps → bad", () => {
  assert.equal(checkAiReply("Sure! Here are some ideas…", rules, "groq").ok, false);
  assert.equal(checkAiReply(JSON.stringify({ ...good, steps: good.steps.slice(0, 2) }), rules, "groq").ok, false);
  assert.equal(checkAiReply(JSON.stringify({ ...good, matches: [] }), rules, "groq").ok, false);
});

test("extractJson: tolerates prose around the object", () => {
  assert.deepEqual(extractJson('Here you go: {"a": 1} hope it helps'), { a: 1 });
});

test("cleanQuizInput: drops unknown ids, keeps one pick on single questions, Other only where allowed", () => {
  const q = site.quiz.questions.find((x) => !x.multi)!;
  // the defaults are all single-answer now; make the last question a "pick all" one for this test
  const multi = { ...site.quiz.questions.at(-1)!, multi: true };
  const s = { quiz: { ...site.quiz, ai: { ...site.quiz.ai, maxOtherChars: 20 }, questions: site.quiz.questions.map((x) => (x.id === q.id ? { ...x, allowOther: true } : x.id === multi.id ? multi : x)) } };
  const out = cleanQuizInput(
    s,
    { [q.id]: [q.options[0].id, q.options[1].id, "nope"], ghost: ["x"], [multi.id]: multi.options.slice(0, 2).map((o) => o.id) },
    { [q.id]: "  a very long typed answer\u0007 here  ", [multi.id]: "not allowed" },
  );
  assert.deepEqual(out.answers[q.id], [q.options[0].id]);
  assert.equal(out.answers.ghost, undefined);
  assert.equal(out.answers[multi.id].length, 2);
  assert.equal(out.other[q.id], "a very long typed an");
  assert.equal(out.other[multi.id], undefined);
});

test("cleanPhone accepts real numbers and rejects junk", () => {
  assert.equal(cleanPhone(" +91 98765-43210 "), "+919876543210");
  assert.equal(cleanPhone("(044) 2345.6789"), "04423456789");
  assert.equal(cleanPhone("12345"), null);
  assert.equal(cleanPhone("call me"), null);
  assert.equal(cleanPhone("++919876543210"), null);
});
