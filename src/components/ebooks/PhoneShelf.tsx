"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fill } from "@/content/site";
import { useSite } from "@/components/providers/SiteProvider";
import { useDemo } from "@/components/providers/DemoSettings";
import { Book3D } from "./Book3D";

const W = "min(54vw, 224px)";
const H = `calc(${W} * 1.45)`;
const STEP = `calc(${W} * 0.92)`; // centre → peek distance
const GLOW: Record<string, string> = { blue: "#5a7bf0", purple: "var(--brand-a)", duo: "var(--brand-b)" };

/**
 * E-books on a phone: a horizontal carousel, one book at a time with the previous and next ones
 * peeking in from the sides. Swipe left/right (vertical swipes still scroll the page), tap a
 * peeking book, or use the arrows / dots. It loops endlessly:
 * slots are keyed by a running index, so the book that wraps round slides in from hidden instead
 * of jumping across. Book order, titles and covers all come from content (admin later).
 */
export function PhoneShelf({ onOpen }: { onOpen: (slug: string) => void }) {
  const { reduced } = useDemo();
  const site = useSite();
  const t = site.ebooksSection;
  const books = site.ebooks;
  const n = books.length;
  const [cur, setCur] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const mod = (v: number) => ((v % n) + n) % n;
  const book = books[mod(cur)];

  const slots = [-2, -1, 0, 1, 2].map((k) => ({ k, v: cur + k, b: books[mod(cur + k)] }));

  return (
    <div className="md:hidden">
      <div
        className="phone-shelf relative -mx-4 touch-pan-y select-none overflow-hidden sm:-mx-8"
        style={{ height: `calc(${H} * 1.18)` }}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY };
          swiped.current = false;
        }}
        onPointerUp={(e) => {
          const s = start.current;
          start.current = null;
          if (!s) return;
          const dy = e.clientY - s.y;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
            swiped.current = true;
            setCur((c) => c + (dx < 0 ? 1 : -1));
          }
        }}
        onPointerCancel={() => (start.current = null)}
        aria-roledescription="carousel"
        aria-label={t.label}
      >
        {/* soft glow in the focused book's colour (a gradient, no blur filter: cheap on phones) */}
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 transition-[background] duration-700"
          style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${GLOW[book.tone]} 26%, transparent), transparent)` }}
          aria-hidden="true"
        />
        {slots.map(({ k, v, b }) => {
          const a = Math.abs(k);
          return (
            <button
              key={v}
              type="button"
              tabIndex={k === 0 ? 0 : -1}
              aria-hidden={k !== 0}
              aria-label={k === 0 ? `Open “${b.title}” and get it free` : undefined}
              onClick={() => {
                if (swiped.current) return;
                if (k === 0) onOpen(b.slug);
                else setCur((c) => c + k);
              }}
              className="ps-slot absolute left-1/2 top-1/2 block"
              data-focus={k === 0}
              style={{
                width: W,
                height: H,
                transform: `translate(-50%, -50%) translateX(calc(${STEP} * ${k})) scale(${(1 - Math.min(a, 1.5) * 0.22).toFixed(3)})`,
                opacity: a >= 2 ? 0 : 1 - a * 0.4,
                zIndex: 10 - a,
                transition: reduced ? "none" : "transform 0.65s cubic-bezier(.16,1,.3,1), opacity 0.65s cubic-bezier(.16,1,.3,1)",
              }}
            >
              <span className="book-scene block h-full w-full">
                <Book3D book={b} w={W} h={H} d="22px" ry={k === 0 ? "12deg" : k < 0 ? "26deg" : "-4deg"} rx="3deg" />
              </span>
            </button>
          );
        })}
        {/* fade the peeking books into the page */}
        <span className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[12%] bg-gradient-to-r from-nl-bg to-transparent" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[12%] bg-gradient-to-l from-nl-bg to-transparent" aria-hidden="true" />
      </div>

      {/* controls */}
      <div className="mt-2 flex items-center justify-center gap-4">
        <button type="button" onClick={() => setCur((c) => c - 1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/80" aria-label="Previous e-book">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 3L5 7l4 4" />
          </svg>
        </button>
        <div className="flex gap-2" aria-hidden="true">
          {books.map((b, i) => (
            <span key={b.slug} className={`h-1.5 rounded-full transition-all duration-500 ${i === mod(cur) ? "w-6 bg-[linear-gradient(90deg,var(--brand-a),var(--brand-b))]" : "w-1.5 bg-white/25"}`} />
          ))}
        </div>
        <button type="button" onClick={() => setCur((c) => c + 1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/80" aria-label="Next e-book">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </button>
      </div>

      {/* the focused book */}
      <div className="mt-6 min-h-[190px] text-center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={book.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.35 }}
          >
            <p className="label-mono">
              {fill(t.cardLabel, { n: book.n, pages: book.pages })}
            </p>
            <h3 className="mt-2 text-[22px] font-semibold">{book.title}</h3>
            <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-relaxed text-nl-ink">{book.oneLiner}</p>
            <button type="button" className="btn btn-primary btn-sm mt-5" onClick={() => onOpen(book.slug)}>
              {t.cardCta}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
