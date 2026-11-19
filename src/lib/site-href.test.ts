import { test } from "node:test";
import assert from "node:assert/strict";
import { navHref, navInPageOrder } from "./site-href.ts";

test("About scrolls on the homepage and opens /about elsewhere, whichever form is saved", () => {
  for (const saved of ["#about", "/about"]) {
    assert.equal(navHref(saved, true), "#about");
    assert.equal(navHref(saved, false), "/about");
  }
  assert.equal(navHref("#services", true), "#services");
  assert.equal(navHref("#services", false), "/#services");
});

test("the menu follows the page's section order; other links keep their place", () => {
  const nav = ["home", "services", "about", "ebooks", "quiz", "contact"].map((id) => ({ id }));
  const out = navInPageOrder(nav, ["services", "about", "quiz", "ebooks", "faq", "contact"]).map((n) => n.id);
  assert.deepEqual(out, ["home", "services", "about", "quiz", "ebooks", "contact"]);
});
