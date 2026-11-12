import type { GlobalConfig } from "payload";
import { area, bool, list, text } from "../fields";
import { signedIn } from "../access";
import { revalidateGlobal } from "../hooks/revalidate";

export const EnquirySettings: GlobalConfig = {
  slug: "enquiry-settings",
  label: "Talk-to-us window",
  admin: {
    group: "The 9 cards",
    description: "The window that opens from every card. The visitor picks what they need and it opens WhatsApp with the message already written. The “What do you need?” choices are set on each card.",
  },
  access: { read: signedIn, update: signedIn },
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Choices",
          fields: [
            list("budgets", "Budget choices"),
            list("timelines", "Timeline choices"),
            { type: "row", fields: [bool("showBudget", "Ask for a budget", true), bool("showTimeline", "Ask for a timeline", true), bool("showCompany", "Ask for a company", true), bool("showMessage", "Allow a message", true)] },
          ],
        },
        {
          label: "Texts",
          fields: [
            { type: "row", fields: [text("title", "Window title"), text("intro", "Line under the title")] },
            { type: "row", fields: [text("activityLabel", "Activity label"), text("needsLabel", "Needs label"), text("budgetLabel", "Budget label"), text("timelineLabel", "Timeline label")] },
            { type: "row", fields: [text("nameLabel", "Name label"), text("namePlaceholder", "Name hint"), text("nameError", "Missing-name message")] },
            { type: "row", fields: [text("companyLabel", "Company label"), text("companyPlaceholder", "Company hint")] },
            { type: "row", fields: [text("messageLabel", "Message label"), text("messagePlaceholder", "Message hint")] },
            { type: "row", fields: [text("whatsappCta", "WhatsApp button"), bool("emailEnabled", "Offer “e-mail instead”", true), text("emailCta", "E-mail link")] },
          ],
        },
        {
          label: "WhatsApp message & thank-you",
          fields: [
            { type: "row", fields: [text("greeting", "First line of the message"), text("signature", "Last line of the message")] },
            text("thanksTitle", "Thank-you title", "{name} becomes the visitor's first name."),
            area("thanksText", "Thank-you text"),
            text("again", "“Open WhatsApp again” button"),
          ],
        },
      ],
    },
  ],
};
