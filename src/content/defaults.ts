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
    title: "We are the bridge between your business and your results.",
    eyebrow: "About us",
    intro:
      "Nine Labs Solutions is a marketing, events and technology company based in Dubai South. We bring nine areas of expertise together in one team, so your business can grow with a partner who understands the whole picture.",
    body: "",
    showStats: false,
    showMission: true,
    showSteps: true,
    showValues: true,
    showCommitments: true,
    showServices: true,
    showContact: true,
    showCta: true,
    seo: { title: "About Nine Labs Solutions", description: "" },
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
    showMission: false,
    showSteps: false,
    showValues: false,
    showCommitments: false,
    showServices: false,
    showContact: false,
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
    showMission: false,
    showSteps: false,
    showValues: false,
    showCommitments: false,
    showServices: false,
    showContact: false,
    showCta: false,
    seo: { title: "", description: "" },
    updatedAt: now(),
  },
];

/**
 * From the client's "About Us and FAQ Page Content" doc (final review 10 Nov 2026). Any answer that
 * carried a "[… to be confirmed …]" / "[… to be supplied …]" note is imported switched off (the doc's
 * own rule: "do not publish placeholder text") — the note stays in the text so the admin sees what's
 * pending; `checkWorkspace` blocks Publish if one is switched back on with the note still there.
 */
export const defaultFaqs: FaqItem[] = [
  // A. About Nine Labs Solutions
  {
    id: "faq-who",
    question: "Who is Nine Labs Solutions?",
    category: "About Nine Labs Solutions",
    answerText:
      "Nine Labs Solutions is a marketing, events and technology company based in Dubai South, Dubai. We bring nine activities together in one team, from digital marketing and advertising to events, content, AI consultancy, and IT and web consultancy.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-bridge",
    question: "What does “the bridge” mean?",
    category: "About Nine Labs Solutions",
    answerText:
      "A bridge only works when traffic moves in both directions. For us, it means a two-way partnership: your goals and knowledge come to us, and our expertise and effort go to you. We treat your company as our own and your results as our results.",
    enabled: true,
    home: true,
  },
  {
    id: "faq-name",
    question: "Why is the company called Nine Labs?",
    category: "About Nine Labs Solutions",
    answerText:
      "The name Nine Labs reflects our nine activities: nine areas where we help businesses grow. It also connects to our mindset. We aim not to leave clients with a simple “no”; we look for a practical way to help, and if something is beyond our current capabilities, we will be honest and find the right solution.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-based",
    question: "Where are you based, and who do you work with?",
    category: "About Nine Labs Solutions",
    answerText:
      "We are based in Dubai South, Dubai, UAE. We work with businesses of different sizes in Dubai and across the UAE, and we welcome clients beyond. [Markets and client types to be confirmed.]",
    enabled: false,
    home: false,
  },

  // B. Our services
  {
    id: "faq-services",
    question: "What services do you offer?",
    category: "Our services",
    answerText:
      "We offer nine services: digital and social media marketing, advertising, digital content and creative production, photography and events filming, events and trade shows, PR and communications, marketing and strategy consultancy, AI consultancy, and IT and web consultancy.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-one-service",
    question: "Can I choose just one service?",
    category: "Our services",
    answerText:
      "Yes. You can start with a single service, or combine several so they work together. We will help you decide what makes sense for your goals. [To be confirmed.]",
    enabled: false,
    home: false,
  },
  {
    id: "faq-video",
    question: "Do you create videos and motion graphics?",
    category: "Our services",
    answerText:
      "Yes. Our digital content and creative production service covers videos, motion graphics and other creative content, and our photography service includes commercial photography and filming of events.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-events-manage",
    question: "Can you manage a whole event for me?",
    category: "Our services",
    answerText: "Yes. We organise, promote and manage business events, conferences, seminars and trade shows, from planning through to the day itself.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-ai",
    question: "What does AI consultancy involve?",
    category: "Our services",
    answerText:
      "We give practical advice on where AI can save your business time or improve results, and how to begin using it sensibly. We start from your business needs, not from the technology.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-it",
    question: "What does IT and web consultancy involve?",
    category: "Our services",
    answerText:
      "We help businesses plan and support the IT systems they rely on, and we also offer website design and redesigns. We start by understanding how your business works, what you need, and how your IT and website can better support your goals.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-packages",
    question: "Do you offer packages for startups and small businesses?",
    category: "Our services",
    answerText: "We want to work with growing businesses, and we will shape a plan to suit your stage and budget. [Package options to be confirmed.]",
    enabled: false,
    home: false,
  },

  // C. Working with us
  {
    id: "faq-start",
    question: "How do we get started?",
    category: "Working with us",
    answerText:
      "Start The 9 Quiz on our website or contact us directly. We will talk through what you need, then come back to you with a clear plan and a quote before any work begins.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-cost",
    question: "How much do your services cost?",
    category: "Working with us",
    answerText: "Every business is different, so we price after we understand what you need. You will receive a clear quote before work starts, with no hidden costs. [Pricing approach to be confirmed.]",
    enabled: false,
    home: true,
  },
  {
    id: "faq-timeline",
    question: "How long does a project take?",
    category: "Working with us",
    answerText: "It depends on the service and the size of the work. A timeline is agreed with you in the plan, before we begin, and we keep you updated if anything changes.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-performance",
    question: "How will I know the work is performing?",
    category: "Working with us",
    answerText:
      "We agree what success looks like at the start, then share clear reports and review the results with you regularly. If something is not working, we will tell you and propose how to fix it.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-feedback",
    question: "Can I give feedback and ask for changes?",
    category: "Working with us",
    answerText: "Of course. Feedback is part of how a bridge works. Your input shapes the work at every stage. [Revision policy to be confirmed.]",
    enabled: false,
    home: false,
  },
  {
    id: "faq-contact-point",
    question: "Will I have one point of contact?",
    category: "Working with us",
    answerText: "You will know who to talk to at every stage of the work. [Point-of-contact arrangement to be confirmed.]",
    enabled: false,
    home: false,
  },
  {
    id: "faq-ownership",
    question: "Who owns the work you create for me?",
    category: "Working with us",
    answerText: "Ownership of final deliverables is set out in the agreement for each project, so everything is clear in writing. [Standard terms to be confirmed.]",
    enabled: false,
    home: false,
  },
  {
    id: "faq-confidential",
    question: "Is my business information kept confidential?",
    category: "Working with us",
    answerText: "Yes. We treat your business information as confidential and use it only to do the work for you.",
    enabled: true,
    home: false,
  },
  {
    id: "faq-payments",
    question: "How do payments work?",
    category: "Working with us",
    answerText: "Payment terms are agreed in writing before work begins. [Payment terms to be confirmed.]",
    enabled: false,
    home: false,
  },

  // D. The 9 Quiz
  {
    id: "faq-quiz-what",
    question: "What is The 9 Quiz?",
    category: "The 9 Quiz",
    answerText: "Nine quick questions about your business. Each answer points to the activities that fit, and you get your top three matches with the reason why. No sign-up.",
    enabled: true,
    home: true,
  },
  {
    id: "faq-quiz-free",
    question: "Is The 9 Quiz free, and what happens to my answers?",
    category: "The 9 Quiz",
    answerText: "[To be confirmed: whether it is free, how answers are stored and who sees them.]",
    enabled: false,
    home: false,
  },
  {
    id: "faq-quiz-person",
    question: "Does The 9 Quiz replace talking to a person?",
    category: "The 9 Quiz",
    answerText: "No. It is a quick first step that helps you put your needs into words. Our team follows up for the real conversation.",
    enabled: true,
    home: false,
  },

  // E. Free e-books
  {
    id: "faq-ebooks-what",
    question: "What are the free e-books?",
    category: "Free e-books",
    answerText:
      "We offer two to three downloadable e-books: one on marketing principles, one on why digital marketing matters today, and one on how Nine Labs Solutions works. [Final titles to be supplied.]",
    enabled: false,
    home: false,
  },
  {
    id: "faq-ebooks-pay",
    question: "Do I need to pay or sign up to download them?",
    category: "Free e-books",
    answerText: "[To be confirmed.]",
    enabled: false,
    home: false,
  },

  // F. Contact
  {
    id: "faq-contact-how",
    question: "How can I contact you?",
    category: "Contact",
    answerText: "Email, phone / WhatsApp and social media links [to be supplied]. You can also start The 9 Quiz at any time.",
    enabled: false,
    home: false,
  },
  {
    id: "faq-response",
    question: "How quickly will you reply?",
    category: "Contact",
    answerText: "[Working hours and typical response time to be confirmed.]",
    enabled: false,
    home: false,
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
