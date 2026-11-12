import type { CollectionConfig } from "payload";
import path from "path";
import { signedIn } from "../access";

/** The e-book PDFs. Private: only signed-in admins, the mailer and signed download links can read them. */
export const EbookFiles: CollectionConfig = {
  slug: "ebook-files",
  labels: { singular: "PDF", plural: "PDF files" },
  admin: { group: "Books", description: "The e-book files. They are private: visitors only get them by e-mail or through their personal link." },
  access: { read: signedIn, update: signedIn, create: signedIn, delete: signedIn },
  upload: {
    staticDir: path.resolve(process.cwd(), "uploads/ebooks"),
    mimeTypes: ["application/pdf"],
  },
  fields: [],
};
