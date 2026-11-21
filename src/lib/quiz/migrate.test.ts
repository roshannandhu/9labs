import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateQuizOptionsInPlace } from "./migrate.ts";
import { site } from "../../content/site.ts";

test("migrateQuizOptionsInPlace: turns on own words where it was never set, leaves a saved false alone", () => {
  const ws = {
    site: {
      quiz: {
        questions: [
          { id: "q1", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }] },
          { id: "q2", allowOther: false, options: [{ id: "c", label: "C" }, { id: "d", label: "D" }] },
        ],
      },
    },
  };
  migrateQuizOptionsInPlace(ws);
  assert.equal(ws.site.quiz.questions[0].allowOther, true);
  assert.equal(ws.site.quiz.questions[1].allowOther, false);
});

test("migrateQuizOptionsInPlace: back-fills a default answer's built-in 'what we say' line", () => {
  const def = site.quiz.questions.find((q) => q.id === "who")!.options.find((o) => o.id === "startup")!;
  const ws = { site: { quiz: { questions: [{ id: "who", options: [{ id: "startup", label: "x" }] }] } } };
  migrateQuizOptionsInPlace(ws);
  assert.equal((ws.site.quiz.questions[0].options[0] as { solves?: string }).solves, def.solves);
});

test("migrateQuizOptionsInPlace: not a workspace-shaped object is a safe no-op", () => {
  assert.doesNotThrow(() => migrateQuizOptionsInPlace(null));
  assert.doesNotThrow(() => migrateQuizOptionsInPlace({}));
  assert.doesNotThrow(() => migrateQuizOptionsInPlace({ site: {} }));
});
