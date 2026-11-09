"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { useDemo } from "@/components/providers/DemoSettings";
import { Book3D } from "./Book3D";

const W = "min(56vw, 228px)";
const H = `calc(${W} * 1.45)`;
const STEP = `calc(${W} * 1.45 * 0.6)`; // centre → peek distance
const GLOW: Record<string, string> = { blue: "#5a7bf0", purple: "#8c53fe", duo: "#5ce0e6" };

/**
 * E-books on a phone: a vertical carousel, one book at a time with the previous and next ones
 * peeking above and below. Swipe up/down on the books (only that area takes the gesture, the page
 * scrolls normally around it), tap a peeking book, or use the arrows / dots. It loops endlessly:
 * slots are keyed by a running index, so the book that wraps round slides in from hidden instead
 * of jumping across. Book order, titles and covers all come from content (admin later).
 */
export function PhoneShelf({ onOpen }: { onOpen: (slug: string) => void }) {
  const { reduced } = useDemo();
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
        className="phone-shelf relative mx-auto touch-none select-none"
        style={{ height: `calc(${H} * 1.72)` }}
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
          if (Math.abs(dy) > 36 && Math.abs(dy) > Math.abs(dx)) {
            swiped.current = true;
            setCur((c) => c + (dy < 0 ? 1 : -1));
          }
        }}
        onPointerCancel={() => (start.current = null)}
        aria-roledescription="carousel"
        aria-label="Free e-books"
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
                transform: `translate(-50%, -50%) translateY(calc(${STEP} * ${k})) scale(${(1 - Math.min(a, 1.5) * 0.3).toFixed(3)})`,
                opacity: a >= 2 ? 0 : 1 - a * 0.45,
                zIndex: 10 - a,
                transition: reduced ? "none" : "transform 0.65s cubic-bezier(.16,1,.3,1), opacity 0.65s cubic-bezier(.16,1,.3,1)",
              }}
            >
              <span className="book-scene block h-full w-full">
                <Book3D book={b} w={W} h={H} d="22px" ry={k === 0 ? "14deg" : "22deg"} rx="3deg" />
              </span>
            </button>
          );
        })}
        {/* fade the peeking books into the page */}
        <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[18%] bg-gradient-to-b from-nl-bg to-transparent" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[18%] bg-gradient-to-t from-nl-bg to-transparent" aria-hidden="true" />
      </div>

      {/* controls */}
      <div className="mt-2 flex items-center justify-center gap-4">
        <button type="button" onClick={() => setCur((c) => c - 1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/80" aria-label="Previous e-book">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l4-4 4 4" />
          </svg>
        </button>
        <div className="flex gap-2" aria-hidden="true">
          {books.map((b, i) => (
            <span key={b.slug} className={`h-1.5 rounded-full transition-all duration-500 ${i === mod(cur) ? "w-6 bg-[linear-gradient(90deg,#8c53fe,#5ce0e6)]" : "w-1.5 bg-white/25"}`} />
          ))}
        </div>
        <button type="button" onClick={() => setCur((c) => c + 1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/80" aria-label="Next e-book">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 5l4 4 4-4" />
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
              E-book {book.n} · {book.pages} pages
            </p>
            <h3 className="mt-2 text-[22px] font-semibold">{book.title}</h3>
            <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-relaxed text-nl-ink">{book.oneLiner}</p>
            <button type="button" className="btn btn-primary btn-sm mt-5" onClick={() => onOpen(book.slug)}>
              Get the free e-book
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
