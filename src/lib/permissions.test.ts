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
