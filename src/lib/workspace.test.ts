import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultWorkspace } from "@/content/defaults";
import { deepMerge, normalizeWorkspace } from "./workspace.ts";

test("deepMerge: a key missing from the saved side falls back to the default's own value", () => {
  assert.deepEqual(deepMerge({ a: 1, b: { c: 2, d: 3 } }, { b: { c: 99 } }), { a: 1, b: { c: 99, d: 3 } });
});

test("deepMerge: an array on the saved side replaces the default wholesale (not merged item-by-item)", () => {
  assert.deepEqual(deepMerge([1, 2, 3], [9]), [9]);
  assert.deepEqual(deepMerge([1, 2, 3], "not an array"), [1, 2, 3]);
});

test("normalizeWorkspace: nothing saved yet returns pure today's defaults", () => {
  assert.deepEqual(normalizeWorkspace(undefined), defaultWorkspace());
  assert.deepEqual(normalizeWorkspace(null), defaultWorkspace());
  assert.deepEqual(normalizeWorkspace("garbage"), defaultWorkspace());
});

test("normalizeWorkspace: an older save missing a field that today's defaults added gets that default, without losing the rest of what it had", () => {
  const def = defaultWorkspace();
  const saved = structuredClone(def);
  saved.site.contact.email = "someone-saved-this@example.com";
  // simulate an old save made before `whatsappFab` existed in the shape
  // @ts-expect-error intentionally simulating a pre-upgrade save missing a field
  delete saved.site.contact.whatsappFab;

  const result = normalizeWorkspace(saved);
  assert.equal(result.site.contact.whatsappFab, def.site.contact.whatsappFab);
  assert.equal(result.site.contact.email, "someone-saved-this@example.com");
});

test("normalizeWorkspace: pages/faqs fall back to today's defaults only when the saved side is empty or missing", () => {
  const withEmptyPages = normalizeWorkspace({ pages: [] });
  assert.deepEqual(withEmptyPages.pages, defaultWorkspace().pages);

  const kept = [{ id: "x" }];
  const withPages = normalizeWorkspace({ pages: kept, faqs: [] });
  assert.equal(withPages.pages, kept);
  assert.deepEqual(withPages.faqs, []); // faqs keeps an empty array as-is, unlike pages
});
