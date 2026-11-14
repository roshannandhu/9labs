import { site } from "@/content/site";
import type { BookRequest, Enquiry, OutboxMail, QuizResult } from "@/content/types";
import { mailLayout, paragraphs } from "./mail";
import { shortRef } from "./text";

/**
 * Ninety days of believable demand, so a freshly opened admin isn't a blank wall — the Dashboard's
 * graphs, the Inbox and the command palette's search all have real shapes to show. Clearly marked
 * "Demo data" in the UI (`src/studio/leads.ts`'s `isSample`); **Settings → Backup & reset → Remove
 * sample data** clears it in one click. Deterministically seeded (same numbers every time this
 * build starts fresh) so the graphs don't jump around between reloads while you're looking at them.
 */
const DAY = 86_400_000;
const DAYS = 90;

/** A small, fast, seeded PRNG (mulberry32) — good enough for demo data, not for anything security-sensitive. */
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(90125);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

/** More likely to land on a recent day (mild growth) and less likely on a weekend (resampled, not zeroed). */
function pickAge(days = DAYS): number {
  for (let tries = 0; tries < 6; tries++) {
    const age = Math.min(days - 1, Math.floor(days * rng() ** 1.5));
    const dow = new Date(Date.now() - age * DAY).getDay();
    if (dow !== 0 && dow !== 6) return age;
    if (rng() > 0.55) return age; // weekends still happen, just less often
  }
  return Math.min(days - 1, Math.floor(days * rng() ** 1.5));
}

function atAge(age: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - age);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
const businessHour = () => atAge(pickAge(), int(8, 19), int(0, 59));
const anyHour = () => atAge(pickAge(), int(7, 23), int(0, 59));

const FIRST = ["Omar", "Priya", "Felix", "Anna", "Marcus", "Lena", "Yusuf", "Chloe", "Rahul", "Sofia", "Ahmed", "Grace", "Karim", "Nadia", "Tom", "Mei"];
const LAST = ["Haddad", "Nair", "Wagner", "Kowalski", "Chen", "Fischer", "Al Suwaidi", "Dubois", "Patel", "Rossi", "Khalil", "Mensah", "Novak", "Hassan", "Reed", "Lin"];
const COMPANY = ["Dune Retail Group", "Nair & Co.", "", "Kowalski Design", "Chen Retail", "Fischer Events", "Suwaidi Trading", "", "Patel Logistics", "Rossi Hospitality", "Khalil Holdings", ""];
const fullName = () => `${pick(FIRST)} ${pick(LAST)}`;
const emailFor = (name: string) => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`;
const phoneFor = () => `+971 5${int(0, 9)} ${int(100, 999)} ${int(1000, 9999)}`;

type Base = { enquiries: Enquiry[]; bookRequests: BookRequest[]; quizResults: QuizResult[]; outbox: OutboxMail[] };

function makeEnquiries(): Enquiry[] {
  const out: Enquiry[] = [];
  for (let i = 0; i < 30; i++) {
    const svc = pick(site.services);
    const channel: Enquiry["channel"] = rng() < 0.82 ? "whatsapp" : "email";
    out.push({
      id: `enq_sample_${i}`,
      ref: shortRef(),
      name: fullName(),
      company: pick(COMPANY),
      service: svc.slug,
      serviceTitle: svc.title,
      needs: svc.needs.length ? [pick(svc.needs)] : [],
      budget: pick(site.enquiry.budgets),
      timeline: pick(site.enquiry.timelines),
      message: rng() < 0.4 ? "" : "Could we talk this week?",
      channel,
      status: rng() < 0.55 ? "new" : rng() < 0.7 ? "contacted" : rng() < 0.85 ? "won" : "lost",
      notes: "",
      createdAt: businessHour(),
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function makeBookRequests(outbox: OutboxMail[]): BookRequest[] {
  const out: BookRequest[] = [];
  for (let i = 0; i < 35; i++) {
    const book = pick(site.ebooks);
    const name = fullName();
    const email = emailFor(name);
    const createdAt = businessHour();
    const age = Math.round((Date.now() - new Date(createdAt).getTime()) / DAY);
    const roll = rng();
    const status: BookRequest["status"] = age < 1 && roll < 0.3 ? "pending" : roll < 0.94 ? "sent" : "failed";
    const sentAt = status === "sent" ? new Date(new Date(createdAt).getTime() + int(1, 40) * 60_000).toISOString() : null;
    const downloads = status === "sent" ? (rng() < 0.55 ? int(1, 3) : 0) : 0;
    out.push({
      id: `req_sample_${i}`,
      name,
      email,
      phone: phoneFor(),
      company: pick(COMPANY),
      bookSlug: book.slug,
      status,
      deliveryUsed: status === "sent" ? "Link" : "",
      sentAt,
      expiresAt: status === "sent" ? new Date(new Date(createdAt).getTime() + 7 * DAY).toISOString() : null,
      downloads,
      linkDownloads: downloads,
      tokenVersion: 1,
      error: status === "failed" ? "The e-mail could not be delivered." : "",
      notes: "",
      consent: true,
      source: rng() < 0.6 ? "/" : `/ebooks/${book.slug}`,
      createdAt,
    });
    if (status === "sent") {
      const firstName = name.split(" ")[0];
      outbox.push({
        id: `mail_sample_book_${i}`,
        kind: "ebook",
        to: email,
        subject: `Your free e-book: ${book.title}`,
        html: mailLayout({ company: site.name, heading: "Here's your e-book", bodyHtml: paragraphs(`Hi ${firstName},\n\nThank you for your interest in ${site.name}. Here is your copy of "${book.title}".`), button: { label: "Download the e-book", url: "/download/?t=sample" } }),
        text: `Hi ${firstName},\n\nHere is your copy of "${book.title}".\n\nDownload: /download/?t=sample`,
        createdAt: sentAt ?? createdAt,
      });
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function makeQuizResults(): QuizResult[] {
  const out: QuizResult[] = [];
  for (let i = 0; i < 70; i++) {
    const shuffled = [...site.services].sort(() => rng() - 0.5).slice(0, 3);
    const scores = [int(88, 99), int(55, 80), int(35, 60)].sort((a, b) => b - a);
    const matches = shuffled.map((s, j) => `${s.short} ${scores[j]}%`).join(" · ");
    const roll = rng();
    const action: QuizResult["action"] = roll < 0.45 ? "none" : roll < 0.8 ? "whatsapp" : "email";
    const name = fullName();
    out.push({
      id: `quiz_sample_${i}`,
      ref: shortRef(),
      top: shuffled[0].title,
      matches,
      summary: `You're exploring ${shuffled[0].short.toLowerCase()}, and your main goal is "grow the business".\n\nWhy: it matched most of your answers.`,
      answers: { who: ["business"], goal: ["grow"] },
      action,
      email: action === "email" ? emailFor(name) : "",
      status: action === "none" ? "new" : rng() < 0.6 ? "contacted" : "new",
      notes: "",
      createdAt: anyHour(),
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function seedSampleData<T extends Base>(state: T): T {
  const outbox: OutboxMail[] = [];
  const bookRequests = makeBookRequests(outbox);
  const enquiries = makeEnquiries();
  const quizResults = makeQuizResults();
  outbox.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...state, enquiries, bookRequests, quizResults, outbox };
}
