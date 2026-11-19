import { test } from "node:test";
import assert from "node:assert/strict";
import { edgeCacheable, edgeCacheKey } from "./edge-cache.ts";

const get = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

test("public pages on the site are cached per deploy; everything else is not", () => {
  assert.equal(edgeCacheKey(get("https://ninelabsolutions.ae/about/"), "v1"), "https://ninelabsolutions.ae/about/?__v=v1");
  assert.equal(edgeCacheKey(get("https://ninelabsolutions.ae/about/"), "v2"), "https://ninelabsolutions.ae/about/?__v=v2");
  assert.equal(edgeCacheKey(get("https://admin.ninelabsolutions.ae/"), "v1"), null);
  assert.equal(edgeCacheKey(get("https://ninelabsolutions.ae/api/quiz-ai/"), "v1"), null);
  assert.equal(edgeCacheKey(get("https://ninelabsolutions.ae/download/abc/"), "v1"), null);
  assert.equal(edgeCacheKey(get("https://ninelabsolutions.ae/about/", { rsc: "1" }), "v1"), null);
  assert.equal(edgeCacheKey(get("https://ninelabsolutions.ae/about/?_rsc=x"), "v1"), null);
  assert.equal(edgeCacheKey(new Request("https://ninelabsolutions.ae/", { method: "POST" }), "v1"), null);
});

test("only plain 200 pages without cookies are kept", () => {
  assert.ok(edgeCacheable(new Response("x", { headers: { "content-type": "text/html; charset=utf-8" } })));
  assert.ok(!edgeCacheable(new Response("x", { status: 404, headers: { "content-type": "text/html" } })));
  assert.ok(!edgeCacheable(new Response("x", { headers: { "content-type": "text/html", "set-cookie": "a=b" } })));
  assert.ok(!edgeCacheable(new Response("{}", { headers: { "content-type": "application/json" } })));
});
