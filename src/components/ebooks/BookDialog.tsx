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

  // Once the book is open, the form is already on screen — put the cursor straight into it.
  useEffect(() => {
    if (reduced || phase !== "open" || lead) return;
    const t = window.setTimeout(() => formPage.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }), 650);
    return () => window.clearTimeout(t);
  }, [phase, reduced, lead]);

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

  // Page size for the open spread (desktop/tablet): left page = contents, right page = form.
  const pw = "min(372px, 42vw, calc((100svh - 120px) / 1.42))";
  const ph = `calc(${pw} * 1.42)`;

  // Phone: one page, as wide as the screen allows — the form, visible the moment the cover opens.
  const mw = "min(92vw, 400px, calc((100svh - 150px) / 1.3))";
  const mh = `calc(${mw} * 1.3)`;

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
                <div ref={formPage} className="h-full overflow-y-auto overscroll-contain p-6 sm:p-7" aria-hidden={turned || !isOpen ? true : undefined}>
                  <LeadForm book={book} onDone={setLead} />
                </div>
              }
              underPage={turned ? <Success book={book} lead={lead} onBack={close} /> : null}
            />
          </motion.div>
        ) : (
          /* Phone: a single page. The cover opens straight onto the form — that's what someone
             tapped "get the free e-book" to do — with the chapter list one tap away above it,
             not a page they have to get past first. Sending the form turns the same page over
             to the confirmation, exactly like the desktop spread's right-hand page. */
          <div className="flex w-full flex-col items-center">
            <motion.div layoutId={`book-${book.slug}`} className="book-scene" transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <Book3D
                book={book}
                w={mw}
                h={mh}
                d="22px"
                ry={phase === "fly" ? "24deg" : "0deg"}
                rx={phase === "fly" ? "4deg" : "0deg"}
                open={isOpen}
                turned={turned}
                insideCover={<div className="h-full" aria-hidden="true" />}
                firstPage={
                  <div ref={formPage} className="h-full overflow-y-auto overscroll-contain p-5" aria-hidden={turned || !isOpen ? true : undefined} inert={turned || !isOpen}>
                    <ChaptersDisclosure book={book} />
                    <LeadForm book={book} onDone={setLead} compact />
                  </div>
                }
                underPage={turned ? <Success book={book} lead={lead} onBack={close} /> : null}
              />
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
