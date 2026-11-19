import type { Ebook } from "@/content/site";
import type { BookRequest, Enquiry, QuizResult } from "@/content/types";

export type LeadKind = "enquiry" | "book" | "quiz";

/** One flat, newest-first shape over the three very different lead records — the palette's search and the Dashboard's activity feed both read it. */
export type FeedItem = { kind: LeadKind; id: string; title: string; sub: string; createdAt: string; href: string; search: string };

export const KIND_LABEL: Record<LeadKind, string> = { enquiry: "Service enquiry", book: "E-book request", quiz: "Quiz result" };
export const KIND_TAB: Record<LeadKind, string> = { enquiry: "enquiries", book: "books", quiz: "quiz" };

const href = (kind: LeadKind, id: string) => `/inbox?tab=${KIND_TAB[kind]}&id=${id}`;

export function toFeed(enquiries: Enquiry[], bookRequests: BookRequest[], quizResults: QuizResult[], ebooks: Ebook[]): FeedItem[] {
  const bookTitle = (slug: string) => ebooks.find((b) => b.slug === slug)?.title ?? slug;
  const items: FeedItem[] = [
    ...enquiries.map((e): FeedItem => ({ kind: "enquiry", id: e.id, title: e.name, sub: e.serviceTitle, createdAt: e.createdAt, href: href("enquiry", e.id), search: [e.name, e.company, e.serviceTitle, e.ref, e.message].join(" ").toLowerCase() })),
    ...bookRequests.map((r): FeedItem => ({ kind: "book", id: r.id, title: r.name, sub: bookTitle(r.bookSlug), createdAt: r.createdAt, href: href("book", r.id), search: [r.name, r.email, r.company, r.bookSlug, bookTitle(r.bookSlug)].join(" ").toLowerCase() })),
    ...quizResults.map((r): FeedItem => ({ kind: "quiz", id: r.id, title: r.top || "Quiz result", sub: r.email || r.ref, createdAt: r.createdAt, href: href("quiz", r.id), search: [r.top, r.email, r.ref, r.matches].join(" ").toLowerCase() })),
  ];
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Demo leads (from `src/lib/sample.ts`) all share this id prefix, so the UI can mark or filter them. */
export const isSample = (id: string) => id.includes("_sample_");
