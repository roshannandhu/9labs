import { test } from "node:test";
import assert from "node:assert/strict";
import { isImageRef, isPdfRef, makeRef, mediaUrl, refKey } from "./fileRefs.ts";

test("makeRef/refKey round-trip, and refKey rejects anything not in our ref format", () => {
  assert.equal(refKey(makeRef("images/abc.png")), "images/abc.png");
  assert.equal(refKey("https://example.com/abc.png"), undefined);
  assert.equal(refKey(undefined), undefined);
});

test("isImageRef / isPdfRef tell the two kinds of stored file apart", () => {
  assert.equal(isImageRef(makeRef("images/abc.png")), true);
  assert.equal(isPdfRef(makeRef("images/abc.png")), false);
  assert.equal(isImageRef(makeRef("pdfs/abc.pdf")), false);
  assert.equal(isPdfRef(makeRef("pdfs/abc.pdf")), true);
  assert.equal(isImageRef(undefined), false);
});

test("mediaUrl: only an image ref gets a URL — a PDF ref, a plain URL, and nothing all get undefined", () => {
  assert.equal(mediaUrl(makeRef("images/abc.png")), "/media/images/abc.png");
  assert.equal(mediaUrl(makeRef("pdfs/abc.pdf")), undefined);
  assert.equal(mediaUrl("https://example.com/abc.png"), undefined);
  assert.equal(mediaUrl(undefined), undefined);
});
