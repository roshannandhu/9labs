"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { fill } from "@/content/site";
import { sectionNo, useSite } from "@/components/providers/SiteProvider";
import { useDemo } from "@/components/providers/DemoSettings";
import ClickSpark from "@/components/reactbits/ClickSpark";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { Book3D } from "./Book3D";
import { BookDialog } from "./BookDialog";
import { PhoneShelf } from "./PhoneShelf";

const BW = "clamp(168px, 17vw, 210px)";
/** Halo colours keyed to each cover (Spectra). */
const HALO: Record<string, [string, string]> = {
  blue: ["var(--nl-blue)", "var(--nl-blue-soft)"],
  purple: ["var(--nl-purple)", "var(--nl-purple)"],
  duo: ["var(--nl-blue)", "var(--nl-purple)"],
};
const BH = `calc(${BW} * 1.45)`;

export function Ebooks() {
  const { settings, reduced } = useDemo();
  const site = useSite();
  const t = site.ebooksSection;
  const count = site.ebooks.length;
  // the shelf holds up to four books in a row; more books make more shelves
  const perRow = count <= 4 ? Math.max(1, count) : count <= 6 ? 3 : 4;
  const rows = Array.from({ length: Math.ceil(count / perRow) }, (_, r) => site.ebooks.slice(r * perRow, (r + 1) * perRow));
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const shelfWide = useMediaQuery("(min-width: 768px)");
  const section = useRef<HTMLElement>(null);
  // Spectra: the focused book lifts and casts a halo in its cover colour. Hover/focus wins;
  // otherwise the shelf gently auto-cycles while it is on screen (wide layouts, full motion).
  const [hover, setHover] = useState<number | null>(null);
  const [auto, setAuto] = useState(0);
  const [inView, setInView] = useState(false);
  const cycling = shelfWide && !reduced && inView && hover === null && !openSlug;
  const focus = hover ?? (shelfWide && !reduced ? auto : null);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!cycling) return;
    const timer = window.setInterval(() => setAuto((a) => (a + 1) % Math.max(1, count)), 4000);
    return () => window.clearInterval(timer);
  }, [cycling, count]);
  const openBook = site.ebooks.find((b) => b.slug === openSlug) ?? null;
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target exists only on the client
  useEffect(() => setMounted(true), []);

  if (!count) return null;

  return (
    <section id="ebooks" ref={section} aria-labelledby="ebooks-title" className="relative py-24 sm:py-32">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index={sectionNo(site, "ebooks")}>{t.label}</SectionLabel>
            <SpringHeading
              id="ebooks-title"
              text={t.heading}
              accent={t.accent || undefined}
              className="mt-4 text-[clamp(2rem,4.6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em]"
            />
          </div>
          {t.intro && <p className="max-w-[44ch] text-[15px] leading-relaxed text-nl-ink sm:text-base">{t.intro}</p>}
        </div>

        <div className="mt-10 sm:mt-14">
          <PhoneShelf onOpen={setOpenSlug} />
        </div>

        {/* tablet / laptop: the mirror shelf (one per row of books) */}
        {rows.map((row, r) => (
        <div key={r} className="relative mx-auto mt-20 hidden md:grid md:gap-x-8" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`, maxWidth: `${row.length * 400}px` }}>
          {/* the shelf line */}
          <div className="pointer-events-none absolute inset-x-0 top-[calc(clamp(168px,17vw,210px)*1.45+20px)] hidden h-px bg-gradient-to-r from-transparent via-white/25 to-transparent md:block" aria-hidden="true">
            <span className="absolute inset-x-[10%] -top-px h-[3px] bg-gradient-to-r from-transparent via-nl-purple/50 to-transparent blur-[2px]" />
          </div>

          {row.map((b, j) => {
            const i = r * perRow + j;
            return (
            <AnimatedContent key={b.slug} distance={60} duration={1} delay={j * 0.12} ease="expo.out">
              <article
                className="shelf-item group relative isolate flex flex-col items-center text-center"
                data-focus={focus === i}
                data-dim={focus !== null && focus !== i}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <span
                  className="spectra-halo"
                  style={{ ["--halo" as string]: HALO[b.tone][0], ["--halo2" as string]: HALO[b.tone][1], top: `calc(${BH} * 0.5)` }}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setOpenSlug(b.slug)}
                  className="relative block rounded-xl focus-visible:outline-offset-8"
                  aria-label={`Open “${b.title}” and get it free`}
                  data-cursor="Open"
                >
                  <span
                    className="pointer-events-none absolute -bottom-6 left-1/2 h-10 w-[120%] -translate-x-1/2 rounded-[50%] opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-100 group-data-[focus=true]:opacity-100"
                    style={{ background: b.tone === "purple" ? "var(--nl-purple)" : "var(--nl-blue)" }}
                    aria-hidden="true"
                  />
                  <span className="book-scene block" style={{ width: BW, height: BH }}>
                    <span
                      className="block h-full w-full motion-safe:animate-[book-float_6s_ease-in-out_infinite]"
                      style={{ animationDelay: `${i * -2}s` }}
                    >
                      {openSlug === b.slug ? (
                        <span className="block h-full w-full" />
                      ) : (
                        <motion.span layoutId={`book-${b.slug}`} className="shelf-book block" transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                          <Book3D book={b} w={BW} h={BH} d="30px" />
                        </motion.span>
                      )}
                    </span>
                  </span>
                </button>

                <p className="label-mono mt-20">{fill(t.cardLabel, { n: b.n, pages: b.pages })}</p>
                <h3 className="mt-2 text-[22px] font-semibold sm:text-2xl">{b.title}</h3>
                <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-nl-ink">{b.oneLiner}</p>
                <div className="mt-6">
                  <ClickSpark sparkColor={[settings.purple, settings.blue, "#3533cb"]} sparkCount={10} sparkRadius={38} glow={0.6}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpenSlug(b.slug)} data-cursor="Open">
                      {t.cardCta}
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M8 3v8M4 8l4 4 4-4M3 13.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </ClickSpark>
                </div>
              </article>
            </AnimatedContent>
            );
          })}
        </div>
        ))}
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>{openBook && <BookDialog key={openBook.slug} book={openBook} onClose={() => setOpenSlug(null)} />}</AnimatePresence>,
          document.body,
        )}
    </section>
  );
}
