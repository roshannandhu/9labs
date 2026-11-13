"use client";

import { useMemo, useState } from "react";
import type { IconKey, QuizOption, QuizQuestion } from "@/content/site";
import { balanceReport, maxReachable, randomAnswers, totalsFor, type BalanceReport } from "@/lib/quiz/analyze";
import { scoreQuiz, type QuizAnswers } from "@/lib/quiz/score";
import { checkpoint, setDraft } from "@/lib/store";
import type { Path } from "@/lib/path";
import { AreaField, CheckField, NumField, TextField } from "@/studio/Field";
import { SortableList } from "@/studio/Sortable";
import { useDraft, useField, useQuizResults } from "@/studio/state";
import { Box, Button, Pill, Row, relativeTime, useNow } from "@/studio/ui";

const ACTIVITIES: { key: IconKey; label: string }[] = [
  { key: "social", label: "Social" },
  { key: "advertising", label: "Ads" },
  { key: "content", label: "Content" },
  { key: "photo", label: "Photo" },
  { key: "events", label: "Events" },
  { key: "pr", label: "PR" },
  { key: "strategy", label: "Strategy" },
  { key: "ai", label: "AI" },
  { key: "it", label: "IT" },
];

const TABS = [
  ["build", "Build"],
  ["try", "Try it"],
  ["balance", "Balance"],
  ["result", "Result"],
  ["insights", "Insights"],
] as const;
type Tab = (typeof TABS)[number][0];

function PointCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const tone = value === 0 ? "transparent" : value === 1 ? "rgb(111 85 232 / .25)" : value === 2 ? "rgb(111 85 232 / .55)" : "rgb(111 85 232 / .9)";
  return (
    <button
      type="button"
      onClick={() => {
        checkpoint();
        onChange((value + 1) % 4);
      }}
      className="grid h-8 w-8 place-items-center rounded-lg border border-st-border-strong text-[12px] font-bold"
      style={{ background: tone, color: value >= 2 ? "#fff" : "var(--st-ink)" }}
      title={`${value} point${value === 1 ? "" : "s"} — click to change`}
    >
      {value}
    </button>
  );
}

function HeatOverview() {
  const draft = useDraft();
  const max = useMemo(() => maxReachable(draft.site), [draft.site]);
  const top = Math.max(1, ...Object.values(max));
  return (
    <div className="grid gap-1.5">
      {ACTIVITIES.map((a) => {
        const v = max[a.key] ?? 0;
        return (
          <div key={a.key} className="flex items-center gap-2.5">
            <span className="w-[62px] shrink-0 text-[12px] text-st-sub">{a.label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-st-panel-2">
              <span className="block h-full rounded-full" style={{ width: `${(v / top) * 100}%`, background: v === 0 ? "var(--st-danger)" : "var(--st-grad)" }} />
            </span>
            <span className="w-6 text-right text-[11px] text-st-dim">{v}</span>
          </div>
        );
      })}
    </div>
  );
}

function OptionEditor({ qi, oi, o }: { qi: number; oi: number; o: QuizOption }) {
  return (
    <div className="rounded-xl border border-st-border p-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TextField path={["site", "quiz", "questions", qi, "options", oi, "label"]} label="" placeholder="Answer" />
        </div>
        <label className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-st-sub" title="Choosing this clears the other answers (e.g. &quot;Nothing yet&quot;)">
          <input type="checkbox" checked={!!o.only} onChange={(e) => { checkpoint(); setDraft(["site", "quiz", "questions", qi, "options", oi, "only"] as Path, e.target.checked); }} className="h-3.5 w-3.5 accent-[var(--st-purple)]" />
          Stands alone
        </label>
      </div>
      <div className="mt-2.5 grid grid-cols-9 gap-1">
        {ACTIVITIES.map((a) => (
          <PointCell key={a.key} value={o.weights[a.key] ?? 0} onChange={(v) => setDraft(["site", "quiz", "questions", qi, "options", oi, "weights", a.key] as Path, v || undefined)} />
        ))}
      </div>
      <div className="mt-1 grid grid-cols-9 gap-1">
        {ACTIVITIES.map((a) => (
          <span key={a.key} className="text-center text-[9px] text-st-dim">
            {a.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RoleField({ qi }: { qi: number }) {
  const [role, setRole] = useField<QuizQuestion["role"]>(["site", "quiz", "questions", qi, "role"]);
  return (
    <label className="block">
      <span className="st-label">Used in the result sentence as</span>
      <select
        className="st-field mt-1.5"
        value={role ?? "none"}
        onChange={(e) => {
          checkpoint();
          const v = e.target.value;
          setRole(v === "none" ? undefined : (v as QuizQuestion["role"]));
        }}
      >
        <option value="none">— not used —</option>
        <option value="who">Who they are</option>
        <option value="goal">Their main goal</option>
        <option value="when">Their timing</option>
      </select>
    </label>
  );
}

function QuestionEditor({ qi, q }: { qi: number; q: QuizQuestion }) {
  return (
    <div className="grid gap-3.5">
      <AreaField path={["site", "quiz", "questions", qi, "q"]} label="Question" rows={2} />
      <Row>
        <TextField path={["site", "quiz", "questions", qi, "label"]} label="Short name" help="Used in the WhatsApp summary." />
        <RoleField qi={qi} />
        <CheckField path={["site", "quiz", "questions", qi, "multi"]} label="Several answers allowed" />
      </Row>
      <TextField path={["site", "quiz", "questions", qi, "hint"]} label="Hint under the question" placeholder="Optional" />

      <div className="grid gap-2">
        {q.options.map((o, oi) => (
          <OptionEditor key={o.id} qi={qi} oi={oi} o={o} />
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            checkpoint();
            const id = `${q.id}-${Date.now().toString(36)}`;
            setDraft(["site", "quiz", "questions", qi, "options"] as Path, [...q.options, { id, label: "New answer", weights: {} }]);
          }}
        >
          + Add an answer
        </Button>
      </div>
    </div>
  );
}

function BuildTab() {
  const draft = useDraft();
  const questions = draft.site.quiz.questions;
  return (
    <>
      <Box title="How the points work" help="Each answer gives points to activities (0–3, click a cell to change). The activities with the most points are recommended.">
        <HeatOverview />
      </Box>
      <SortableList
        items={questions}
        keyOf={(q) => q.id}
        minItems={1}
        onReorder={(next) => setDraft(["site", "quiz", "questions"] as Path, next)}
        onRemove={(i) => {
          if (questions.length <= 1) return;
          checkpoint();
          setDraft(["site", "quiz", "questions"] as Path, questions.filter((_, j) => j !== i));
        }}
        renderItem={(q, qi) => (
          <details>
            <summary className="cursor-pointer text-[13.5px] font-semibold text-st-ink">
              {qi + 1}. {q.q || "New question"} <span className="font-normal text-st-dim">— {q.options.length} answers</span>
            </summary>
            <div className="mt-3.5">
              <QuestionEditor qi={qi} q={q} />
            </div>
          </details>
        )}
      />
      <Button
        onClick={() => {
          checkpoint();
          const n = questions.length + 1;
          setDraft(["site", "quiz", "questions"] as Path, [
            ...questions,
            { id: `q${Date.now().toString(36)}`, label: `Question ${n}`, q: "New question", multi: false, options: [{ id: `a${Date.now().toString(36)}1`, label: "Answer 1", weights: {} }, { id: `a${Date.now().toString(36)}2`, label: "Answer 2", weights: {} }] },
          ]);
        }}
      >
        + Add a question
      </Button>
    </>
  );
}

function TryTab() {
  const draft = useDraft();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const result = useMemo(() => scoreQuiz(draft.site, answers), [draft.site, answers]);
  const totals = useMemo(() => totalsFor(draft.site, answers), [draft.site, answers]);
  const answered = Object.values(answers).some((a) => a.length);

  const pick = (q: QuizQuestion, id: string) =>
    setAnswers((a) => {
      const cur = a[q.id] ?? [];
      if (!q.multi) return { ...a, [q.id]: cur[0] === id ? [] : [id] };
      const only = new Set(q.options.filter((o) => o.only).map((o) => o.id));
      if (cur.includes(id)) return { ...a, [q.id]: cur.filter((x) => x !== id) };
      return { ...a, [q.id]: only.has(id) ? [id] : [...cur.filter((x) => !only.has(x)), id] };
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Box title="Answer as a visitor would" right={<Button onClick={() => setAnswers(randomAnswers(draft.site))}>Random visitor</Button>}>
        {draft.site.quiz.questions.map((q, i) => (
          <fieldset key={q.id} className="grid gap-1.5">
            <legend className="text-[13px] font-medium text-st-ink">
              {i + 1}. {q.q || "(no question text yet)"}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((o) => {
                const on = (answers[q.id] ?? []).includes(o.id);
                return (
                  <button key={o.id} type="button" onClick={() => pick(q, o.id)} className={`rounded-full border px-3 py-1.5 text-[12.5px] ${on ? "border-transparent bg-st-indigo text-white" : "border-st-border-strong text-st-sub"}`}>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        {answered && (
          <Button onClick={() => setAnswers({})} className="w-fit">
            Clear
          </Button>
        )}
      </Box>
      <div className="grid gap-4">
        <Box title="Live scoreboard">
          <div className="grid gap-1.5">
            {ACTIVITIES.map((a) => {
              const v = totals[a.key] ?? 0;
              const max = Math.max(1, ...Object.values(totals));
              return (
                <div key={a.key} className="flex items-center gap-2.5">
                  <span className="w-[62px] shrink-0 text-[12px] text-st-sub">{a.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-st-panel-2">
                    <span className="block h-full rounded-full bg-st-grad" style={{ width: `${(v / max) * 100}%`, background: "var(--st-grad)" }} />
                  </span>
                  <span className="w-6 text-right text-[11px] text-st-dim">{v}</span>
                </div>
              );
            })}
          </div>
        </Box>
        <Box title="What the visitor would see">
          {!answered ? (
            <p className="text-[13px] text-st-sub">Pick some answers to see the recommendation.</p>
          ) : (
            <>
              <p className="text-[13.5px] text-st-ink">{result.summary}</p>
              <ol className="grid gap-2">
                {result.matches.map((m) => (
                  <li key={m.service.slug} className="rounded-lg bg-st-panel-2 p-2.5 text-[12.5px]">
                    <strong className="text-st-ink">
                      {m.service.title} — {m.score}%
                    </strong>
                    <p className="mt-0.5 text-st-sub">{m.why}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Box>
      </div>
    </div>
  );
}

function BalanceTab() {
  const draft = useDraft();
  const [report, setReport] = useState<BalanceReport | null>(null);
  const [running, setRunning] = useState(false);
  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      setReport(balanceReport(draft.site, 2000));
      setRunning(false);
    }, 10);
  };
  return (
    <Box title="Fairness check" help="2,000 simulated random visitors — how often each activity comes first or is shown at all. A fairness check, not a forecast of real visitors.">
      <Button variant="primary" onClick={run} disabled={running} className="w-fit">
        {running ? "Running…" : "Run 2,000 simulated visitors"}
      </Button>
      {report && (
        <>
          {report.neverFirst.length > 0 && (
            <p className="rounded-xl border border-st-warn/30 bg-st-warn-bg p-3 text-[13px] text-st-warn">Never came first in this run: {report.neverFirst.map((k) => ACTIVITIES.find((a) => a.key === k)?.label).join(", ")}.</p>
          )}
          {report.tieAtTop > 0 && <p className="st-help">{report.tieAtTop} of {report.trials} visitors had a tie at the top — card order decided it.</p>}
          <div className="grid gap-1.5">
            {ACTIVITIES.map((a) => {
              const first = report.firstCount[a.key] ?? 0;
              const shown = report.shownCount[a.key] ?? 0;
              return (
                <div key={a.key} className="flex items-center gap-2.5">
                  <span className="w-[62px] shrink-0 text-[12px] text-st-sub">{a.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-st-panel-2">
                    <span className="block h-full rounded-full bg-st-grad" style={{ width: `${(shown / report.trials) * 100}%` }} />
                  </span>
                  <span className="w-28 text-right text-[11px] text-st-dim">
                    {first} first · {shown} shown
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Box>
  );
}

function ResultTab() {
  const draft = useDraft();
  const steps = draft.site.quiz.result.steps;
  return (
    <>
      <Box title="Result screen">
        <Row>
          <TextField path={["site", "quiz", "result", "label"]} label="Label" />
          <TextField path={["site", "quiz", "result", "heading"]} label="Heading" />
        </Row>
        <AreaField path={["site", "quiz", "result", "summary"]} label="Opening sentence" rows={2} help="{who} {goal} {when} are replaced." />
        <TextField path={["site", "quiz", "result", "why"]} label="“Why” line" help="{answers} becomes their own answers." />
        <NumField path={["site", "quiz", "result", "matches"]} label="How many activities to recommend" min={1} max={5} />
      </Box>
      <Box title="The three-step plan" help="{first} {firstDescription} {next} are replaced.">
        {steps.map((s, i) => (
          <div key={i} className="grid gap-2">
            <TextField path={["site", "quiz", "result", "steps", i, "title"]} label={`Step ${i + 1} title`} />
            <AreaField path={["site", "quiz", "result", "steps", i, "text"]} label={`Step ${i + 1} text`} rows={2} />
          </div>
        ))}
      </Box>
      <Box title="WhatsApp and e-mail">
        <Row>
          <TextField path={["site", "quiz", "result", "whatsappCta"]} label="WhatsApp button" />
          <TextField path={["site", "quiz", "result", "retake"]} label="Retake link" />
          <TextField path={["site", "quiz", "result", "ebooksCta"]} label="E-books link" />
        </Row>
        <Row>
          <TextField path={["site", "quiz", "result", "whatsappIntro"]} label="Message — first line" />
          <TextField path={["site", "quiz", "result", "whatsappOutro"]} label="Message — last line" />
        </Row>
        <CheckField path={["site", "quiz", "result", "emailEnabled"]} label="Offer “e-mail me this plan”" />
      </Box>
    </>
  );
}

function InsightsTab() {
  const results = useQuizResults();
  const weekAgo = useNow() - 7 * 86_400_000;
  const week = results.filter((r) => new Date(r.createdAt).getTime() > weekAgo);
  const tally = new Map<string, number>();
  for (const r of results) if (r.top) tally.set(r.top, (tally.get(r.top) ?? 0) + 1);
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const actions = { none: results.filter((r) => r.action === "none").length, whatsapp: results.filter((r) => r.action === "whatsapp").length, email: results.filter((r) => r.action === "email").length };
  return (
    <>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className="st-card p-4">
          <p className="font-digits text-[26px] font-black text-st-ink">{results.length}</p>
          <p className="st-help">Finished, all time</p>
        </div>
        <div className="st-card p-4">
          <p className="font-digits text-[26px] font-black text-st-ink">{week.length}</p>
          <p className="st-help">Finished, 7 days</p>
        </div>
        <div className="st-card p-4">
          <p className="font-digits text-[26px] font-black text-st-ink">{actions.whatsapp + actions.email}</p>
          <p className="st-help">Followed through</p>
        </div>
      </div>
      <Box title="Most recommended">
        {ranked.length === 0 && <p className="text-[13px] text-st-sub">No quizzes finished yet.</p>}
        <div className="grid gap-1.5">
          {ranked.slice(0, 9).map(([title, n]) => (
            <div key={title} className="flex items-center justify-between text-[13px]">
              <span className="text-st-ink">{title}</span>
              <Pill>{n}</Pill>
            </div>
          ))}
        </div>
      </Box>
      <Box title="Recent results">
        <div className="grid gap-1.5">
          {results.slice(0, 8).map((r) => (
            <div key={r.id} className="rounded-lg bg-st-panel-2 px-3 py-2 text-[12.5px]">
              <span className="text-st-ink">{r.top}</span> <span className="text-st-dim">· {relativeTime(r.createdAt)}</span>
            </div>
          ))}
        </div>
      </Box>
    </>
  );
}

export default function QuizLabPage() {
  const [tab, setTab] = useState<Tab>("build");
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-[22px] font-semibold text-st-ink">Quiz Lab</h1>
      <nav className="flex flex-wrap gap-1.5 border-b border-st-border pb-3">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${tab === id ? "bg-st-indigo text-white" : "text-st-sub hover:text-st-ink"}`}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "build" && <BuildTab />}
      {tab === "try" && <TryTab />}
      {tab === "balance" && <BalanceTab />}
      {tab === "result" && <ResultTab />}
      {tab === "insights" && <InsightsTab />}
    </div>
  );
}
