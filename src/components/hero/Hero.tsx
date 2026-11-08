"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { useQuiz } from "@/components/providers/QuizProvider";
import { NineLight } from "./NineLight";
import { BlueprintConstruction, LEAN } from "./BlueprintConstruction";
import { NINE_FRAC, OrbitCarousel, type OrbitFx, type OrbitHandle } from "./OrbitCarousel";

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
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/**
 * Cover: "Light-built 9". A 9 filled with electric-blue light leans 7° forward in the exact
 * centre of a full-bleed blueprint screen and tilts toward the mouse in 3D (the grid, the 9
 * and the ring sit at different depths). The nine activities travel a matching Saturn ring
 * around it; a fixed caption under the 9 names the front one; a bridge builds itself between
 * them and the 9 gives a heartbeat when the light dot arrives. Hovering the quiz button sends
 * the same pulse into the 9. Scrolling, the ring's items ride down and swell into the Services
 * cards while the 9 docks into the nav logo. SVG + CSS + GSAP only.
 */
export function Hero() {
  const { settings, reduced } = useDemo();
  const quiz = useQuiz();
  const [active, setActive] = useState(0);
  const orbit = useRef<OrbitHandle>(null);
  const fx = useRef<OrbitFx>({ spread: 1, fade: 1, drop: 0, tilt: 0, px: 0, py: 0, gather: 0 });
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const nineBox = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const construct = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const lean = useRef({ mouse: 0, dock: 0 });
  const [pulse, setPulse] = useState<{ id: number; d: string } | null>(null);

  const writeLean = () => {
    const l = lean.current;
    stage.current?.style.setProperty("--lean", `${((LEAN + l.mouse) * (1 - l.dock)).toFixed(2)}deg`);
  };

  // Heartbeat: the 9 receives what the bridge brings in (one soft glow + a tiny swell).
  const beat = useCallback(() => {
    if (reduced || document.hidden) return;
    const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
    nineBox.current?.querySelector(".nine-pulse")?.animate([{ opacity: 0, scale: 0.85 }, { opacity: 0.85, scale: 1.08, offset: 0.3 }, { opacity: 0, scale: 1.2 }], { duration: 1100, easing: ease });
    dock.current?.animate([{ scale: 1 }, { scale: 1.025, offset: 0.3 }, { scale: 1 }], { duration: 900, easing: ease });
  }, [reduced]);

  // Desktop: the 9 tilts toward the mouse in 3D (±7° / ±5°), its lean moves ±2°, the ring tilts ±2°
  // and drifts against the 9, and the grid shifts a few px (BlueprintGrid) — depth without WebGL.
  useEffect(() => {
    const sec = section.current;
    if (!sec || reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const reset = () => {
      lean.current.mouse = 0;
      const f = fx.current;
      f.tilt = 0;
      f.px = 0;
      f.py = 0;
      if (tilt.current) tilt.current.style.transform = "";
      writeLean();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      lean.current.mouse = nx * 2;
      const f = fx.current;
      f.tilt = ny * 2;
      f.px = nx;
      f.py = ny;
      if (tilt.current) {
        tilt.current.style.transform = `perspective(1100px) translate3d(${(-nx * 7).toFixed(1)}px, ${(-ny * 5).toFixed(1)}px, 0) rotateY(${(nx * 7).toFixed(2)}deg) rotateX(${(-ny * 5).toFixed(2)}deg)`;
      }
      writeLean();
    };
    sec.addEventListener("pointermove", onMove, { passive: true });
    sec.addEventListener("pointerleave", reset);
    return () => {
      sec.removeEventListener("pointermove", onMove);
      sec.removeEventListener("pointerleave", reset);
    };
  }, [reduced]);

  // Quiz button: a light pulse runs from the button along a bridge line into the 9.
  const sendPulse = () => {
    const sec = section.current;
    const btn = sec?.querySelector<HTMLElement>("[data-cta-quiz]");
    const nine = nineBox.current;
    if (reduced || !sec || !btn || !nine) return;
    const s = sec.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const n = nine.getBoundingClientRect();
    const x0 = b.left + b.width / 2 - s.left;
    const y0 = b.top - s.top;
    const x1 = n.left + n.width / 2 - s.left;
    const y1 = n.top + n.height * 0.78 - s.top;
    const bow = (x0 < s.width / 2 ? -1 : 1) * Math.min(220, s.width * 0.18);
    setPulse({ id: Date.now(), d: `M${x0.toFixed(1)} ${y0.toFixed(1)}Q${(x0 + bow).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}` });
  };

  useGSAP(
    () => {
      const f = fx.current;
      if (reduced) {
        f.spread = 1;
        f.fade = 1;
        f.drop = 0;
        f.gather = 0;
        return;
      }
      const wide = window.matchMedia("(min-width: 1024px)").matches;

      // Scroll out. Desktop: the items ride along with the page, drift down toward the Services
      // ring and swell as they gather, fading into its cards as those rise into view.
      // Smaller screens (Services is a stack of cards there): the ring opens and falls away.
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          const p = self.progress;
          if (wide) {
            // converge + sink by p ≈ 0.6, fade out just before the Services heading reaches them
            const e = easeInOut(clamp01(p / 0.6));
            f.spread = 1 + p * 0.2;
            f.gather = e;
            f.drop = window.scrollY * 0.97 + e * window.innerHeight * 0.3;
            f.fade = clamp01(1 - (p - 0.36) / 0.28);
          } else {
            f.spread = 1 + p * 1.1;
            f.gather = 0;
            f.drop = p * (stage.current?.offsetHeight ?? 400) * 0.9;
            f.fade = Math.max(0, 1 - p * 5); // gone before the items reach the headline
          }
        },
      });
      gsap.to(copy.current, {
        y: -60,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: wide ? "0% top" : "20% top", end: wide ? "20% top" : "70% top", scrub: true },
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
      className="relative flex min-h-[100svh] flex-col overflow-x-clip pt-[var(--nav-h)] lsp:grid lsp:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lsp:items-start"
    >
      {/* Stage: the 9 + its ring. Full-bleed: no frame, no mask, the glow bleeds past the edges. */}
      <div
        ref={stage}
        className="relative min-h-[clamp(220px,37svh,420px)] w-full flex-1 sm:min-h-[clamp(300px,44svh,520px)] lg:h-[clamp(360px,48svh,700px)] lg:flex-none lsp:sticky lsp:top-[var(--nav-h)] lsp:h-[calc(100svh-var(--nav-h))] lsp:min-h-0 lsp:overflow-x-clip"
        style={{ ["--lean" as string]: `${LEAN}deg` }}
      >
        <OrbitCarousel ref={orbit} active={active} onActive={setActive} fx={fx} onBeat={beat} className="!absolute inset-0">
          <div ref={nineBox} className="relative" style={{ height: `min(${NINE_FRAC * 100}%, 760px)`, aspectRatio: "2 / 3" }} data-hero-nine>
            <div ref={construct} className="absolute inset-0">
              <BlueprintConstruction className="absolute inset-0 h-full w-full" glyph={settings.glyph} />
            </div>
            <div ref={dock} className="absolute inset-0 will-change-transform" style={{ transformOrigin: `50% ${GLYPH_CY * 100}%` }}>
              <div ref={tilt} className="nine-tilt absolute inset-0">
                <NineLight className="absolute inset-0 h-full w-full" glyph={settings.glyph} />
              </div>
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
              <span className="rise-in font-accent text-gradient inline-block pb-[0.08em]" style={{ animationDelay: "0.42s" }}>
                built to deliver results.
              </span>
            </span>
          </h1>
          <p className="rise-in mx-auto mt-3 max-w-[62ch] text-[15px] leading-relaxed text-nl-ink sm:text-[17px] lsp:text-sm" style={{ animationDelay: "0.6s" }}>
            {site.hero.sub}
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lsp:mt-4">
            <button
              type="button"
              data-cta-quiz
              className="btn btn-primary rise-in"
              style={{ animationDelay: "0.75s" }}
              onClick={() => quiz.open()}
              onPointerEnter={(e) => e.pointerType === "mouse" && sendPulse()}
              onFocus={sendPulse}
              data-cursor="Start"
            >
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

      {/* Quiz-button pulse: a thin purple bridge line from the button into the 9, one light dot, then a heartbeat */}
      {pulse && (
        <svg key={pulse.id} className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" aria-hidden="true">
          <path d={pulse.d} pathLength={1} className="cta-line" fill="none" stroke="var(--nl-purple)" strokeWidth="1.4" strokeLinecap="round" />
          <path
            d={pulse.d}
            pathLength={1}
            className="cta-dot"
            fill="none"
            stroke="#f1e8ff"
            strokeWidth="5"
            strokeLinecap="round"
            onAnimationEnd={(e) => {
              if (e.animationName === "cta-dot") {
                beat();
                setPulse(null);
              }
            }}
          />
        </svg>
      )}
    </section>
  );
}
