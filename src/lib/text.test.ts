import { test } from "node:test";
import assert from "node:assert/strict";
import { fillTemplate, shortRef, templateTokens } from "./text.ts";

const TEMPLATE = [
  "Hi Nine Labs! 👋",
  "I'm {name}[ from {company}].",
  "",
  "Interested in: {service}",
  "[What we need: {needs}]",
  "[Budget: {budget}]",
  "[Timeline: {timeline}]",
  "",
  "{message}",
  "",
  "[Ref: {ref}]",
  "(Sent from the Nine Labs website)",
].join("\n");

test("fillTemplate: all optional fields present", () => {
  const out = fillTemplate(TEMPLATE, {
    name: "John",
    company: "Acme",
    service: "Events",
    needs: "Branding, Website",
    budget: "AED 20–50k",
    timeline: "ASAP",
    message: "Please call me",
    ref: "NL-7K2Q",
  });
  assert.equal(
    out,
    [
      "Hi Nine Labs! 👋",
      "I'm John from Acme.",
      "",
      "Interested in: Events",
      "What we need: Branding, Website",
      "Budget: AED 20–50k",
      "Timeline: ASAP",
      "",
      "Please call me",
      "",
      "Ref: NL-7K2Q",
      "(Sent from the Nine Labs website)",
    ].join("\n"),
  );
});

test("fillTemplate: empty optional fields drop their lines and collapse blanks", () => {
  const out = fillTemplate(TEMPLATE, {
    name: "John",
    company: "",
    service: "Events",
    needs: "Branding",
    budget: "",
    timeline: "ASAP",
    message: "",
    ref: "NL-7K2Q",
  });
  assert.equal(
    out,
    [
      "Hi Nine Labs! 👋",
      "I'm John.",
      "",
      "Interested in: Events",
      "What we need: Branding",
      "Timeline: ASAP",
      "",
      "Ref: NL-7K2Q",
      "(Sent from the Nine Labs website)",
    ].join("\n"),
  );
});

test("fillTemplate: no leading/trailing blank lines", () => {
  const out = fillTemplate("\n\n{a}\n\n", { a: "x" });
  assert.equal(out, "x");
});

test("templateTokens finds every distinct token", () => {
  assert.deepEqual(templateTokens("Hi {name}, re {service}. [{name} again]"), ["name", "service"]);
});

test("shortRef looks like NL-XXXX with no ambiguous characters", () => {
  const ref = shortRef();
  assert.match(ref, /^NL-[A-HJ-NP-Z2-9]{4}$/);
});
