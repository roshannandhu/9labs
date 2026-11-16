import { waLink, type SiteData } from "@/content/site";
import { esc, mailLayout, paragraphs } from "@/lib/mail";
import type { QuizResult } from "./score";

export function buildQuizPlanMail(site: SiteData, result: QuizResult) {
  const t = site.quiz.result;
  const chat = waLink(site.contact.whatsappNumber, result.whatsappText);
  const matchesHtml = result.matches.map((m, i) => `<p style="margin:0 0 14px;line-height:1.55"><strong style="color:#0e0c20">${i + 1}. ${esc(m.service.title)} — ${m.score}%</strong><br>${esc(m.why)}</p>`).join("");
  const stepsHtml = result.steps.map((s, i) => `<p style="margin:0 0 12px;line-height:1.55"><strong style="color:#6f55e8">0${i + 1}</strong> <strong style="color:#0e0c20">${esc(s.title)}</strong><br>${esc(s.text)}</p>`).join("");
  return {
    subject: `${t.label} — ${site.name}`,
    html: mailLayout({ company: site.name, heading: t.heading, bodyHtml: paragraphs(result.summary) + matchesHtml + stepsHtml, button: { label: t.whatsappCta, url: chat }, footer: `You asked for this plan on ${site.url.replace(/^https?:\/\//, "")}.` }),
    text: [t.heading, result.summary, ...result.matches.map((m, i) => `${i + 1}. ${m.service.title} — ${m.score}%\n${m.why}`), ...result.steps.map((s, i) => `0${i + 1} ${s.title}\n${s.text}`), `${t.whatsappCta}: ${chat}`].join("\n\n"),
  };
}
