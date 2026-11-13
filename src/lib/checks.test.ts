import { test } from "node:test";
import assert from "node:assert/strict";
import { checkWorkspace } from "./checks.ts";
import { defaultWorkspace } from "../content/defaults.ts";

test("a fresh default workspace has no blocking errors", () => {
  const issues = checkWorkspace(defaultWorkspace());
  assert.deepEqual(issues.filter((i) => i.level === "error"), []);
});

test("an activity with no scoring answer anywhere is flagged", () => {
  const ws = defaultWorkspace();
  ws.site.quiz.questions = ws.site.quiz.questions.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o, weights: {} })) }));
  const issues = checkWorkspace(ws);
  const errors = issues.filter((i) => i.level === "error" && i.message.includes("could never be recommended"));
  assert.equal(errors.length, 9); // every one of the nine activities is now unreachable
});

test("an empty WhatsApp number blocks publish", () => {
  const ws = defaultWorkspace();
  ws.site.contact.whatsappNumber = "";
  const issues = checkWorkspace(ws);
  assert.ok(issues.some((i) => i.level === "error" && i.message.includes("WhatsApp")));
});

test("two books sharing a link name is an error", () => {
  const ws = defaultWorkspace();
  ws.site.ebooks[1].slug = ws.site.ebooks[0].slug;
  const issues = checkWorkspace(ws);
  assert.ok(issues.some((i) => i.level === "error" && i.message.includes("share the link name")));
});
