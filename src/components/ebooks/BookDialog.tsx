"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Ebook } from "@/content/site";
import { useDemo } from "@/components/providers/DemoSettings";
import { useQuiz } from "@/components/providers/QuizProvider";
import { getLenis } from "@/lib/scroll";
import { useModalLock } from "@/lib/useModalLock";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { Book3D } from "./Book3D";
import { BookCover } from "./BookCover";
import { LeadForm, type LeadValues } from "./LeadForm";

type Phase = "fly" | "front" | "open" | "closing";

function Inside({ book }: { book: Ebook }) {
  return (
    <div className="flex h-full flex-col p-6 sm:p-7">
      <p className="label-mono !text-[11px] !text-nl-purple">Inside this book</p>
      <h3 className="mt-2 text-[22px] font-semibold leading-tight">{book.title}</h3>
      <p className="mt-1.5 text-[13px] leading-snug text-nl-ink">{book.subtitle}</p>
      <ol className="mt-5 space-y-2.5">
        {book.chapters.map((c, i) => (
          <li key={c} className="flex items-baseline gap-3 border-b border-white/[0.06] pb-2.5 text-[13.5px] text-white/85">
            <span className="text-[11px] font-semibold text-nl-purple">{String(i + 1).padStart(2, "0")}</span>
            {c}
          </li>
        ))}
      </ol>
      <div className="mt-auto flex items-center gap-3 pt-5 text-[11.5px] text-white/50">
        <span className="rounded-full border border-white/10 px-2.5 py-1">{book.pages} pages</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1">PDF</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1">{book.readTime}</span>
      </div>
    </div>
  );
}

/** Collapsed contents list for the phone's single-page form — the book opens straight to the
    form (that's the whole point of opening it), with "what's inside" one tap away above it. */
function ChaptersDisclosure({ book }: { book: Ebook }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-[13px] font-medium text-white/80">
          What&rsquo;s inside <span className="text-white/40">· {book.chapters.length} chapters</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ol className="space-y-2 px-4 pb-4">
          {book.chapters.map((c, i) => (
            <li key={c} className="flex items-baseline gap-2.5 text-[12.5px] text-white/75">
              <span className="text-[11px] font-semibold text-nl-purple">{String(i + 1).padStart(2, "0")}</span>
              {c}
            </li>
          ))}
        </ol>
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
        <path d="M17 29l7 7 15-16" stroke="rgb(var(--fg-rgb))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="construct-draw" style={{ animationDelay: "1.3s" }} />
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
  // the 3D spread needs room; phones (and short landscape screens) get a flat page instead
  const wide = useMediaQuery("(min-width: 768px) and (min-height: 560px)", true);
  const [phase, setPhase] = useState<Phase>(reduced ? "open" : "fly");
  const [lead, setLead] = useState<LeadValues | null>(null);
  const formPage = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const close = () => {
    if (reduced) return onClose();
    setPhase("closing");
    // wait for the cover to swing shut (1.15 s) before the book flies back to the shelf
    window.setTimeout(onClose, 950);
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

  // Once the book is open, the form is already on screen — put the cursor straight into it.
  useEffect(() => {
    if (reduced || phase !== "open" || lead) return;
    const t = window.setTimeout(() => formPage.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }), 650);
    return () => window.clearTimeout(t);
  }, [phase, reduced, lead]);

  useEffect(() => {
    if (!wide) return; // the phone page has its own lock (useModalLock)
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
  }, [wide]);

  const isOpen = phase === "open";
  const turned = !!lead;

  if (!wide) return <BookPage book={book} onClose={onClose} reduced={reduced} />;

  // Page size for the open spread (desktop/tablet): left page = contents, right page = form.
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
      <div className="fixed inset-0 bg-nl-bg/80 backdrop-blur-xl" onClick={close} aria-hidden="true" />
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
                <div ref={formPage} className="h-full overflow-y-auto overscroll-contain p-6 sm:p-7" aria-hidden={turned || !isOpen ? true : undefined} inert={turned || !isOpen}>
                  <LeadForm book={book} onDone={setLead} />
                </div>
              }
              underPage={turned ? <Success book={book} lead={lead} onBack={close} /> : null}
            />
          </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Phones (and short landscape screens): the book opens into a flat, full-screen page — the cover
 * peels open as a short animation, then a normal scrolling page with the chapters and the form.
 * No 3D page to scroll inside, 16 px inputs (no iOS zoom), no auto-focus (no surprise keyboard),
 * fields scroll above the keyboard, and the confirmation is never cut off.
 */
function BookPage({ book, onClose, reduced }: { book: Ebook; onClose: () => void; reduced: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const [lead, setLead] = useState<LeadValues | null>(null);
  useModalLock(true, panel, onClose);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-nl-bg"
      initial={{ opacity: 0, y: reduced ? 0 : 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : 28 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Get the free e-book: ${book.title}`}
        tabIndex={-1}
        className="h-full overflow-y-auto overscroll-contain outline-none"
        data-lenis-prevent
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-nl-bg/85 px-4 py-3 backdrop-blur-xl">
          <p className="label-mono">Free e-book {book.n}</p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>

        <div className="mx-auto max-w-[520px] px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-6">
          <div className="flex items-center gap-5">
            {/* the cover peels open onto the first page */}
            <div className="bp-book relative h-[150px] w-[104px] shrink-0" aria-hidden="true">
              <div className="bp-paper absolute inset-0 rounded-[3px_8px_8px_3px]" />
              <div className={`bp-cover on-dark absolute inset-0 overflow-hidden rounded-[3px_8px_8px_3px] ${reduced ? "" : "bp-cover--open"}`}>
                <BookCover book={book} />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-[22px] font-semibold leading-tight">{book.title}</h2>
              <p className="mt-1 text-[14px] leading-snug text-nl-ink">{book.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[12px] text-white/60">
                <span className="rounded-full border border-white/12 px-2.5 py-1">{book.pages} pages</span>
                <span className="rounded-full border border-white/12 px-2.5 py-1">PDF</span>
                <span className="rounded-full border border-white/12 px-2.5 py-1">{book.readTime}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ChaptersDisclosure book={book} />
          </div>

          {lead ? (
            <div className="mt-2 rounded-3xl border border-white/10 p-1">
              <Success book={book} lead={lead} onBack={onClose} />
            </div>
          ) : (
            <LeadForm book={book} onDone={setLead} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
