import { fill, type IconKey, type QuizQuestion, type Service } from "@/content/site";
import type { SiteData } from "@/content/types";
import type { AiQuizResult, QuizAnswers, QuizOther } from "./types";

type QuizSite = Pick<SiteData, "services" | "quiz">;

const chosen = (q: QuizQuestion | undefined, a: QuizAnswers) => (q ? q.options.filter((o) => a[q.id]?.includes(o.id)) : []);
const byRole = (questions: QuizQuestion[], role: QuizQuestion["role"], a: QuizAnswers) => chosen(questions.find((q) => q.role === role), a)[0]?.label;

/** `fit` by rank — no percentages, just "how sure are we." */
const FIT: AiQuizResult["matches"][number]["fit"][] = ["best", "also", "consider"];

/**
 * The quiz worked out without AI: every chosen option casts one vote for the activity it points
 * to (`pointsTo` — see migrate.ts), the most-voted win, ties break toward the lower service card
 * number (the same rule `scoreQuiz` used for weight totals). This is layer 3 of the AI chain's
 * fallback (docs/AI_RAG_SYSTEM.md §6) — a safety net, not the showpiece, and it's intentionally
 * simpler than the AI result: no highlights, no quoted "why," just votes and the admin's own
 * summary/step templates. `other` (free-text "Other" answers) isn't read here — it carries no
 * `pointsTo` of its own, so it can't shift the vote; it still reaches the client/admin untouched,
 * via the WhatsApp lines (./whatsapp.ts) and the saved lead.
 *
 * Returns `null` only when no option anywhere in the quiz has a `pointsTo` — not just "nothing was
 * answered" — because that's the one case even a zero-vote ranking would be pure noise (layer 4,
 * the true last resort, per §6).
 */
export function runBackup(site: QuizSite, answers: QuizAnswers, other: QuizOther): AiQuizResult | null {
  void other; // accepted for the AI chain's shared call shape; nothing to vote with here (see above)
  const { questions, result: r } = site.quiz;
  const configured = questions.some((q) => q.options.some((o) => o.pointsTo));
  if (!configured) return null;

  const votes = new Map<IconKey, number>();
  for (const q of questions) {
    for (const o of chosen(q, answers)) {
      if (o.pointsTo) votes.set(o.pointsTo, (votes.get(o.pointsTo) ?? 0) + 1);
    }
  }

  const n = Math.min(3, Math.max(1, r.matches || 3));
  const ranked = site.services
    .map((s) => ({ s, v: votes.get(s.icon) ?? 0 }))
    .sort((x, y) => y.v - x.v || x.s.n - y.s.n)
    .slice(0, n);

  const matches = ranked.map(({ s }, i): AiQuizResult["matches"][number] => ({ slug: s.slug, fit: FIT[Math.min(i, FIT.length - 1)], how: s.description }));

  const when = byRole(questions, "when", answers);
  const wants = fill(r.summary, {
    who: byRole(questions, "who", answers)?.toLowerCase() ?? "a business",
    goal: byRole(questions, "goal", answers) ?? "Growth",
    when: when ? `, ${when.toLowerCase()}` : "",
  });

  const top: Service[] = ranked.map(({ s }) => s);
  const vars = {
    first: top[0]?.short.toLowerCase() ?? "the right activity",
    firstDescription: top[0]?.description ?? "",
    next: top.slice(1).map((s) => s.short.toLowerCase()).join(" and ") || "the next activity",
  };
  const steps = r.steps.map((s) => ({ title: fill(s.title, vars), text: fill(s.text, vars) }));

  return {
    wants,
    highlights: [],
    matches,
    steps,
    tags: { who: byRole(questions, "who", answers), goal: byRole(questions, "goal", answers), when },
    source: "backup",
  };
}
