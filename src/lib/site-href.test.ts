import { test } from "node:test";
import assert from "node:assert/strict";
import { navHref } from "./site-href.ts";

test("About scrolls on the homepage and opens /about elsewhere, whichever form is saved", () => {
  for (const saved of ["#about", "/about"]) {
    assert.equal(navHref(saved, true), "#about");
    assert.equal(navHref(saved, false), "/about");
  }
  assert.equal(navHref("#services", true), "#services");
  assert.equal(navHref("#services", false), "/#services");
});
