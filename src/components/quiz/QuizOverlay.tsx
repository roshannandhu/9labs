"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { generateQuizAnswer, type QuizAnswer } from "@/lib/quiz/provider";
import { getLenis, scrollToId } from "@/lib/scroll";
import { useDemo } from "@/components/providers/DemoSettings";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { NINE_PATH } from "@/components/hero/nine-path";
import { SocialIcon } from "@/components/icons/SocialIcon";

type Step = "ask" | "thinking" | "result";
const STATUS = ["Reading your goals…", "Matching our nine activities…", "Drafting your bridge plan…"];
const ease = [0.16, 1, 0.3, 1] as const;

function useTypewriter(text: string, enabled: boolean, speed = 14) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restart typing for a new answer
    setN(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, enabled, speed]);
  return enabled ? text.slice(0, n) : text;
}

export default function QuizOverlay({ open, prefill, onClose }: { open: boolean; prefill: string; onClose: () => void }) {
  const { reduced } = useDemo();
  const [step, setStep] = useState<Step>("ask");
  const [text, setText] = useState(prefill);
  const [answer, setAnswer] = useState<QuizAnswer | null>(null);
  const [status, setStatus] = useState(0);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  // Reset when (re)opened.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the dialog each time it opens
    setStep("ask");
    setText(prefill);
    setAnswer(null);
    setSent(false);
    setEmail("");
  }, [open, prefill]);

  // Lock scroll, focus management, Escape and a simple focus trap.
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const lenis = getLenis();
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const ta = textarea.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }, 350);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
      lastFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  // Rotating status while "thinking".
  useEffect(() => {
    if (step !== "thinking") return;
    const id = window.setInterval(() => setStatus((s) => (s + 1) % STATUS.length), 900);
    return () => window.clearInterval(id);
  }, [step]);

  const submit = async () => {
    if (text.trim().length < 8) return;
    setStatus(0);
    setStep("thinking");
    const a = await generateQuizAnswer(text);
    setAnswer(a);
    setStep("result");
  };

  const typed = useTypewriter(answer?.summary ?? "", step === "result" && !reduced);
  const canSubmit = text.trim().length >= 8;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          data-lenis-prevent
        >
          <div className="fixed inset-0 bg-[#050507]/85 backdrop-blur-2xl" onClick={onClose} aria-hidden="true" />
          <div
            className="pointer-events-none fixed inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(50% 40% at 50% 0%, color-mix(in srgb, var(--nl-purple) 22%, transparent), transparent 70%), radial-gradient(40% 40% at 85% 100%, color-mix(in srgb, var(--nl-blue) 16%, transparent), transparent 70%)",
            }}
            aria-hidden="true"
          />

          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-dialog-title"
            className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-10 pt-5 sm:px-6 sm:pt-8"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <div className="flex items-center justify-between">
              <p className="label-mono flex items-center gap-2">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-nl-purple" /> The 9 Quiz
                <span className="rounded-full border border-white/15 px-2 py-0.5 !text-[9px] text-white/50">Demo</span>
              </p>
              <button
                type="button"
                onClick={onClose}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/80 transition-colors hover:border-nl-purple hover:text-white"
                aria-label="Close The 9 Quiz"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center py-8">
              <AnimatePresence mode="wait">
                {step === "ask" && (
                  <motion.div key="ask" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease }}>
                    <h2 id="quiz-dialog-title" className="text-[clamp(2rem,6vw,3.6rem)] font-semibold leading-[1] tracking-[-0.04em]">
                      What do you need<span className="text-nl-purple">?</span>
                    </h2>
                    <p className="mt-3 text-[15px] text-nl-ink sm:text-base">Describe it in your own words. Our AI shows you how Nine Labs would deliver it.</p>
                    <form
                      className="mt-7"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                      }}
                    >
                      <label htmlFor="quiz-need" className="sr-only">
                        Describe what you need
                      </label>
                      <div className="glass relative rounded-3xl p-2 focus-within:[--glass-edge:linear-gradient(var(--nl-purple),var(--nl-purple))] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--nl-purple)_15%,transparent)]">
                        <textarea
                          id="quiz-need"
                          ref={textarea}
                          value={text}
                          maxLength={1000}
                          rows={5}
                          onChange={(e) => setText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                          }}
                          placeholder={site.quiz.examples[0]}
                          className="block w-full resize-none bg-transparent px-4 py-3 text-[16px] leading-relaxed text-white placeholder:text-white/30 focus:outline-none sm:text-[17px]"
                        />
                        <div className="flex items-center justify-between gap-3 px-3 pb-2">
                          <span className="font-mono text-[11px] text-white/35">{text.length}/1000</span>
                          <button type="submit" disabled={!canSubmit} className="btn btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-40" data-cursor="Go">
                            Show me how
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </form>
                    <p className="label-mono mt-6">Or start from</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {site.quiz.chips.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setText((t) => (t.trim() ? `${t.trim()} ${c}.` : `${c}. `));
                            textarea.current?.focus();
                          }}
                          className="rounded-full border border-white/12 px-3.5 py-1.5 text-[13px] text-white/75 transition-colors hover:border-nl-purple/70 hover:text-white"
                        >
                          + {c}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === "thinking" && (
                  <motion.div
                    key="thinking"
                    className="flex flex-col items-center py-10 text-center"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.4, ease }}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="relative h-40 w-28">
                      <svg viewBox="10 60 380 500" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                        <path d={NINE_PATH} fill="var(--nl-purple)" fillOpacity=".3" style={{ filter: "blur(18px)" }} />
                        <path d={NINE_PATH} fill="#0b1130" stroke="white" strokeOpacity=".1" strokeWidth="2" />
                        <path
                          d={NINE_PATH}
                          pathLength={1}
                          fill="none"
                          stroke="var(--nl-blue)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="0.3 0.7"
                          style={{ animation: "quiz-trace 1.4s linear infinite" }}
                        />
                      </svg>
                      <span className="absolute inset-x-[-40%] top-0 h-px bg-gradient-to-r from-transparent via-nl-purple to-transparent" style={{ animation: "quiz-scan 1.8s ease-in-out infinite" }} />
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={status}
                        className="mt-8 font-display text-xl text-white"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3 }}
                      >
                        {STATUS[status]}
                      </motion.p>
                    </AnimatePresence>
                    <p className="label-mono mt-3">The 9 is thinking</p>
                  </motion.div>
                )}

                {step === "result" && answer && (
                  <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease }}>
                    <p className="label-mono !text-nl-purple">Your bridge plan</p>
                    <h2 id="quiz-dialog-title" className="mt-2 text-[clamp(1.9rem,5vw,3rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
                      Here’s how we’d get you across.
                    </h2>
                    <p className="mt-4 min-h-[4.5em] text-[16px] leading-relaxed text-white/80 sm:text-[17px]" aria-label={answer.summary}>
                      <span aria-hidden="true">{typed}</span>
                    </p>

                    <ul className="mt-6 grid gap-3">
                      {answer.matches.map((m, i) => (
                        <motion.li
                          key={m.service.slug}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 + i * 0.12, duration: 0.5, ease }}
                          className="glass group relative flex items-start gap-4 rounded-2xl p-4 transition-shadow hover:shadow-[0_0_0_1px_var(--nl-purple),0_20px_50px_-24px_var(--nl-purple)] sm:p-5"
                        >
                          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-nl-purple/35 bg-nl-purple/10 text-white">
                            <ActivityIcon icon={m.service.icon} size={26} play />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className="font-display text-[16px] font-semibold text-white sm:text-[17px]">{m.service.title}</span>
                              <span className="font-mono text-xs text-nl-purple">{m.score}% match</span>
                            </span>
                            <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10">
                              <motion.span
                                className="block h-full rounded-full bg-gradient-to-r from-nl-blue to-nl-purple"
                                initial={{ width: 0 }}
                                animate={{ width: `${m.score}%` }}
                                transition={{ delay: 0.45 + i * 0.12, duration: 1, ease }}
                              />
                            </span>
                            <span className="mt-2.5 block text-[14px] leading-relaxed text-nl-ink">{m.why}</span>
                          </span>
                        </motion.li>
                      ))}
                    </ul>

                    <ol className="mt-8 grid gap-3 sm:grid-cols-3">
                      {answer.steps.map((s, i) => (
                        <li key={s.title} className="glass relative rounded-2xl p-4">
                          <span className="font-mono text-xs text-nl-purple">0{i + 1}</span>
                          <p className="mt-1 font-display font-semibold text-white">{s.title}</p>
                          <p className="mt-1 text-[13.5px] leading-relaxed text-nl-ink">{s.text}</p>
                        </li>
                      ))}
                    </ol>

                    <div className="glass relative mt-8 rounded-3xl p-4 sm:p-5">
                      {sent ? (
                        <p className="text-[15px] text-white" role="status">
                          ✓ Plan on its way to <span className="text-nl-purple">{email}</span>. <span className="text-white/50">(Demo — nothing was sent.)</span>
                        </p>
                      ) : (
                        <form
                          className="flex flex-col gap-3 sm:flex-row"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (/^\S+@\S+\.\S+$/.test(email)) setSent(true);
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
                            placeholder="you@company.com"
                            className="min-h-[48px] flex-1 rounded-full border border-white/12 bg-transparent px-5 text-[15px] text-white placeholder:text-white/30 focus:border-nl-purple/70 focus:outline-none"
                          />
                          <button type="submit" className="btn btn-primary btn-sm !min-h-[48px]">
                            Send me this plan
                          </button>
                        </form>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <a
                          href={`https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(answer.whatsappText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          <SocialIcon name="whatsapp" size={16} /> Chat on WhatsApp
                        </a>
                        <button
                          type="button"
                          className="btn btn-sm text-white/70 hover:text-white"
                          onClick={() => {
                            onClose();
                            window.setTimeout(() => scrollToId("ebooks"), 450);
                          }}
                        >
                          Get the free e-books →
                        </button>
                        <button type="button" className="btn btn-sm text-white/50 hover:text-white" onClick={() => setStep("ask")}>
                          ↺ Start over
                        </button>
                      </div>
                    </div>
                    <p className="label-mono mt-5 !text-white/30">Demo — answers are simulated. The live version uses AI.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
