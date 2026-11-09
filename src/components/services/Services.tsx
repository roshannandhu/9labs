"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { registerAnchorPrefix } from "@/lib/scroll";
import { useDemo } from "@/components/providers/DemoSettings";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { useEnquiry } from "@/components/enquiry/EnquiryProvider";
import { StaticDigit } from "@/components/particles/StaticDigit";
import { goto, digitTarget, picTarget, allNineTarget, onStageReached } from "@/components/particles/bus";
import { ServiceCard } from "./ServiceCard";

const services = site.services;
const N = services.length;
const LIVE_MS = 4500; // how long a landed picture stays before auto-play moves on
const DIGIT_HOLD_MS = 420; // how long a landed number is held before it blooms into its picture
const ALL9_MS = 2600; // how long the finale 9 holds before the loop restarts

/**
 * "Our 9 labs" — the Showcase. One screen; nothing locks or snaps. The particle swarm
 * (ParticleStage) briefly shows each service's number, then blooms into a detailed, living
 * picture of it. Auto-play steps through all nine and loops through a finale "all nine" 9; tap a
 * dock icon, swipe, or use ‹ › to jump. Reduced motion: a plain list, every picture still.
 */
export function Services() {
  const { reduced } = useDemo();

  const heading = (
    <div className="max-w-[920px]">
      <SectionLabel index="01">Our 9 labs</SectionLabel>
      <SpringHeading
        id="services-title"
        text="Nine activities."
        accent="One team."
        className="mt-4 text-[clamp(2rem,4.4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em]"
      />
      <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-nl-ink sm:text-base">
        Everything a brand needs to grow — from the first strategy session to the last frame of the event film — planned and delivered by one team.
      </p>
    </div>
  );

  return reduced ? <ServicesList heading={heading} /> : <ServicesShowcase heading={heading} />;
}

function ServicesShowcase({ heading }: { heading: React.ReactNode }) {
  const enquiry = useEnquiry();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const [atFinale, setAtFinale] = useState(false);
  // bumped by scheduleNext's timeout; a plain effect below (declared after `advance`) reacts to it —
  // the state round-trip is what lets scheduleNext ask for "advance to the next one" without itself
  // depending on advance/goToService/playFinale (which depend on scheduleNext: a real cycle).
  const [autoTick, setAutoTick] = useState(0);

  const activeRef = useRef(0);
  const pausedRef = useRef(false);
  const readyRef = useRef(false);
  const visibleRef = useRef(false);
  const busyRef = useRef(false);
  const atFinaleRef = useRef(false);
  const pendingRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const wait = (ms: number) => new Promise<void>((res) => window.setTimeout(res, ms));
  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const scheduleNext = useCallback((ms: number) => {
    clearTimer();
    if (pausedRef.current || !visibleRef.current) return;
    timerRef.current = window.setTimeout(() => setAutoTick((k) => k + 1), ms);
  }, []);

  const goToService = useCallback(
    async (index: number, dir: 1 | -1, opts: { direct?: boolean } = {}) => {
      if (busyRef.current) return;
      busyRef.current = true;
      clearTimer();
      atFinaleRef.current = false;
      setAtFinale(false);
      setActive(index);
      if (!opts.direct) {
        await goto(digitTarget(index + 1), dir);
        await wait(DIGIT_HOLD_MS);
      }
      await goto(picTarget(services[index].icon), dir);
      setCycleKey((k) => k + 1);
      busyRef.current = false;
      scheduleNext(LIVE_MS);
    },
    [scheduleNext],
  );

  const playFinale = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    clearTimer();
    atFinaleRef.current = true;
    setAtFinale(true);
    await goto(allNineTarget, 1);
    setCycleKey((k) => k + 1);
    busyRef.current = false;
    scheduleNext(ALL9_MS);
  }, [scheduleNext]);

  // a plain function (not memoized): used directly by clicks/keys, and by onAutoAdvance above
  const advance = (dir: 1 | -1) => {
    if (busyRef.current) return;
    if (atFinaleRef.current) {
      void goToService(0, 1);
      return;
    }
    const next = activeRef.current + dir;
    if (next >= N) void playFinale();
    else if (next < 0) void goToService(N - 1, -1);
    else void goToService(next, dir);
  };
  // the other end of scheduleNext's timeout (see autoTick above). autoTick only ever counts up
  // from 0, so "still 0" reliably means "the timer hasn't fired yet" — unlike a ref flag, this
  // stays correct under React's dev-mode double-invoke (StrictMode re-runs this effect once more
  // on mount, but autoTick is still 0 then too, so it's naturally a no-op either time).
  useEffect(() => {
    if (autoTick === 0) return;
    advance(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only autoTick should re-fire this; advance reads refs + stable callbacks
  }, [autoTick]);

  const start = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const idx = pendingRef.current ?? 0;
    pendingRef.current = null;
    setActive(idx);
    await wait(DIGIT_HOLD_MS);
    if (idx > 0) {
      await goto(digitTarget(idx + 1), 1);
      await wait(DIGIT_HOLD_MS);
    }
    await goto(picTarget(services[idx].icon), 1);
    setCycleKey((k) => k + 1);
    busyRef.current = false;
    readyRef.current = true;
    setReady(true);
    scheduleNext(LIVE_MS);
  }, [scheduleNext]);

  useEffect(() => onStageReached(() => void start()), [start]);

  // "#service-<slug>" jumps the Showcase to that service (and lands the page on the stage).
  useEffect(
    () =>
      registerAnchorPrefix("service-", (id) => {
        const i = services.findIndex((s) => `service-${s.slug}` === id);
        if (i < 0) return null;
        if (readyRef.current) void goToService(i, 1, { direct: true });
        else pendingRef.current = i;
        // land a hair past the stage's own top: that's what completes the particle hand-off
        // (ParticleStage's ScrollTrigger ends when the stage reaches "top top"), not the section's.
        const b = stageRef.current?.getBoundingClientRect();
        return b ? window.scrollY + b.top + 4 : null;
      }),
    [goToService],
  );

  // auto-play only while the Showcase is actually on screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        visibleRef.current = e.isIntersecting;
        if (e.isIntersecting && readyRef.current && !busyRef.current && !pausedRef.current) scheduleNext(LIVE_MS);
        if (!e.isIntersecting) clearTimer();
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scheduleNext]);

  // phone: swipe the stage to step; vertical drags still scroll the page
  useEffect(() => {
    const el = touchRef.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let tracking = false;
    const down = (e: PointerEvent) => {
      sx = e.clientX;
      sy = e.clientY;
      tracking = true;
    };
    const up = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) advance(dx < 0 ? 1 : -1);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", () => (tracking = false));
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- advance only reads refs + stable callbacks (see scheduleNext)
  }, []);

  const togglePause = () => {
    setPaused((p) => {
      const next = !p;
      if (next) clearTimer();
      else if (readyRef.current && !busyRef.current) scheduleNext(LIVE_MS);
      return next;
    });
  };

  const onDockKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      advance(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      advance(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      void goToService(0, -1);
    } else if (e.key === "End") {
      e.preventDefault();
      void goToService(N - 1, 1);
    }
  };

  const svc = services[active];

  return (
    <section ref={sectionRef} id="services" aria-labelledby="services-title" className="relative py-16 sm:py-24">
      <div className="container-x">{heading}</div>

      <div className="container-x mt-8 sm:mt-12">
        <div
          data-ready={ready}
          className="showcase-panel relative isolate overflow-hidden rounded-[32px] border border-white/[0.09] bg-[linear-gradient(160deg,var(--surface-1)_0%,var(--surface-2)_60%)] p-4 sm:rounded-[40px] sm:p-7 lg:p-9"
        >
          {/* mobile: 9 story segments */}
          <div className="mb-3 flex gap-1.5 sm:hidden" aria-hidden="true">
            {services.map((s, i) => (
              <span key={s.slug} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                {i < active || (i === active && atFinale) ? <span className="block h-full w-full bg-white/70" /> : i === active ? (
                  <span key={cycleKey} className="showcase-seg block h-full bg-white/80" style={{ animationDuration: `${LIVE_MS}ms`, animationPlayState: paused ? "paused" : "running" }} />
                ) : null}
              </span>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[55%_1fr] lg:items-center lg:gap-10">
            {/* the stage: the swarm lands here as a picture, scroll-native, zero particles at rest */}
            <div ref={touchRef} className="relative mx-auto aspect-square w-full max-w-[460px] touch-pan-y select-none">
              <div ref={stageRef} data-particle-slot="stage" className="absolute inset-[6%]" aria-hidden="true" />
              <p className="showcase-caption absolute inset-x-0 bottom-1 text-center text-[13px] font-semibold text-white/70 sm:text-sm">{atFinale ? "" : svc.short}</p>
            </div>

            {/* details */}
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center justify-between gap-3">
                <p className="label-mono !text-[11px]">
                  {String(active + 1).padStart(2, "0")} / 0{N}
                </p>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => advance(-1)} className="showcase-nav" aria-label="Previous activity">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 3L5 7l4 4" />
                    </svg>
                  </button>
                  <button type="button" onClick={togglePause} className="showcase-nav" aria-label={paused ? "Resume auto-play" : "Pause auto-play"} aria-pressed={paused}>
                    {paused ? (
                      <svg width="12" height="13" viewBox="0 0 12 13" fill="currentColor" aria-hidden="true">
                        <path d="M1 1l10 5.5L1 12V1z" />
                      </svg>
                    ) : (
                      <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor" aria-hidden="true">
                        <rect x="0.5" y="0.5" width="3" height="12" rx="1" />
                        <rect x="7" y="0.5" width="3" height="12" rx="1" />
                      </svg>
                    )}
                  </button>
                  <button type="button" onClick={() => advance(1)} className="showcase-nav" aria-label="Next activity">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 3l4 4-4 4" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="mt-2.5 text-[22px] font-semibold leading-tight sm:text-[28px]">{svc.title}</h3>
              <p className="mt-2 max-w-[52ch] text-[14.5px] leading-relaxed text-nl-ink sm:text-[15px]">{svc.description}</p>
              <ul className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Capabilities">
                {svc.tags.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.1em] text-white/55">
                    <span className="h-1 w-1 rounded-full bg-nl-purple" />
                    {t}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => enquiry.open(svc.slug)} className="link-glow mt-5 inline-flex w-fit items-center gap-2 py-1 text-sm font-medium text-white" data-cursor="Ask">
                Talk to us about this
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* the dock */}
          <div role="tablist" aria-label="Jump to an activity" onKeyDown={onDockKey} className="showcase-dock mt-6 flex items-center gap-1 overflow-x-auto sm:mt-8 sm:justify-center sm:gap-2">
            {services.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                role="tab"
                aria-selected={i === active && !atFinale}
                tabIndex={i === active ? 0 : -1}
                onClick={() => void goToService(i, i > active ? 1 : i < active ? -1 : 1, { direct: true })}
                className="dock-btn group relative flex shrink-0 flex-col items-center gap-1 rounded-2xl px-2.5 py-2 text-white/55 transition-colors data-[on=true]:text-white"
                data-on={i === active && !atFinale}
              >
                <span className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] transition-colors group-data-[on=true]:border-nl-purple/60 group-data-[on=true]:bg-nl-purple/15 sm:h-10 sm:w-10">
                  <ActivityIcon icon={s.icon} size={18} play={i === active} />
                  {i === active && !atFinale && (
                    <svg className="dock-ring absolute -inset-[3px]" viewBox="0 0 40 40" aria-hidden="true">
                      <circle
                        key={cycleKey}
                        className="dock-ring-fill"
                        cx="20"
                        cy="20"
                        r="18.5"
                        fill="none"
                        stroke="var(--nl-purple)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        style={{ animationDuration: `${LIVE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                      />
                    </svg>
                  )}
                </span>
                <span className="hidden text-[10.5px] font-medium leading-none sm:block">{s.short}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Reduced motion: nothing moving — the nine cards in a list, each with a still number. */
function ServicesList({ heading }: { heading: React.ReactNode }) {
  return (
    <section id="services" aria-labelledby="services-title" className="relative pt-24 sm:pt-28">
      <div className="container-x">
        {heading}
        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.slug} className="flex flex-col">
              <div className="h-20 w-14" aria-hidden="true">
                <StaticDigit ch={String(s.n)} />
              </div>
              <ServiceCard service={s} className="mt-3 flex-1" />
            </li>
          ))}
        </ol>
      </div>
      <div className="container-x flex flex-col items-center pb-20 pt-14 text-center sm:pb-28 sm:pt-20">
        <h3 className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">
          All nine. <span className="font-accent text-gradient">One team.</span>
        </h3>
        <ul className="mt-8 grid w-full max-w-[760px] grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
          {services.map((s) => (
            <li key={s.slug}>
              <a
                href={`#service-${s.slug}`}
                className="finale-tile flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-2 py-4 text-nl-blue-soft transition-colors hover:border-nl-purple/50 hover:bg-nl-purple/[0.06] sm:gap-3 sm:rounded-3xl sm:py-6"
              >
                <ActivityIcon icon={s.icon} size={30} play={false} />
                <span className="text-[11.5px] font-medium leading-tight text-white/80 sm:text-sm">{s.short}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
