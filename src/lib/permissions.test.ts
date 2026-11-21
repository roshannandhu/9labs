import { test } from "node:test";
import assert from "node:assert/strict";
import type { Change } from "./diff.ts";
import { firstForbiddenChange } from "./permissions.ts";

const change = (path: (string | number)[]): Change => ({ path, before: undefined, after: undefined });

test("owner and admin can change anything", () => {
  const changes = [change(["site", "contact", "email"]), change(["site", "ebooks", 0, "title"])];
  assert.equal(firstForbiddenChange("owner", changes), null);
  assert.equal(firstForbiddenChange("admin", changes), null);
});

test("editor can change books and the quiz", () => {
  const changes = [change(["site", "ebooks", 0, "title"]), change(["site", "quiz", "questions", 0, "text"])];
  assert.equal(firstForbiddenChange("editor", changes), null);
});

test("editor is blocked on the first change outside books/quiz, even mixed in with allowed ones", () => {
  const blocked = change(["site", "contact", "email"]);
  const changes = [change(["site", "ebooks", 0, "title"]), blocked, change(["site", "quiz", "label"])];
  assert.equal(firstForbiddenChange("editor", changes), blocked);
});

test("editor is blocked by a sibling path that merely starts the same way (e.g. 'ebooksSection' vs 'ebooks')", () => {
  const blocked = change(["site", "ebooksSection", "heading"]);
  assert.equal(firstForbiddenChange("editor", [blocked]), blocked);
});

test("editorSlice: an editor's save keeps only their books and quiz; everything else stays as the base had it", async () => {
  const { editorSlice } = await import("./permissions.ts");
  const { defaultWorkspace } = await import("../content/defaults.ts");
  const base = defaultWorkspace();
  base.site.contact.email = "owner@base.test";
  const theirs = structuredClone(base);
  theirs.site.contact.email = "editor@sneaky.test"; // not theirs to change
  theirs.site.quiz.cta = "Edited quiz CTA";
  theirs.site.ebooks = theirs.site.ebooks.slice(0, 1);
  const out = editorSlice(base, theirs);
  assert.equal(out.site.contact.email, "owner@base.test");
  assert.equal(out.site.quiz.cta, "Edited quiz CTA");
  assert.equal(out.site.ebooks.length, theirs.site.ebooks.length);
  assert.notEqual(out.site.quiz, theirs.site.quiz, "a copy, not a shared reference");
  assert.equal(base.site.quiz.cta === "Edited quiz CTA", false, "the base itself is untouched");
});

test("enquiryMissingFields: a required choice field with nothing to choose from never blocks the enquiry", async () => {
  const { enquiryMissingFields, emptyEnquiryAnswers } = await import("./enquiry.ts");
  const { defaultWorkspace } = await import("../content/defaults.ts");
  const { toSite } = await import("../content/toSite.ts");
  const site = toSite(defaultWorkspace());
  site.enquiry.fields = ["needs", "budget", "timeline"];
  site.enquiry.required = ["needs", "budget", "timeline"];
  site.enquiry.budgets = ["< 10k"];
  site.enquiry.timelines = [];
  const missing = enquiryMissingFields(site, emptyEnquiryAnswers(), []);
  assert.deepEqual(missing, ["budget"]); // needs: the service has none; timeline: no options
  assert.deepEqual(enquiryMissingFields(site, emptyEnquiryAnswers(), ["SEO"]), ["needs", "budget"]);
});
