import type { Ebook } from "@/content/site";
import type { Workspace } from "@/content/types";
import type { Path } from "./path";

export type Issue = { path: Path; message: string; level: "error" | "warning" };

const ACTIVITY_LABELS: Record<string, string> = {
  social: "Social media",
  advertising: "Advertising",
  content: "Content & creative",
  photo: "Photo & filming",
  events: "Events",
  pr: "PR & comms",
  strategy: "Strategy",
  ai: "AI consultancy",
  it: "IT consultancy",
};

function checkQuiz(ws: Workspace): Issue[] {
  const out: Issue[] = [];
  const qs = ws.site.quiz.questions;
  if (!qs.length) {
    out.push({ path: ["site", "quiz", "questions"], message: "Add at least one quiz question.", level: "error" });
    return out;
  }
  const reachable = new Set<string>();
  qs.forEach((q, qi) => {
    if (q.options.length < 2) out.push({ path: ["site", "quiz", "questions", qi], message: `"${q.q || `Question ${qi + 1}`}" needs at least two answers.`, level: "error" });
    for (const o of q.options) for (const [k, v] of Object.entries(o.weights)) if ((v ?? 0) > 0) reachable.add(k);
  });
  for (const [key, label] of Object.entries(ACTIVITY_LABELS)) {
    if (!reachable.has(key)) out.push({ path: ["site", "quiz", "questions"], message: `No answer gives points to ${label} — it could never be recommended.`, level: "error" });
  }
  const roles = qs.filter((q) => q.role).map((q) => q.role);
  if (new Set(roles).size !== roles.length) out.push({ path: ["site", "quiz", "questions"], message: "Only one question should be marked for each part of the result sentence (who / goal / timing).", level: "warning" });
  return out;
}

function checkCompany(ws: Workspace): Issue[] {
  const out: Issue[] = [];
  if (!/^\d{8,15}$/.test(ws.site.contact.whatsappNumber)) {
    out.push({ path: ["site", "contact", "whatsappNumber"], message: "Add a WhatsApp number in Company details — every Talk-to-us and quiz message needs one.", level: "error" });
  }
  if (!ws.site.contact.email.trim()) out.push({ path: ["site", "contact", "email"], message: "Add a company e-mail in Company details.", level: "warning" });
  return out;
}

function checkCards(ws: Workspace): Issue[] {
  return ws.site.services
    .filter((s) => !s.title.trim())
    .map((s): Issue => ({ path: ["site", "services", s.n - 1, "title"], message: `Card ${s.n} needs a title.`, level: "error" }));
}

function checkBooks(ws: Workspace): Issue[] {
  const out: Issue[] = [];
  const enabled = ws.site.ebooks.filter((b: Ebook) => b.enabled);
  if (!enabled.length) out.push({ path: ["site", "ebooks"], message: "No books are shown on the website — switch at least one on, or turn the e-books section off.", level: "warning" });
  for (const b of enabled) {
    if (!b.pdfFileId) out.push({ path: ["site", "ebooks"], message: `"${b.title}" has no PDF yet — requests for it will wait until one is uploaded.`, level: "warning" });
    if (!b.slug.trim()) out.push({ path: ["site", "ebooks"], message: `"${b.title}" needs a link name, or it won't be reachable on its own page.`, level: "error" });
  }
  const seen = new Set<string>();
  for (const b of ws.site.ebooks) {
    if (!b.slug.trim()) continue;
    if (seen.has(b.slug)) out.push({ path: ["site", "ebooks"], message: `Two books share the link name "${b.slug}" — give each book its own.`, level: "error" });
    seen.add(b.slug);
  }
  return out;
}

function checkPages(ws: Workspace): Issue[] {
  const out: Issue[] = [];
  const seen = new Set<string>();
  for (const p of ws.pages) {
    if (!p.slug.trim()) {
      out.push({ path: ["pages"], message: `"${p.title}" needs an address.`, level: "error" });
      continue;
    }
    if (seen.has(p.slug)) out.push({ path: ["pages"], message: `Two pages share the address "${p.slug}" — give each page its own.`, level: "error" });
    seen.add(p.slug);
  }
  return out;
}

/** Every issue across the workspace. Publish blocks on "error"; "warning" only shows as a checklist. */
export function checkWorkspace(ws: Workspace): Issue[] {
  return [...checkQuiz(ws), ...checkCompany(ws), ...checkCards(ws), ...checkBooks(ws), ...checkPages(ws)];
}

export const blockingIssues = (issues: Issue[]) => issues.filter((i) => i.level === "error");
