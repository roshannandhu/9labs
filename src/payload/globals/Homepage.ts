import type { GlobalConfig } from "payload";
import { area, bool, cta, list, num, select, text } from "../fields";
import { signedIn } from "../access";
import { revalidateGlobal } from "../hooks/revalidate";

const accentHelp = "The last words, shown in the italic gradient style.";

export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Homepage",
  admin: { group: "Website", description: "Every heading, text and button on the homepage, and which sections are shown." },
  access: { read: signedIn, update: signedIn },
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Sections",
          description: "Switch sections on or off and drag them into the order you want. The cover (hero) is always first.",
          fields: [
            {
              name: "sections",
              label: "Sections",
              type: "array",
              labels: { singular: "Section", plural: "Sections" },
              fields: [
                {
                  type: "row",
                  fields: [
                    select("section", "Section", [
                      { label: "Services (the 9 cards)", value: "services" },
                      { label: "About and values", value: "about" },
                      { label: "The 9 Quiz", value: "quiz" },
                      { label: "Free e-books", value: "ebooks" },
                      { label: "Contact", value: "contact" },
                    ], undefined, undefined, { required: true }),
                    bool("enabled", "Show on the homepage", true),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "hero",
          label: "Cover (hero)",
          fields: [
            { type: "row", fields: [text("eyebrow", "Small line above the headline"), text("eyebrowExtra", "…extra part hidden on phones")] },
            { type: "row", fields: [text("headline", "Headline"), text("headlineAccent", "Headline — highlighted ending", accentHelp)] },
            area("sub", "Text under the headline"),
            cta("primary", "Main button"),
            cta("secondary", "Second button"),
            text("caption", "Small line under the big 9"),
          ],
        },
        {
          name: "servicesSection",
          label: "Services",
          description: "The texts around the nine cards. The cards themselves are under “The 9 cards”.",
          fields: [
            text("label", "Section label"),
            { type: "row", fields: [text("heading", "Heading"), text("accent", "Heading — highlighted ending", accentHelp)] },
            area("intro", "Introduction"),
            { type: "row", fields: [text("outro", "Closing line"), text("outroAccent", "Closing line — highlighted ending")] },
            text("cardCta", "Button on every card", "Opens the Talk-to-us window."),
          ],
        },
        {
          name: "about",
          label: "About",
          fields: [
            text("label", "Section label"),
            area("statement", "Big statement"),
            area("body", "About text"),
            area("philosophy", "Quote"),
            {
              name: "stats",
              label: "Numbers",
              type: "array",
              maxRows: 3,
              labels: { singular: "Number", plural: "Numbers" },
              fields: [{ type: "row", fields: [num("value", "Number", undefined, { required: true }), text("label", "Label", undefined, { required: true })] }],
            },
            text("strip", "Line under the numbers"),
            {
              name: "story",
              label: "“How we work” — the bridge",
              type: "group",
              fields: [
                text("label", "Label"),
                { type: "row", fields: [text("heading", "Heading"), text("accent", "Heading — highlighted ending")] },
                { type: "row", fields: [text("yourSideLabel", "Left bank — label"), text("yourSideTitle", "Left bank — title")] },
                list("yourSideChips", "Left bank — chips"),
                { type: "row", fields: [text("ourSideLabel", "Right bank — label"), text("ourSideTitle", "Right bank — title")] },
                text("middleLabel", "Middle stop (phone)"),
                {
                  type: "row",
                  fields: [
                    text("pillOut", "Moving label, left to right", "Keep it short (about 14 characters).", { maxLength: 18 }),
                    text("pillIn", "Moving label, right to left", "Keep it short (about 14 characters).", { maxLength: 18 }),
                    text("result", "Result badge", undefined, { maxLength: 18 }),
                  ],
                },
              ],
            },
            {
              name: "steps",
              label: "The three steps",
              type: "array",
              minRows: 3,
              maxRows: 3,
              admin: { description: "The bridge animation is built for exactly three steps." },
              fields: [{ type: "row", fields: [text("n", "Number", undefined, { admin: { width: "15%" } }), text("title", "Title")] }, area("text", "Text")],
            },
            { type: "row", fields: [text("valuesLabel", "Values — label"), text("valuesHeading", "Values — heading")] },
            area("valuesIntro", "Values — introduction", "The value cards themselves are under Content → Values."),
          ],
        },
        {
          name: "closing",
          label: "Contact",
          fields: [
            text("label", "Section label"),
            { type: "row", fields: [text("heading", "Heading"), text("accent", "Heading — highlighted ending")] },
            area("text", "Text"),
            text("cta", "Main button", "Opens the quiz. The second button opens WhatsApp."),
            text("loop", "Text flowing along the arc", "It repeats, so end it with a separator such as ✦ and a space."),
            { type: "row", fields: [text("emailLabel", "E-mail card label"), text("phoneLabel", "Phone card label"), text("visitLabel", "Location card label")] },
          ],
        },
        {
          name: "faqPreview",
          label: "FAQ on the homepage",
          description: "Optionally show the first few questions on the homepage, with a link to the full FAQ page.",
          fields: [
            bool("enabled", "Show questions on the homepage", false),
            num("count", "How many questions", undefined, { defaultValue: 4, min: 1, max: 10 }),
            text("label", "Section label"),
            { type: "row", fields: [text("heading", "Heading"), text("accent", "Heading — highlighted ending")] },
            text("cta", "Link text"),
          ],
        },
      ],
    },
  ],
};
