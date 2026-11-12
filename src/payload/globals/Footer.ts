import type { GlobalConfig } from "payload";
import { text } from "../fields";
import { signedIn } from "../access";
import { revalidateGlobal } from "../hooks/revalidate";

export const Footer: GlobalConfig = {
  slug: "footer",
  label: "Footer",
  admin: { group: "Website", description: "Column titles, the links to pages (About, FAQ, Privacy…) and the copyright line." },
  access: { read: signedIn, update: signedIn },
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    text("copyright", "Copyright line"),
    { type: "row", fields: [text("navTitle", "Menu column title"), text("activitiesTitle", "Activities column title"), text("contactTitle", "Contact column title"), text("pagesTitle", "Pages column title")] },
    {
      name: "links",
      label: "Page links",
      type: "array",
      labels: { singular: "Link", plural: "Links" },
      admin: { description: "Links shown in the footer, e.g. About us → /about, FAQ → /faq. Pages are written under Content → Pages." },
      fields: [{ type: "row", fields: [text("label", "Text", undefined, { required: true }), text("href", "Page or address", undefined, { required: true })] }],
    },
  ],
};
