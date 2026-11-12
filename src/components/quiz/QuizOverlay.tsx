"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fill } from "@/content/site";
import { useSite, useWhatsApp } from "@/components/providers/SiteProvider";
import { beacon, newRef, postJson } from "@/lib/api";
import { scoreQuiz, type QuizAnswers } from "@/lib/quiz/score";
import { scrollToId } from "@/lib/scroll";
import { useModalLock } from "@/lib/useModalLock";
import { useDemo } from "@/components/providers/DemoSettings";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { SocialIcon } from "@/components/icons/SocialIcon";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The 9 Quiz: the admin's questions, one per screen, answered with big tap cards (keys 1–5 work too).
 * Single-answer questions move on by themselves; "pick all that apply" ones get a Next button.
 * The result is worked out in the browser (src/lib/quiz/score.ts): the top three activities with
 * a match score and why, a three-step plan, and one tap to send it all to Nine Labs on WhatsApp.
 * Each finished quiz is also saved for the admin (Quiz → Quiz results), in the background.
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
      window.clearTimeout(advance.current);
      advance.current = window.setTimeout(() => go(idx + 1), reduced ? 120 : 260);
    },
    [q, idx, go, reduced, commit],
  );
  const next = useCallback(() => {
    if (q && idx === live.current && latest.current[q.id]?.length) go(idx + 1);
  }, [q, idx, go]);

  // keys: 1–5 pick an answer, Enter = next, ← = back
  useEffect(() => {
    if (!open || !q) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) {
        e.preventDefault();
        choose(q.options[n - 1].id);
      } else if (e.key === "Enter" && q.multi) {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" && idx > 0) {
        go(idx - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, q, idx, choose, go, next]);

  const result = useMemo(() => (idx >= COUNT ? scoreQuiz(site, answers) : null), [idx, answers, site, COUNT]);

  // a finished quiz is saved once for the admin; the result never waits for it
  const done = Boolean(result);
  useEffect(() => {
    if (!done || !open) return;
    ref.current = newRef();
    void postJson("/api/public/quiz-submissions", { ref: ref.current, answers });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per finished quiz
  }, [done, open]);
  const slide = reduced ? { x: 0 } : { x: dir * 40 };

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
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => go(idx - 1)}
                        disabled={idx === 0}
                        className="btn btn-sm text-white/60 hover:text-white disabled:invisible"
                      >
                        ← Back
                      </button>
                      {q.multi && (
                        <button type="button" onClick={next} disabled={!picked.length} className="btn btn-primary btn-sm disabled:opacity-40">
                          Next →
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  result && (
                    <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                      <p className="label-mono !text-[color:var(--brand-a)]">{t.label}</p>
                      <h2 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-white">
                        {t.heading}
                      </h2>
                      <p className="mt-3 text-[16px] leading-relaxed text-nl-ink">{result.summary}</p>

                      <ul className="mt-6 grid gap-3">
                        {result.matches.map((m, i) => (
                          <motion.li
                            key={m.service.slug}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease }}
                            className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[var(--chip-bg)] p-4 sm:p-5"
                          >
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[color:var(--brand-a)]/35 bg-[color:var(--brand-a)]/10 text-white">
                              <ActivityIcon icon={m.service.icon} size={26} play />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-3">
                                <span className="font-display text-[16px] font-semibold text-white sm:text-[17px]">
                                  {i + 1}. {m.service.title}
                                </span>
                                <span className="shrink-0 font-digits text-xs font-black text-[color:var(--brand-a)]">{m.score}%</span>
                              </span>
                              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10">
                                <motion.span
                                  className="block h-full rounded-full bg-gradient-to-r from-[color:var(--brand-a)] to-[color:var(--brand-b)]"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${m.score}%` }}
                                  transition={{ delay: 0.35 + i * 0.1, duration: 0.9, ease }}
                                />
                              </span>
                              <span className="mt-2.5 block text-[14px] leading-relaxed text-nl-ink">{m.why}</span>
                            </span>
                          </motion.li>
                        ))}
                      </ul>

                      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                        {result.steps.map((s, i) => (
                          <li key={s.title} className="rounded-2xl border border-white/10 bg-[var(--chip-bg)] p-4">
                            <span className="font-digits text-xs font-black text-[color:var(--brand-a)]">0{i + 1}</span>
                            <p className="mt-1 font-display font-semibold text-white">{s.title}</p>
                            <p className="mt-1 text-[13.5px] leading-relaxed text-nl-ink">{s.text}</p>
                          </li>
                        ))}
                      </ol>

                      <div className="mt-6 rounded-3xl border border-white/10 bg-[var(--chip-bg)] p-4 sm:p-5">
                        <a
                          href={wa(result.whatsappText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary w-full"
                          onClick={() => beacon("/api/public/quiz-submissions", { ref: ref.current, action: "whatsapp" })}
                        >
                          <SocialIcon name="whatsapp" size={18} /> {t.whatsappCta}
                        </a>
                        {!t.emailEnabled ? null : sent ? (
                          <p className="mt-3 text-[15px] text-white" role="status">
                            ✓ {fill(t.emailSent, { email })}
                          </p>
                        ) : (
                          <form
                            className="mt-3 flex flex-col gap-2.5 sm:flex-row"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!/^\S+@\S+\.\S+$/.test(email) || sending) return;
                              setSending(true);
                              const res = await postJson("/api/public/quiz-email", { ref: ref.current, email, answers });
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
