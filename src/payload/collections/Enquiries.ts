import type { CollectionConfig } from "payload";
import { area, list, select, text } from "../fields";
import { adminUp, nobody } from "../access";
import { FOLLOW_UP } from "./QuizSubmissions";

export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  labels: { singular: "Enquiry", plural: "Enquiries" },
  admin: {
    group: "The 9 cards",
    useAsTitle: "name",
    defaultColumns: ["name", "service", "budget", "channel", "status", "createdAt"],
    description: "Everything sent from the Talk-to-us window, saved just before WhatsApp opens.",
    listSearchableFields: ["name", "company", "message"],
    components: { beforeListTable: ["/payload/components/ExportButton#EnquiryExport"] },
  },
  defaultSort: "-createdAt",
  access: { read: adminUp, update: adminUp, create: nobody, delete: adminUp },
  fields: [
    { type: "row", fields: [text("name", "Name", undefined, { admin: { readOnly: true } }), text("company", "Company", undefined, { admin: { readOnly: true } })] },
    text("service", "Activity", undefined, { admin: { readOnly: true } }),
    list("needs", "What they need"),
    { type: "row", fields: [text("budget", "Budget", undefined, { admin: { readOnly: true } }), text("timeline", "Timeline", undefined, { admin: { readOnly: true } })] },
    area("message", "Message", undefined, { admin: { readOnly: true } }),
    select("channel", "Sent by", [
      { label: "WhatsApp", value: "whatsapp" },
      { label: "E-mail", value: "email" },
    ], "whatsapp", undefined, { admin: { position: "sidebar", readOnly: true } }),
    select("status", "Follow-up", FOLLOW_UP, "new", undefined, { admin: { position: "sidebar" } }),
    area("notes", "Private notes", undefined, { admin: { position: "sidebar" } }),
  ],
};
