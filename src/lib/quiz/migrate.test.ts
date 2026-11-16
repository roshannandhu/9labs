import { test } from "node:test";
import assert from "node:assert/strict";
import { derivePointsTo, migrateQuizOptionsInPlace } from "./migrate.ts";
import { site } from "../../content/site.ts";

test("derivePointsTo: highest weight wins", () => {
  assert.equal(derivePointsTo({ strategy: 2, social: 1 }, site.services), "strategy");
});

test("derivePointsTo: a tie goes to the lower service card number", () => {
  // strategy=7, pr=6, ai=8, it=9 — all weighted 1, pr (card 6) is lowest
  assert.equal(derivePointsTo({ strategy: 1, pr: 1, ai: 1, it: 1 }, site.services), "pr");
});

test("derivePointsTo: no weights, or every weight 0, is null", () => {
  assert.equal(derivePointsTo({}, site.services), null);
  assert.equal(derivePointsTo(undefined, site.services), null);
});

test("migrateQuizOptionsInPlace: fills pointsTo from weights once, leaves an existing pointsTo alone", () => {
  const ws = { site: { services: site.services, quiz: { questions: [{ id: "q1", options: [{ id: "a", weights: { strategy: 2, social: 1 } }, { id: "b", weights: { social: 1 }, pointsTo: "pr" }] }] } } };
  migrateQuizOptionsInPlace(ws);
  assert.equal(ws.site.quiz.questions[0].options[0].pointsTo, "strategy");
  assert.equal(ws.site.quiz.questions[0].options[1].pointsTo, "pr"); // untouched, was already set
});

test("migrateQuizOptionsInPlace: not a workspace-shaped object is a safe no-op", () => {
  assert.doesNotThrow(() => migrateQuizOptionsInPlace(null));
  assert.doesNotThrow(() => migrateQuizOptionsInPlace({}));
  assert.doesNotThrow(() => migrateQuizOptionsInPlace({ site: {} }));
});
