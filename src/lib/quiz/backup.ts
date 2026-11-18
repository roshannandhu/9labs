import { fill, type IconKey, type QuizQuestion, type Service } from "@/content/site";
import type { SiteData } from "@/content/types";
import type { AiQuizResult, QuizAnswerRow, QuizAnswers, QuizOther } from "./types";

type QuizSite = Pick<SiteData, "services" | "quiz">;

const chosen = (q: QuizQuestion | undefined, a: QuizAnswers) => (q ? q.options.filter((o) => a[q.id]?.includes(o.id)) : []);
const byRole = (questions: QuizQuestion[], role: QuizQuestion["role"], a: QuizAnswers) => chosen(questions.find((q) => q.role === role), a)[0]?.label;

/** `fit` by rank — no percentages, just "how sure are we." */
const FIT: AiQuizResult["matches"][number]["fit"][] = ["best", "also", "consider"];

/** 3-6 short phrases in the client's own words — a cheap, non-AI "representation" of what they
 *  said: the label of every answer that actually pointed somewhere, plus any typed "Other" text,
 *  in the order they answered, deduplicated, capped at 6. No LLM involved — this is quoting, not
 *  understanding, which is exactly why the real AI result (once built) can do better here: it can
 *  read meaning into the Other text instead of just echoing it verbatim. */
function highlightsFor(questions: QuizQuestion[], answers: QuizAnswers, other: QuizOther): string[] {
  const out: string[] = [];
  const add = (s: string | undefined) => {
    const t = s?.trim();
    if (t && !out.includes(t)) out.push(t);
  };
  for (const q of questions) {
    for (const o of chosen(q, answers)) if (o.pointsTo) add(o.label);
    add(other[q.id]);
  }
  return out.slice(0, 6);
}

const COMMON = new Set(["every", "night", "with", "that", "have", "this", "from", "into", "your", "they", "what", "when", "want", "need", "some", "more", "just", "like", "make", "would", "about", "there", "their", "will", "very", "much", "also"]);
const stems = (t: string) => new Set((t.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !COMMON.has(w)).map((w) => w.slice(0, 5)));

/** The service whose title/tags/needs share the most words with what they typed — a cheap,
 *  non-AI reading of "Other" text. ponytail: word-stem overlap, the AI does the real reading. */
export function guessService(services: Service[], typed: string, min = 1): Service | undefined {
  const words = stems(typed);
  let best: Service | undefined;
  let top = min - 1;
  for (const s of services) {
    let n = 0;
    for (const w of stems([s.title, s.short, s.description, ...s.tags, ...s.needs].join(" "))) if (words.has(w)) n++;
    if (n > top) [best, top] = [s, n];
  }
  return best;
}

/** One row per answered question: their pick(s) or own words → how we solve it. Option `solves`
 *  text first, else the service's description; typed-only answers are matched by `guessService`. */
export function answerRows(site: QuizSite, answers: QuizAnswers, other: QuizOther): QuizAnswerRow[] {
  const rows: QuizAnswerRow[] = [];
  for (const q of site.quiz.questions) {
    const picks = chosen(q, answers);
    const typed = other[q.id]?.trim() ?? "";
    if (!picks.length && !typed) continue;
    const lead = picks.find((o) => o.pointsTo) ?? picks[0];
    // typed words: first among the services this question is about, then a strong match anywhere,
    // else the question's own first service (an answer to "tech" is about tech)
    const own = site.services.filter((sv) => q.options.some((o) => o.pointsTo === sv.icon));
    const svc = lead?.pointsTo
      ? site.services.find((s) => s.icon === lead.pointsTo)
      : typed
        ? (guessService(own, typed) ?? guessService(site.services, typed, 2) ?? own[0])
        : undefined;
    // a pick that points nowhere ("No events planned") gives way to what they typed next to it
    const how = (lead?.pointsTo || !typed ? lead?.solves?.trim() : "") || svc?.description || "We'll take this into our first call and shape the plan around it.";
    rows.push({ q: q.id, said: [...picks.map((o) => o.label), ...(typed ? [`“${typed}”`] : [])].join(" · "), own: Boolean(typed) || undefined, how, slug: svc?.slug ?? null });
  }
  return rows;
}

/**
 * The quiz worked out without AI: every chosen option casts one vote for the activity it points
 * to (`pointsTo` — see migrate.ts), the most-voted win, ties break toward the lower service card
 * number (the same rule `scoreQuiz` used for weight totals). This is layer 3 of the AI chain's
 * fallback (docs/AI_RAG_SYSTEM.md §6) — a safety net, not the showpiece: `highlights` is quoted
 * verbatim (see `highlightsFor` above), not understood. "Other" text votes only through the
 * keyword guess in `answerRows` (one vote for the service it names, when there is one).
 *
 * Returns `null` only when no option anywhere in the quiz has a `pointsTo` — not just "nothing was
 * answered" — because that's the one case even a zero-vote ranking would be pure noise (layer 4,
 * the true last resort, per §6).
 */
export function runBackup(site: QuizSite, answers: QuizAnswers, other: QuizOther): AiQuizResult | null {
  const { questions, result: r } = site.quiz;
  const configured = questions.some((q) => q.options.some((o) => o.pointsTo));
  if (!configured) return null;

  const votes = new Map<IconKey, number>();
  const vote = (k: IconKey) => votes.set(k, (votes.get(k) ?? 0) + 1);
  for (const q of questions) {
    for (const o of chosen(q, answers)) if (o.pointsTo) vote(o.pointsTo);
  }
  const rows = answerRows(site, answers, other);
  for (const row of rows) {
    // typed words vote only where no pick already pointed somewhere (no double counting)
    const typedOnly = row.own && !chosen(questions.find((q) => q.id === row.q), answers).some((o) => o.pointsTo);
    const s = typedOnly && row.slug ? site.services.find((x) => x.slug === row.slug) : undefined;
    if (s) vote(s.icon);
  }

  const n = Math.min(5, Math.max(1, r.matches || 3));
  const ranked = site.services
    .map((s) => ({ s, v: votes.get(s.icon) ?? 0 }))
    .sort((x, y) => y.v - x.v || x.s.n - y.s.n)
    .filter((x, i) => i === 0 || x.v > 0) // never pad the list with services nothing pointed to
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
    highlights: highlightsFor(questions, answers, other),
    answers: rows,
    matches,
    steps,
    tags: { who: byRole(questions, "who", answers), goal: byRole(questions, "goal", answers), when },
    source: "backup",
  };
}
