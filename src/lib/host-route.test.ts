import { test } from "node:test";
import assert from "node:assert/strict";
import { hostRedirect } from "./host-route.ts";

const r = (u: string) => hostRedirect(new URL(u));

test("www and .com land on the one public site, path kept", () => {
  assert.equal(r("https://www.ninelabsolutions.ae/about/?a=1"), "https://ninelabsolutions.ae/about/?a=1");
  assert.equal(r("https://ninelabsolutions.com/"), "https://ninelabsolutions.ae/");
  assert.equal(r("https://www.ninelabsolutions.com/services/"), "https://ninelabsolutions.ae/services/");
  assert.equal(r("https://ninelabsolutions.ae/about/"), null);
});

test("/admin on the public site moves to the admin subdomain", () => {
  assert.equal(r("https://ninelabsolutions.ae/admin/"), "https://admin.ninelabsolutions.ae/admin/");
  assert.equal(r("https://www.ninelabsolutions.com/admin/inbox/?tab=quiz"), "https://admin.ninelabsolutions.ae/admin/inbox/?tab=quiz");
  assert.equal(r("https://ninelabsolutions.ae/administrator/"), null);
});

test("the admin subdomain opens the admin, and serves its own routes and assets", () => {
  assert.equal(r("https://admin.ninelabsolutions.ae/"), "https://admin.ninelabsolutions.ae/admin/");
  assert.equal(r("https://www.admin.ninelabsolutions.ae/"), "https://admin.ninelabsolutions.ae/admin/");
  assert.equal(r("https://admin.ninelabsolutions.ae/inbox/"), "https://admin.ninelabsolutions.ae/admin/inbox/");
  assert.equal(r("https://www.admin.ninelabsolutions.ae/admin/quiz/"), "https://admin.ninelabsolutions.ae/admin/quiz/");
  for (const p of ["/admin/", "/admin/books/", "/api/admin/ai/keys/", "/_next/static/x.js", "/favicon.ico"]) {
    assert.equal(r(`https://admin.ninelabsolutions.ae${p}`), null, p);
  }
});

test("other hosts pass through", () => {
  assert.equal(r("https://ninelabs.ninelabs-web.workers.dev/admin/"), null);
  assert.equal(r("http://localhost:3002/"), null);
});
