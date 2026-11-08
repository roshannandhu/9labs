"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { useDemo } from "@/components/providers/DemoSettings";
import ClickSpark from "@/components/reactbits/ClickSpark";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { Book3D } from "./Book3D";
import { BookDialog } from "./BookDialog";

const BW = "clamp(168px, 17vw, 210px)";
const BH = `calc(${BW} * 1.45)`;

export function Ebooks() {
  const { settings } = useDemo();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const openBook = site.ebooks.find((b) => b.slug === openSlug) ?? null;
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target exists only on the client
  useEffect(() => setMounted(true), []);

  return (
    <section id="ebooks" aria-labelledby="ebooks-title" className="relative py-24 sm:py-32">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index="05">Free e-books</SectionLabel>
            <h2 id="ebooks-title" className="mt-4 text-[clamp(2rem,4.6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
              Principles, not tricks. <span className="text-gradient">Free to read.</span>
            </h2>
          </div>
          <p className="max-w-[44ch] text-[15px] leading-relaxed text-nl-ink sm:text-base">
            Three short e-books that explain how growth really works — and how we work. Pick one, open it, and we’ll send it to your inbox.
          </p>
        </div>

        <div className="relative mt-16 grid gap-y-20 sm:mt-20 md:grid-cols-3 md:gap-x-8">
          {/* the shelf line */}
          <div className="pointer-events-none absolute inset-x-0 top-[calc(clamp(168px,17vw,210px)*1.45+20px)] hidden h-px bg-gradient-to-r from-transparent via-white/25 to-transparent md:block" aria-hidden="true">
            <span className="absolute inset-x-[10%] -top-px h-[3px] bg-gradient-to-r from-transparent via-nl-purple/50 to-transparent blur-[2px]" />
          </div>

          {site.ebooks.map((b, i) => (
            <AnimatedContent key={b.slug} distance={60} duration={1} delay={i * 0.12} ease="expo.out">
              <article className="shelf-item group flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => setOpenSlug(b.slug)}
                  className="relative block rounded-xl focus-visible:outline-offset-8"
                  aria-label={`Open “${b.title}” and get it free`}
                  data-cursor="Open"
                >
                  <span
                    className="pointer-events-none absolute -bottom-6 left-1/2 h-10 w-[120%] -translate-x-1/2 rounded-[50%] opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-100"
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

                <p className="label-mono mt-20">E-book {b.n} · {b.pages} pages</p>
                <h3 className="mt-2 text-[22px] font-semibold sm:text-2xl">{b.title}</h3>
                <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-nl-ink">{b.oneLiner}</p>
                <div className="mt-6">
                  <ClickSpark sparkColor={[settings.purple, settings.blue, "#ffffff"]} sparkCount={10} sparkRadius={38} glow={0.6}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpenSlug(b.slug)} data-cursor="Open">
                      Get the free e-book
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M8 3v8M4 8l4 4 4-4M3 13.5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </ClickSpark>
                </div>
              </article>
            </AnimatedContent>
          ))}
        </div>
        <p className="label-mono mt-14 text-center !text-white/30">Working titles · final titles &amp; covers to be supplied</p>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>{openBook && <BookDialog key={openBook.slug} book={openBook} onClose={() => setOpenSlug(null)} />}</AnimatePresence>,
          document.body,
        )}
    </section>
  );
}
