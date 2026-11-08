"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { useQuiz } from "@/components/providers/QuizProvider";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { NineNeon } from "./NineNeon";
import { BlueprintConstruction } from "./BlueprintConstruction";
import { OrbitCarousel, type OrbitFx, type OrbitHandle } from "./OrbitCarousel";

const NineParticles = dynamic(() => import("./NineParticles"), { ssr: false });
const NineCinematic = dynamic(() => import("./NineCinematic"), { ssr: false });

const services = site.services;

function splitWords(text: string, startDelay: number, step = 0.045) {
  return text.split(" ").map((w, i) => (
    <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <span className="rise-in inline-block" style={{ animationDelay: `${startDelay + i * step}s` }}>
        {w}&nbsp;
      </span>
    </span>
  ));
}

export function Hero() {
  const { settings, reduced } = useDemo();
  const quiz = useQuiz();
  const [active, setActive] = useState(0);
  const orbit = useRef<OrbitHandle>(null);
  const fx = useRef<OrbitFx>({ spread: 1, fade: 1 });
  const progress = useRef(0);
  const section = useRef<HTMLElement>(null);
  const nineWrap = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const iris = useRef<HTMLDivElement>(null);
  const wide = useMediaQuery("(min-width: 768px)");
  const coarse = useMediaQuery("(pointer: coarse)");
  const [gl, setGl] = useState<"unknown" | "ok" | "no">("unknown");
  const [perfGuard, setPerfGuard] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
  const [minTime, setMinTime] = useState(false);

  // WebGL capability + a minimum time so the neon line finishes drawing before the 3D reveal.
  useEffect(() => {
    let ok = false;
    try {
      const c = document.createElement("canvas");
      ok = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      ok = false;
    }
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability is only known on the client
    setGl(ok && !(mem && mem < 3) ? "ok" : "no");
    const t = window.setTimeout(() => setMinTime(true), 2300);
    return () => window.clearTimeout(t);
  }, []);

  const concept = settings.concept === "cinematic" && gl === "no" ? "neon" : settings.concept;
  const [tierOverride, setTierOverride] = useState<"high" | "low" | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("tier");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL is only readable on the client
    if (t === "high" || t === "low") setTierOverride(t);
    if (q.get("perf") === "off") setPerfGuard(false);
  }, []);
  const tier = tierOverride ?? (wide && !coarse ? "high" : "low");
  const show3d = canvasReady && minTime;
  // "Cross the bridge": concept C pins the cover briefly and flies through the 9's bowl.
  const portal = concept === "cinematic" && gl === "ok" && settings.portal && !reduced;

  useGSAP(
    () => {
      if (reduced) {
        fx.current.spread = 1;
        fx.current.fade = 1;
        progress.current = 0;
        return;
      }
      if (portal) {
        const place = () => {
          const sec = section.current;
          const stg = stage.current;
          if (!sec || !stg || !iris.current) return;
          iris.current.style.setProperty("--ix", `${stg.offsetLeft + stg.offsetWidth / 2}px`);
          iris.current.style.setProperty("--iy", `${stg.offsetTop + stg.offsetHeight * 0.48}px`);
        };
        place();
        ScrollTrigger.create({
          trigger: section.current,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 1.15)}`,
          pin: true,
          scrub: true,
          refreshPriority: 0,
          invalidateOnRefresh: true,
          onRefresh: place,
          onUpdate: (self) => {
            const p = self.progress;
            progress.current = p;
            fx.current.spread = 1 + p * 1.6;
            fx.current.fade = Math.max(0, 1 - p * 2.6);
            if (copy.current) {
              const k = Math.min(1, p * 2.8);
              copy.current.style.opacity = (1 - k).toFixed(3);
              copy.current.style.transform = `translateY(${(-70 * k).toFixed(1)}px)`;
            }
            if (iris.current) {
              const r = Math.max(0, (p - 0.52) / 0.48);
              const max = Math.hypot(window.innerWidth, window.innerHeight) * 1.15;
              iris.current.style.setProperty("--ir", `${(Math.pow(r, 1.5) * max).toFixed(1)}px`);
            }
          },
        });
        return () => {
          if (copy.current) {
            copy.current.style.opacity = "";
            copy.current.style.transform = "";
          }
        };
      }
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          progress.current = p;
          fx.current.spread = 1 + p * 0.85;
          fx.current.fade = Math.max(0, 1 - p * 1.7);
        },
      });
      if (nineWrap.current)
        gsap.to(nineWrap.current, {
          scale: concept === "cinematic" ? 1 : 1.28,
          opacity: concept === "cinematic" ? 0.15 : 0,
          ease: "none",
          scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
        });
      gsap.to(copy.current, {
        y: -70,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: section.current, start: "15% top", end: "65% top", scrub: true },
      });
    },
    { scope: section, dependencies: [reduced, concept, gl, portal], revertOnUpdate: true },
  );

  const s = services[active];

  const focusPanel = (
    <div className="glass glass-lens relative overflow-hidden rounded-2xl px-4 py-3.5 xl:px-5 xl:py-4">
      <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-nl-purple/70" />
      <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-nl-purple/70" />
      <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-nl-purple/70" />
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-nl-purple/70" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={reduced ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduced ? undefined : { opacity: 0, y: -6, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start gap-3.5"
        >
          <span className="mt-0.5 hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-nl-purple/40 bg-nl-purple/10 text-white sm:grid">
            <ActivityIcon icon={s.icon} size={22} play />
          </span>
          <span className="min-w-0 flex-1 text-center sm:text-left">
            <span className="label-mono block !text-[10px] !text-nl-purple">Now orbiting · {String(s.n).padStart(2, "0")} / 09</span>
            <span className="mt-1 block font-display text-[15px] font-semibold text-white sm:text-base">{s.title}</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-nl-ink sm:text-sm xl:text-[13px]">{s.description}</span>
          </span>
          <a
            href={`#service-${s.slug}`}
            className="hidden shrink-0 self-center rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-nl-purple hover:text-white sm:inline-flex xl:hidden"
            data-cursor="Explore"
          >
            Explore →
          </a>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const pager = (
    <div className="mt-2.5 flex justify-center gap-1.5 xl:justify-end" role="group" aria-label="Choose an activity">
      {services.map((x, i) => (
        <button
          key={x.slug}
          type="button"
          onClick={() => orbit.current?.focusIndex(i)}
          aria-label={`Show ${x.title}`}
          aria-pressed={i === active}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i === active ? "w-7 bg-nl-purple shadow-[0_0_12px_var(--nl-purple)]" : "w-3 bg-white/20 hover:bg-white/40"
          }`}
        />
      ))}
    </div>
  );

  return (
    <section id="home" ref={section} aria-labelledby="hero-title" className="relative overflow-hidden pt-[var(--nav-h)]">
      {/* Stage: the 9 + orbit */}
      <div ref={stage} className="relative mx-auto h-[clamp(260px,calc(100svh-var(--nav-h)-440px),460px)] w-full max-w-[1680px] sm:h-[clamp(320px,calc(100svh-var(--nav-h)-400px),560px)] lg:h-[clamp(380px,calc(100svh-var(--nav-h)-348px),700px)]">
        {concept === "cinematic" && gl === "ok" && (
          <div ref={nineWrap} className="absolute inset-0">
            <NineCinematic
              key={tier}
              progress={progress}
              tier={tier}
              play={show3d}
              onReady={() => setCanvasReady(true)}
              onSlow={() => {
                // Two-step guard: high → low tier, then low → neon poster.
                setCanvasReady(false);
                if (tier === "high") setTierOverride("low");
                else setGl("no");
              }}
              perfGuard={perfGuard}
              active={active}
              dive={portal}
              className={`transition-opacity duration-[1400ms] ease-out ${show3d ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        )}
        <OrbitCarousel ref={orbit} active={active} onActive={setActive} fx={fx} track={concept !== "cinematic"}>
          {concept === "cinematic" ? (
            /* Neon poster: paints instantly (no JS), then hands over to the 3D scene underneath */
            <div
              className={`relative h-[84%] transition-[opacity,transform] duration-[1200ms] ease-out ${
                show3d && gl === "ok" ? "scale-95 opacity-0" : "opacity-100"
              }`}
              style={{ aspectRatio: "2 / 3" }}
            >
              <BlueprintConstruction className="absolute inset-0 h-full w-full" glyph={settings.glyph} />
              <NineNeon className="absolute inset-0 h-full w-full" glyph={settings.glyph} active={active} />
            </div>
          ) : (
            <div ref={nineWrap} className="relative h-[84%]" style={{ aspectRatio: "2 / 3" }}>
              <BlueprintConstruction className="absolute inset-0 h-full w-full" glyph={settings.glyph} />
              {concept === "particles" ? (
                <NineParticles className="absolute inset-0 h-full w-full" glyph={settings.glyph} />
              ) : (
                <NineNeon className="absolute inset-0 h-full w-full" glyph={settings.glyph} active={active} />
              )}
            </div>
          )}
        </OrbitCarousel>

        {/* Blueprint corner annotations (decorative) */}
        <div className="pointer-events-none absolute left-6 top-5 hidden flex-col gap-1.5 xl:flex" aria-hidden="true">
          <span className="label-mono !text-[10px] !text-white/40">24.89° N · 55.16° E</span>
          <span className="h-px w-16 bg-white/20" />
          <span className="label-mono !text-[10px] !text-white/30">Dubai South · UAE</span>
        </div>
        <div className="pointer-events-none absolute right-6 top-5 hidden flex-col items-end gap-1.5 xl:flex" aria-hidden="true">
          <span className="label-mono !text-[10px] !text-white/40">Sheet {String(active + 1).padStart(2, "0")} / 09</span>
          <span className="h-px w-16 bg-white/20" />
          <span className="label-mono !text-[10px] !text-white/30">Nine Labs Solutions</span>
        </div>

        {/* Focus moment (wide screens): sits in the free lower-right corner of the stage */}
        <div className="absolute bottom-1 right-6 z-30 hidden w-[430px] xl:block">
          {focusPanel}
          {pager}
        </div>
      </div>

      <div ref={copy} className="container-x relative z-30 pb-16 pt-1">
        {/* Focus moment (small screens): directly under the ring */}
        <div className="mx-auto mb-6 max-w-md xl:hidden">
          {focusPanel}
          {pager}
        </div>

        <div className="mx-auto max-w-[1080px] text-center">
          <p className="label-mono rise-in mb-4 inline-flex items-center gap-2.5" style={{ animationDelay: "0.1s" }}>
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-nl-purple shadow-[0_0_10px_var(--nl-purple)]" />
            <span>
              Marketing · Events · Technology<span className="hidden sm:inline"> — Dubai South</span>
            </span>
          </p>
          <h1
            id="hero-title"
            className="mx-auto text-[clamp(2.05rem,7.2vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.035em] lg:text-[clamp(2.9rem,3.9vw,3.8rem)]"
          >
            {splitWords("Marketing, events and technology,", 0.18)}
            <span className="sm:block">
              <span className="rise-in text-gradient inline-block pb-[0.08em]" style={{ animationDelay: "0.42s" }}>
                built to deliver results.
              </span>
            </span>
          </h1>
          <p className="rise-in mx-auto mt-4 max-w-[62ch] text-[15px] leading-relaxed text-nl-ink sm:text-[17px]" style={{ animationDelay: "0.6s" }}>
            {site.hero.sub}
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
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

      {/* Portal iris: a ring of light opens from the 9's bowl as the camera passes through it */}
      {portal && <div ref={iris} className="portal-iris pointer-events-none absolute inset-0 z-40" aria-hidden="true" />}
    </section>
  );
}
