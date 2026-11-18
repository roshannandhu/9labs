"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fill } from "@/content/site";
import { useSite, useWhatsApp } from "@/components/providers/SiteProvider";
import { fetchQuizAi, submitQuizContact, submitQuizEmail, submitQuizResult } from "@/site/backend";
import { opaqueRef } from "@/lib/text";
import { answerRows, runBackup } from "@/lib/quiz/backup";
import { cleanPhone } from "@/lib/quiz/result";
import type { AiQuizResult, QuizAnswerRow, QuizAnswers, QuizOther } from "@/lib/quiz/types";
import type { QuizQuestion, Service } from "@/content/site";
import { buildQuizLines, buildQuizWhatsappText } from "@/lib/quiz/whatsapp";
import { scrollToId } from "@/lib/scroll";
import { useModalLock } from "@/lib/useModalLock";
import { useDemo } from "@/components/providers/DemoSettings";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { SocialIcon } from "@/components/icons/SocialIcon";

const ease = [0.16, 1, 0.3, 1] as const;
const FIT_LABEL = { best: "Best fit", also: "Also useful", consider: "Worth considering" } as const;

const THINKING = ["Reading what you told us…", "Matching it to what we do…", "Writing your plan…"];

/**
 * The 9 Quiz: the admin's questions, one per screen, answered with big tap cards (keys 1–5 work too).
 * Single-answer questions move on by themselves; "pick all that apply" ones get a Next button; a
 * question with "Allow Other" also takes the visitor's own words.
 * After the last answer a short "thinking" screen covers the AI call (POST /api/public/quiz-ai —
 * retrieval + Groq/Gemini, docs/AI_RAG_SYSTEM.md); if it fails or takes too long the built-in
 * backup (src/lib/quiz/backup.ts) answers instead, and if even that has nothing to go on, the
 * visitor still sees their answers and can send them on WhatsApp. The lead is saved either way.
 */
export default function QuizOverlay({ open, first, onClose }: { open: boolean; first: string; onClose: () => void }) {
  const { reduced } = useDemo();
  const site = useSite();
  const wa = useWhatsApp();
  const questions = site.quiz.questions;
  const COUNT = questions.length;
  const t = site.quiz.result;
  const ref = useRef("");
  const [idx, setIdx] = useState(0); // 0..COUNT-1 questions · COUNT result
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  // the answers as of the very last tap (state lags a frame behind): "Next" checks this, so a
  // question can never be left behind empty, however fast the taps come
  const latest = useRef<QuizAnswers>({});
  // which question is live right now: the one sliding away keeps its buttons for a moment, and a
  // tap on those must do nothing
  const live = useRef(0);
  const commit = useCallback((next: QuizAnswers) => {
    latest.current = next;
    setAnswers(next);
  }, []);
  // typed "Other" answers, kept the same way as `answers` (state for render, ref for the latest)
  const [other, setOther] = useState<QuizOther>({});
  const latestOther = useRef<QuizOther>({});
  const [otherOn, setOtherOn] = useState<Record<string, boolean>>({});
  const writeOther = useCallback((qid: string, text: string) => {
    latestOther.current = { ...latestOther.current, [qid]: text };
    setOther(latestOther.current);
  }, []);
  // undefined = still thinking · null = last resort (nothing to recommend) · otherwise the result
  const [result, setResult] = useState<AiQuizResult | null | undefined>(undefined);
  const [thinkingLine, setThinkingLine] = useState(0);
  const openedAt = useRef(0);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const advance = useRef(0);

  // fresh start every time it opens (optionally with question 1 already answered)
  useEffect(() => {
    if (!open) return;
    const start = Boolean(first) && Boolean(questions[0]?.options.some((o) => o.id === first));
    /* eslint-disable react-hooks/set-state-in-effect -- reset the dialog each time it opens */
    commit(start ? { [questions[0].id]: [first] } : {});
    setIdx(start ? 1 : 0);
    live.current = start ? 1 : 0;
    setDir(1);
    setSent(false);
    setEmail("");
    latestOther.current = {};
    setOther({});
    setOtherOn({});
    setResult(undefined);
    openedAt.current = Date.now();
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a fresh start only when it opens, not when content refreshes
  }, [open, first]);

  useModalLock(open, panel, onClose);
  useEffect(() => () => window.clearTimeout(advance.current), []);

  const go = useCallback(
    (to: number) => {
      window.clearTimeout(advance.current);
      setDir(to >= idx ? 1 : -1);
      live.current = Math.max(0, Math.min(COUNT, to));
      if (live.current < COUNT) setResult(undefined); // leaving the result: the next finish thinks afresh
      setIdx(live.current);
    },
    [idx, COUNT],
  );

  const q = idx < COUNT ? questions[idx] : null;
  const picked = q ? (answers[q.id] ?? []) : [];

  const choose = useCallback(
    (optId: string) => {
      // a tap that lands on the previous question while it slides away is not an answer
      if (!q || idx !== live.current || !q.options.some((o) => o.id === optId)) return;
      const a = latest.current;
      if (q.multi) {
        const only = new Set(q.options.filter((o) => o.only).map((o) => o.id));
        const cur = a[q.id] ?? [];
        // "Nothing yet" stands alone; picking anything else drops it
        commit({ ...a, [q.id]: cur.includes(optId) ? cur.filter((x) => x !== optId) : only.has(optId) ? [optId] : [...cur.filter((x) => !only.has(x)), optId] });
        return;
      }
      commit({ ...a, [q.id]: [optId] });
      // a real pick replaces typed text on a single-answer question
      if (latestOther.current[q.id]) writeOther(q.id, "");
      setOtherOn((m) => ({ ...m, [q.id]: false }));
      window.clearTimeout(advance.current);
      advance.current = window.setTimeout(() => go(idx + 1), reduced ? 120 : 260);
    },
    [q, idx, go, reduced, commit, writeOther],
  );
  const hasAnswer = (qid: string) => Boolean(latest.current[qid]?.length || latestOther.current[qid]?.trim());
  const next = useCallback(() => {
    if (q && idx === live.current && hasAnswer(q.id)) go(idx + 1);
  }, [q, idx, go]);
  /** "Other": on a single-answer question it IS the answer (the picks clear); on a multi one it adds to them. */
  const toggleOther = useCallback(() => {
    if (!q || idx !== live.current) return;
    window.clearTimeout(advance.current);
    const on = !otherOn[q.id];
    setOtherOn((m) => ({ ...m, [q.id]: on }));
    if (on && !q.multi) commit({ ...latest.current, [q.id]: [] });
    if (!on) writeOther(q.id, "");
  }, [q, idx, otherOn, commit, writeOther]);

  // keys: 1–5 pick an answer, Enter = next, ← = back
  useEffect(() => {
    if (!open || !q) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) {
        e.preventDefault();
        choose(q.options[n - 1].id);
      } else if (e.key === "Enter" && (q.multi || otherOn[q.id])) {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" && idx > 0) {
        go(idx - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, q, idx, choose, go, next, otherOn]);

  // finished: ask the AI (which saves the lead), show "thinking" for at least ~1.8 s so it never
  // flashes, and fall back to the built-in backup — saving via the fallback route — if it fails
  const finished = open && idx >= COUNT;
  useEffect(() => {
    if (!finished) return;
    ref.current = opaqueRef();
    const a = latest.current;
    const o = Object.fromEntries(Object.entries(latestOther.current).filter(([, v]) => v.trim()));
    let alive = true;
    const minWait = new Promise((r) => window.setTimeout(r, reduced ? 0 : 1800));
    void Promise.all([fetchQuizAi(ref.current, a, o, Date.now() - openedAt.current), minWait]).then(([ai]) => {
      if (!ai) submitQuizResult(ref.current, a, o);
      if (alive) setResult(ai ?? runBackup(site, a, o));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per finished quiz
  }, [finished]);
  useEffect(() => {
    if (!finished || result !== undefined || reduced) return;
    const t = window.setInterval(() => setThinkingLine((n) => (n + 1) % THINKING.length), 1400);
    return () => window.clearInterval(t);
  }, [finished, result, reduced]);

  const lines = useMemo(() => (idx >= COUNT ? buildQuizLines(questions, answers, other) : []), [idx, COUNT, questions, answers, other]);
  const whatsappText = useMemo(
    () => (result ? buildQuizWhatsappText(site, lines, result) : [t.whatsappIntro, "", ...lines.map((l) => `• ${l}`), "", t.whatsappOutro].join("\n").trim()),
    [result, site, lines, t.whatsappIntro, t.whatsappOutro],
  );
  const slide = reduced ? { x: 0 } : { x: dir * 40 };
  /** One row per answered question; results saved before rows existed get the scoring rows. */
  const rows = useMemo(() => (result ? (result.answers?.length ? result.answers : answerRows(site, answers, other)) : []), [result, site, answers, other]);
  /** Everything they said (picks and own words) that this service answers — the "you said" chips. */
  const saidFor = (slug: string) => rows.filter((r) => r.slug === slug).map((r) => r.said);
  // the form step: save name + phone with the lead, hand back the chat link to open in the same click
  const sendWhatsApp = (contact: { name: string; phone: string }) => {
    submitQuizContact(ref.current, contact, latest.current, latestOther.current);
    return wa(`Hi, I'm ${contact.name}.\n\n${whatsappText}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          data-lenis-prevent
        >
          <div className="fixed inset-0 bg-nl-bg/92 backdrop-blur-2xl" onClick={onClose} aria-hidden="true" />
          <div
            className="pointer-events-none fixed inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(50% 40% at 50% 0%, color-mix(in srgb, var(--brand-a) 20%, transparent), transparent 70%), radial-gradient(40% 40% at 85% 100%, color-mix(in srgb, var(--brand-b) 16%, transparent), transparent 70%)",
            }}
            aria-hidden="true"
          />

          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={site.quiz.label}
            tabIndex={-1}
            className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 pb-8 pt-4 outline-none sm:px-6 sm:pt-7"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.45, ease }}
          >
            {/* header: title, step, close */}
            <div className="flex items-center justify-between gap-3">
              <p className="label-mono flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-a)]" /> {site.quiz.label}
              </p>
              <div className="flex items-center gap-3">
                {q && (
                  <span className="font-digits text-xs font-black text-white/60" aria-live="polite">
                    {idx + 1} / {COUNT}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/80 transition-colors hover:border-nl-purple hover:text-white"
                  aria-label={`Close ${site.quiz.label}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <path d="M2 2l10 10M12 2L2 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* progress: one segment per question */}
            <div className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COUNT}, minmax(0, 1fr))` }} aria-hidden="true">
              {questions.map((qq, i) => (
                <span key={qq.id} className="h-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[color:var(--brand-a)] to-[color:var(--brand-b)] transition-[width] duration-500"
                    style={{ width: i < idx || idx >= COUNT ? "100%" : i === idx ? "35%" : "0%" }}
                  />
                </span>
              ))}
            </div>

            <div className="flex flex-1 flex-col justify-center py-6 sm:py-10">
              <AnimatePresence mode="wait" initial={false}>
                {q ? (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, ...slide }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: reduced ? 0 : -dir * 40 }}
                    transition={{ duration: 0.32, ease }}
                  >
                    <p className="label-mono !text-[color:var(--brand-a)]">Question {idx + 1}</p>
                    <h2 className="mt-2 text-[clamp(1.6rem,5.4vw,2.6rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-white">{q.q}</h2>
                    {q.hint && <p className="mt-2 text-[14.5px] text-nl-ink">{q.hint}</p>}

                    <div className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3" role={q.multi ? "group" : "radiogroup"} aria-label={q.q}>
                      {q.options.map((o, i) => {
                        const on = picked.includes(o.id);
                        return (
                          <button
                            key={o.id}
                            type="button"
                            role={q.multi ? "checkbox" : "radio"}
                            aria-checked={on}
                            onClick={() => choose(o.id)}
                            className={`quiz-option group relative flex min-h-[58px] items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15.5px] font-medium transition-all duration-200 sm:min-h-[64px] sm:text-base ${
                              on ? "border-transparent text-white" : "border-white/12 bg-[var(--chip-bg)] text-white/85 hover:-translate-y-0.5 hover:border-[color:var(--brand-a)]/60"
                            } ${i === q.options.length - 1 && q.options.length % 2 ? "sm:col-span-2" : ""}`}
                            data-on={on}
                          >
                            <span
                              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border font-digits text-[11px] font-black transition-colors ${
                                on ? "border-white/40 bg-white/20 text-paper" : "border-white/15 text-white/50"
                              }`}
                              aria-hidden="true"
                            >
                              {on && q.multi ? "✓" : i + 1}
                            </span>
                            <span className="relative">{o.label}</span>
                          </button>
                        );
                      })}
                      {q.allowOther && (
                        <button
                          type="button"
                          role={q.multi ? "checkbox" : "radio"}
                          aria-checked={Boolean(otherOn[q.id])}
                          aria-expanded={Boolean(otherOn[q.id])}
                          aria-controls={`quiz-other-${q.id}`}
                          onClick={toggleOther}
                          className={`quiz-option relative flex min-h-[58px] items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15.5px] font-medium transition-all duration-200 sm:col-span-2 sm:min-h-[64px] sm:text-base ${
                            otherOn[q.id] ? "border-transparent text-white" : "border-dashed border-white/20 bg-[var(--chip-bg)] text-white/85 hover:-translate-y-0.5 hover:border-[color:var(--brand-a)]/60"
                          }`}
                          data-on={Boolean(otherOn[q.id])}
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/15 text-[13px] text-white/60" aria-hidden="true">
                            ✎
                          </span>
                          <span className="relative">Other — in your own words</span>
                        </button>
                      )}
                    </div>
                    {q.allowOther && otherOn[q.id] && (
                      <div className="mt-3">
                        <label htmlFor={`quiz-other-${q.id}`} className="sr-only">
                          Your own answer
                        </label>
                        <textarea
                          id={`quiz-other-${q.id}`}
                          autoFocus
                          rows={3}
                          maxLength={site.quiz.ai.maxOtherChars || 300}
                          value={other[q.id] ?? ""}
                          onChange={(e) => writeOther(q.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              next();
                            }
                          }}
                          placeholder={q.otherPlaceholder || "Tell us in a sentence or two…"}
                          className="w-full resize-none rounded-2xl border border-white/12 bg-transparent px-4 py-3 text-[16px] text-white placeholder:text-white/35 focus:border-nl-purple/70 focus:outline-none"
                        />
                        <p className="mt-1 text-right font-digits text-[11px] text-white/45" aria-live="polite">
                          {(other[q.id] ?? "").length} / {site.quiz.ai.maxOtherChars || 300}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => go(idx - 1)}
                        disabled={idx === 0}
                        className="btn btn-sm text-white/60 hover:text-white disabled:invisible"
                      >
                        ← Back
                      </button>
                      {(q.multi || otherOn[q.id]) && (
                        <button type="button" onClick={next} disabled={!picked.length && !other[q.id]?.trim()} className="btn btn-primary btn-sm disabled:opacity-40">
                          Next →
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : result === undefined ? (
                  <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="flex flex-col items-center text-center" role="status" aria-live="polite">
                    <div className="relative grid h-40 w-40 place-items-center">
                      <motion.span
                        className="absolute inset-6 rounded-full bg-gradient-to-br from-[color:var(--brand-a)] to-[color:var(--brand-b)] blur-xl"
                        animate={reduced ? undefined : { scale: [0.85, 1.1, 0.85], opacity: [0.55, 0.9, 0.55] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                        aria-hidden="true"
                      />
                      <span className="relative h-14 w-14 rounded-full bg-gradient-to-br from-[color:var(--brand-a)] to-[color:var(--brand-b)] shadow-[0_0_60px_var(--brand-a)]" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-[18px] font-semibold text-white">{THINKING[thinkingLine]}</p>
                    <ul className="mt-5 flex max-w-lg flex-wrap justify-center gap-1.5" aria-hidden="true">
                      {lines
                        .flatMap((l) => l.slice(l.indexOf(":") + 1).split(", "))
                        .map((c) => c.trim())
                        .filter(Boolean)
                        .slice(0, 10)
                        .map((chip, i) => (
                          <motion.li
                            key={`${chip}-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1, 0.35], y: [10, 0, 0, -6] }}
                            transition={{ delay: i * 0.12, duration: 2.2, repeat: reduced ? 0 : Infinity, repeatDelay: 0.6 }}
                            className="rounded-full border border-white/12 bg-[var(--chip-bg)] px-2.5 py-1 text-[12px] text-white/80"
                          >
                            {chip}
                          </motion.li>
                        ))}
                    </ul>
                  </motion.div>
                ) : result === null ? (
                  <motion.div key="told" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                    <p className="label-mono !text-[color:var(--brand-a)]">{t.label}</p>
                    <h2 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-white">Thanks — here&apos;s what you told us</h2>
                    <ul className="mt-4 grid gap-2">
                      {lines.map((l) => (
                        <li key={l} className="rounded-2xl border border-white/10 bg-[var(--chip-bg)] px-4 py-3 text-[14.5px] text-nl-ink">
                          {l}
                        </li>
                      ))}
                    </ul>
                    <WhatsAppStep cta={t.whatsappCta} onSend={sendWhatsApp} className="mt-6" />
                    <button type="button" className="btn btn-sm mt-3 text-white/60 hover:text-white" onClick={() => go(0)}>
                      {t.retake}
                    </button>
                  </motion.div>
                ) : (
                  result && (
                    <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                      <p className="label-mono !text-[color:var(--brand-a)]">{t.label}</p>
                      <h2 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-white">
                        {t.heading}
                      </h2>
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-[var(--chip-bg)] px-2.5 py-1 text-[11.5px] font-medium text-white/75">
                        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[color:var(--brand-a)] to-[color:var(--brand-b)]" aria-hidden="true" />
                        {result.source === "backup" ? "Matched from your answers" : "Written for you by our AI"}
                      </p>
                      <p className="mt-3 text-[16px] leading-relaxed text-nl-ink">{result.wants}</p>
                      <SolutionMap rows={rows} questions={questions} services={site.services} brand={site.shortName} reduced={reduced} />

                      <p className="label-mono mt-8 !text-white/55">Where we&apos;d start</p>
                      <ul className="mt-3 grid gap-3">
                        {result.matches.map((m, i) => {
                          const s = site.services.find((sv) => sv.slug === m.slug);
                          if (!s) return null;
                          return (
                            <motion.li
                              key={m.slug}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease }}
                              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[var(--chip-bg)] p-4 sm:p-5"
                            >
                              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[color:var(--brand-a)]/35 bg-[color:var(--brand-a)]/10 text-white">
                                <ActivityIcon icon={s.icon} size={26} play />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-3">
                                  <span className="font-display text-[16px] font-semibold text-white sm:text-[17px]">
                                    {i + 1}. {s.title}
                                  </span>
                                  <span className="shrink-0 font-digits text-[10px] font-black uppercase tracking-wide text-[color:var(--brand-a)]">{FIT_LABEL[m.fit]}</span>
                                </span>
                                {saidFor(s.slug).length > 0 && (
                                  <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px] text-white/55">
                                    You said
                                    {saidFor(s.slug).map((said) => (
                                      <span key={said} className="max-w-full break-words rounded-full border border-[color:var(--brand-a)]/30 bg-[color:var(--brand-a)]/10 px-2 py-0.5 text-white/85">
                                        {said}
                                      </span>
                                    ))}
                                  </span>
                                )}
                                <span className="mt-2.5 block text-[14px] leading-relaxed text-nl-ink">{m.how}</span>
                                {s.tags.length > 0 && (
                                  <span className="mt-2.5 flex flex-wrap gap-1.5">
                                    {s.tags.map((tag) => (
                                      <span key={tag} className="rounded-full border border-white/12 px-2 py-0.5 text-[11px] text-white/65">
                                        {tag}
                                      </span>
                                    ))}
                                  </span>
                                )}
                              </span>
                            </motion.li>
                          );
                        })}
                      </ul>

                      <PlanLine steps={result.steps} reduced={reduced} />

                      <div className="mt-6 rounded-3xl border border-white/10 bg-[var(--chip-bg)] p-4 sm:p-5">
                        <WhatsAppStep cta={t.whatsappCta} onSend={sendWhatsApp} />
                        {!t.emailEnabled ? null : sent ? (
                          <p className="mt-3 text-[15px] text-white" role="status">
                            ✓ {fill(t.emailSent, { email })}
                          </p>
                        ) : (
                          <form
                            className="mt-3 flex flex-col gap-2.5 sm:flex-row"
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!/^\S+@\S+\.\S+$/.test(email) || sending) return;
                              setSending(true);
                              const res = submitQuizEmail(ref.current, email, answers, other);
                              setSending(false);
                              if (res.ok) setSent(true);
                            }}
                          >
                            <label htmlFor="quiz-email" className="sr-only">
                              Email address
                            </label>
                            <input
                              id="quiz-email"
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder={t.emailPlaceholder}
                              className="min-h-[48px] flex-1 rounded-full border border-white/12 bg-transparent px-5 text-[16px] text-white placeholder:text-white/35 focus:border-nl-purple/70 focus:outline-none"
                            />
                            <button type="submit" disabled={sending} className="btn btn-outline btn-sm !min-h-[48px] disabled:opacity-60">
                              {t.emailCta}
                            </button>
                          </form>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button type="button" className="btn btn-sm text-white/60 hover:text-white" onClick={() => go(0)}>
                            {t.retake}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm text-white/60 hover:text-white"
                            onClick={() => {
                              onClose();
                              window.setTimeout(() => scrollToId("ebooks"), 450);
                            }}
                          >
                            {t.ebooksCta}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * "Send this to us on WhatsApp", in two taps: the button opens a short name + phone form, and
 * submitting it saves the contact with the lead and opens the chat — synchronously inside the
 * submit, so a popup blocker lets it through.
 */
function WhatsAppStep({ cta, onSend, className = "" }: { cta: string; onSend: (contact: { name: string; phone: string }) => string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const input = "min-h-[48px] w-full rounded-full border border-white/12 bg-transparent px-5 text-[16px] text-white placeholder:text-white/35 focus:border-nl-purple/70 focus:outline-none";

  if (!open)
    return (
      <button type="button" className={`btn btn-primary w-full ${className}`} onClick={() => setOpen(true)}>
        <SocialIcon name="whatsapp" size={18} /> {cta}
      </button>
    );

  return (
    <form
      className={`grid gap-2.5 ${className}`}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const n = name.trim();
        const p = cleanPhone(phone);
        if (n.length < 2) return setError("Please add your name.");
        if (!p) return setError("Please add a phone number we can reach you on.");
        setError("");
        window.open(onSend({ name: n, phone: p }), "_blank", "noopener,noreferrer");
      }}
    >
      <p className="text-[14px] text-nl-ink">So we know who&apos;s writing — then WhatsApp opens with your plan.</p>
      <label htmlFor="quiz-name" className="sr-only">
        Your name
      </label>
      <input id="quiz-name" autoFocus autoComplete="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={input} />
      <label htmlFor="quiz-phone" className="sr-only">
        Phone number
      </label>
      <input id="quiz-phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={32} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (with country code)" className={input} />
      {error && (
        <p className="text-[13.5px] text-[#ff8a8a]" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full">
        <SocialIcon name="whatsapp" size={18} /> Open WhatsApp
      </button>
      <p className="text-[12px] text-white/45">We save your name and number with your answers so we can reply.</p>
    </form>
  );
}

/**
 * The result as a picture: every answer on the left, a line across, and how Nine Labs solves that
 * exact point on the right (stacked, joined by a short line, on phones). Below it, "your mix": one
 * bar per service, sized by how many answers lead there. The same drawing for AI and scoring.
 */
function SolutionMap({ rows, questions, services, brand, reduced }: { rows: QuizAnswerRow[]; questions: QuizQuestion[]; services: Service[]; brand: string; reduced: boolean }) {
  if (!rows.length) return null;
  const mix = services
    .map((s) => ({ s, n: rows.filter((r) => r.slug === s.slug).length }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n || a.s.n - b.s.n);
  return (
    <section className="mt-6" aria-label={`How ${brand} solves each answer`}>
      <p className="label-mono !text-white/55">
        Your {rows.length} answers <span aria-hidden="true">→</span> how {brand} solves each
      </p>
      <ol className="mt-3 grid gap-2.5">
        {rows.map((r, i) => {
          const s = services.find((x) => x.slug === r.slug);
          return (
            <motion.li
              key={r.q}
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : 0.08 + i * 0.07, duration: 0.4, ease }}
              className="grid items-stretch sm:grid-cols-[minmax(0,1fr)_40px_minmax(0,1.35fr)]"
            >
              <div className="rounded-2xl border border-white/10 bg-[var(--chip-bg)] px-3.5 py-3">
                <p className="font-digits text-[10px] font-black uppercase tracking-wide text-white/50">
                  {String(i + 1).padStart(2, "0")} · {questions.find((q) => q.id === r.q)?.label ?? r.q}
                </p>
                <p className="mt-1 break-words text-[14px] font-medium leading-snug text-white">
                  {r.own && (
                    <span className="text-[color:var(--brand-a)]" title="In your own words">
                      ✎{" "}
                    </span>
                  )}
                  {r.said}
                </p>
              </div>
              <div className="relative flex h-5 items-center justify-center sm:h-auto" aria-hidden="true">
                <span className="absolute h-full w-px bg-gradient-to-b from-[color:var(--brand-a)] to-[color:var(--brand-b)] sm:h-px sm:w-full sm:bg-gradient-to-r" />
                <span className="relative h-2 w-2 rounded-full bg-[color:var(--brand-b)] shadow-[0_0_12px_var(--brand-a)]" />
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--brand-a)]/30 bg-[color:var(--brand-a)]/10 px-3.5 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-white">
                  {s ? <ActivityIcon icon={s.icon} size={20} play /> : <span className="text-[15px]">✓</span>}
                </span>
                <span className="min-w-0">
                  <span className="block font-digits text-[10px] font-black uppercase tracking-wide text-[color:var(--brand-a)]">{s?.short ?? brand}</span>
                  <span className="mt-0.5 block break-words text-[14px] leading-snug text-white/90">{r.how}</span>
                </span>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {mix.length > 0 && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[var(--chip-bg)] p-4">
          <p className="label-mono !text-[10px] !text-white/55">Your mix: where {brand} would put the work</p>
          <ul className="mt-3 grid gap-3">
            {mix.map(({ s, n }, i) => (
              <li key={s.slug} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 sm:grid-cols-[28px_minmax(0,10rem)_minmax(0,1fr)_auto]">
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/15 bg-white/5 text-white">
                  <ActivityIcon icon={s.icon} size={16} play />
                </span>
                <span className="min-w-0 break-words text-[13px] font-medium leading-snug text-white">{s.short}</span>
                <span className="col-span-3 h-2 overflow-hidden rounded-full bg-white/10 sm:col-span-1 sm:row-start-1 sm:[grid-column-start:3]">
                  <motion.span
                    className="block h-full rounded-full bg-gradient-to-r from-[color:var(--brand-a)] to-[color:var(--brand-b)]"
                    initial={{ width: reduced ? `${(n / rows.length) * 100}%` : "0%" }}
                    animate={{ width: `${(n / rows.length) * 100}%` }}
                    transition={{ delay: reduced ? 0 : 0.4 + i * 0.08, duration: 0.7, ease }}
                  />
                </span>
                <span className="row-start-1 font-digits text-[11px] font-black text-white/60 [grid-column-start:3] sm:[grid-column-start:4]">
                  {n} of {rows.length}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** The plan as a line of numbered stops: a vertical line on phones, one column per step on wider screens. */
function PlanLine({ steps, reduced }: { steps: AiQuizResult["steps"]; reduced: boolean }) {
  if (!steps.length) return null;
  return (
    <div className="mt-8">
      <p className="label-mono !text-white/55">Your plan</p>
      <ol className="mt-3 grid gap-3 sm:[grid-template-columns:var(--cols)] sm:gap-4" style={{ ["--cols" as string]: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <motion.li
            key={`${i}-${s.title}`}
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.2 + i * 0.12, duration: 0.45, ease }}
            className="relative flex gap-3 sm:block"
          >
            {i < steps.length - 1 && (
              <span
                className="absolute bottom-[-12px] left-4 top-8 w-px bg-gradient-to-b from-[color:var(--brand-a)] to-[color:var(--brand-b)] sm:bottom-auto sm:left-10 sm:right-[-16px] sm:top-4 sm:h-px sm:w-auto sm:bg-gradient-to-r"
                aria-hidden="true"
              />
            )}
            <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[color:var(--brand-a)] to-[color:var(--brand-b)] font-digits text-[12px] font-black text-paper shadow-[0_0_20px_var(--brand-a)]">
              {i + 1}
            </span>
            <span className="block min-w-0 flex-1 rounded-2xl border border-white/10 bg-[var(--chip-bg)] p-3.5 sm:mt-3">
              <span className="block font-display font-semibold text-white">{s.title}</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-nl-ink">{s.text}</span>
            </span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
