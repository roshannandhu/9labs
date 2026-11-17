"use client";

import type { SiteData } from "@/content/site";
import type { EnquiryFieldKey } from "@/content/types";
import { buildEnquiryMessage, enquiryMissingFields, enquiryNameOk, enquiryWhatsappNumber, type EnquiryAnswers } from "@/lib/enquiry";
import { aiQuizResultSchema } from "@/lib/quiz/result";
import type { AiQuizResult, QuizAnswers, QuizOther } from "@/lib/quiz/types";
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

/**
 * Asks the server for the AI result (it also saves the lead). Resolves `null` on any failure or after
 * `timeoutMs` — the overlay then shows the built-in backup and saves via `submitQuizResult` instead.
 */
export async function fetchQuizAi(ref: string, answers: QuizAnswers, other: QuizOther, elapsedMs: number, timeoutMs = 12_000): Promise<AiQuizResult | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const req = fetch(`${basePath}/api/public/quiz-ai/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref, answers, other, trap: "", elapsedMs }), signal: ctl.signal })
    .then(async (res) => {
      if (!res.ok) return null;
      const body = (await res.json()) as { result?: unknown; saved?: boolean };
      const parsed = aiQuizResultSchema.safeParse(body.result);
      if (!parsed.success) return null;
      // the server showed a result but couldn't store the lead: one retry through the fallback save
      if (body.saved === false) void post("quiz-results", { ref, answers, other }, { keepalive: true }).catch(() => {});
      return parsed.data;
    })
    .catch(() => null)
    .finally(() => clearTimeout(timer));
  quizSaved.set(ref, req);
  return req;
}

/** The fallback save, for when `fetchQuizAi` didn't come back (the server skips refs it already has). */
export function submitQuizResult(ref: string, answers: QuizAnswers, other: QuizOther = {}): void {
  quizSaved.set(
    ref,
    post("quiz-results", { ref, answers, other }, { keepalive: true }).catch(() => {}),
  );
}

/** The WhatsApp form step: name + phone onto the saved lead (answers ride along in case that save never landed). */
export function submitQuizContact(ref: string, contact: { name: string; phone: string }, answers: QuizAnswers, other: QuizOther): void {
  void (quizSaved.get(ref) ?? Promise.resolve()).then(() => post("quiz-results/action", { ref, action: "whatsapp", ...contact, answers, other }, { keepalive: true }).catch(() => {}));
}

export function submitQuizEmail(ref: string, email: string, answers: QuizAnswers, other: QuizOther = {}): { ok: boolean } {
  void (quizSaved.get(ref) ?? Promise.resolve()).then(() => post("quiz-email", { ref, email, answers, other }, { keepalive: true }).catch(() => {}));
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
