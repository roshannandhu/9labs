"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { QuizOption, QuizQuestion, Service } from "@/content/site";
import { randomAnswers } from "@/lib/quiz/analyze";
import { runBackup } from "@/lib/quiz/backup";
import type { QuizAnswers } from "@/lib/quiz/types";
import type { KbEntry, KbKind } from "@/server/ai/types";
import { Icon } from "@/studio/Icon";
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

const KIND_COLORS: Record<KbKind, { bg: string; text: string; border: string }> = {
  service: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/30" },
  note: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/30" },
  pricing: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/30" },
  faq: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30" },
  case: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/30" },
  ebook: { bg: "bg-rose-500/10", text: "text-rose-300", border: "border-rose-500/30" },
  process: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/30" },
};

function makeDefaultEntries(services: Service[]): KbEntry[] {
  const now = new Date().toISOString();
  const serviceEntries: KbEntry[] = services.map((s) => ({
    id: `kb-service-${s.slug}`,
    kind: "service",
    title: s.title,
    body: `${s.title}: ${s.short}.\n${s.description}\nKey needs addressed: ${s.needs.join(", ")}.`,
    tags: [...s.tags],
    serviceSlug: s.slug,
    allowPrices: false,
    enabled: true,
    updatedAt: now,
    updatedBy: "System Seed",
    hasEmbedding: true,
  }));

  const aboutEntry: KbEntry = {
    id: "kb-note-about",
    kind: "note",
    title: "About Nine Labs Solutions",
    body: "Nine Labs Solutions is a premier marketing, technology, and live-experience agency based in Dubai South, UAE. We specialize in cross-disciplinary growth: AI consultancy, custom software & web development, social & performance marketing, video production, and high-impact corporate trade shows and events.",
    tags: ["about", "overview", "dubai", "services", "capabilities"],
    serviceSlug: null,
    allowPrices: false,
    enabled: true,
    updatedAt: now,
    updatedBy: "System Seed",
    hasEmbedding: true,
  };

  return [aboutEntry, ...serviceEntries];
}

function KnowledgeTab() {
  const draft = useDraft();
  const services = draft.site.services;
  const [entries, setEntries] = useState<KbEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("nl-admin-kb-cache");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return makeDefaultEntries(services);
  });
  const [filterKind, setFilterKind] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [editingEntry, setEditingEntry] = useState<KbEntry | null>(null);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [reindexing, setReindexing] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const saveToStorage = useCallback((items: KbEntry[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nl-admin-kb-cache", JSON.stringify(items));
      } catch {}
    }
  }, []);

  const loadFromApi = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kb/");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.entries) && data.entries.length > 0) {
          setEntries(data.entries);
          saveToStorage(data.entries);
        }
      }
    } catch {}
  }, [saveToStorage]);

  useEffect(() => {
    void loadFromApi();
  }, [loadFromApi]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleEnabled = async (id: string) => {
    const next = entries.map((e) => (e.id === id ? { ...e, enabled: !e.enabled, updatedAt: new Date().toISOString() } : e));
    setEntries(next);
    saveToStorage(next);
    const updated = next.find((e) => e.id === id);
    if (updated) {
      await fetch(`/api/admin/kb/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
    showToast(updated?.enabled ? "Entry enabled" : "Entry paused");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this knowledge entry?")) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveToStorage(next);
    await fetch(`/api/admin/kb/${id}/`, { method: "DELETE" }).catch(() => {});
    showToast("Entry deleted");
  };

  const handleSaveModal = async (entry: KbEntry) => {
    const now = new Date().toISOString();
    const finalized = { ...entry, updatedAt: now, updatedBy: entry.updatedBy || "Admin" };
    let next: KbEntry[];
    if (isNew) {
      next = [finalized, ...entries];
      await fetch("/api/admin/kb/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalized),
      }).catch(() => {});
      showToast("Knowledge entry created");
    } else {
      next = entries.map((e) => (e.id === finalized.id ? finalized : e));
      await fetch(`/api/admin/kb/${finalized.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalized),
      }).catch(() => {});
      showToast("Knowledge entry updated");
    }
    setEntries(next);
    saveToStorage(next);
    setEditingEntry(null);
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      await fetch("/api/admin/kb/reindex/", { method: "POST" });
    } catch {}
    setReindexing(false);
    showToast(`Reindexed ${entries.length} knowledge base entries`);
  };

  const handleResetDefaults = () => {
    if (!confirm("Reset knowledge base to all 9 default service entries + about note?")) return;
    const seeded = makeDefaultEntries(services);
    setEntries(seeded);
    saveToStorage(seeded);
    showToast("Reset to default knowledge entries");
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
            <h3 className="font-display text-[17px] font-semibold text-st-ink">Knowledge Base</h3>
            <span className="rounded-full bg-st-purple/15 px-2.5 py-0.5 text-[11px] font-medium text-st-purple">
              {entries.length} Grounding Entries
            </span>
          </div>
          <p className="mt-1 text-[13px] text-st-sub">
            The factual corpus used by the RAG vector engine to tailor answers, recommend services, and construct steps.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            onClick={handleResetDefaults}
            className="text-[12.5px]"
          >
            Reset Seed
          </Button>
          <Button
            variant="default"
            onClick={handleReindex}
            disabled={reindexing}
            className="text-[12.5px]"
          >
            {reindexing ? "Indexing..." : "Reindex All"}
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
            + Add Entry
          </Button>
        </div>
      </div>

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
                        <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-300">
                          Prices Allowed
                        </span>
                      ) : (
                        <span className="rounded-md border border-st-border bg-st-panel-2 px-1.5 py-0.5 text-[10.5px] text-st-dim">
                          No Prices
                        </span>
                      )}
                      {!e.enabled && (
                        <span className="rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-red-400">
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
                          ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
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
                      className="rounded-lg border border-st-border bg-st-panel-2 px-2.5 py-1 text-[11.5px] font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10"
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
