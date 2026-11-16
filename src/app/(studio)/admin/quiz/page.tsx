"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { QuizOption, QuizQuestion } from "@/content/site";
import { randomAnswers } from "@/lib/quiz/analyze";
import { runBackup } from "@/lib/quiz/backup";
import type { QuizAnswers } from "@/lib/quiz/types";
import { checkpoint, setDraft } from "@/studio/store";
import type { Path } from "@/lib/path";
import { AreaField, CheckField, NumField, TextField } from "@/studio/Field";
import { SortableList } from "@/studio/Sortable";
import { useDraft, useField, useQuizResults } from "@/studio/state";
import { Box, Button, PageHeader, Row, Tabs, relativeTime, useNow } from "@/studio/ui";
import { BarList, StatTile, type BarItem } from "@/studio/charts";

const FIT_LABEL = { best: "Best fit", also: "Also useful", consider: "Worth considering" } as const;

const TABS = [
  ["build", "Build"],
  ["test", "Test"],
  ["knowledge", "Knowledge"],
  ["ai", "AI"],
  ["result", "Result"],
  ["insights", "Insights"],
] as const;
type Tab = (typeof TABS)[number][0];

function OptionEditor({ qi, oi, o }: { qi: number; oi: number; o: QuizOption }) {
  const draft = useDraft();
  const services = draft.site.services;
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
      <label className="mt-2.5 block">
        <span className="st-label">Points to</span>
        <select
          className="st-field mt-1.5"
          value={o.pointsTo ?? ""}
          onChange={(e) => {
            checkpoint();
            setDraft(["site", "quiz", "questions", qi, "options", oi, "pointsTo"] as Path, e.target.value || null);
          }}
        >
          <option value="">— none —</option>
          {services.map((s) => (
            <option key={s.slug} value={s.icon}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
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
      <Row>
        <CheckField path={["site", "quiz", "questions", qi, "allowOther"]} label="Allow &quot;Other&quot; — a free-text answer" />
        <TextField path={["site", "quiz", "questions", qi, "otherPlaceholder"]} label="Other — placeholder text" placeholder="Optional" />
      </Row>

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
            setDraft(["site", "quiz", "questions", qi, "options"] as Path, [...q.options, { id, label: "New answer" }]);
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
            { id: `q${Date.now().toString(36)}`, label: `Question ${n}`, q: "New question", multi: false, options: [{ id: `a${Date.now().toString(36)}1`, label: "Answer 1" }, { id: `a${Date.now().toString(36)}2`, label: "Answer 2" }] },
          ]);
        }}
      >
        + Add a question
      </Button>
    </>
  );
}

function TestTab() {
  const draft = useDraft();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const result = useMemo(() => runBackup(draft.site, answers, {}), [draft.site, answers]);
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
      <Box title="What the visitor would see" help="This is the no-AI backup result — the AI tab will show the real AI result side by side with this, once it's connected.">
        {!answered || !result ? (
          <p className="text-[13px] text-st-sub">{!result ? "No answer points anywhere yet — add a \"Points to\" on the Build tab first." : "Pick some answers to see the recommendation."}</p>
        ) : (
          <>
            <p className="text-[13.5px] text-st-ink">{result.wants}</p>
            {result.highlights.length > 0 && (
              <p className="flex flex-wrap gap-1">
                {result.highlights.map((h) => (
                  <span key={h} className="rounded-full border border-st-purple/30 bg-st-purple/10 px-2 py-0.5 text-[11px] font-medium text-st-ink">
                    {h}
                  </span>
                ))}
              </p>
            )}
            <ol className="grid gap-2">
              {result.matches.map((m) => {
                const s = draft.site.services.find((sv) => sv.slug === m.slug);
                return (
                  <li key={m.slug} className="rounded-lg bg-st-panel-2 p-2.5 text-[12.5px]">
                    <strong className="text-st-ink">
                      {s?.title ?? m.slug} — {FIT_LABEL[m.fit]}
                    </strong>
                    <p className="mt-0.5 text-st-sub">{m.how}</p>
                    {!!s?.tags.length && (
                      <p className="mt-1.5 flex flex-wrap gap-1">
                        {s.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-st-border-strong px-2 py-0.5 text-[10.5px] text-st-dim">
                            {tag}
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </Box>
    </div>
  );
}

function KnowledgeTab() {
  return (
    <Box title="Knowledge base" help="Entries an AI result is grounded in — one per service, plus pricing/FAQ/case notes.">
      <p className="text-[13px] text-st-sub">Needs the real backend (Supabase) merged in first — coming in the next phase of this build.</p>
    </Box>
  );
}

function AiTab() {
  return (
    <Box title="AI providers &amp; keys" help="Groq (primary) and Gemini (fallback), with as many keys per provider as you like — the server rotates between them.">
      <p className="text-[13px] text-st-sub">Needs the real backend (Supabase) merged in first — coming in the next phase of this build.</p>
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
  const items: BarItem[] = ranked.slice(0, 9).map(([title, n]) => ({ key: title, label: title, value: n }));
  return (
    <>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <StatTile label="Finished, all time" value={results.length} delta={null} compareLabel="" spark={[]} color="var(--st-series-quiz)" />
        <StatTile label="Finished, 7 days" value={week.length} delta={null} compareLabel="" spark={[]} color="var(--st-series-quiz)" />
        <StatTile label="Followed through" value={actions.whatsapp + actions.email} delta={null} compareLabel="" spark={[]} color="var(--st-series-quiz)" />
      </div>
      <Box title="Most recommended">{ranked.length === 0 ? <p className="text-[13px] text-st-sub">No quizzes finished yet.</p> : <BarList items={items} color="var(--st-series-quiz)" />}</Box>
      <Box title="Recent results">
        <div className="grid gap-1.5">
          {results.slice(0, 8).map((r) => (
            <Link key={r.id} href={`/admin/inbox?tab=quiz&id=${r.id}`} className="flex items-center justify-between rounded-lg bg-st-panel-2 px-3 py-2 text-[12.5px] transition-colors hover:bg-st-panel-3">
              <span className="text-st-ink">{r.top}</span> <span className="text-st-dim">{relativeTime(r.createdAt)}</span>
            </Link>
          ))}
        </div>
      </Box>
    </>
  );
}

export default function QuizLabPage() {
  const [tab, setTab] = useState<Tab>("build");
  return (
    <div className="grid gap-5">
      <PageHeader title="Quiz" description="The 9 Quiz — questions, what each answer points to, the AI/backup result and what visitors chose." />
      <Tabs layoutId="quiz-tabs" active={tab} onChange={setTab} tabs={TABS.map(([id, label]) => ({ id, label }))} />
      <div className="grid gap-4">
        {tab === "build" && <BuildTab />}
        {tab === "test" && <TestTab />}
        {tab === "knowledge" && <KnowledgeTab />}
        {tab === "ai" && <AiTab />}
        {tab === "result" && <ResultTab />}
        {tab === "insights" && <InsightsTab />}
      </div>
    </div>
  );
}
