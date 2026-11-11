import type { CollectionConfig } from "payload";
import path from "path";
import { text } from "../fields";
import { everyone, signedIn } from "../access";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Image", plural: "Images" },
  admin: { group: "Content", description: "Images used on the site: book covers, the logo, page pictures." },
  access: { read: everyone, update: signedIn, create: signedIn, delete: signedIn },
  upload: {
    staticDir: path.resolve(process.cwd(), "uploads/media"),
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumb", width: 320 },
      { name: "cover", width: 720 },
      { name: "wide", width: 1600 },
    ],
    adminThumbnail: "thumb",
  },
  fields: [text("alt", "Description for screen readers", "A few words describing the picture.")],
};
