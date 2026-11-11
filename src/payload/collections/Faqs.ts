import type { CollectionConfig } from "payload";
import { bool, text } from "../fields";
import { signedIn } from "../access";
import { revalidateAfterDelete, revalidateCollection } from "../hooks/revalidate";

export const Faqs: CollectionConfig = {
  slug: "faqs",
  labels: { singular: "Question", plural: "FAQ" },
  admin: { group: "Content", useAsTitle: "question", defaultColumns: ["question", "category", "enabled"], description: "Questions and answers for the FAQ page (/faq). Drag to reorder." },
  orderable: true,
  access: { read: signedIn, update: signedIn, create: signedIn, delete: signedIn },
  versions: { maxPerDoc: 20 },
  hooks: { afterChange: [revalidateCollection], afterDelete: [revalidateAfterDelete] },
  fields: [
    text("question", "Question", undefined, { required: true }),
    { name: "answer", label: "Answer", type: "richText", required: true },
    { type: "row", fields: [text("category", "Group", "Optional. Questions with the same group are shown together, e.g. “E-books”."), bool("enabled", "Show on the website", true)] },
  ],
};
