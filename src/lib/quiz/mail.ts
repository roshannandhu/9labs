import { waLink, type SiteData } from "@/content/site";
import { esc, mailLayout, paragraphs } from "@/lib/mail";
import { runBackup } from "./backup";
import type { AiQuizResult, QuizAnswers, QuizOther } from "./types";
import { buildQuizLines, buildQuizWhatsappText } from "./whatsapp";

const titleOf = (site: SiteData, slug: string) => site.services.find((s) => s.slug === slug)?.title ?? slug;

/** The lead-row text the Inbox lists (no percentages), plus the result itself — the one the AI chain
 *  produced when given, otherwise the built-in backup. */
export function quizLeadFields(site: SiteData, answers: QuizAnswers, other: QuizOther = {}, given?: { ai: AiQuizResult | null; source: AiQuizResult["source"] | "none" }) {
  const ai = given ? given.ai : runBackup(site, answers, other);
  const lines = buildQuizLines(site.quiz.questions, answers, other);
  return {
    ai,
    source: given ? given.source : ai ? ("backup" as const) : ("none" as const),
    top: ai?.matches[0] ? titleOf(site, ai.matches[0].slug) : "",
    matches: ai ? ai.matches.map((m, i) => `${i + 1}) ${titleOf(site, m.slug)}`).join(", ") : "",
    summary: ai ? [ai.wants, "", ...lines].join("\n") : "No recommendation available — no answer points anywhere yet.",
    lines,
  };
}

export function buildQuizPlanMail(site: SiteData, ai: AiQuizResult, lines: string[]) {
  const t = site.quiz.result;
  const chat = waLink(site.contact.whatsappNumber, buildQuizWhatsappText(site, lines, ai));
  const matchesHtml = ai.matches.map((m, i) => `<p style="margin:0 0 14px;line-height:1.55"><strong style="color:#0e0c20">${i + 1}. ${esc(titleOf(site, m.slug))}</strong><br>${esc(m.how)}</p>`).join("");
  const stepsHtml = ai.steps.map((s, i) => `<p style="margin:0 0 12px;line-height:1.55"><strong style="color:#6f55e8">0${i + 1}</strong> <strong style="color:#0e0c20">${esc(s.title)}</strong><br>${esc(s.text)}</p>`).join("");
  return {
    subject: `${t.label} — ${site.name}`,
    html: mailLayout({ company: site.name, heading: t.heading, bodyHtml: paragraphs(ai.wants) + matchesHtml + stepsHtml, button: { label: t.whatsappCta, url: chat }, footer: `You asked for this plan on ${site.url.replace(/^https?:\/\//, "")}.` }),
    text: [t.heading, ai.wants, ...ai.matches.map((m, i) => `${i + 1}. ${titleOf(site, m.slug)}\n${m.how}`), ...ai.steps.map((s, i) => `0${i + 1} ${s.title}\n${s.text}`), `${t.whatsappCta}: ${chat}`].join("\n\n"),
  };
}
