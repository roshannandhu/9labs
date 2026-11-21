import { test } from "node:test";
import assert from "node:assert/strict";
import { checkWorkspace } from "./checks.ts";
import { defaultWorkspace } from "../content/defaults.ts";

test("a fresh default workspace has no blocking errors", () => {
  const issues = checkWorkspace(defaultWorkspace());
  assert.deepEqual(issues.filter((i) => i.level === "error"), []);
});

test("a question with fewer than two answers blocks publish", () => {
  const ws = defaultWorkspace();
  ws.site.quiz.questions[0].options = ws.site.quiz.questions[0].options.slice(0, 1);
  const issues = checkWorkspace(ws);
  assert.ok(issues.some((i) => i.level === "error" && i.message.includes("at least two answers")));
});

test("an empty WhatsApp number blocks publish", () => {
  const ws = defaultWorkspace();
  ws.site.contact.whatsappNumber = "";
  const issues = checkWorkspace(ws);
  assert.ok(issues.some((i) => i.level === "error" && i.message.includes("WhatsApp")));
});

test("a WhatsApp number typed with + and spaces is accepted", () => {
  const ws = defaultWorkspace();
  ws.site.contact.whatsappNumber = "+91 7736786683";
  assert.ok(!checkWorkspace(ws).some((i) => i.message.includes("WhatsApp")));
});

test("two books sharing a link name is an error", () => {
  const ws = defaultWorkspace();
  ws.site.ebooks[1].slug = ws.site.ebooks[0].slug;
  const issues = checkWorkspace(ws);
  assert.ok(issues.some((i) => i.level === "error" && i.message.includes("share the link name")));
});

test("switching on an FAQ that still has a [to be confirmed] note blocks publish", () => {
  const ws = defaultWorkspace();
  const faq = ws.faqs.find((f) => f.id === "faq-cost")!;
  faq.enabled = true;
  const issues = checkWorkspace(ws);
  assert.ok(issues.some((i) => i.level === "error" && i.message.includes("to be confirmed")));
});

test("a fresh workspace only warns about the FAQs/commitments waiting on the client, while they're switched off", () => {
  const issues = checkWorkspace(defaultWorkspace());
  assert.equal(issues.filter((i) => i.level === "error").length, 0);
  assert.ok(issues.some((i) => i.level === "warning" && i.message.includes("to be confirmed")));
});
