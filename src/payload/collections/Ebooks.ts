import type { CollectionConfig } from "payload";
import { area, bool, list, num, select, text } from "../fields";
import { signedIn } from "../access";
import { revalidateAfterDelete, revalidateCollection } from "../hooks/revalidate";
import { DELIVERY_OPTIONS } from "../globals/EbookSettings";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80);

export const Ebooks: CollectionConfig = {
  slug: "ebooks",
  labels: { singular: "Book", plural: "Books" },
  admin: {
    group: "Books",
    useAsTitle: "title",
    defaultColumns: ["title", "enabled", "requests", "sent", "downloads"],
    description: "The free e-books on the shelf. Add a book, upload its PDF and cover, and drag to set the order.",
  },
  orderable: true,
  access: { read: signedIn, update: signedIn, create: signedIn, delete: signedIn },
  versions: { maxPerDoc: 20 },
  hooks: { afterChange: [revalidateCollection], afterDelete: [revalidateAfterDelete] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Book details",
          fields: [
            text("title", "Title", undefined, { required: true }),
            text("subtitle", "Subtitle"),
            area("oneLiner", "One-line description", "Shown under the title on the shelf."),
            list("chapters", "Chapters", "The “Inside this book” list. Type a chapter and press Enter."),
            {
              type: "row",
              fields: [
                num("pages", "Pages", undefined, { min: 1 }),
                text("readTime", "Reading time", "e.g. 35 min read"),
                select("tone", "Cover colour", [
                  { label: "Blue", value: "blue" },
                  { label: "Purple", value: "purple" },
                  { label: "Blue to purple", value: "duo" },
                ], "blue", "Used for the designed cover and the glow behind the book."),
              ],
            },
          ],
        },
        {
          label: "Cover & PDF",
          fields: [
            { name: "cover", label: "Cover image", type: "upload", relationTo: "media", admin: { description: "Optional. Upright image, about 720 × 1040. Without one the site draws a designed cover from the title and colour." } },
            { name: "file", label: "The e-book (PDF)", type: "upload", relationTo: "ebook-files", admin: { description: "The file visitors receive. A book without a PDF cannot be sent — requests wait until one is uploaded." } },
          ],
        },
        {
          label: "Sending",
          fields: [
            {
              type: "row",
              fields: [
                select("approvalMode", "When is this book sent?", [
                  { label: "Use the general setting", value: "inherit" },
                  { label: "After I approve the request", value: "manual" },
                  { label: "Automatically, straight away", value: "auto" },
                ], "inherit"),
                select("deliveryMode", "How is this book sent?", [{ label: "Use the general setting", value: "inherit" }, ...DELIVERY_OPTIONS], "inherit"),
              ],
            },
          ],
        },
      ],
    },
    bool("enabled", "Show on the website", true, "Switch off to hide the book without deleting it."),
    text("slug", "Link name", "Made from the title. Used in the book's address: /ebooks/…", {
      unique: true,
      index: true,
      admin: { position: "sidebar" },
      hooks: {
        beforeValidate: [
          ({ value, data }: { value?: unknown; data?: { title?: string } }) => (typeof value === "string" && value.trim() ? slugify(value) : slugify(data?.title ?? "")),
        ],
      },
    }),
    { type: "collapsible", label: "Numbers", admin: { position: "sidebar" }, fields: [
      num("requests", "Requests", undefined, { defaultValue: 0, admin: { readOnly: true } }),
      num("sent", "E-mails sent", undefined, { defaultValue: 0, admin: { readOnly: true } }),
      num("downloads", "Downloads", undefined, { defaultValue: 0, admin: { readOnly: true } }),
    ] },
  ],
};
