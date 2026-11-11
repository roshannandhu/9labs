import type { GlobalConfig } from "payload";
import { area, bool, list, num, select, text } from "../fields";
import { signedIn } from "../access";
import { revalidateGlobal } from "../hooks/revalidate";

const hex = (v: unknown) => !v || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v)) || "Use a colour code such as #6f55e8.";
const colour = (name: string, label: string, description?: string) => text(name, label, description ?? "Leave empty to keep the built-in colour.", { validate: hex, admin: { placeholder: "#000000" } });

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Look, SEO & tracking",
  admin: { group: "Website", description: "Colours and theme, what Google and social networks show, and analytics." },
  access: { read: signedIn, update: signedIn },
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "theme",
          label: "Look",
          fields: [
            {
              type: "row",
              fields: [
                select("default", "Theme a new visitor sees", [
                  { label: "Light (lavender)", value: "light" },
                  { label: "Dark", value: "dark" },
                ], "light"),
                bool("toggle", "Let visitors switch light / dark", true),
                bool("intro", "Play the logo animation on a first visit", true),
              ],
            },
            num("grid", "Background grid strength", "0 hides the grid, 0.06 is the default, 0.12 is strong.", { min: 0, max: 0.2, defaultValue: 0.06 }),
            {
              name: "colors",
              label: "Brand colours",
              type: "group",
              admin: { description: "Change a colour and the whole site follows. Empty fields keep the built-in colours." },
              fields: [
                { type: "row", fields: [colour("blue", "Light theme — main colour"), colour("purple", "Light theme — accent"), colour("indigo", "Light theme — deep colour"), colour("bg", "Light theme — background")] },
                { type: "row", fields: [colour("darkBg", "Dark theme — background"), colour("logoFrom", "Highlight gradient — start", "The purple of the logo: used for highlights everywhere and the logo in the dark theme. Empty = built-in."), colour("logoTo", "Highlight gradient — end", "The cyan of the logo. Empty = built-in.")] },
              ],
            },
          ],
        },
        {
          name: "seo",
          label: "Google & sharing",
          fields: [
            text("title", "Homepage title", "The blue line in Google results and the browser tab."),
            text("titleTemplate", "Title of other pages", "%s is replaced by the page's own title."),
            area("description", "Description", "The grey text in Google results. About 150 characters."),
            list("keywords", "Keywords"),
            { name: "ogImage", label: "Sharing image", type: "upload", relationTo: "media", admin: { description: "Shown when the site is shared on WhatsApp or social media (1200 × 630). Empty = the built-in image." } },
            bool("index", "Allow search engines to list the site", true, "Switch off while the site is not ready."),
            text("googleVerification", "Google Search Console code", "Only the code, not the whole tag."),
          ],
        },
        {
          name: "integrations",
          label: "Analytics",
          description: "Tracking starts only after a visitor accepts the cookie notice. The notice appears only when at least one ID is filled in.",
          fields: [
            { type: "row", fields: [text("ga4", "Google Analytics ID", "Looks like G-XXXXXXXXXX."), text("gtm", "Google Tag Manager ID", "Looks like GTM-XXXXXXX."), text("metaPixel", "Meta Pixel ID", "Numbers only.")] },
            area("cookieText", "Cookie notice text"),
            { type: "row", fields: [text("cookieAccept", "Accept button"), text("cookieDecline", "Decline button")] },
          ],
        },
      ],
    },
  ],
};
