import { site } from "@/content/site";
import type { BookRequest, Enquiry, OutboxMail, QuizResult } from "@/content/types";
import { shortRef } from "./text";

/**
 * A handful of believable leads, so a freshly opened admin isn't a blank wall — every room
 * (Today's pulse, the Inbox board, the Nine Ring) has something to show. Clearly marked "Demo
 * data" in the UI; **Settings → Data → Remove sample data** clears it in one click.
 */
const HOURS_AGO = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

type Base = {
  enquiries: Enquiry[];
  bookRequests: BookRequest[];
  quizResults: QuizResult[];
  outbox: OutboxMail[];
};

export function seedSampleData<T extends Base>(state: T): T {
  const svc = site.services;
  const find = (slug: string) => svc.find((s) => s.slug === slug) ?? svc[0];

  const enquiries: Enquiry[] = [
    {
      id: "enq_sample_1",
      ref: shortRef(),
      name: "Omar Haddad",
      company: "Dune Retail Group",
      service: find("events-trade-shows").slug,
      serviceTitle: find("events-trade-shows").title,
      needs: ["Product launch", "Exhibition stand"],
      budget: "AED 20–50k",
      timeline: "In 1–3 months",
      message: "Looking to launch our new collection at the autumn trade show.",
      channel: "whatsapp",
      status: "new",
      notes: "",
      createdAt: HOURS_AGO(3),
    },
    {
      id: "enq_sample_2",
      ref: shortRef(),
      name: "Priya Nair",
      company: "Nair & Co.",
      service: find("digital-social-media-marketing").slug,
      serviceTitle: find("digital-social-media-marketing").title,
      needs: ["Content calendar", "Reels & short video"],
      budget: "AED 5–20k",
      timeline: "As soon as possible",
      message: "",
      channel: "whatsapp",
      status: "contacted",
      notes: "Called back, sending a proposal Thursday.",
      createdAt: HOURS_AGO(26),
    },
    {
      id: "enq_sample_3",
      ref: shortRef(),
      name: "Felix Wagner",
      company: "",
      service: find("ai-consultancy").slug,
      serviceTitle: find("ai-consultancy").title,
      needs: ["AI strategy"],
      budget: "Not sure yet",
      timeline: "Just exploring",
      message: "What would a first AI project look like for a small team?",
      channel: "email",
      status: "new",
      notes: "",
      createdAt: HOURS_AGO(60),
    },
  ];

  const bookRequests: BookRequest[] = [
    {
      id: "req_sample_1",
      name: "Anna Kowalski",
      email: "anna@example.com",
      phone: "+971 50 111 2222",
      company: "Kowalski Design",
      bookSlug: "the-foundations",
      status: "pending",
      deliveryUsed: "",
      sentAt: null,
      expiresAt: null,
      downloads: 0,
      linkDownloads: 0,
      tokenVersion: 1,
      error: "",
      notes: "",
      consent: true,
      source: "/",
      createdAt: HOURS_AGO(5),
    },
    {
      id: "req_sample_2",
      name: "Marcus Chen",
      email: "marcus@example.com",
      phone: "+971 55 333 4444",
      company: "Chen Retail",
      bookSlug: "the-nine-labs-method",
      status: "sent",
      deliveryUsed: "Link",
      sentAt: HOURS_AGO(40),
      expiresAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      downloads: 2,
      linkDownloads: 2,
      tokenVersion: 1,
      error: "",
      notes: "",
      consent: true,
      source: "/ebooks/the-nine-labs-method",
      createdAt: HOURS_AGO(41),
    },
  ];

  const quizResults: QuizResult[] = [
    {
      id: "quiz_sample_1",
      ref: shortRef(),
      top: find("events-trade-shows").title,
      matches: `${find("events-trade-shows").short} 97% · ${find("photography-events-filming").short} 78% · ${find("pr-communications").short} 61%`,
      summary: "You're an organiser, exhibitor or venue, and your main goal is “Run an event or exhibition”.",
      answers: { who: ["events"], goal: ["event"] },
      action: "whatsapp",
      email: "",
      status: "contacted",
      notes: "",
      createdAt: HOURS_AGO(20),
    },
    {
      id: "quiz_sample_2",
      ref: shortRef(),
      top: find("digital-social-media-marketing").title,
      matches: `${find("digital-social-media-marketing").short} 94% · ${find("advertising").short} 72% · ${find("digital-content-creative-production").short} 58%`,
      summary: "You're a small business that wants to grow, and your main goal is “More customers and sales”.",
      answers: { who: ["small"], goal: ["sales"] },
      action: "email",
      email: "lena@example.com",
      status: "new",
      notes: "",
      createdAt: HOURS_AGO(8),
    },
  ];

  const outbox: OutboxMail[] = [
    {
      id: "mail_sample_1",
      kind: "ebook-alert",
      to: site.contact.email,
      subject: `New e-book request to approve: ${find("the-foundations").title ?? "The Foundations"}`,
      html: "",
      text: "Anna Kowalski asked for “The Foundations”.",
      createdAt: HOURS_AGO(5),
    },
  ];

  return { ...state, enquiries, bookRequests, quizResults, outbox };
}
