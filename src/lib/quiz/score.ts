import { fill, type IconKey, type QuizQuestion, type Service } from "@/content/site";
import type { SiteData } from "@/content/types";

/** Chosen option ids per question id. */
export type QuizAnswers = Record<string, string[]>;

export type QuizMatch = { service: Service; score: number; why: string };
export type QuizResult = {
  summary: string;
  matches: QuizMatch[];
  steps: { title: string; text: string }[];
  whatsappText: string;
  /** "Question: answer, answer" lines — the same list the WhatsApp message and the admin show. */
  lines: string[];
};

type QuizSite = Pick<SiteData, "services" | "quiz">;

const chosen = (q: QuizQuestion | undefined, a: QuizAnswers) => (q ? q.options.filter((o) => a[q.id]?.includes(o.id)) : []);

/**
 * The 9 Quiz, worked out without AI or an API: every answer adds points to the activities it
 * points to; the highest are suggested. "Why" quotes the visitor's own answers that pushed each
 * activity up, so the result always reads as theirs. Questions, points and every sentence come
 * from the admin (Quiz → Quiz settings); this same function runs on the site, in the admin's
 * simulator and on the server when a result is saved.
 */
export function scoreQuiz(site: QuizSite, a: QuizAnswers): QuizResult {
  const { questions, result: r } = site.quiz;
  const totals = new Map<IconKey, number>();
  const reasons = new Map<IconKey, { label: string; w: number }[]>();
  for (const q of questions) {
    for (const o of chosen(q, a)) {
      for (const [k, w] of Object.entries(o.weights) as [IconKey, number][]) {
        totals.set(k, (totals.get(k) ?? 0) + w);
        reasons.set(k, [...(reasons.get(k) ?? []), { label: o.label, w }]);
      }
    }
  }

  const ranked = site.services
    .map((s) => ({ s, v: totals.get(s.icon) ?? 0 }))
    .sort((x, y) => y.v - x.v || x.s.n - y.s.n)
    .slice(0, Math.min(5, Math.max(1, r.matches || 3)));
  const top = Math.max(1, ranked[0]?.v ?? 1);

  const matches: QuizMatch[] = ranked.map(({ s, v }, i) => {
    const said = (reasons.get(s.icon) ?? []).sort((x, y) => y.w - x.w).slice(0, 2);
    const because = said.length && r.why ? `${fill(r.why, { answers: said.map((x) => x.label.toLowerCase()).join("” and “") })} ` : "";
    return { service: s, score: Math.max(55, Math.round(58 + 39 * (v / top)) - i * 2), why: `${because}${s.description}` };
  });

  // the opening sentence is built from the questions the admin marked as "who", "goal" and "timing"
  const byRole = (role: QuizQuestion["role"]) => chosen(questions.find((q) => q.role === role), a)[0]?.label;
  const when = byRole("when");
  const summary = fill(r.summary, {
    who: byRole("who")?.toLowerCase() ?? "a business",
    goal: byRole("goal") ?? "Growth",
    when: when ? `, ${when.toLowerCase()}` : "",
  });

  const [m1, ...rest] = matches.map((m) => m.service);
  const vars = {
    first: m1?.short.toLowerCase() ?? "the right activity",
    firstDescription: m1?.description ?? "",
    next: rest.map((s) => s.short.toLowerCase()).join(" and ") || "the next activity",
  };
  const steps = r.steps.map((s) => ({ title: fill(s.title, vars), text: fill(s.text, vars) }));

  const lines = questions
    .map((q) => {
      const c = chosen(q, a);
      return c.length ? `${q.label}: ${c.map((o) => o.label).join(", ")}` : null;
    })
    .filter((l): l is string => l !== null);
  const whatsappText = [
    r.whatsappIntro,
    "",
    ...lines.map((l) => `• ${l}`),
    "",
    `Suggested for us: ${matches.map((m, i) => `${i + 1}) ${m.service.title} (${m.score}%)`).join(", ")}`,
    "",
    r.whatsappOutro,
  ]
    .join("\n")
    .trim();

  return { summary, matches, steps, whatsappText, lines };
}
