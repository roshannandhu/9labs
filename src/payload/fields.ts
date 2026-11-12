import type { Field } from "payload";

/** Small helpers so every admin field carries a label and a plain-English help line. */
type Extra = Record<string, unknown>;
const withHelp = (description?: string, admin: Extra = {}) => (description || Object.keys(admin).length ? { admin: { ...(description ? { description } : {}), ...admin } } : {});

export const text = (name: string, label: string, description?: string, extra: Extra = {}): Field =>
  ({ name, label, type: "text", ...withHelp(description, extra.admin as Extra), ...omitAdmin(extra) }) as Field;

export const area = (name: string, label: string, description?: string, extra: Extra = {}): Field =>
  ({ name, label, type: "textarea", ...withHelp(description, extra.admin as Extra), ...omitAdmin(extra) }) as Field;

export const bool = (name: string, label: string, defaultValue: boolean, description?: string): Field =>
  ({ name, label, type: "checkbox", defaultValue, ...withHelp(description) }) as Field;

export const num = (name: string, label: string, description?: string, extra: Extra = {}): Field =>
  ({ name, label, type: "number", ...withHelp(description, extra.admin as Extra), ...omitAdmin(extra) }) as Field;

/** A list of short texts (chips, tags, chapters…): type one, press Enter, type the next. */
export const list = (name: string, label: string, description?: string): Field =>
  ({ name, label, type: "text", hasMany: true, ...withHelp(description ?? "Type one and press Enter to add the next.") }) as Field;

export const select = (name: string, label: string, options: { label: string; value: string }[], defaultValue?: string, description?: string, extra: Extra = {}): Field =>
  ({ name, label, type: "select", options, defaultValue, ...withHelp(description, extra.admin as Extra), ...omitAdmin(extra) }) as Field;

/** Button: a label plus what it does. */
export const cta = (name: string, label: string): Field => ({
  name,
  label,
  type: "group",
  fields: [
    {
      type: "row",
      fields: [
        text("label", "Button text"),
        select(
          "action",
          "What it does",
          [
            { label: "Opens the quiz", value: "quiz" },
            { label: "Opens WhatsApp", value: "whatsapp" },
            { label: "Goes to a link", value: "link" },
          ],
          "quiz",
        ),
        text("href", "Link", "A section (#ebooks), a page (/about) or a full address (https://…).", {
          admin: { condition: (_: unknown, sibling: { action?: string }) => sibling?.action === "link" },
        }),
      ],
    },
  ],
});

function omitAdmin(extra: Extra) {
  const rest = { ...extra };
  delete rest.admin;
  return rest;
}

export const ACTIVITIES = [
  { value: "social", label: "Social media" },
  { value: "advertising", label: "Advertising" },
  { value: "content", label: "Content & creative" },
  { value: "photo", label: "Photography & filming" },
  { value: "events", label: "Events" },
  { value: "pr", label: "PR" },
  { value: "strategy", label: "Strategy" },
  { value: "ai", label: "AI" },
  { value: "it", label: "IT" },
] as const;
