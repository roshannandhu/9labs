import { site, type IconKey, type QuizQuestion, type Service } from "@/content/site";

/** Chosen option ids per question id. */
export type QuizAnswers = Record<string, string[]>;

export type QuizMatch = { service: Service; score: number; why: string };
export type QuizResult = {
  summary: string;
  matches: QuizMatch[];
  steps: { title: string; text: string }[];
  whatsappText: string;
};

const questions = site.quiz.questions as QuizQuestion[];

const chosen = (q: QuizQuestion, a: QuizAnswers) => q.options.filter((o) => a[q.id]?.includes(o.id));

/**
 * The 9 Quiz, worked out in the browser (no AI, no API): every answer adds points to the
 * activities it points to; the three highest are suggested. "Why" quotes the visitor's own
 * answers that pushed each activity up, so the result always reads as theirs.
 */
export function scoreQuiz(a: QuizAnswers): QuizResult {
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
    .slice(0, 3);
  const top = Math.max(1, ranked[0]?.v ?? 1);

  const matches: QuizMatch[] = ranked.map(({ s, v }, i) => {
    const r = (reasons.get(s.icon) ?? []).sort((x, y) => y.w - x.w).slice(0, 2);
    const why = r.length
      ? `Because you said “${r.map((x) => x.label.toLowerCase()).join("” and “")}”. ${s.description}`
      : s.description;
    return { service: s, score: Math.max(55, Math.round(58 + 39 * (v / top)) - i * 2), why };
  });

  const who = chosen(questions[0], a)[0]?.label.toLowerCase() ?? "a business";
  const goal = chosen(questions[1], a)[0]?.label ?? "Growth";
  const when = chosen(questions[8], a)[0]?.label.toLowerCase() ?? "";
  const summary = `You're ${who}, and your main goal is “${goal}”. Here is where Nine Labs would start${when ? `, ${when}` : ""}.`;

  const [m1, m2, m3] = matches.map((m) => m.service);
  const steps = [
    { title: "A short discovery call", text: "We listen first: your goals, your customers and what has worked so far." },
    { title: `Start with ${m1?.short.toLowerCase() ?? "the right activity"}`, text: m1?.description ?? "" },
    {
      title: "Measure, then grow",
      text: `Add ${[m2?.short, m3?.short].filter(Boolean).join(" and ").toLowerCase() || "the next activity"} when the numbers say it's time. Clear monthly reporting.`,
    },
  ];

  const lines = questions
    .map((q) => {
      const c = chosen(q, a);
      return c.length ? `• ${q.label}: ${c.map((o) => o.label).join(", ")}` : null;
    })
    .filter(Boolean);
  const whatsappText = [
    "Hi Nine Labs! I took The 9 Quiz.",
    "",
    ...lines,
    "",
    `Suggested for us: ${matches.map((m, i) => `${i + 1}) ${m.service.title} (${m.score}%)`).join(", ")}`,
    "",
    "Can we talk?",
  ].join("\n");

  return { summary, matches, steps, whatsappText };
}
