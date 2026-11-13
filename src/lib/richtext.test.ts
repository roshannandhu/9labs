import { test } from "node:test";
import assert from "node:assert/strict";
import { textToHtml } from "./richtext.ts";

test("paragraphs, bold and links", () => {
  const out = textToHtml('First paragraph with **bold** and a [link](https://example.com).\n\nSecond paragraph.');
  assert.equal(out, '<p>First paragraph with <strong>bold</strong> and a <a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>.</p><p>Second paragraph.</p>');
});

test("bullet list block", () => {
  const out = textToHtml("- One\n- Two\n- Three");
  assert.equal(out, "<ul><li>One</li><li>Two</li><li>Three</li></ul>");
});

test("heading line", () => {
  assert.equal(textToHtml("## A heading"), "<h3>A heading</h3>");
});

test("never injects raw HTML from the source text", () => {
  const out = textToHtml('<script>alert(1)</script> and "quotes"');
  assert.ok(!out.includes("<script>"));
  assert.ok(out.includes("&lt;script&gt;"));
});

test("a javascript: link is not turned into a link (only https:// is allowed)", () => {
  const out = textToHtml("[click](javascript:alert(1))");
  assert.ok(!out.includes("<a "));
});
