import { site } from "./site";
import type { DeliverySettings, EbookEmailSettings, FaqItem, Page, Workspace } from "./types";

/** Current shape of a saved `Workspace`. Bump when a change would break an older saved copy. */
export const WORKSPACE_SCHEMA = 1;

export const defaultDelivery: DeliverySettings = {
  approvalMode: "manual",
  deliveryMode: "link",
  attachmentMaxMb: 15,
  linkDays: 7,
  maxDownloads: 5,
  senderName: "Nine Labs Solutions",
  replyTo: "",
  adminAlert: true,
  adminAlertTo: "",
};

export const defaultEmail: EbookEmailSettings = {
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

const now = () => new Date().toISOString();

export const defaultPages: Page[] = [
  {
    id: "page-about",
    slug: "about",
    title: "About Nine Labs Solutions",
    eyebrow: "About us",
    intro: "We are the bridge between your business and your results.",
    body: [
      "Nine Labs Solutions is a marketing, events and technology company based in Dubai South. We see your company as our own, and we work in both directions: your goals come to us, and our expertise goes to you.",
      "Nine activities, one team, one aim: results you can see.",
    ].join("\n\n"),
    showStats: true,
    showSteps: true,
    showValues: true,
    showServices: true,
    showCta: true,
    seo: { title: "", description: "" },
    updatedAt: now(),
  },
  {
    id: "page-faq",
    slug: "faq",
    title: "Frequently asked questions",
    eyebrow: "FAQ",
    intro: "Short answers to the questions we hear most. Can't find yours? Message us on WhatsApp.",
    body: "",
    showStats: false,
    showSteps: false,
    showValues: false,
    showServices: false,
    showCta: true,
    seo: { title: "", description: "" },
    updatedAt: now(),
  },
  {
    id: "page-privacy",
    slug: "privacy",
    title: "Privacy",
    eyebrow: "Privacy",
    intro: "How we handle the details you share with us.",
    body: [
      "We only ask for what we need to reply to you — your name, contact details and what you're interested in. We never sell your details.",
      "Book requests, quiz results and enquiries are kept so we can follow up and improve the site. Message us any time to see or remove your details.",
      "This page is a working draft — the final wording will follow UAE PDPL guidance once the client supplies it.",
    ].join("\n\n"),
    showStats: false,
    showSteps: false,
    showValues: false,
    showServices: false,
    showCta: false,
    seo: { title: "", description: "" },
    updatedAt: now(),
  },
];

export const defaultFaqs: FaqItem[] = [
  {
    id: "faq-1",
    question: "What does Nine Labs Solutions do?",
    category: "About us",
    answerText:
      "Nine activities under one roof — social media, advertising, content and creative, photography and filming, events, PR, strategy, AI and IT consultancy — planned and delivered by one team.",
    enabled: true,
  },
  {
    id: "faq-2",
    question: "Where are you based, and who do you work with?",
    category: "About us",
    answerText: "We're based in Dubai South and work with brands across the UAE and beyond.",
    enabled: true,
  },
  {
    id: "faq-3",
    question: "How does The 9 Quiz work?",
    category: "The 9 Quiz",
    answerText:
      "Nine quick questions. Every answer gives points to the activities it fits; the three with the most points are recommended, with a short reason quoting your own answers. No sign-up, no AI — it's worked out in your browser.",
    enabled: true,
  },
  {
    id: "faq-4",
    question: "Are the e-books really free?",
    category: "E-books",
    answerText: "Yes. Fill in the form, and we'll e-mail your copy — no payment, no catch.",
    enabled: true,
  },
  {
    id: "faq-5",
    question: "How do I start a project with you?",
    category: "Working with us",
    answerText: "Take The 9 Quiz or use Talk to us on any activity card — both open a WhatsApp chat with our team.",
    enabled: true,
  },
];

export function defaultWorkspace(): Workspace {
  return {
    schema: WORKSPACE_SCHEMA,
    site: structuredClone(site),
    pages: structuredClone(defaultPages),
    faqs: structuredClone(defaultFaqs),
    delivery: { ...defaultDelivery },
    email: { ...defaultEmail },
  };
}
