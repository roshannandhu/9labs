"use client";

import { waLink } from "@/content/site";
import type { EnquiryFieldKey } from "@/content/types";
import { effectiveApproval, alertAdminNewRequest, deliverBookRequest } from "@/lib/ebooks/deliver";
import { buildEnquiryMessage, enquiryMissingFields, enquiryNameOk, enquiryWhatsappNumber, type EnquiryAnswers } from "@/lib/enquiry";
import { esc, mailLayout, paragraphs } from "@/lib/mail";
import { scoreQuiz, type QuizAnswers } from "@/lib/quiz/score";
import { addBookRequest, addEnquiry, addOutboxMail, addQuizResult, bumpEbookCounter, getState, updateBookRequest, updateQuizResult } from "@/lib/store";
import { shortRef } from "@/lib/text";

/** A hidden field a visitor never sees filled in, or a form sent faster than a person can type. */
export const looksAutomated = (trap: string, elapsedMs: number, minMs = 1200) => Boolean(trap.trim()) || (elapsedMs > 0 && elapsedMs < minMs);

/* ------------------------------------------------------------------ */
/*  Talk to us → WhatsApp                                            */
/* ------------------------------------------------------------------ */

export type EnquirySubmitResult = { ok: true; ref: string; message: string; number: string } | { ok: false; missing: ("name" | EnquiryFieldKey)[] };

/** Validates, saves the enquiry for the admin, and hands back the exact message and number to open. */
export function submitEnquiry(serviceSlug: string, answers: EnquiryAnswers, channel: "whatsapp" | "email"): EnquirySubmitResult {
  const { published } = getState();
  const svc = published.site.services.find((s) => s.slug === serviceSlug) ?? published.site.services[0];
  const missing: ("name" | EnquiryFieldKey)[] = [];
  if (!enquiryNameOk(answers)) missing.push("name");
  missing.push(...enquiryMissingFields(published.site, answers));
  if (missing.length) return { ok: false, missing };

  const ref = published.site.enquiry.refCode ? shortRef() : "";
  const message = buildEnquiryMessage(published.site, svc, answers, ref);
  const number = enquiryWhatsappNumber(published.site, svc);

  addEnquiry({
    ref,
    name: answers.name.trim(),
    company: answers.company.trim(),
    service: svc.slug,
    serviceTitle: svc.title,
    needs: answers.needs,
    budget: answers.budget,
    timeline: answers.timeline,
    message: answers.message.trim(),
    channel,
  });
  return { ok: true, ref, message, number };
}

/* ------------------------------------------------------------------ */
/*  The 9 Quiz                                                          */
/* ------------------------------------------------------------------ */

export function submitQuizResult(ref: string, answers: QuizAnswers) {
  const { published, quizResults } = getState();
  if (quizResults.some((r) => r.ref === ref)) return;
  const result = scoreQuiz(published.site, answers);
  addQuizResult({
    ref,
    top: result.matches[0]?.service.title ?? "",
    matches: result.matches.map((m) => `${m.service.short} ${m.score}%`).join(" · "),
    summary: [result.summary, "", ...result.lines].join("\n"),
    answers,
    action: "none",
    email: "",
  });
}

export function submitQuizAction(ref: string, action: "whatsapp") {
  const existing = getState().quizResults.find((r) => r.ref === ref);
  if (existing && existing.action !== "email") updateQuizResult(existing.id, { action });
}

export function submitQuizEmail(ref: string, email: string, answers: QuizAnswers): { ok: boolean; error?: string } {
  const { published, quizResults } = getState();
  if (!published.site.quiz.result.emailEnabled) return { ok: false, error: "Not available." };
  const dayAgo = Date.now() - 86_400_000;
  const recent = quizResults.filter((r) => r.email.toLowerCase() === email.toLowerCase() && new Date(r.createdAt).getTime() > dayAgo).length;
  if (recent >= 2) return { ok: true };

  const result = scoreQuiz(published.site, answers);
  const t = published.site.quiz.result;
  const chat = waLink(published.site.contact.whatsappNumber, result.whatsappText);
  const matchesHtml = result.matches.map((m, i) => `<p style="margin:0 0 14px;line-height:1.55"><strong style="color:#0e0c20">${i + 1}. ${esc(m.service.title)} — ${m.score}%</strong><br>${esc(m.why)}</p>`).join("");
  const stepsHtml = result.steps.map((s, i) => `<p style="margin:0 0 12px;line-height:1.55"><strong style="color:#6f55e8">0${i + 1}</strong> <strong style="color:#0e0c20">${esc(s.title)}</strong><br>${esc(s.text)}</p>`).join("");

  addOutboxMail({
    kind: "quiz-plan",
    to: email,
    subject: `${t.label} — ${published.site.name}`,
    html: mailLayout({ company: published.site.name, heading: t.heading, bodyHtml: paragraphs(result.summary) + matchesHtml + stepsHtml, button: { label: t.whatsappCta, url: chat }, footer: `You asked for this plan on ${published.site.url.replace(/^https?:\/\//, "")}.` }),
    text: [t.heading, result.summary, ...result.matches.map((m, i) => `${i + 1}. ${m.service.title} — ${m.score}%\n${m.why}`), ...result.steps.map((s, i) => `0${i + 1} ${s.title}\n${s.text}`), `${t.whatsappCta}: ${chat}`].join("\n\n"),
  });

  const existing = quizResults.find((r) => r.ref === ref);
  if (existing) updateQuizResult(existing.id, { email, action: "email" });
  else
    addQuizResult({
      ref,
      top: result.matches[0]?.service.title ?? "",
      matches: result.matches.map((m) => `${m.service.short} ${m.score}%`).join(" · "),
      summary: [result.summary, "", ...result.lines].join("\n"),
      answers,
      action: "email",
      email,
    });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Free e-books                                                        */
/* ------------------------------------------------------------------ */

export type EbookSubmitInput = { bookSlug: string; name: string; email: string; code: string; phone: string; company: string; consent: boolean; trap: string; elapsedMs: number; source: string };
export type EbookSubmitResult = { status: "sent" | "pending" | "error"; error?: string };

export async function submitEbookRequest(input: EbookSubmitInput): Promise<EbookSubmitResult> {
  if (looksAutomated(input.trap, input.elapsedMs)) return { status: "pending" };

  const { published, bookRequests } = getState();
  const book = published.site.ebooks.find((b) => b.slug === input.bookSlug && b.enabled);
  if (!book) return { status: "error", error: "This e-book is no longer available." };

  const digits = input.phone.replace(/\D/g, "");
  const phoneRequired = published.site.ebookForm.phoneRequired;
  if (phoneRequired || digits) {
    if (digits.length < 7 || digits.length > 14) return { status: "error", error: "Please enter a valid phone number." };
  }
  const phone = digits ? `${input.code} ${input.phone.trim()}`.trim() : "";

  const dayAgo = Date.now() - 86_400_000;
  const again = bookRequests.find((r) => r.email.toLowerCase() === input.email.toLowerCase() && r.bookSlug === book.slug && r.status !== "rejected" && new Date(r.createdAt).getTime() > dayAgo);
  if (again) {
    updateBookRequest(again.id, { name: input.name, phone: phone || again.phone, company: input.company || again.company });
    return { status: again.status === "sent" ? "sent" : "pending" };
  }

  const request = addBookRequest({
    name: input.name,
    email: input.email,
    phone,
    company: input.company,
    bookSlug: book.slug,
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
    source: input.source,
  });
  bumpEbookCounter(book.id, "requests", 1);

  const approval = effectiveApproval(book, published.delivery);
  if (approval === "auto") {
    const sent = await deliverBookRequest(request.id);
    alertAdminNewRequest(request, book.title, !sent.ok);
    return { status: sent.ok ? "sent" : "pending" };
  }
  alertAdminNewRequest(request, book.title, true);
  return { status: "pending" };
}
