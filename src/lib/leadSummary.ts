import type { BookRequest, Enquiry, QuizResult } from "@/content/types";

/**
 * One short line per lead for the admin inbox: who it is and what they want, from what they gave.
 * Same wording in the list (phone cards) and at the top of the detail panel.
 */
const who = (name: string, company: string) => [name.trim() || "Someone", company.trim() && `(${company.trim()})`].filter(Boolean).join(" ");
const list = (xs: string[]) => (xs.length <= 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

export function enquirySummary(e: Enquiry): string {
  const extras = [e.budget && `budget ${e.budget}`, e.timeline && `timeline ${e.timeline}`].filter(Boolean).join(", ");
  return `${who(e.name, e.company)} wants ${e.serviceTitle || "a service"}${e.needs.length ? ` — ${list(e.needs)}` : ""}${extras ? ` (${extras})` : ""}.`;
}

export function bookSummary(r: BookRequest, bookTitle: string): string {
  return `${who(r.name, r.company)} asked for the free e-book “${bookTitle}”.`;
}

export function quizSummary(r: QuizResult, serviceTitle: (slug: string) => string): string {
  const best = r.ai?.matches?.length ? list(r.ai.matches.filter((m) => m.fit === "best").map((m) => serviceTitle(m.slug))) : r.top;
  const wants = r.ai?.wants?.trim().replace(/\.$/, "");
  const next = r.action === "whatsapp" ? " Opened WhatsApp." : r.action === "email" ? " Asked for the plan by e-mail." : "";
  return `${who(r.name, "")} ${wants ? `wants ${wants.charAt(0).toLowerCase()}${wants.slice(1)}` : "finished The 9 Quiz"}${best ? ` — best fit: ${best}` : ""}.${next}`;
}
