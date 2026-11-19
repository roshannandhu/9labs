import { z } from "zod";
import type { SiteData } from "@/content/site";
import type { AiQuizResult, QuizAnswerRow, QuizAnswers, QuizOther, QuizSource, QuizVisual, QuizVisualItem } from "./types";

/**
 * The AI result contract (docs/AI_RAG_SYSTEM.md §5) and the checks every model reply must pass
 * before a visitor sees it. Anything that fails sends the chain to its next layer — a bad answer
 * is never "fixed up" into something the model didn't say, except harmless trimming.
 */
const text = (max: number) => z.string().trim().min(1).max(max);

/** The AI's diagram (types.ts `QuizVisual`). Checked on its own: a bad diagram is dropped, the rest of the reply stands. */
const visualItem = z.object({ label: text(240), note: z.string().trim().max(400).nullish(), slug: z.string().trim().max(80).nullish() });
const visualSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("flow"), title: text(140), before: z.array(visualItem).min(2).max(5), after: z.array(visualItem).min(2).max(5) }),
  z.object({ kind: z.literal("funnel"), title: text(140), stages: z.array(visualItem.extend({ leak: z.boolean().nullish() })).min(3).max(6) }),
  z.object({ kind: z.literal("roadmap"), title: text(140), steps: z.array(visualItem).min(2).max(5) }),
]);

const replySchema = z.object({
  wants: text(700),
  highlights: z.array(z.string().trim().max(120)).max(10).default([]),
  answers: z.array(z.object({ q: z.string().trim().max(40), slug: z.string().trim().max(80).nullish(), how: z.string().trim().max(400) })).max(40).default([]),
  matches: z
    .array(z.object({ slug: z.string().trim().min(1).max(80), fit: z.enum(["best", "also", "consider"]), how: text(500) }))
    .min(1)
    .max(9),
  steps: z.array(z.object({ title: text(90), text: text(320) })).min(3),
  tags: z.object({ goal: z.string().trim().max(60).optional(), who: z.string().trim().max(60).optional(), when: z.string().trim().max(60).optional() }).partial().default({}),
  visual: z.unknown().optional(),
});

export type ResultCheck = { ok: true; result: AiQuizResult } | { ok: false; reason: "bad" | "blocked"; detail: string };

export type ResultRules = {
  /** Published service slugs — the only ones a match may name. */
  slugs: string[];
  allowPrices: boolean;
  /** Answer labels + "Other" text — highlights must be quoted from these. */
  sourceTexts: string[];
  /** The scoring rows (backup.ts `answerRows`): the AI may rewrite each `how`, never `said`; any
   *  question it skips keeps its scoring row. */
  rows: QuizAnswerRow[];
  /** How many services to show (admin: result.matches, 1–5). */
  maxMatches: number;
};

/** Money, or a promised date/deadline/guarantee. The model is told never to say these unless allowed. */
const PRICE = /(?:\b(?:aed|usd|eur|gbp|inr|dhs?|dirhams?|dollars?|euros?|rupees?)\b|[$€£₹]\s?\d|\b(?:costs?|priced?|pricing|fee|fees)\s+(?:of\s+|from\s+|at\s+|is\s+)?\d)/i;
const PROMISE = /\b(?:within|in(?:\s+just)?|under)\s+\d+\s*(?:hours?|days?|weeks?|months?)\b|\bguarantee(?:d|s)?\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/i;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

const clean = (s: string) => s.replace(CONTROL, "").replace(/\s+/g, " ").trim();
const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, s.lastIndexOf(" ", max - 1) > max * 0.6 ? s.lastIndexOf(" ", max - 1) : max - 1).trimEnd()}…`);

/** Pulls the JSON object out of a reply, tolerating ```json fences or a sentence around it. */
export function extractJson(reply: string): unknown {
  const s = reply.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(s);
  } catch {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(s.slice(a, b + 1));
    throw new Error("no JSON object");
  }
}

/** Some models split one step into `{"title"}` + `{"text"}` — join such halves back together. */
function mendSteps(raw: unknown): unknown {
  const r = raw as { steps?: unknown };
  if (!r || !Array.isArray(r.steps)) return raw;
  const out: Record<string, unknown>[] = [];
  for (const s of r.steps as Record<string, unknown>[]) {
    const prev = out.at(-1);
    if (prev && prev.title && !prev.text && s && !s.title && s.text) prev.text = s.text;
    else out.push({ ...s });
  }
  return { ...r, steps: out };
}

/**
 * The model's diagram, tidied: short labels, real service slugs only (others → no icon), a funnel
 * must show at least one leak, and nothing may mention a price or promise. Anything off → null, and
 * the overlay simply shows the per-answer map without it.
 */
function checkVisual(raw: unknown, known: Set<string>, allowPrices: boolean): QuizVisual | null {
  const p = visualSchema.safeParse(raw);
  if (!p.success) return null;
  const v = p.data;
  const item = (x: z.infer<typeof visualItem>): QuizVisualItem => ({
    label: clip(clean(x.label), 40),
    ...(x.note && clean(x.note) ? { note: clip(clean(x.note), 90) } : {}),
    slug: x.slug && known.has(x.slug) ? x.slug : null,
  });
  const title = clip(clean(v.title), 80);
  let out: QuizVisual;
  if (v.kind === "flow") out = { kind: "flow", title, before: v.before.slice(0, 4).map(item), after: v.after.slice(0, 4).map(item) };
  else if (v.kind === "funnel") {
    out = { kind: "funnel", title, stages: v.stages.slice(0, 5).map((x) => ({ ...item(x), leak: !!x.leak })) };
    if (!out.stages.some((x) => x.leak)) return null;
  } else out = { kind: "roadmap", title, steps: v.steps.slice(0, 4).map(item) };
  const items = out.kind === "flow" ? [...out.before, ...out.after] : out.kind === "funnel" ? out.stages : out.steps;
  const words = [out.title, ...items.flatMap((x) => [x.label, x.note ?? ""])].join(" ");
  if (!allowPrices && (PRICE.test(words) || PROMISE.test(words))) return null;
  return out;
}

export function checkAiReply(reply: string, rules: ResultRules, source: QuizSource): ResultCheck {
  let raw: unknown;
  try {
    raw = extractJson(reply);
  } catch {
    return { ok: false, reason: "bad", detail: "not JSON" };
  }
  const parsed = replySchema.safeParse(mendSteps(raw));
  if (!parsed.success) return { ok: false, reason: "bad", detail: `shape: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}` };
  const r = parsed.data;

  const known = new Set(rules.slugs);
  const seen = new Set<string>();
  const matches: AiQuizResult["matches"] = [];
  for (const m of r.matches) {
    if (!known.has(m.slug)) return { ok: false, reason: "bad", detail: `unknown service "${m.slug}"` };
    if (seen.has(m.slug)) continue;
    seen.add(m.slug);
    matches.push({ slug: m.slug, fit: matches.length === 0 ? "best" : m.fit === "best" ? "also" : m.fit, how: clip(clean(m.how), 280) });
  }
  const result: AiQuizResult = {
    wants: clip(clean(r.wants), 600),
    highlights: [],
    answers: rules.rows.map((row) => {
      const a = r.answers.find((x) => x.q === row.q && x.how);
      // a row that breaks the price/promise rule keeps its scoring text — the rest of the reply stands
      if (!a || (!rules.allowPrices && (PRICE.test(a.how) || PROMISE.test(a.how)))) return row;
      const slug = a.slug && known.has(a.slug) ? a.slug : row.slug;
      return { ...row, slug, how: clip(clean(a.how), 220) };
    }),
    matches: matches.slice(0, Math.max(1, Math.min(5, rules.maxMatches || 3))),
    steps: r.steps.slice(0, 3).map((s) => ({ title: clip(clean(s.title), 80), text: clip(clean(s.text), 280) })),
    tags: Object.fromEntries(Object.entries(r.tags).filter(([, v]) => v).map(([k, v]) => [k, clean(v as string)])),
    source,
    visual: checkVisual(r.visual, known, rules.allowPrices),
  };

  if (!rules.allowPrices) {
    const all = [result.wants, ...result.matches.map((m) => m.how), ...result.steps.flatMap((s) => [s.title, s.text])].join("\n");
    if (PRICE.test(all)) return { ok: false, reason: "blocked", detail: "mentions a price" };
    if (PROMISE.test(all)) return { ok: false, reason: "blocked", detail: "promises a date or guarantee" };
  }

  // highlights must really be the client's words — anything the model invented is dropped, not shown
  const hay = rules.sourceTexts.map((t) => t.toLowerCase()).join("\n");
  const hs = new Set<string>();
  for (const h of r.highlights.map(clean)) if (h.length >= 2 && hay.includes(h.toLowerCase()) && hs.size < 6) hs.add(h);
  result.highlights = [...hs];

  return { ok: true, result };
}

/** Validates a stored/transported result (e.g. the overlay reading the API) — shape only, no model rules. */
export const aiQuizResultSchema = z.object({
  wants: z.string(),
  highlights: z.array(z.string()),
  // optional: results saved before per-answer rows existed
  answers: z.array(z.object({ q: z.string(), said: z.string(), own: z.boolean().optional(), how: z.string(), slug: z.string().nullable() })).default([]),
  matches: z.array(z.object({ slug: z.string(), fit: z.enum(["best", "also", "consider"]), how: z.string() })).min(1),
  steps: z.array(z.object({ title: z.string(), text: z.string() })),
  tags: z.object({ goal: z.string().optional(), who: z.string().optional(), when: z.string().optional() }),
  source: z.enum(["groq", "gemini", "backup"]),
  // optional, and a damaged one never sinks the whole result
  visual: visualSchema.nullable().optional().catch(null),
});

/**
 * What a visitor sent, reduced to what the quiz actually asks: unknown question/option ids are
 * dropped, single-answer questions keep one pick, and "Other" text is kept only where the question
 * allows it — control characters stripped, capped at `quiz.ai.maxOtherChars`.
 */
export function cleanQuizInput(site: Pick<SiteData, "quiz">, answers: QuizAnswers, other: QuizOther): { answers: QuizAnswers; other: QuizOther } {
  const max = Math.max(20, Math.min(2000, site.quiz.ai.maxOtherChars || 300));
  const a: QuizAnswers = {};
  const o: QuizOther = {};
  for (const q of site.quiz.questions) {
    const ids = new Set(q.options.map((x) => x.id));
    const picked = [...new Set((answers[q.id] ?? []).filter((id) => ids.has(id)))];
    if (picked.length) a[q.id] = q.multi ? picked : picked.slice(0, 1);
    const typed = q.allowOther ? clean(other[q.id] ?? "").slice(0, max) : "";
    if (typed) o[q.id] = typed;
  }
  return { answers: a, other: o };
}

/** Loose phone check for the WhatsApp form: optional leading +, then 7–15 digits once spaces, dashes,
 *  dots and brackets are dropped. Returns the tidied number, or null. */
export function cleanPhone(raw: string): string | null {
  const s = raw.trim().replace(/[\s().-]/g, "");
  return /^\+?\d{7,15}$/.test(s) ? s : null;
}
