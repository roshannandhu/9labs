"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { useQuiz } from "@/components/providers/QuizProvider";
import { NineLight } from "./NineLight";
import { BlueprintConstruction, LEAN } from "./BlueprintConstruction";
import { OrbitCarousel, type OrbitFx, type OrbitHandle } from "./OrbitCarousel";

const services = site.services;
const GLYPH_CY = 309 / 600; // the 9's visual centre inside its 2:3 box
const GLYPH_H = 478 / 600; // glyph height inside its box

function splitWords(text: string, startDelay: number, step = 0.045) {
  return text.split(" ").map((w, i) => (
    <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <span className="rise-in inline-block" style={{ animationDelay: `${startDelay + i * step}s` }}>
        {w}&nbsp;
      </span>
    </span>
  ));
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Cover: "Light-built 9". A 9 filled with electric-blue light leans 7° forward in the exact
 * centre of a full-bleed blueprint screen; the nine activities travel a matching Saturn ring
 * around it; a fixed caption under the 9 names the front one; the copy sits below, never
 * covered. Scrolling opens the ring toward Services and (Concept Lab toggle) docks the 9 into
 * the nav logo. SVG + CSS + GSAP only.
 */
export function Hero() {
  const { settings, reduced } = useDemo();
  const quiz = useQuiz();
  const [active, setActive] = useState(0);
  const orbit = useRef<OrbitHandle>(null);
  const fx = useRef<OrbitFx>({ spread: 1, fade: 1, drop: 0, tilt: 0 });
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const nineBox = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const construct = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const lean = useRef({ mouse: 0, dock: 0 });

  const writeLean = () => {
    const l = lean.current;
    stage.current?.style.setProperty("--lean", `${((LEAN + l.mouse) * (1 - l.dock)).toFixed(2)}deg`);
  };

  // Desktop: the 9's lean and the ring's tilt follow the mouse by ±2° (the grid parallax lives in BlueprintGrid).
  useEffect(() => {
    const sec = section.current;
    if (!sec || reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      lean.current.mouse = nx * 2;
      fx.current.tilt = ny * 2;
      writeLean();
    };
    const onLeave = () => {
      lean.current.mouse = 0;
      fx.current.tilt = 0;
      writeLean();
    };
    sec.addEventListener("pointermove", onMove, { passive: true });
    sec.addEventListener("pointerleave", onLeave);
    return () => {
      sec.removeEventListener("pointermove", onMove);
      sec.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  useGSAP(
    () => {
      const f = fx.current;
      if (reduced) {
        f.spread = 1;
        f.fade = 1;
        f.drop = 0;
        return;
      }

      // Scroll out: the ring opens like a flower and the items fall toward Services.
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          const p = self.progress;
          f.spread = 1 + p * 1.1;
          f.drop = p * (stage.current?.offsetHeight ?? 400) * 0.9;
          f.fade = Math.max(0, 1 - p * 2.8); // gone before the items reach the headline
        },
      });
      gsap.to(copy.current, {
        y: -60,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "20% top", end: "70% top", scrub: true },
      });
      gsap.to(construct.current, {
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "top top", end: "35% top", scrub: true },
      });

      if (!settings.logoDock) {
        gsap.to(dock.current, {
          opacity: 0,
          scale: 0.9,
          ease: "none",
          scrollTrigger: { trigger: section.current, start: "top top", end: "70% top", scrub: true },
        });
        return;
      }

      // Logo dock: the 9 shrinks, straightens from 7° to 0° and lands on the nav logo, which lights up.
      const logo = document.querySelector<HTMLElement>("[data-logo-9]");
      const m = { x: 0, y: 0, h: 1, lx: 0, ly: 0, lh: 24 };
      const measure = () => {
        const b = nineBox.current?.getBoundingClientRect();
        const l = logo?.getBoundingClientRect();
        if (!b || !l) return;
        m.x = b.left + b.width / 2;
        m.y = b.top + window.scrollY + b.height * GLYPH_CY;
        m.h = b.height * GLYPH_H;
        m.lx = l.left + l.width / 2;
        m.ly = l.top + l.height / 2;
        m.lh = l.height * 0.62;
      };
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 0.62)}`,
        invalidateOnRefresh: true,
        onRefresh: measure,
        onUpdate: (self) => {
          const el = dock.current;
          if (!el) return;
          const e = easeInOut(self.progress);
          const tx = (m.lx - m.x) * e;
          const ty = (m.ly - (m.y - window.scrollY)) * e;
          const sc = 1 + (m.lh / m.h - 1) * e;
          el.style.transform = e > 0 ? `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${sc.toFixed(4)})` : "";
          el.style.opacity = e > 0.85 ? String(Math.max(0, (1 - e) / 0.15).toFixed(3)) : "";
          lean.current.dock = e;
          writeLean();
          if (logo) logo.dataset.lit = e > 0.9 ? "true" : "false";
        },
      });
      return () => {
        lean.current.dock = 0;
        writeLean();
        if (logo) logo.dataset.lit = "false";
        if (dock.current) {
          dock.current.style.transform = "";
          dock.current.style.opacity = "";
        }
      };
    },
    { scope: section, dependencies: [reduced, settings.logoDock], revertOnUpdate: true },
  );

  const s = services[active];

  return (
    <section
      id="home"
      ref={section}
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col overflow-x-clip pt-[var(--nav-h)] lsp:grid lsp:grid-cols-[1.1fr_1fr] lsp:items-start"
    >
      {/* Stage: the 9 + its ring. Full-bleed: no frame, no mask, the glow bleeds past the edges. */}
      <div ref={stage} className="relative min-h-[clamp(220px,37svh,420px)] lg:min-h-[clamp(230px,40svh,420px)] w-full flex-1 lsp:sticky lsp:top-[var(--nav-h)] lsp:overflow-x-clip lsp:h-[calc(100svh-var(--nav-h))] lsp:min-h-0" style={{ ["--lean" as string]: `${LEAN}deg` }}>
        <OrbitCarousel ref={orbit} active={active} onActive={setActive} fx={fx} className="!absolute inset-0">
          <div ref={nineBox} className="relative h-[min(84%,640px)]" style={{ aspectRatio: "2 / 3" }} data-hero-nine>
            <div ref={construct} className="absolute inset-0">
              <BlueprintConstruction className="absolute inset-0 h-full w-full" glyph={settings.glyph} />
            </div>
            <div ref={dock} className="absolute inset-0 will-change-transform" style={{ transformOrigin: `50% ${GLYPH_CY * 100}%` }}>
              <NineLight className="absolute inset-0 h-full w-full" glyph={settings.glyph} />
            </div>
          </div>
        </OrbitCarousel>
      </div>

      <div ref={copy} className="container-x relative z-30 pb-8 pt-1 sm:pb-10 lsp:pt-4">
        {/* Caption: the front activity, fixed under the 9 */}
        <div className="rise-in mx-auto mb-5 flex max-w-xl flex-col items-center text-center" style={{ animationDelay: "2.9s" }}>
          <span className="h-px w-20 bg-gradient-to-r from-transparent via-nl-purple to-transparent" aria-hidden="true" />
          <div className="mt-3 min-h-[4.6rem] sm:min-h-[4.2rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.a
                key={active}
                href={`#service-${s.slug}`}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="group block rounded-lg"
                data-cursor="Explore"
              >
                <span className="label-mono block !text-[10px] !text-nl-purple">{String(s.n).padStart(2, "0")} / 09</span>
                <span className="mt-1 block font-display text-base font-semibold text-white transition-colors group-hover:text-nl-blue-soft sm:text-lg">
                  {s.title}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-nl-ink sm:text-sm">{s.description}</span>
              </motion.a>
            </AnimatePresence>
          </div>
        </div>

        <div className="mx-auto max-w-[1080px] text-center">
          <p className="label-mono rise-in mb-3 inline-flex items-center gap-2.5" style={{ animationDelay: "0.1s" }}>
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-nl-purple shadow-[0_0_10px_var(--nl-purple)]" />
            <span>
              Marketing · Events · Technology<span className="hidden sm:inline"> — Dubai South</span>
            </span>
          </p>
          <h1
            id="hero-title"
            className="mx-auto text-[clamp(1.9rem,6.6vw,3rem)] font-semibold leading-[1.04] tracking-[-0.035em] lg:text-[clamp(2.6rem,3.4vw,3.6rem)] short:text-[2.4rem] lsp:text-[1.75rem]"
          >
            {splitWords("Marketing, events and technology,", 0.18)}
            <span className="sm:block">
              <span className="rise-in text-gradient inline-block pb-[0.08em]" style={{ animationDelay: "0.42s" }}>
                built to deliver results.
              </span>
            </span>
          </h1>
          <p className="rise-in mx-auto mt-3 max-w-[62ch] text-[15px] leading-relaxed text-nl-ink sm:text-[17px] lsp:text-sm" style={{ animationDelay: "0.6s" }}>
            {site.hero.sub}
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lsp:mt-4">
            <button type="button" className="btn btn-primary rise-in" style={{ animationDelay: "0.75s" }} onClick={() => quiz.open()} data-cursor="Start">
              {site.hero.primaryCta}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <a href="#ebooks" className="btn btn-outline rise-in" style={{ animationDelay: "0.85s" }} data-cursor="Read">
              {site.hero.secondaryCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
