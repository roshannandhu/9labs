import type { BookRequest, Enquiry, FollowUp, QuizResult } from "@/content/types";

export type LeadKind = "enquiry" | "book" | "quiz";

/** One shape for the Inbox's list/board, over the three very different lead records. */
export type UnifiedLead = {
  kind: LeadKind;
  id: string;
  title: string;
  sub: string;
  status: FollowUp;
  createdAt: string;
  search: string;
};

export const fromEnquiry = (e: Enquiry): UnifiedLead => ({
  kind: "enquiry",
  id: e.id,
  title: e.name,
  sub: e.serviceTitle,
  status: e.status,
  createdAt: e.createdAt,
  search: [e.name, e.company, e.serviceTitle, e.ref, e.message].join(" ").toLowerCase(),
});

export const fromBookRequest = (r: BookRequest): UnifiedLead => ({
  kind: "book",
  id: r.id,
  title: r.name,
  sub: r.bookSlug,
  status: r.status === "sent" ? "contacted" : r.status === "rejected" ? "lost" : "new",
  createdAt: r.createdAt,
  search: [r.name, r.email, r.company, r.bookSlug].join(" ").toLowerCase(),
});

export const fromQuizResult = (r: QuizResult): UnifiedLead => ({
  kind: "quiz",
  id: r.id,
  title: r.top || "Quiz result",
  sub: r.email || r.ref,
  status: r.status,
  createdAt: r.createdAt,
  search: [r.top, r.email, r.ref, r.matches].join(" ").toLowerCase(),
});

export const KIND_LABEL: Record<LeadKind, string> = { enquiry: "Enquiry", book: "Book request", quiz: "Quiz" };
export const STATUS_LABEL: Record<FollowUp, string> = { new: "New", contacted: "Contacted", won: "Won", lost: "Lost" };
