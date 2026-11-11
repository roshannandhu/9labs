import type { GlobalConfig } from "payload";
import { cta, select, text } from "../fields";
import { signedIn } from "../access";
import { revalidateGlobal } from "../hooks/revalidate";

export const SECTIONS = [
  { label: "Home (top)", value: "home" },
  { label: "Services", value: "services" },
  { label: "About", value: "about" },
  { label: "The 9 Quiz", value: "quiz" },
  { label: "Free e-books", value: "ebooks" },
  { label: "Contact", value: "contact" },
];

export const Navigation: GlobalConfig = {
  slug: "navigation",
  label: "Menu",
  admin: { group: "Website", description: "The links in the top menu (and the phone menu) and the highlighted button." },
  access: { read: signedIn, update: signedIn },
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: "items",
      label: "Menu links",
      type: "array",
      labels: { singular: "Link", plural: "Links" },
      admin: { description: "Drag to reorder." },
      fields: [
        {
          type: "row",
          fields: [
            text("label", "Text", undefined, { required: true }),
            select("kind", "Goes to", [
              { label: "A section of the homepage", value: "section" },
              { label: "A page or address", value: "link" },
            ], "section"),
            select("section", "Section", SECTIONS, "home", undefined, { admin: { condition: (_: unknown, s: { kind?: string }) => s?.kind !== "link" } }),
            text("href", "Page or address", "For example /about, /faq or https://…", { admin: { condition: (_: unknown, s: { kind?: string }) => s?.kind === "link" } }),
          ],
        },
      ],
    },
    cta("cta", "Highlighted button"),
  ],
};
