import { test } from "node:test";
import assert from "node:assert/strict";
import { hostRoute } from "./host-route.ts";

const r = (u: string) => hostRoute(new URL(u));
const to = (redirect: string) => ({ redirect });
const as = (rewrite: string) => ({ rewrite });

test("www and .com land on the one public site, path kept", () => {
  assert.deepEqual(r("https://www.ninelabsolutions.ae/about/?a=1"), to("https://ninelabsolutions.ae/about/?a=1"));
  assert.deepEqual(r("https://ninelabsolutions.com/"), to("https://ninelabsolutions.ae/"));
  assert.deepEqual(r("https://www.ninelabsolutions.com/services/"), to("https://ninelabsolutions.ae/services/"));
  assert.equal(r("https://ninelabsolutions.ae/about/"), null);
  assert.equal(r("https://ninelabsolutions.ae/administrator/"), null);
});

test("/admin/... anywhere moves to the admin host root", () => {
  assert.deepEqual(r("https://ninelabsolutions.ae/admin/"), to("https://admin.ninelabsolutions.ae/"));
  assert.deepEqual(r("https://www.ninelabsolutions.com/admin/inbox/?tab=quiz"), to("https://admin.ninelabsolutions.ae/inbox/?tab=quiz"));
  assert.deepEqual(r("https://admin.ninelabsolutions.ae/admin/quiz/"), to("https://admin.ninelabsolutions.ae/quiz/"));
  assert.deepEqual(r("http://localhost:3002/admin/books/"), to("http://admin.localhost:3002/books/"));
});

test("the admin host serves the admin at its root; API and files pass", () => {
  assert.deepEqual(r("https://admin.ninelabsolutions.ae/"), as("/admin/"));
  assert.deepEqual(r("https://admin.ninelabsolutions.ae/inbox/?tab=quiz&id=1"), as("/admin/inbox/?tab=quiz&id=1"));
  assert.deepEqual(r("https://www.admin.ninelabsolutions.ae/inbox/"), to("https://admin.ninelabsolutions.ae/inbox/"));
  assert.deepEqual(r("http://admin.localhost:3002/settings/"), as("/admin/settings/"));
  for (const p of ["/api/admin/ai/keys/", "/_next/static/x.js", "/favicon.ico"]) assert.equal(r(`https://admin.ninelabsolutions.ae${p}`), null, p);
});

test("other hosts pass through", () => {
  assert.equal(r("https://ninelabs.ninelabs-web.workers.dev/admin/"), null);
});
