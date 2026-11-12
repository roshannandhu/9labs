import type { CollectionConfig } from "payload";
import { area, select, text } from "../fields";
import { signedIn } from "../access";
import { revalidateAfterDelete, revalidateCollection } from "../hooks/revalidate";

export const Values: CollectionConfig = {
  slug: "values",
  labels: { singular: "Value", plural: "Values" },
  admin: { group: "Content", useAsTitle: "title", defaultColumns: ["title", "line"], description: "The value cards in the About section. Drag to reorder." },
  orderable: true,
  access: { read: signedIn, update: signedIn, create: signedIn, delete: signedIn },
  hooks: { afterChange: [revalidateCollection], afterDelete: [revalidateAfterDelete] },
  fields: [
    {
      type: "row",
      fields: [
        text("title", "Title", undefined, { required: true }),
        select("key", "Icon", [
          { label: "Two circles (partnership)", value: "partnership" },
          { label: "Shield (ownership)", value: "ownership" },
          { label: "Lock (trust)", value: "trust" },
          { label: "Diamond (quality)", value: "quality" },
          { label: "Infinity (loyalty)", value: "loyalty" },
        ], "partnership", undefined, { required: true }),
      ],
    },
    area("line", "Text", undefined, { required: true }),
  ],
};
