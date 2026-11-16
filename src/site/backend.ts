"use client";

import type { SiteData } from "@/content/site";
import type { EnquiryFieldKey } from "@/content/types";
import { buildEnquiryMessage, enquiryMissingFields, enquiryNameOk, enquiryWhatsappNumber, type EnquiryAnswers } from "@/lib/enquiry";
import type { QuizAnswers } from "@/lib/quiz/types";
import { shortRef } from "@/lib/text";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const post = (path: string, body: unknown, opts: { keepalive?: boolean } = {}) => fetch(`${basePath}/api/public/${path}/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: opts.keepalive });

/* ------------------------------------------------------------------ */
/*  Talk to us → WhatsApp                                            */
/* ------------------------------------------------------------------ */

export type EnquirySubmitResult = { ok: true; ref: string; message: string; number: string } | { ok: false; missing: ("name" | EnquiryFieldKey)[] };

/** Validates and builds the exact message/number to open — synchronous, so WhatsApp opens inside the click (a popup blocker would stop an awaited one). The save itself is fire-and-forget. */
export function submitEnquiry(site: SiteData, serviceSlug: string, answers: EnquiryAnswers, channel: "whatsapp" | "email"): EnquirySubmitResult {
  const svc = site.services.find((s) => s.slug === serviceSlug) ?? site.services[0];
  const missing: ("name" | EnquiryFieldKey)[] = [];
  if (!enquiryNameOk(answers)) missing.push("name");
  missing.push(...enquiryMissingFields(site, answers));
  if (missing.length) return { ok: false, missing };

  const ref = site.enquiry.refCode ? shortRef() : "";
  const message = buildEnquiryMessage(site, svc, answers, ref);
  const number = enquiryWhatsappNumber(site, svc);

  void post(
    "enquiries",
    { ref, service: svc.slug, channel, answers: { name: answers.name.trim(), company: answers.company.trim(), needs: answers.needs, budget: answers.budget, timeline: answers.timeline, message: answers.message.trim() } },
    { keepalive: true },
  ).catch(() => {});

  return { ok: true, ref, message, number };
}

/* ------------------------------------------------------------------ */
/*  The 9 Quiz                                                          */
/* ------------------------------------------------------------------ */

/** Keyed by ref, so an action/e-mail POST waits for its own quiz-results POST to land first — the row has to exist before it can be updated. */
const quizSaved = new Map<string, Promise<unknown>>();

export function submitQuizResult(ref: string, answers: QuizAnswers): void {
  quizSaved.set(
    ref,
    post("quiz-results", { ref, answers }, { keepalive: true }).catch(() => {}),
  );
}

export function submitQuizAction(ref: string, action: "whatsapp"): void {
  void (quizSaved.get(ref) ?? Promise.resolve()).then(() => post("quiz-results/action", { ref, action }, { keepalive: true }).catch(() => {}));
}

export function submitQuizEmail(ref: string, email: string, answers: QuizAnswers): { ok: boolean } {
  void (quizSaved.get(ref) ?? Promise.resolve()).then(() => post("quiz-email", { ref, email, answers }, { keepalive: true }).catch(() => {}));
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Free e-books                                                        */
/* ------------------------------------------------------------------ */

export type EbookSubmitInput = { bookSlug: string; name: string; email: string; code: string; phone: string; company: string; consent: boolean; trap: string; elapsedMs: number; source: string };
export type EbookSubmitResult = { status: "sent" | "pending" | "error"; error?: string };

export async function submitEbookRequest(input: EbookSubmitInput): Promise<EbookSubmitResult> {
  try {
    const res = await post("ebook-requests", input);
    const data = (await res.json()) as EbookSubmitResult;
    if (!res.ok) return { status: "error", error: data?.error ?? "Something went wrong." };
    return data;
  } catch {
    return { status: "error", error: "Could not reach us. Check your connection and try again." };
  }
}
