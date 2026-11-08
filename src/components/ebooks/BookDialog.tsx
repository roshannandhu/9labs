"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Ebook } from "@/content/site";
import { useDemo } from "@/components/providers/DemoSettings";
import { useQuiz } from "@/components/providers/QuizProvider";
import { getLenis } from "@/lib/scroll";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { Book3D } from "./Book3D";
import { LeadForm, type LeadValues } from "./LeadForm";

type Phase = "fly" | "front" | "open" | "closing";

function Inside({ book, onNext }: { book: Ebook; onNext?: () => void }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto overscroll-contain p-6 sm:p-7">
      <p className="label-mono !text-[10px] !text-nl-purple">Inside this book</p>
      <h3 className="mt-2 text-[22px] font-semibold leading-tight">{book.title}</h3>
      <p className="mt-1.5 text-[13px] leading-snug text-nl-ink">{book.subtitle}</p>
      <ol className="mt-5 space-y-2.5">
        {book.chapters.map((c, i) => (
          <li key={c} className="flex items-baseline gap-3 border-b border-white/[0.06] pb-2.5 text-[13.5px] text-white/85">
            <span className="font-mono text-[11px] text-nl-purple">{String(i + 1).padStart(2, "0")}</span>
            {c}
          </li>
        ))}
      </ol>
      <div className="mt-auto flex items-center gap-3 pt-5 text-[11.5px] text-white/50">
        <span className="rounded-full border border-white/10 px-2.5 py-1">{book.pages} pages</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1">PDF</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1">{book.readTime}</span>
      </div>
      {onNext && (
        <>
          <button type="button" className="btn btn-primary btn-sm mt-5 w-full !min-h-[46px]" onClick={onNext}>
            Get it free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="label-mono mt-2.5 text-center !text-[9.5px] !text-white/35">or swipe to turn the page</p>
        </>
      )}
    </div>
  );
}

function Success({ book, lead, onBack }: { book: Ebook; lead: LeadValues | null; onBack: () => void }) {
  const quiz = useQuiz();
  const first = lead?.name.trim().split(/\s+/)[0] ?? "";
  return (
    <div className="flex h-full flex-col items-start p-6 sm:p-7" role="status" aria-live="polite">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true" className="drop-shadow-[0_0_14px_var(--nl-purple)]">
        <circle cx="28" cy="28" r="26" stroke="var(--nl-purple)" strokeWidth="1.5" pathLength={1} className="construct-draw" style={{ animationDelay: "0.9s" }} />
        <path d="M17 29l7 7 15-16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="construct-draw" style={{ animationDelay: "1.3s" }} />
      </svg>
      <h3 className="mt-5 text-[22px] font-semibold leading-tight">You’re on the list{first ? `, ${first}` : ""}!</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-nl-ink">
        We’ll send <span className="text-white">“{book.title}”</span> to <span className="text-nl-purple">{lead?.email}</span> as soon as it’s approved. Keep an eye on your inbox.
      </p>
      <p className="label-mono mt-3 !text-[9.5px] !text-white/35">Demo — no email was sent</p>
      <div className="mt-auto flex w-full flex-col gap-2.5">
        <button type="button" className="btn btn-primary btn-sm w-full" onClick={() => quiz.open()}>
          Start The 9 Quiz
        </button>
        <button type="button" className="btn btn-outline btn-sm w-full" onClick={onBack}>
          Back to the shelf
        </button>
      </div>
    </div>
  );
}

export function BookDialog({ book, onClose }: { book: Ebook; onClose: () => void }) {
  const { reduced } = useDemo();
  const wide = useMediaQuery("(min-width: 768px)", true);
  const [phase, setPhase] = useState<Phase>(reduced ? "open" : "fly");
  const [lead, setLead] = useState<LeadValues | null>(null);
  // phone: one page at a time — "inside" (contents) turns over to "form"
  const [step, setStep] = useState<"inside" | "form">("inside");
  const swipe = useRef<number | null>(null);
  const formPage = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const close = () => {
    if (reduced) return onClose();
    setPhase("closing");
    window.setTimeout(onClose, 650);
  };
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (reduced) return;
    const a = window.setTimeout(() => setPhase("front"), 60);
    const b = window.setTimeout(() => setPhase("open"), 720);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [reduced]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const lenis = getLenis();
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeBtn.current?.focus({ preventScroll: true }), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && dialog.current) {
        const f = [...dialog.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea")].filter(
          (el) => el.offsetParent !== null && !el.closest("[aria-hidden='true']"),
        );
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  const isOpen = phase === "open";
  const turned = !!lead;
  const toForm = () => {
    setStep("form");
    // once the page has turned, put the cursor in the first field
    if (!reduced) window.setTimeout(() => formPage.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }), 1100);
  };

  // Phone single page: as wide as the screen allows, a little taller than a real book so the form fits.
  const mw = "min(92vw, 380px, calc((100svh - 130px) / 1.6))";
  const mh = `calc(${mw} * 1.6)`;

  // Page size for the open spread (desktop/tablet).
  const pw = "min(372px, 42vw, calc((100svh - 120px) / 1.42))";
  const ph = `calc(${pw} * 1.42)`;

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      data-lenis-prevent
    >
      <div className="fixed inset-0 bg-[#050507]/80 backdrop-blur-xl" onClick={close} aria-hidden="true" />
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(40% 50% at 50% 50%, color-mix(in srgb, var(--nl-purple) 14%, transparent), transparent 70%)" }}
        aria-hidden="true"
      />
      <div ref={dialog} role="dialog" aria-modal="true" aria-label={`Get the free e-book: ${book.title}`} className="relative flex min-h-full items-center justify-center px-4 py-16">
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          className="glass fixed right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full text-white/80 transition-colors hover:text-white sm:right-6 sm:top-6"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>

        {wide ? (
          <motion.div layoutId={`book-${book.slug}`} className="book-scene" transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <Book3D
              book={book}
              w={pw}
              h={ph}
              d="34px"
              ry={phase === "fly" ? "24deg" : "0deg"}
              rx={phase === "fly" ? "4deg" : "0deg"}
              bx={isOpen ? `calc(${pw} / 2)` : "0px"}
              bz={isOpen ? "-40px" : "0px"}
              open={isOpen}
              turned={turned}
              insideCover={<Inside book={book} />}
              firstPage={
                <div className="h-full overflow-y-auto overscroll-contain p-6 sm:p-7" aria-hidden={turned || !isOpen ? true : undefined}>
                  <LeadForm book={book} onDone={setLead} />
                </div>
              }
              underPage={turned ? <Success book={book} lead={lead} onBack={close} /> : null}
            />
          </motion.div>
        ) : (
          /* Phone: the same book, one page at a time. The cover swings open onto "Inside this book";
             "Get it free" (or a swipe) turns the page, and the form is on the next page of the book.
             After sending, the same page shows the confirmation. */
          <div
            className="flex w-full flex-col items-center"
            onPointerDown={(e) => {
              swipe.current = e.clientX;
            }}
            onPointerUp={(e) => {
              const x0 = swipe.current;
              swipe.current = null;
              if (x0 == null || !isOpen || turned) return;
              const dx = e.clientX - x0;
              if (dx < -50 && step === "inside") toForm();
              else if (dx > 50 && step === "form") setStep("inside");
            }}
          >
            <motion.div layoutId={`book-${book.slug}`} className="book-scene" transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <Book3D
                book={book}
                w={mw}
                h={mh}
                d="22px"
                ry={phase === "fly" ? "24deg" : "0deg"}
                rx={phase === "fly" ? "4deg" : "0deg"}
                open={isOpen}
                turned={step === "form"}
                insideCover={<div className="h-full" />}
                firstPage={
                  <div className="h-full" aria-hidden={!isOpen || step === "form" ? true : undefined} inert={!isOpen || step === "form"}>
                    <Inside book={book} onNext={toForm} />
                  </div>
                }
                underPage={
                  <div ref={formPage} className="relative h-full overflow-y-auto overscroll-contain p-5" aria-hidden={step !== "form" ? true : undefined} inert={step !== "form"}>
                    {turned ? (
                      <Success book={book} lead={lead} onBack={close} />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setStep("inside")}
                          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50 transition-colors hover:text-white"
                        >
                          ‹ Contents
                        </button>
                        <LeadForm book={book} onDone={setLead} compact />
                      </>
                    )}
                  </div>
                }
              />
            </motion.div>
            {/* page dots */}
            <div className="mt-5 flex items-center gap-2" aria-hidden="true">
              {(["inside", "form"] as const).map((p) => (
                <span key={p} className={`h-1.5 rounded-full transition-all duration-500 ${step === p ? "w-6 bg-nl-purple shadow-[0_0_10px_var(--nl-purple)]" : "w-1.5 bg-white/25"}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
