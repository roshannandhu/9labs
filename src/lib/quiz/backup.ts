import { fill, type QuizOption, type QuizQuestion, type Service } from "@/content/site";
import type { SiteData } from "@/content/types";
import type { AiQuizResult, QuizAnswerRow, QuizAnswers, QuizOther } from "./types";

type QuizSite = Pick<SiteData, "services" | "quiz">;

const chosen = (q: QuizQuestion | undefined, a: QuizAnswers) => (q ? q.options.filter((o) => a[q.id]?.includes(o.id)) : []);
const byRole = (questions: QuizQuestion[], role: QuizQuestion["role"], a: QuizAnswers) => chosen(questions.find((q) => q.role === role), a)[0]?.label;

/** `fit` by rank — no percentages, just "how sure are we." */
const FIT: AiQuizResult["matches"][number]["fit"][] = ["best", "also", "consider"];

/* ─────────────────────────── the offline matcher (pure JS, no AI) ───────────────────────────
 * When the AI is off or unreachable, services are picked by keyword overlap — no admin ever maps
 * an answer to a service by hand (that was the old `pointsTo` vote, now gone). Each answer's text
 * (the option label, its optional "what we say" line, and any typed words) is matched against each
 * service's own words (title, short, description, tags, needs). A vague or typed-only answer that
 * matches nothing specific falls back to its QUESTION's words — the question + all its answers —
 * so "when" questions point nowhere and a typed "we copy orders by hand" still lands on AI/IT via
 * the tech question it sits under. This is a safety net, not the showpiece (docs/AI_RAG_SYSTEM.md §6).
 */

// Short filler words that carry no service meaning; dropped before matching.
const STOP = new Set([
  "the", "and", "for", "you", "our", "are", "was", "who", "why", "how", "now", "get", "got", "let", "use", "set", "per", "via", "out", "off", "all", "any", "can", "may", "not", "but", "its", "has", "had", "did", "new", "one", "two", "way", "too", "yet", "own", "see", "say", "put", "top", "few", "lot", "bit", "far", "big", "end", "day", "yes",
  "every", "night", "with", "that", "have", "this", "from", "into", "your", "they", "what", "when", "want", "need", "some", "more", "just", "like", "make", "much", "also", "will", "very", "them", "then", "than", "well", "been", "were", "here", "over", "most", "even", "such", "only", "both", "each",
  "would", "about", "there", "their", "which", "these", "those", "where", "while", "could", "should", "right", "still", "thing", "being",
]);
// Two-letter words worth keeping because they name a service domain ("it" dropped — collides with the pronoun).
const KEEP2 = new Set(["ai", "pr"]);

/** The meaningful word-stems in a blob of text (first 5 letters of each 3+ letter word, fillers removed). */
function terms(text: string): Set<string> {
  const out = new Set<string>();
  for (const w of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (KEEP2.has(w)) out.add(w);
    else if (w.length >= 3 && !STOP.has(w)) out.add(w.slice(0, 5));
  }
  return out;
}

// Each service's word-set, built once (services are stable objects for the life of a render).
const profileCache = new WeakMap<Service, Set<string>>();
const profileOf = (s: Service): Set<string> => {
  let p = profileCache.get(s);
  if (!p) profileCache.set(s, (p = terms([s.title, s.short, s.description, ...s.tags, ...s.needs].join(" "))));
  return p;
};

const overlap = (words: Set<string>, profile: Set<string>): number => {
  let n = 0;
  for (const w of words) if (profile.has(w)) n++;
  return n;
};

/** How well a blob of text fits each service, by shared words. Services with zero overlap are left out. */
export function scoreServices(text: string, services: Service[]): Map<string, number> {
  const t = terms(text);
  const out = new Map<string, number>();
  if (!t.size) return out;
  for (const s of services) {
    const n = overlap(t, profileOf(s));
    if (n > 0) out.set(s.slug, n);
  }
  return out;
}

/** One answer → service scores: the specific signal (picks + typed) if it matches anything, else the
 *  question's own words as a domain anchor (so a vague/typed-only answer still routes sensibly). */
function scoreAnswer(q: QuizQuestion, picks: QuizOption[], typed: string, services: Service[]): Map<string, number> {
  const specific = scoreServices([...picks.map((o) => o.label), ...picks.map((o) => o.solves ?? ""), typed].join(" "), services);
  if (specific.size) return specific;
  return scoreServices([q.q, q.label, ...q.options.flatMap((o) => [o.label, o.solves ?? ""])].join(" "), services);
}

/** The single best service for a score map (ties break toward the lower service card number). */
const topSlug = (scores: Map<string, number>, services: Service[]): string | null => {
  let best: Service | undefined;
  let top = 0;
  for (const s of services) {
    const v = scores.get(s.slug) ?? 0;
    if (v > top) [best, top] = [s, v];
  }
  return best?.slug ?? null;
};

/** 3-6 short phrases in the client's own words: every picked answer's label plus any typed text, in
 *  order, deduplicated, capped at 6. Quoting, not understanding — the AI result reads meaning instead. */
function highlightsFor(questions: QuizQuestion[], answers: QuizAnswers, other: QuizOther): string[] {
  const out: string[] = [];
  const add = (s: string | undefined) => {
    const t = s?.trim();
    if (t && !out.includes(t)) out.push(t);
  };
  for (const q of questions) {
    for (const o of chosen(q, answers)) add(o.label);
    add(other[q.id]);
  }
  return out.slice(0, 6);
}

/** One row per answered question: their pick(s)/own words → the service it fits and how we help. The
 *  "how" is the option's own "what we say" line when set, else the matched service's description. */
export function answerRows(site: QuizSite, answers: QuizAnswers, other: QuizOther): QuizAnswerRow[] {
  const rows: QuizAnswerRow[] = [];
  for (const q of site.quiz.questions) {
    const picks = chosen(q, answers);
    const typed = other[q.id]?.trim() ?? "";
    if (!picks.length && !typed) continue;
    const slug = topSlug(scoreAnswer(q, picks, typed, site.services), site.services);
    const svc = site.services.find((s) => s.slug === slug);
    const lead = picks[0];
    const how = lead?.solves?.trim() || svc?.description || "We'll take this into our first call and shape the plan around it.";
    rows.push({ q: q.id, said: [...picks.map((o) => o.label), ...(typed ? [`“${typed}”`] : [])].join(" · "), own: Boolean(typed) || undefined, how, slug });
  }
  return rows;
}

/**
 * The quiz worked out without AI (layer 3 of the chain, docs/AI_RAG_SYSTEM.md §6). Every answer is
 * matched to the services it fits by keyword overlap (`scoreAnswer`); the scores add up across the
 * quiz and the highest-scoring services win, ties breaking toward the lower service card number.
 * Pure JS, runs on the client too (the overlay's own fallback when the API call fails).
 *
 * Returns `null` only when NOTHING the visitor said matches any service at all — the one case a
 * ranking would be pure noise, so the overlay shows the "here's what you told us" screen instead
 * (layer 4, the true last resort).
 */
export function runBackup(site: QuizSite, answers: QuizAnswers, other: QuizOther): AiQuizResult | null {
  const { questions, result: r } = site.quiz;

  const tally = new Map<string, number>();
  for (const q of questions) {
    const picks = chosen(q, answers);
    const typed = other[q.id]?.trim() ?? "";
    if (!picks.length && !typed) continue;
    for (const [slug, n] of scoreAnswer(q, picks, typed, site.services)) tally.set(slug, (tally.get(slug) ?? 0) + n);
  }
  if (!tally.size) return null;

  const n = Math.min(5, Math.max(1, r.matches || 3));
  const ranked = site.services
    .map((s) => ({ s, v: tally.get(s.slug) ?? 0 }))
    .sort((x, y) => y.v - x.v || x.s.n - y.s.n)
    .filter((x) => x.v > 0) // never pad the list with services nothing matched
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
    answers: answerRows(site, answers, other),
    matches,
    steps,
    tags: { who: byRole(questions, "who", answers), goal: byRole(questions, "goal", answers), when },
    source: "backup",
  };
}
