import type { CollectionConfig } from "payload";
import { area, list, text } from "../fields";
import { nobody, signedIn } from "../access";
import { revalidateCollection } from "../hooks/revalidate";

/**
 * The nine activity cards. There are always exactly nine and their order is fixed: each position
 * has its own animated scene, particle picture and number, so only the words are editable.
 */
export const Services: CollectionConfig = {
  slug: "services",
  labels: { singular: "Card", plural: "The 9 cards" },
  admin: {
    group: "The 9 cards",
    useAsTitle: "title",
    defaultColumns: ["n", "title", "short"],
    description: "The nine activities. Edit the words and the “What do you need?” choices of each card. The order and the animations are fixed.",
    pagination: { defaultLimit: 10 },
  },
  defaultSort: "n",
  access: { read: signedIn, update: signedIn, create: nobody, delete: nobody },
  versions: { maxPerDoc: 20 },
  hooks: { afterChange: [revalidateCollection] },
  fields: [
    {
      type: "row",
      fields: [
        { name: "n", label: "Card number", type: "number", required: true, unique: true, index: true, admin: { readOnly: true, width: "20%" } },
        text("icon", "Animation", "Fixed: the scene this card plays.", { required: true, admin: { readOnly: true, width: "30%" } }),
        text("slug", "Link name", "Fixed: used in links to this card.", { required: true, unique: true, admin: { readOnly: true, width: "50%" } }),
      ],
    },
    { type: "row", fields: [text("title", "Title", undefined, { required: true }), text("short", "Short name", "Used in small places: the wheel, the footer, the quiz plan.", { required: true })] },
    area("description", "Description", undefined, { required: true }),
    list("tags", "Three keywords", "Shown on the card."),
    list("needs", "“What do you need?” choices", "The choices in the Talk-to-us window for this card. Type one and press Enter."),
    text("whatsappNumber", "Send this card's enquiries to another WhatsApp number", "Optional. Digits only with the country code. Empty = the company number.", {
      validate: (v: unknown) => !v || /^\d{8,15}$/.test(String(v)) || "Digits only, with the country code (8–15 digits).",
    }),
  ],
};
