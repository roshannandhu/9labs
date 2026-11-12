import type { CollectionConfig } from "payload";
import { select, text } from "../fields";
import { nobody, ownerOnly } from "../access";

export const LoginEvents: CollectionConfig = {
  slug: "login-events",
  labels: { singular: "Sign-in", plural: "Sign-in log" },
  admin: { group: "Admin", useAsTitle: "email", defaultColumns: ["email", "result", "device", "createdAt"], description: "Every sign-in attempt, successful or not." },
  defaultSort: "-createdAt",
  access: { read: ownerOnly, create: nobody, update: nobody, delete: ownerOnly },
  fields: [
    text("email", "E-mail", undefined, { admin: { readOnly: true } }),
    select("result", "Result", [
      { label: "Signed in", value: "ok" },
      { label: "Not allowed (e-mail not listed or switched off)", value: "denied" },
      { label: "Google sign-in failed", value: "google-error" },
    ], undefined, undefined, { admin: { readOnly: true } }),
    text("device", "Device", undefined, { admin: { readOnly: true } }),
    text("ip", "Network address", undefined, { admin: { readOnly: true } }),
  ],
};

/** Counters for the public forms' per-visitor limits. Never visible in the admin. */
export const RateHits: CollectionConfig = {
  slug: "rate-hits",
  admin: { hidden: true },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: "key", type: "text", required: true, index: true },
    { name: "windowStart", type: "date", required: true },
    { name: "count", type: "number", defaultValue: 0 },
  ],
};
