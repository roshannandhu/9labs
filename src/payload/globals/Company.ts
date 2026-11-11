import type { GlobalConfig } from "payload";
import { area, bool, num, select, text } from "../fields";
import { signedIn } from "../access";
import { revalidateGlobal } from "../hooks/revalidate";

export const Company: GlobalConfig = {
  slug: "company",
  label: "Company details",
  admin: { group: "Website", description: "Name, contact details, WhatsApp and social links. Used in the menu, footer, contact section and e-mails." },
  access: { read: signedIn, update: signedIn },
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Company",
          fields: [
            { type: "row", fields: [text("name", "Company name"), text("shortName", "Short name", "Used where space is tight.")] },
            text("type", "Type of business"),
            area("tagline", "One-line description", "Shown under the logo in the footer."),
            { type: "row", fields: [text("location", "Location", "As written on the site, e.g. Dubai South, Dubai, UAE."), text("mapUrl", "Map link", "Opens when a visitor taps the location.")] },
            {
              type: "row",
              fields: [
                { name: "logo", label: "Logo", type: "upload", relationTo: "media", admin: { description: "Optional. Leave empty to keep the built-in animated logo." } },
                { name: "favicon", label: "Browser tab icon", type: "upload", relationTo: "media", admin: { description: "Optional. Square PNG or SVG." } },
              ],
            },
            {
              name: "geo",
              label: "Address for Google",
              type: "group",
              admin: { description: "Not shown on the site. Helps Google understand where the company is." },
              fields: [
                { type: "row", fields: [text("locality", "Area"), text("region", "City / emirate"), text("country", "Country code", "Two letters, e.g. AE.")] },
                { type: "row", fields: [num("latitude", "Latitude"), num("longitude", "Longitude")] },
              ],
            },
          ],
        },
        {
          label: "Contact & WhatsApp",
          fields: [
            {
              name: "contact",
              label: false,
              type: "group",
              fields: [
                { type: "row", fields: [text("email", "E-mail"), text("phone", "Phone (as shown)", "Exactly as it should appear, e.g. +971 50 123 4567.")] },
                text("whatsappNumber", "WhatsApp number", "Digits only with the country code and no +, e.g. 971501234567. Every WhatsApp button on the site opens a chat with this number.", {
                  validate: (v: unknown) => !v || /^\d{8,15}$/.test(String(v)) || "Digits only, with the country code (8–15 digits).",
                }),
                area("whatsappText", "Message already typed for the visitor", "Used by the general WhatsApp buttons."),
                bool("whatsappFab", "Show the floating WhatsApp button", true),
                { type: "row", fields: [text("fabLabel", "Floating button text"), text("chatLabel", "“Chat on WhatsApp” button text")] },
              ],
            },
          ],
        },
        {
          label: "Social links",
          fields: [
            {
              name: "socials",
              label: "Social links",
              type: "array",
              labels: { singular: "Link", plural: "Links" },
              admin: { description: "A link appears on the site only when it is switched on and has an address. Drag to change the order." },
              fields: [
                {
                  type: "row",
                  fields: [
                    select("key", "Platform", [
                      { label: "Instagram", value: "instagram" },
                      { label: "LinkedIn", value: "linkedin" },
                      { label: "X", value: "x" },
                      { label: "Facebook", value: "facebook" },
                      { label: "TikTok", value: "tiktok" },
                      { label: "YouTube", value: "youtube" },
                    ], undefined, undefined, { required: true }),
                    text("href", "Address", "The full link, starting with https://"),
                    bool("enabled", "Show", true),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
