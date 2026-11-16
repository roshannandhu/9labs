import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreQuiz } from "./score.ts";
import { site } from "../../content/site.ts";

test("scoreQuiz ranks activities by points, breaking ties toward the lower card number, and explains why", () => {
  const result = scoreQuiz(site, { who: ["small"], goal: ["sales"] });
  // who=small: social 2, advertising 1 — goal=sales: advertising 3, social 2 — social and advertising
  // both total 4, so social (card 1) wins the tie over advertising (card 2).
  assert.equal(result.matches[0].service.icon, "social");
  assert.equal(result.matches[0].score, 97);
  assert.match(result.summary, /small business/);
  assert.match(result.matches[0].why, /sales|customers|social/i);
});

test("scoreQuiz: no answers still returns a ranked (if arbitrary) list, never throws", () => {
  const result = scoreQuiz(site, {});
  assert.equal(result.matches.length, 3);
  assert.equal(result.lines.length, 0);
});

test("scoreQuiz: ties break toward the lower card number", () => {
  const tiny = {
    services: site.services,
    quiz: {
      ...site.quiz,
      questions: [{ id: "q1", label: "Q1", q: "Pick one", options: [{ id: "a", label: "A", weights: { it: 1, social: 1 } }] }],
      result: { ...site.quiz.result, matches: 2 },
    },
  };
  const result = scoreQuiz(tiny, { q1: ["a"] });
  // social is card 1, it is card 9 — equal points, card 1 (social) must come first
  assert.equal(result.matches[0].service.icon, "social");
});

test("scoreQuiz: a 'stands alone' style answer is just data — scoring itself doesn't enforce exclusivity (that's the UI's job)", () => {
  const result = scoreQuiz(site, { make: ["photo", "posts"] });
  assert.ok(result.matches.some((m) => m.service.icon === "photo" || m.service.icon === "social"));
});
