"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { QuizOption, QuizQuestion, Service } from "@/content/site";
import { randomAnswers } from "@/lib/quiz/analyze";
import { runBackup } from "@/lib/quiz/backup";
import type { AiQuizResult, QuizAnswers, QuizOther } from "@/lib/quiz/types";
import { ApiError, api } from "@/studio/api";
import type { KbEntry, KbKind } from "@/server/ai/types";
import { checkpoint, setDraft } from "@/studio/store";
import type { Path } from "@/lib/path";
import { AreaField, CheckField, NumField, SelectField, TextField } from "@/studio/Field";
import { SortableList } from "@/studio/Sortable";
import { useDraft, useField, useQuizResults } from "@/studio/state";
import { Box, Button, PageHeader, Row, Segmented, Tabs, relativeTime, useNow } from "@/studio/ui";
import { BarList, StatTile, type BarItem } from "@/studio/charts";
import { AiHealthView, OUTCOME_LABEL } from "@/studio/AiHealth";

const FIT_LABEL = { best: "Best fit", also: "Also useful", consider: "Worth considering" } as const;

const TABS = [
  ["build", "Questions"],
  ["result", "Result page"],
  ["test", "Try it"],
  ["knowledge", "AI knowledge"],
  ["insights", "Insights"],
] as const;

/** Rarely needed settings, folded away so the everyday ones stay easy to see. */
function More({ children, label = "More options" }: { children: React.ReactNode; label?: string }) {
  return (
    <details className="group rounded-xl border border-dashed border-st-border">
      <summary className="cursor-pointer select-none px-3 py-2 text-[12.5px] font-medium text-st-sub hover:text-st-ink">{label}</summary>
      <div className="grid gap-3.5 px-3 pb-3 pt-1">{children}</div>
    </details>
  );
}
type Tab = (typeof TABS)[number][0];

function OptionEditor({ qi, oi, o, q }: { qi: number; oi: number; o: QuizOption; q: QuizQuestion }) {
  const draft = useDraft();
  const services = draft.site.services;
  const svc = services.find((s) => s.icon === o.pointsTo);
  return (
    <div className="grid gap-2.5 rounded-xl border border-st-border p-3">
      <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto] sm:items-end">
        <TextField path={["site", "quiz", "questions", qi, "options", oi, "label"]} label={`Answer ${oi + 1}`} placeholder="Answer" />
        <label className="block min-w-0">
          <span className="st-label">Solved by</span>
          <select
          className="st-field mt-1.5 w-full"
          value={o.pointsTo ?? ""}
          onChange={(e) => {
            checkpoint();
            setDraft(["site", "quiz", "questions", qi, "options", oi, "pointsTo"] as Path, e.target.value || null);
          }}
        >
          <option value="">— no service —</option>
          {services.map((s) => (
            <option key={s.slug} value={s.icon}>
              {s.title}
            </option>
          ))}
        </select>
        </label>
        <Button
          variant="ghost"
          className="justify-self-start text-st-danger sm:mb-0.5"
          disabled={q.options.length <= 2}
          title={q.options.length <= 2 ? "A question needs at least 2 answers" : "Remove this answer"}
          onClick={() => {
            checkpoint();
            setDraft(["site", "quiz", "questions", qi, "options"] as Path, q.options.filter((_, j) => j !== oi));
          }}
        >
          ✕ Remove
        </Button>
      </div>
      <TextField
        path={["site", "quiz", "questions", qi, "options", oi, "solves"]}
        label="How we help (shown on the result)"
        placeholder={svc ? svc.description : "One sentence: what Nine Labs does about this answer"}
        help="The AI rewrites this for each visitor when it's on; scoring shows it as written. Empty = the service's description."
      />
      {q.multi && (
        <label className="flex items-center gap-1.5 text-[11.5px] text-st-sub">
          <input type="checkbox" checked={!!o.only} onChange={(e) => { checkpoint(); setDraft(["site", "quiz", "questions", qi, "options", oi, "only"] as Path, e.target.checked); }} className="h-3.5 w-3.5 accent-[var(--st-purple)]" />
          Stands alone — picking it clears the other answers (e.g. &quot;Nothing yet&quot;)
        </label>
      )}
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
      <CheckField path={["site", "quiz", "questions", qi, "allowOther"]} label="Visitors can also type their own words" help="Adds an “Other — in your own words” card. The AI reads it; scoring matches it to a service by its words." />

      <div className="grid gap-2">
        {q.options.map((o, oi) => (
          <OptionEditor key={o.id} qi={qi} oi={oi} o={o} q={q} />
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
      <More>
        <Row>
          <TextField path={["site", "quiz", "questions", qi, "label"]} label="Short name" help="Shown on the result and in the WhatsApp summary." />
          <RoleField qi={qi} />
        </Row>
        <TextField path={["site", "quiz", "questions", qi, "hint"]} label="Hint under the question" placeholder="Optional" />
        <TextField path={["site", "quiz", "questions", qi, "otherPlaceholder"]} label="Placeholder in the “own words” box" placeholder="Tell us in a sentence or two…" />
        <CheckField path={["site", "quiz", "questions", qi, "multi"]} label="Several answers allowed" help="Off (recommended): the quiz moves on by itself after a tap. On: visitors must press Next." />
      </More>
    </div>
  );
}

function BuildTab() {
  const draft = useDraft();
  const questions = draft.site.quiz.questions;
  const allOther = questions.every((q) => q.allowOther);
  return (
    <>
      <div className="flex flex-col gap-2 rounded-xl border border-st-border bg-st-panel p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-st-sub">
          {questions.length} questions. Each answer is <strong className="text-st-ink">solved by</strong> one service, with a line on <strong className="text-st-ink">how we help</strong>. Open a question to edit it; drag to reorder.
        </p>
        <Button
          className="shrink-0"
          onClick={() => {
            checkpoint();
            setDraft(["site", "quiz", "questions"] as Path, questions.map((q) => ({ ...q, allowOther: !allOther })));
          }}
        >
          {allOther ? "Turn off own words everywhere" : "Allow own words on every question"}
        </Button>
      </div>
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
              {qi + 1}. {q.q || "New question"}{" "}
              <span className="font-normal text-st-dim">
                — {q.options.length} answers{q.allowOther ? " + own words" : ""}
                {q.options.some((o) => !o.pointsTo && !o.solves) ? " · some answers have no service" : ""}
              </span>
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
            { id: `q${Date.now().toString(36)}`, label: `Question ${n}`, q: "New question", multi: false, allowOther: true, options: [{ id: `a${Date.now().toString(36)}1`, label: "Answer 1" }, { id: `a${Date.now().toString(36)}2`, label: "Answer 2" }] },
          ]);
        }}
      >
        + Add a question
      </Button>
    </>
  );
}

type AiTestResponse = {
  ai: {
    result: AiQuizResult | null;
    source: string;
    outcome: "ok" | "failover" | "backup" | "none";
    attempts: { provider: string; ok: boolean; reason?: string; detail?: string; latencyMs: number; tokensIn: number; tokensOut: number }[];
    retrieved: { titles: string[]; mode: string };
    latencyMs: number;
  };
  backup: AiQuizResult | null;
};


function ResultView({ result, services }: { result: AiQuizResult; services: Service[] }) {
  return (
    <>
      <p className="text-[13.5px] text-st-ink">{result.wants}</p>
      {result.visual && (
        <p className="text-[12.5px] text-st-sub">
          <strong className="text-st-ink">AI diagram:</strong> {{ flow: "today → with us", funnel: "where customers slip away", roadmap: "the order we'd work in" }[result.visual.kind]} — “{result.visual.title}”
        </p>
      )}
      {result.highlights.length > 0 && (
        <p className="flex flex-wrap gap-1">
          {result.highlights.map((h) => (
            <span key={h} className="rounded-full border border-st-purple/30 bg-st-purple/10 px-2 py-0.5 text-[11px] font-medium text-st-ink">
              {h}
            </span>
          ))}
        </p>
      )}
      {result.answers.length > 0 && (
        <ol className="grid gap-1.5">
          {result.answers.map((a) => (
            <li key={a.q} className="grid gap-0.5 rounded-lg border border-st-border px-2.5 py-2 text-[12.5px] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-3">
              <span className="min-w-0 break-words text-st-ink">
                {a.own ? "✎ " : ""}
                {a.said}
              </span>
              <span className="min-w-0 break-words text-st-sub">
                <strong className="text-st-ink">{services.find((s) => s.slug === a.slug)?.short ?? "—"}:</strong> {a.how}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="st-micro">Services shown</p>
      <ol className="grid gap-2">
        {result.matches.map((m) => {
          const s = services.find((sv) => sv.slug === m.slug);
          return (
            <li key={m.slug} className="rounded-lg bg-st-panel-2 p-2.5 text-[12.5px]">
              <strong className="text-st-ink">
                {s?.title ?? m.slug} — {FIT_LABEL[m.fit]}
              </strong>
              <p className="mt-0.5 text-st-sub">{m.how}</p>
            </li>
          );
        })}
      </ol>
      <ol className="grid gap-1 text-[12px] text-st-sub">
        {result.steps.map((st, i) => (
          <li key={i}>
            <strong className="text-st-ink">
              0{i + 1} {st.title}
            </strong>{" "}
            — {st.text}
          </li>
        ))}
      </ol>
    </>
  );
}

function TestTab() {
  const draft = useDraft();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [other, setOther] = useState<QuizOther>({});
  const [run, setRun] = useState<AiTestResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const backup = useMemo(() => runBackup(draft.site, answers, other), [draft.site, answers, other]);
  const answered = Object.values(answers).some((a) => a.length) || Object.values(other).some((o) => o.trim());

  const pick = (q: QuizQuestion, id: string) =>
    setAnswers((a) => {
      const cur = a[q.id] ?? [];
      if (!q.multi) return { ...a, [q.id]: cur[0] === id ? [] : [id] };
      const only = new Set(q.options.filter((o) => o.only).map((o) => o.id));
      if (cur.includes(id)) return { ...a, [q.id]: cur.filter((x) => x !== id) };
      return { ...a, [q.id]: only.has(id) ? [id] : [...cur.filter((x) => !only.has(x)), id] };
    });

  const runAi = async () => {
    setRunning(true);
    setError("");
    try {
      setRun(await api<AiTestResponse>("/api/admin/ai/test", { json: { answers, other } }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server.");
    }
    setRunning(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Box
        title="Answer as a visitor would"
        right={
          <Button
            onClick={() => {
              setAnswers(randomAnswers(draft.site));
              setRun(null);
            }}
          >
            Random visitor
          </Button>
        }
      >
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
            {q.allowOther && (
              <input
                type="text"
                value={other[q.id] ?? ""}
                onChange={(e) => setOther((m) => ({ ...m, [q.id]: e.target.value }))}
                placeholder="Other — typed by the visitor (try something tricky)"
                maxLength={draft.site.quiz.ai.maxOtherChars || 300}
                className="st-field text-[12.5px]"
              />
            )}
          </fieldset>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={runAi} disabled={!answered || running}>
            {running ? "Asking the AI…" : "Run the real AI"}
          </Button>
          {answered && (
            <Button
              onClick={() => {
                setAnswers({});
                setOther({});
                setRun(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>
        <p className="text-[11.5px] text-st-dim">Uses your current draft and the live knowledge base. Nothing is saved as a lead. Each run counts toward the providers&apos; limits.</p>
      </Box>

      <div className="grid content-start gap-4">
        <Box title="AI result" help="What the visitor would see when AI is on.">
          {error ? (
            <p className="text-[13px] text-st-danger">{error}</p>
          ) : !run ? (
            <p className="text-[13px] text-st-sub">Pick some answers, then press “Run the real AI”.</p>
          ) : (
            <>
              <p className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                <span className="rounded-full bg-st-purple/15 px-2 py-0.5 font-medium text-st-purple">{OUTCOME_LABEL[run.ai.outcome]}</span>
                <span className="text-st-dim">
                  {run.ai.source} · {run.ai.latencyMs} ms · retrieval: {run.ai.retrieved.mode}
                </span>
              </p>
              <More label="Technical details">
                {run.ai.attempts.map((a, i) => (
                  <p key={i} className="break-words text-[11.5px] text-st-dim">
                    {a.provider}: {a.ok ? `ok (${a.tokensIn}→${a.tokensOut} tokens, ${a.latencyMs} ms)` : `failed — ${a.reason}${a.detail ? `: ${a.detail}` : ""}`}
                  </p>
                ))}
                {run.ai.retrieved.titles.length > 0 && <p className="break-words text-[11.5px] text-st-dim">Facts used: {run.ai.retrieved.titles.join(" · ")}</p>}
              </More>
              {run.ai.result ? <ResultView result={run.ai.result} services={draft.site.services} /> : <p className="text-[13px] text-st-sub">Last resort — the visitor sees their own answers and the WhatsApp button.</p>}
            </>
          )}
        </Box>
        <Box title="Scoring result" help="What visitors get in “Scoring only” mode, or when the AI is out of quota or fails — from each answer's “Solved by” and “How we help”.">
          {!answered ? (
            <p className="text-[13px] text-st-sub">Pick some answers to see the scoring result.</p>
          ) : !backup ? (
            <p className="text-[13px] text-st-sub">No answer is solved by a service yet — set “Solved by” on the Questions tab.</p>
          ) : (
            <ResultView result={backup} services={draft.site.services} />
          )}
        </Box>
      </div>
    </div>
  );
}

const KIND_COLORS: Record<KbKind, { bg: string; text: string; border: string }> = {
  service: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-300", border: "border-purple-500/30" },
  note: { bg: "bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-500/30" },
  pricing: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", border: "border-amber-500/30" },
  faq: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/30" },
  case: { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-500/30" },
  ebook: { bg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-300", border: "border-rose-500/30" },
  process: { bg: "bg-slate-500/10", text: "text-slate-700 dark:text-slate-300", border: "border-slate-500/30" },
};

function KnowledgeTab() {
  const draft = useDraft();
  const services = draft.site.services;
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ok" | string>("loading");
  const [filterKind, setFilterKind] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [editingEntry, setEditingEntry] = useState<KbEntry | null>(null);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [reindexing, setReindexing] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };
  const failed = (err: unknown) => showToast(err instanceof ApiError ? err.message : "Couldn't reach the server — nothing was changed.");
  const toInput = (e: KbEntry) => ({ id: e.id, kind: e.kind, title: e.title, body: e.body, tags: e.tags, serviceSlug: e.serviceSlug ?? null, allowPrices: e.allowPrices, enabled: e.enabled });

  useEffect(() => {
    let alive = true;
    api<{ entries: KbEntry[] }>("/api/admin/kb")
      .then((d) => {
        if (!alive) return;
        setEntries(d.entries);
        setLoadState("ok");
      })
      .catch((err) => alive && setLoadState(err instanceof ApiError ? err.message : "Couldn't load the knowledge base."));
    return () => {
      alive = false;
    };
  }, []);

  const replaceEntry = (entry: KbEntry) => setEntries((list) => (list.some((e) => e.id === entry.id) ? list.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...list]));

  const handleToggleEnabled = async (id: string) => {
    const cur = entries.find((e) => e.id === id);
    if (!cur) return;
    try {
      const { entry } = await api<{ entry: KbEntry }>(`/api/admin/kb/${id}`, { method: "PUT", json: toInput({ ...cur, enabled: !cur.enabled }) });
      replaceEntry(entry);
      showToast(entry.enabled ? "Entry enabled" : "Entry paused — the AI won't see it");
    } catch (err) {
      failed(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this knowledge entry? This can't be undone.")) return;
    try {
      await api(`/api/admin/kb/${id}`, { method: "DELETE" });
      setEntries((list) => list.filter((e) => e.id !== id));
      showToast("Entry deleted");
    } catch (err) {
      failed(err);
    }
  };

  const handleSaveModal = async (draftEntry: KbEntry) => {
    try {
      const { entry } = isNew ? await api<{ entry: KbEntry }>("/api/admin/kb", { json: toInput(draftEntry) }) : await api<{ entry: KbEntry }>(`/api/admin/kb/${draftEntry.id}`, { method: "PUT", json: toInput(draftEntry) });
      replaceEntry(entry);
      setEditingEntry(null);
      showToast(entry.hasEmbedding ? "Saved and indexed" : "Saved — not indexed yet (needs the Gemini key); the AI still sees it via the full-list fallback");
    } catch (err) {
      failed(err);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const r = await api<{ total: number; indexed: number }>("/api/admin/kb/reindex", { method: "POST" });
      const fresh = await api<{ entries: KbEntry[] }>("/api/admin/kb");
      setEntries(fresh.entries);
      showToast(`Indexed ${r.indexed} of ${r.total} entries`);
    } catch (err) {
      failed(err);
    }
    setReindexing(false);
  };

  const countsByKind = useMemo(() => {
    const map: Record<string, number> = { all: entries.length };
    for (const e of entries) {
      map[e.kind] = (map[e.kind] || 0) + 1;
    }
    return map;
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterKind !== "all" && e.kind !== filterKind) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchBody = e.body.toLowerCase().includes(q);
        const matchTag = e.tags.some((t) => t.toLowerCase().includes(q));
        const matchSlug = e.serviceSlug?.toLowerCase().includes(q);
        if (!matchTitle && !matchBody && !matchTag && !matchSlug) return false;
      }
      return true;
    });
  }, [entries, filterKind, search]);

  const kinds: { id: string; label: string }[] = [
    { id: "all", label: `All (${countsByKind.all || 0})` },
    { id: "service", label: `Services (${countsByKind.service || 0})` },
    { id: "note", label: `Notes (${countsByKind.note || 0})` },
    { id: "pricing", label: `Pricing (${countsByKind.pricing || 0})` },
    { id: "faq", label: `FAQ (${countsByKind.faq || 0})` },
    { id: "case", label: `Case Studies (${countsByKind.case || 0})` },
    { id: "ebook", label: `eBooks (${countsByKind.ebook || 0})` },
    { id: "process", label: `Processes (${countsByKind.process || 0})` },
  ];

  return (
    <div className="grid gap-4">
      {/* Top action header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-st-border bg-st-panel p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display text-[17px] font-semibold text-st-ink">What the AI knows</h3>
            <span className="rounded-full bg-st-purple/15 px-2.5 py-0.5 text-[11px] font-medium text-st-purple">
              {entries.length} facts
            </span>
          </div>
          <p className="mt-1 text-[13px] text-st-sub">
            Facts about Nine Labs the AI may use when it writes a visitor&apos;s plan. It never makes up anything that isn&apos;t here or in your services.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            onClick={handleReindex}
            disabled={reindexing}
            className="text-[12.5px]"
          >
            {reindexing ? "Refreshing…" : "Refresh AI search"}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setIsNew(true);
              setEditingEntry({
                id: `kb-${Date.now()}`,
                kind: "note",
                title: "",
                body: "",
                tags: [],
                serviceSlug: null,
                allowPrices: false,
                enabled: true,
                updatedAt: new Date().toISOString(),
                updatedBy: "Admin",
              });
            }}
            className="text-[12.5px]"
          >
            + Add a fact
          </Button>
        </div>
      </div>

      {loadState !== "ok" && (
        <p className="rounded-xl border border-st-border bg-st-panel p-4 text-[13px] text-st-sub" role="status">
          {loadState === "loading" ? "Loading the knowledge base…" : loadState}
        </p>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-st-border bg-st-panel p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setFilterKind(k.id)}
              className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                filterKind === k.id
                  ? "bg-st-purple text-white shadow-sm"
                  : "bg-st-panel-2 text-st-sub hover:bg-st-panel-3 hover:text-st-ink"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search entries, tags, text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-st-border bg-st-panel-2 px-3 py-1.5 text-[12.5px] text-st-ink placeholder:text-st-dim focus:border-st-purple focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-st-dim hover:text-st-ink"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className="rounded-xl border border-st-purple/40 bg-st-purple/10 px-4 py-2 text-[13px] font-medium text-st-purple animate-in fade-in slide-in-from-top-2">
          ✓ {toast}
        </div>
      )}

      {/* Entries List */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-st-border p-8 text-center">
            <p className="text-[14px] text-st-sub">No knowledge entries found matching your query.</p>
          </div>
        ) : (
          filtered.map((e) => {
            const colors = KIND_COLORS[e.kind] || KIND_COLORS.note;
            const linkedService = services.find((s) => s.slug === e.serviceSlug);
            return (
              <div
                key={e.id}
                className={`group relative rounded-xl border transition-all ${
                  e.enabled
                    ? "border-st-border bg-st-panel hover:border-st-border-strong hover:shadow-sm"
                    : "border-st-border/50 bg-st-panel/50 opacity-70"
                } p-4 sm:p-5`}
              >
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        {e.kind}
                      </span>
                      {linkedService && (
                        <span className="rounded-md border border-st-border bg-st-panel-2 px-2 py-0.5 text-[11px] text-st-sub">
                          {String(linkedService.n).padStart(2, "0")} · {linkedService.title}
                        </span>
                      )}
                      {e.allowPrices ? (
                        <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-700 dark:text-amber-300">
                          Prices Allowed
                        </span>
                      ) : (
                        <span className="rounded-md border border-st-border bg-st-panel-2 px-1.5 py-0.5 text-[10.5px] text-st-dim">
                          No Prices
                        </span>
                      )}
                      {!e.enabled && (
                        <span className="rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-st-danger">
                          Paused
                        </span>
                      )}
                    </div>
                    <h4 className="mt-2 font-display text-[15px] font-semibold text-st-ink">{e.title}</h4>
                    <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-st-sub line-clamp-3">
                      {e.body}
                    </p>
                    {e.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {e.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-st-panel-2 px-2 py-0.5 text-[10.5px] text-st-dim"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions column */}
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(e.id)}
                      title={e.enabled ? "Click to pause" : "Click to enable"}
                      className={`rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                        e.enabled
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                          : "bg-st-panel-2 text-st-dim hover:bg-st-panel-3 hover:text-st-sub"
                      }`}
                    >
                      {e.enabled ? "Active" : "Paused"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNew(false);
                        setEditingEntry({ ...e });
                      }}
                      className="rounded-lg border border-st-border bg-st-panel-2 px-2.5 py-1 text-[11.5px] font-medium text-st-sub transition-colors hover:border-st-border-strong hover:text-st-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
                      className="rounded-lg border border-st-border bg-st-panel-2 px-2.5 py-1 text-[11.5px] font-medium text-st-danger transition-colors hover:border-red-500/40 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-st-border bg-st-panel p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-st-border pb-4">
              <h3 className="font-display text-[17px] font-semibold text-st-ink">
                {isNew ? "New Knowledge Entry" : "Edit Knowledge Entry"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-st-dim hover:bg-st-panel-2 hover:text-st-ink"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveModal(editingEntry);
              }}
              className="mt-4 grid gap-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[12px] font-medium text-st-sub">Entry Kind</label>
                  <select
                    value={editingEntry.kind}
                    onChange={(ev) => setEditingEntry({ ...editingEntry, kind: ev.target.value as KbKind })}
                    className="mt-1 w-full rounded-lg border border-st-border bg-st-panel-2 px-3 py-2 text-[13px] text-st-ink focus:border-st-purple focus:outline-none"
                  >
                    <option value="service">Service grounding</option>
                    <option value="note">General Note / About</option>
                    <option value="pricing">Pricing &amp; Rates</option>
                    <option value="faq">FAQ</option>
                    <option value="case">Case Study</option>
                    <option value="ebook">eBook Summary</option>
                    <option value="process">Delivery Process</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-st-sub">Linked Service (Optional)</label>
                  <select
                    value={editingEntry.serviceSlug ?? ""}
                    onChange={(ev) =>
                      setEditingEntry({
                        ...editingEntry,
                        serviceSlug: ev.target.value ? ev.target.value : null,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-st-border bg-st-panel-2 px-3 py-2 text-[13px] text-st-ink focus:border-st-purple focus:outline-none"
                  >
                    <option value="">None (Company-wide)</option>
                    {services.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {String(s.n).padStart(2, "0")} · {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-st-sub">Entry Title</label>
                <input
                  type="text"
                  required
                  value={editingEntry.title}
                  onChange={(ev) => setEditingEntry({ ...editingEntry, title: ev.target.value })}
                  placeholder="e.g. AI Consultancy & Integration"
                  className="mt-1 w-full rounded-lg border border-st-border bg-st-panel-2 px-3 py-2 text-[13px] text-st-ink placeholder:text-st-dim focus:border-st-purple focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-st-sub">Factual Content (Prompt Context)</label>
                  <span className="text-[11px] text-st-dim">{editingEntry.body.length} characters</span>
                </div>
                <textarea
                  required
                  rows={6}
                  value={editingEntry.body}
                  onChange={(ev) => setEditingEntry({ ...editingEntry, body: ev.target.value })}
                  placeholder="State facts, deliverables, deliverables timeline, client benefits, and constraints clearly..."
                  className="mt-1 w-full rounded-lg border border-st-border bg-st-panel-2 p-3 text-[13px] text-st-ink placeholder:text-st-dim focus:border-st-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-st-sub">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editingEntry.tags.join(", ")}
                  onChange={(ev) =>
                    setEditingEntry({
                      ...editingEntry,
                      tags: ev.target.value
                        .split(",")
                        .map((s) => s.trim().replace(/^#/, ""))
                        .filter(Boolean),
                    })
                  }
                  placeholder="ai, automation, llm, dubai"
                  className="mt-1 w-full rounded-lg border border-st-border bg-st-panel-2 px-3 py-2 text-[13px] text-st-ink placeholder:text-st-dim focus:border-st-purple focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-st-border bg-st-panel-2 p-3.5">
                <label className="flex items-center gap-2.5 text-[12.5px] font-medium text-st-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEntry.allowPrices}
                    onChange={(ev) => setEditingEntry({ ...editingEntry, allowPrices: ev.target.checked })}
                    className="h-4 w-4 rounded accent-[var(--st-purple)]"
                  />
                  <span>Allow quoting prices from this entry</span>
                </label>
                <p className="text-[11.5px] text-st-sub ml-6.5">
                  By default, AI answers never mention money. Check this only for official published rates.
                </p>

                <label className="flex items-center gap-2.5 text-[12.5px] font-medium text-st-ink cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={editingEntry.enabled}
                    onChange={(ev) => setEditingEntry({ ...editingEntry, enabled: ev.target.checked })}
                    className="h-4 w-4 rounded accent-[var(--st-purple)]"
                  />
                  <span>Enabled in RAG vector search</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-st-border pt-4">
                <Button variant="default" onClick={() => setEditingEntry(null)}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  className="rounded-lg bg-st-purple px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/** AI + scoring together, or scoring alone. Scoring always stands behind the AI, so a limit or outage never shows. */
function ModeSwitch() {
  const [on, setOn] = useField<boolean>(["site", "quiz", "ai", "enabled"]);
  return (
    <div className="grid gap-2">
      <span className="st-label">Result mode</span>
      <Segmented
        layoutId="quiz-mode"
        value={on ? "ai" : "scoring"}
        onChange={(v) => {
          checkpoint();
          setOn(v === "ai");
        }}
        options={[
          { value: "ai", label: "AI + scoring" },
          { value: "scoring", label: "Scoring only" },
        ]}
      />
      <p className="st-help">
        {on
          ? "The AI writes each visitor's plan from their answers and your knowledge base. If it hits its daily limit, is slow or fails, that visitor automatically gets the scoring result instead — they never see an error."
          : "Every visitor gets the scoring result: each answer votes for the activity its “Points to” names, the most-voted win. No AI calls, no limits."}
      </p>
    </div>
  );
}

/** Always on top of the page: which mode the quiz runs in. */
function ModeCard() {
  const draft = useDraft();
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-st-border bg-st-panel p-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 lg:max-w-[52%]">
        <p className="text-[14px] font-semibold text-st-ink">How results are worked out</p>
        <p className="mt-1 text-[12.5px] text-st-sub">
          Both modes show every answer and how {draft.site.shortName} solves it, as a picture. Publish to apply.
        </p>
      </div>
      <div className="min-w-0 lg:w-[46%]">
        <ModeSwitch />
      </div>
    </div>
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
        <NumField path={["site", "quiz", "result", "matches"]} label="Services to recommend" help="Shown under the answer-by-answer picture." min={1} max={5} />
        <More>
          <AreaField path={["site", "quiz", "result", "summary"]} label="Opening sentence (scoring mode)" rows={2} help="{who} {goal} {when} are replaced. The AI writes its own." />
          <TextField path={["site", "quiz", "result", "why"]} label="“Why” line" help="{answers} becomes their own answers." />
        </More>
      </Box>
      <Box title="How the AI writes" help="Used when the mode is “AI + scoring”. The API keys are Worker secrets, never stored here.">
        <SelectField
          path={["site", "quiz", "ai", "tone"]}
          label="Tone"
          options={[
            { value: "friendly", label: "Friendly" },
            { value: "professional", label: "Professional" },
            { value: "short", label: "Short and direct" },
          ]}
        />
        <AreaField path={["site", "quiz", "ai", "notes"]} label="About Nine Labs (for the AI)" help="A few facts the AI should always know — who you are, what you're best at. Don't put prices here." rows={4} />
        <More>
          <NumField path={["site", "quiz", "ai", "maxOtherChars"]} label="Longest “own words” answer (characters)" min={50} max={1000} step={10} />
          <NumField path={["site", "quiz", "ai", "geminiDailyLimitEstimate"]} label="Gemini daily limit (your estimate)" help="Gemini doesn't report its quota; this sets the % on Insights." min={0} step={50} />
          <CheckField path={["site", "quiz", "ai", "allowPrices"]} label="Allow prices" help="Even when on, the AI only quotes prices from facts marked “allow prices”." />
        </More>
      </Box>
      <Box title="The three-step plan" help="In scoring mode: {first} {firstDescription} {next} are replaced. The AI writes its own steps.">
        {steps.map((s, i) => (
          <div key={i} className="grid gap-2">
            <TextField path={["site", "quiz", "result", "steps", i, "title"]} label={`Step ${i + 1} title`} />
            <AreaField path={["site", "quiz", "result", "steps", i, "text"]} label={`Step ${i + 1} text`} rows={2} />
          </div>
        ))}
      </Box>
      <Box title="WhatsApp and e-mail">
        <TextField path={["site", "quiz", "result", "whatsappCta"]} label="WhatsApp button" />
        <CheckField path={["site", "quiz", "result", "emailEnabled"]} label="Offer “e-mail me this plan”" />
        <More>
          <Row>
            <TextField path={["site", "quiz", "result", "whatsappIntro"]} label="Message — first line" />
            <TextField path={["site", "quiz", "result", "whatsappOutro"]} label="Message — last line" />
          </Row>
          <Row>
            <TextField path={["site", "quiz", "result", "retake"]} label="Retake link" />
            <TextField path={["site", "quiz", "result", "ebooksCta"]} label="E-books link" />
          </Row>
        </More>
      </Box>
    </>
  );
}

function InsightsTab() {
  const draft = useDraft();
  const ai = draft.site.quiz.ai;
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
      <Box title="AI health, keys & quota" help="Last 7 days of quiz results (never what visitors typed), your AI keys, and how much quota is left.">
        <AiHealthView enabled={ai.enabled} geminiLimit={ai.geminiDailyLimitEstimate} manageKeys />
      </Box>
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
      <PageHeader title="Quiz" description="The 9 Quiz: the questions, how Nine Labs solves each answer, and what visitors chose." />
      <ModeCard />
      <Tabs layoutId="quiz-tabs" active={tab} onChange={setTab} tabs={TABS.map(([id, label]) => ({ id, label }))} />
      <div className="grid gap-4">
        {tab === "build" && <BuildTab />}
        {tab === "test" && <TestTab />}
        {tab === "knowledge" && <KnowledgeTab />}
        {tab === "result" && <ResultTab />}
        {tab === "insights" && <InsightsTab />}
      </div>
    </div>
  );
}
