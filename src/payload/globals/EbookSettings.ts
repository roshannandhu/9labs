import type { GlobalConfig } from "payload";
import { area, bool, num, select, text } from "../fields";
import { adminUp, signedIn } from "../access";
import { revalidateGlobal } from "../hooks/revalidate";

export const DELIVERY_OPTIONS = [
  { label: "A private download link", value: "link" },
  { label: "The PDF attached to the e-mail", value: "attachment" },
  { label: "Both: attached and a link", value: "both" },
];

export const EbookSettings: GlobalConfig = {
  slug: "ebook-settings",
  label: "Book settings",
  admin: { group: "Books", description: "How e-books are sent, the e-mail visitors receive, and the texts of the request form." },
  access: { read: signedIn, update: adminUp },
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          name: "delivery",
          label: "Sending",
          fields: [
            {
              type: "row",
              fields: [
                select(
                  "approvalMode",
                  "When is a book sent?",
                  [
                    { label: "After I approve the request", value: "manual" },
                    { label: "Automatically, straight away", value: "auto" },
                  ],
                  "manual",
                  "A single book can override this on its own page.",
                ),
                select("deliveryMode", "How is it sent?", DELIVERY_OPTIONS, "link", "A single book can override this on its own page."),
              ],
            },
            {
              type: "row",
              fields: [
                num("attachmentMaxMb", "Largest attachment (MB)", "A bigger PDF is sent as a link instead, so the e-mail still arrives.", { min: 1, max: 25, defaultValue: 15 }),
                num("linkDays", "Link works for (days)", undefined, { min: 1, max: 90, defaultValue: 7 }),
                num("maxDownloads", "Downloads per link", "Stops a forwarded link being shared widely.", { min: 1, max: 50, defaultValue: 5 }),
              ],
            },
            { type: "row", fields: [text("senderName", "Sender name", "What the visitor sees in their inbox."), text("replyTo", "Replies go to", "Optional. Empty = the sending mailbox.")] },
            { type: "row", fields: [bool("adminAlert", "E-mail me when someone requests a book", true), text("adminAlertTo", "Send alerts to", "Empty = the company e-mail.")] },
          ],
        },
        {
          name: "email",
          label: "E-mail to the visitor",
          description: "You can use {{name}}, {{bookTitle}}, {{downloadLink}}, {{expiryDate}} and {{company}}. The download button and the attachment are added automatically according to the sending settings.",
          fields: [
            text("subject", "Subject"),
            area("body", "Message", "Plain text. Leave an empty line between paragraphs.", { admin: { rows: 10 } }),
            text("buttonLabel", "Download button text"),
            area("footer", "Small print at the bottom"),
            { name: "testSend", type: "ui", admin: { components: { Field: "/payload/components/TestEmail#TestEmail" } } },
          ],
        },
        {
          name: "section",
          label: "Section on the homepage",
          fields: [
            text("label", "Section label"),
            { type: "row", fields: [text("heading", "Heading"), text("accent", "Heading — highlighted ending")] },
            area("intro", "Introduction"),
            { type: "row", fields: [text("cardLabel", "Line above each title", "{n} = book number, {pages} = pages."), text("cardCta", "Button"), text("insideLabel", "“Inside this book” label")] },
          ],
        },
        {
          name: "form",
          label: "Request form",
          fields: [
            { type: "row", fields: [text("eyebrow", "Small line", "{n} = book number."), text("title", "Title")] },
            text("text", "Line under the title", "{title} = the book's title."),
            { type: "row", fields: [text("nameLabel", "Name label"), text("namePlaceholder", "Name hint")] },
            { type: "row", fields: [text("emailLabel", "E-mail label"), text("emailPlaceholder", "E-mail hint")] },
            { type: "row", fields: [text("phoneLabel", "Phone label"), text("phonePlaceholder", "Phone hint"), bool("phoneRequired", "Phone is required", true)] },
            { type: "row", fields: [text("companyLabel", "Company label"), text("companyPlaceholder", "Company hint"), bool("showCompany", "Ask for a company", true)] },
            area("consent", "Consent sentence", "The visitor must tick this before sending."),
            { type: "row", fields: [text("submit", "Button"), text("sending", "Button while sending"), text("back", "“Back” button")] },
            {
              name: "codes",
              label: "Country codes",
              type: "array",
              labels: { singular: "Country code", plural: "Country codes" },
              fields: [{ type: "row", fields: [text("code", "Code", "With the +, e.g. +971.", { required: true }), text("label", "Shown as", "e.g. UAE +971.", { required: true })] }],
            },
            text("defaultCode", "Code selected at first", "Must be one of the codes above."),
            text("successTitle", "After sending — title", "{name} = “, first name”."),
            area("successPending", "After sending — when it waits for approval", "{title} and {email} are replaced."),
            area("successSent", "After sending — when it is sent straight away", "{title} and {email} are replaced."),
            text("error", "If something goes wrong"),
          ],
        },
      ],
    },
  ],
};
