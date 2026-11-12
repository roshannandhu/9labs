import type { CollectionConfig } from "payload";
import { area, bool, text } from "../fields";
import { signedIn } from "../access";
import { revalidateAfterDelete, revalidateCollection } from "../hooks/revalidate";

const RESERVED = ["admin", "api", "ebooks", "download", "_next", "media"];

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Page", plural: "Pages" },
  admin: {
    group: "Content",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    description: "Full pages: About (/about), FAQ introduction (/faq), Privacy, Terms and any page you add. Link them from the menu or the footer.",
  },
  access: { read: signedIn, update: signedIn, create: signedIn, delete: signedIn },
  versions: { maxPerDoc: 20 },
  hooks: { afterChange: [revalidateCollection], afterDelete: [revalidateAfterDelete] },
  fields: [
    {
      type: "row",
      fields: [
        text("title", "Title", undefined, { required: true }),
        text("slug", "Address", "The page opens at /<address>. Small letters, numbers and dashes. “about” and “faq” are the About and FAQ pages.", {
          required: true,
          unique: true,
          index: true,
          validate: (v: unknown) => {
            const s = String(v ?? "");
            if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) return "Small letters, numbers and dashes only, e.g. privacy-policy.";
            if (RESERVED.includes(s)) return "This address is used by the site itself. Please choose another.";
            return true;
          },
        }),
      ],
    },
    text("eyebrow", "Small label above the title"),
    area("intro", "Introduction", "Shown large under the title."),
    { name: "body", label: "Page content", type: "richText" },
    {
      type: "collapsible",
      label: "Extra blocks (About page)",
      admin: { initCollapsed: true, description: "Reuse parts of the homepage under the text." },
      fields: [
        { type: "row", fields: [bool("showStats", "The three numbers", false), bool("showSteps", "The three “how we work” steps", false), bool("showValues", "The value cards", false), bool("showServices", "The nine activities", false), bool("showCta", "Quiz + WhatsApp buttons", true)] },
      ],
    },
    {
      name: "seo",
      label: "Google & sharing",
      type: "group",
      fields: [text("title", "Title in Google", "Empty = the page title."), area("description", "Description in Google", "Empty = the introduction.")],
    },
  ],
};
