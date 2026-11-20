import { test } from "node:test";
import assert from "node:assert/strict";
import type { BookRequest, Enquiry, QuizResult } from "../content/types.ts";
import { bookSummary, enquirySummary, quizSummary } from "./leadSummary.ts";

test("enquiry: who, the service, what they need, budget and timeline", () => {
  const e = { name: "Sara", company: "Bloom", serviceTitle: "Social media", needs: ["Strategy", "Content", "Ads"], budget: "AED 5k", timeline: "This month" } as Enquiry;
  assert.equal(enquirySummary(e), "Sara (Bloom) wants Social media — Strategy, Content and Ads (budget AED 5k, timeline This month).");
  assert.equal(enquirySummary({ ...e, company: "", needs: [], budget: "", timeline: "" }), "Sara wants Social media.");
});

test("e-book request names the book", () => {
  assert.equal(bookSummary({ name: "Ali", company: "" } as BookRequest, "The Foundations"), "Ali asked for the free e-book “The Foundations”.");
});

test("quiz: what they want (AI), the best fits and what they did next; falls back without AI", () => {
  const title = (s: string) => ({ social: "Social media", ads: "Advertising" })[s] ?? s;
  const r = {
    name: "Roshan",
    top: "Social media",
    action: "whatsapp",
    ai: { wants: "More customers from Instagram.", matches: [{ slug: "social", fit: "best", how: "" }, { slug: "ads", fit: "best", how: "" }, { slug: "pr", fit: "also", how: "" }] },
  } as unknown as QuizResult;
  assert.equal(quizSummary(r, title), "Roshan wants more customers from Instagram — best fit: Social media and Advertising. Opened WhatsApp.");
  assert.equal(quizSummary({ ...r, name: "", ai: null, action: "none" } as QuizResult, title), "Someone finished The 9 Quiz — best fit: Social media.");
});
