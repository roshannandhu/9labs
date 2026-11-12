/** Built-in e-mail wording. The admin can change the e-book e-mail under Books → Book settings. */
export const EBOOK_EMAIL = {
  subject: "Your free e-book: {{bookTitle}}",
  body: [
    "Hi {{name}},",
    "Thank you for your interest in Nine Labs Solutions. Here is your copy of “{{bookTitle}}”.",
    "If it raises questions about your own business, just reply to this e-mail — we read every message.",
    "The Nine Labs team",
  ].join("\n\n"),
  buttonLabel: "Download the e-book",
  footer: "You are receiving this e-mail because you asked for this e-book on our website.",
};

export const DELIVERY_DEFAULTS = {
  approvalMode: "manual" as "manual" | "auto",
  deliveryMode: "link" as "link" | "attachment" | "both",
  attachmentMaxMb: 15,
  linkDays: 7,
  maxDownloads: 5,
  senderName: "Nine Labs Solutions",
  replyTo: "",
  adminAlert: true,
  adminAlertTo: "",
};
