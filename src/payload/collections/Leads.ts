import type { CollectionConfig } from "payload";
import { area, bool, num, select, text } from "../fields";
import { adminUp } from "../access";

export const LEAD_STATUS = [
  { label: "Waiting for approval", value: "pending" },
  { label: "Sent", value: "sent" },
  { label: "Failed to send", value: "failed" },
  { label: "Rejected", value: "rejected" },
];

/** E-book requests from the website form. Sending is done by the buttons (see src/lib/ebooks/send.ts). */
export const Leads: CollectionConfig = {
  slug: "leads",
  labels: { singular: "Book request", plural: "Book requests" },
  admin: {
    group: "Books",
    useAsTitle: "email",
    defaultColumns: ["name", "email", "book", "status", "createdAt"],
    description: "Everyone who asked for an e-book. Open a request to approve, reject or send it again.",
    listSearchableFields: ["name", "email", "company", "phone"],
    components: { beforeListTable: ["/payload/components/LeadTools#LeadTools"] },
  },
  defaultSort: "-createdAt",
  access: { read: adminUp, update: adminUp, create: adminUp, delete: adminUp },
  fields: [
    { name: "actions", type: "ui", admin: { components: { Field: "/payload/components/LeadActions#LeadActions" } } },
    { type: "row", fields: [text("name", "Name", undefined, { required: true }), text("email", "E-mail", undefined, { required: true, index: true })] },
    { type: "row", fields: [text("phone", "Phone / WhatsApp"), text("company", "Company")] },
    { name: "book", label: "Book", type: "relationship", relationTo: "ebooks", required: true, index: true },
    area("notes", "Private notes", "Only visible here."),
    select("status", "Status", LEAD_STATUS, "pending", "Changed by the buttons above.", { index: true, admin: { position: "sidebar", readOnly: true } }),
    text("deliveryUsed", "Sent as", undefined, { admin: { position: "sidebar", readOnly: true } }),
    { name: "sentAt", label: "Sent on", type: "date", admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
    { name: "expiresAt", label: "Link works until", type: "date", admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
    num("downloads", "Downloads", undefined, { defaultValue: 0, admin: { position: "sidebar", readOnly: true } }),
    text("error", "Problem", undefined, { admin: { position: "sidebar", readOnly: true, condition: (d: { error?: string }) => Boolean(d?.error) } }),
    bool("consent", "Agreed to receive e-mails", false),
    text("source", "Came from", undefined, { admin: { readOnly: true } }),
    // the current download link: a new link (Resend) gets a new version and a fresh download allowance
    { name: "tokenVersion", type: "number", defaultValue: 1, admin: { hidden: true } },
    { name: "linkDownloads", type: "number", defaultValue: 0, admin: { hidden: true } },
  ],
};
