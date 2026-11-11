import type { CollectionConfig } from "payload";
import { area, select, text } from "../fields";
import { adminUp, nobody } from "../access";

export const FOLLOW_UP = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
];

export const QuizSubmissions: CollectionConfig = {
  slug: "quiz-submissions",
  labels: { singular: "Quiz result", plural: "Quiz results" },
  admin: {
    group: "Quiz",
    useAsTitle: "top",
    defaultColumns: ["top", "action", "email", "status", "createdAt"],
    description: "Every finished quiz: the answers, what was recommended, and whether the visitor contacted you.",
  },
  defaultSort: "-createdAt",
  access: { read: adminUp, update: adminUp, create: nobody, delete: adminUp },
  fields: [
    { type: "row", fields: [text("top", "Top recommendation", undefined, { admin: { readOnly: true } }), text("matches", "Recommended", undefined, { admin: { readOnly: true } })] },
    area("summary", "Answers", undefined, { admin: { readOnly: true, rows: 12 } }),
    { type: "row", fields: [
      select("action", "What they did next", [
        { label: "Only looked at the result", value: "none" },
        { label: "Opened WhatsApp", value: "whatsapp" },
        { label: "Asked for the plan by e-mail", value: "email" },
      ], "none", undefined, { admin: { readOnly: true } }),
      text("email", "E-mail", undefined, { admin: { readOnly: true } }),
    ] },
    select("status", "Follow-up", FOLLOW_UP, "new", undefined, { admin: { position: "sidebar" } }),
    area("notes", "Private notes", undefined, { admin: { position: "sidebar" } }),
    { name: "answers", type: "json", admin: { hidden: true } },
    text("ref", "Reference", undefined, { index: true, admin: { hidden: true } }),
  ],
};
