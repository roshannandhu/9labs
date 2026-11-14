"use client";

import { useEffect, useRef, useState } from "react";
import { useSite } from "@/components/providers/SiteProvider";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { SplitFlap } from "./SplitFlap";

/** The bridge is built in exactly three steps (the admin edits their words, not their number). */
const LAST = 2;
const stroke = { fill: "none", vectorEffect: "non-scaling-stroke" as const, strokeLinecap: "round" as const };

/* ---------------------------------------------------------------- side view (laptop / tablet) */
const quad = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
const H = { deck: 300, top: 70, water: 380, towers: [330, 870], x0: 120, x1: 1080 };

function SideBridge() {
  const { story } = useSite().about;
  const hangers: { x: number; y: number; side: "l" | "c" | "r" }[] = [];
  for (let x = 360; x <= 840; x += 30) hangers.push({ x, y: quad(H.top, 470, H.top, (x - 330) / 540), side: "c" });
  for (let x = 150; x <= 310; x += 30) hangers.push({ x, y: quad(290, 190, H.top, (x - H.x0) / (330 - H.x0)), side: "l" });
  for (let x = 890; x <= 1050; x += 30) hangers.push({ x, y: quad(H.top, 190, 290, (x - 870) / (H.x1 - 870)), side: "r" });

  return (
    <svg viewBox="0 0 1200 440" className="block h-auto w-full overflow-visible text-white" aria-hidden="true">
      <defs>
        <linearGradient id="bs-cable" x1="0" x2="1">
          <stop offset="0" stopColor="var(--brand-a)" />
          <stop offset="1" stopColor="var(--brand-b)" />
        </linearGradient>
        <filter id="bs-glow" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* water + reflections */}
      <path d={`M0 ${H.water} H1200`} {...stroke} stroke="currentColor" strokeOpacity="0.14" />
      <path d={`M180 ${H.water + 14} H460 M620 ${H.water + 14} H1020 M300 ${H.water + 28} H900`} {...stroke} stroke="currentColor" strokeOpacity="0.07" strokeDasharray="10 14" />

      {/* banks */}
      <path className="bs-draw bs-1" d={`M0 ${H.deck} H${H.x0} L${H.x0 + 26} ${H.water}`} {...stroke} stroke="currentColor" strokeOpacity="0.5" strokeWidth={1.4} />
      <path className="bs-draw bs-2" d={`M1200 ${H.deck} H${H.x1} L${H.x1 - 26} ${H.water}`} {...stroke} stroke="currentColor" strokeOpacity="0.5" strokeWidth={1.4} />

      {/* towers (left builds in step 1, right in step 2) */}
      {H.towers.map((x, i) => (
        <g key={x} className={i === 0 ? "bs-1" : "bs-2"}>
          <path className="bs-draw" d={`M${x - 13} ${H.water} V${H.top}`} {...stroke} stroke="currentColor" strokeOpacity="0.6" strokeWidth={1.5} />
          <path className="bs-draw" d={`M${x + 13} ${H.water} V${H.top}`} {...stroke} stroke="currentColor" strokeOpacity="0.6" strokeWidth={1.5} />
          <path
            className="bs-draw"
            d={`M${x - 13} 120 L${x + 13} 170 M${x + 13} 120 L${x - 13} 170 M${x - 13} 200 L${x + 13} 250 M${x + 13} 200 L${x - 13} 250 M${x - 13} 320 H${x + 13}`}
            {...stroke}
            stroke="currentColor"
            strokeOpacity="0.22"
          />
          <path className="bs-draw" d={`M${x - 18} ${H.top} H${x + 18}`} {...stroke} stroke="currentColor" strokeOpacity="0.7" strokeWidth={1.6} />
          {/* tower light */}
          <circle className="bs-pop" cx={x} cy={H.top - 10} r="4" fill={i === 0 ? "var(--brand-a)" : "var(--brand-b)"} filter="url(#bs-glow)" />
        </g>
      ))}

      {/* hangers */}
      {hangers.map((h) => (
        <path
          key={`${h.side}${h.x}`}
          className={`bs-draw ${h.side === "l" ? "bs-1" : "bs-2"}`}
          d={`M${h.x} ${h.y.toFixed(1)} V${H.deck}`}
          {...stroke}
          stroke="currentColor"
          strokeOpacity="0.22"
        />
      ))}

      {/* main cables */}
      <g filter="url(#bs-glow)">
        <path className="bs-draw bs-1" d={`M${H.x0} 290 Q225 190 330 ${H.top}`} {...stroke} stroke="url(#bs-cable)" strokeWidth={1.8} />
        <path className="bs-draw bs-2" d={`M330 ${H.top} Q600 470 870 ${H.top}`} {...stroke} stroke="url(#bs-cable)" strokeWidth={1.8} />
        <path className="bs-draw bs-2" d={`M870 ${H.top} Q975 190 ${H.x1} 290`} {...stroke} stroke="url(#bs-cable)" strokeWidth={1.8} />
      </g>

      {/* the deck joins in step 3: two lanes */}
      <g className="bs-3">
        <path className="bs-draw bs-deck" d={`M${H.x0} ${H.deck} H${H.x1}`} {...stroke} stroke="currentColor" strokeOpacity="0.85" strokeWidth={1.8} />
        <path className="bs-draw bs-deck" d={`M${H.x0} ${H.deck + 16} H${H.x1}`} {...stroke} stroke="currentColor" strokeOpacity="0.3" />
        <path className="bs-draw bs-deck" d={`M${H.x0} ${H.deck + 8} H${H.x1}`} {...stroke} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="8 10" />
      </g>

      {/* two-way traffic (runs once the bridge is complete) */}
      <g className="bs-traffic">
        <g className="bs-ltr" style={{ ["--run" as string]: `${H.x1 - H.x0 - 120}px` }}>
          <rect x={H.x0 + 4} y={H.deck - 26} width="112" height="22" rx="11" fill="var(--brand-a)" />
          <text x={H.x0 + 60} y={H.deck - 11} textAnchor="middle" className="bs-pill-text">
            {story.pillOut}
          </text>
        </g>
        <g className="bs-rtl" style={{ ["--run" as string]: `${H.x1 - H.x0 - 136}px` }}>
          <rect x={H.x1 - 140} y={H.deck + 22} width="136" height="22" rx="11" fill="var(--brand-b)" />
          <text x={H.x1 - 72} y={H.deck + 37} textAnchor="middle" className="bs-pill-text bs-pill-text--dark">
            {story.pillIn}
          </text>
        </g>
      </g>

      {/* the meeting point: the 9 */}
      <g className="bs-nine" transform={`translate(600 ${H.deck + 8})`}>
        <circle r="34" fill="var(--nl-bg)" stroke="url(#bs-cable)" strokeWidth="2" filter="url(#bs-glow)" />
        <text y="10" textAnchor="middle" className="bs-nine-text">
          9
        </text>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- the two banks (HTML, so text stays crisp and wraps) */
function YouBank({ className = "" }: { className?: string }) {
  const { story } = useSite().about;
  return (
    <div className={`bs-card bs-1 ${className}`}>
      <p className="label-mono !text-[10.5px]">{story.yourSideLabel}</p>
      <p className="mt-1 font-display text-[15px] font-semibold leading-tight text-white sm:text-base">{story.yourSideTitle}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {story.yourSideChips.map((t) => (
          <span key={t} className="rounded-full border border-[color:var(--brand-a)]/40 bg-[color:var(--brand-a)]/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
function UsBank({ className = "" }: { className?: string }) {
  const site = useSite();
  const { story } = site.about;
  return (
    <div className={`bs-card bs-2 ${className}`}>
      <p className="label-mono !text-[10.5px]">{story.ourSideLabel}</p>
      <p className="mt-1 font-display text-[15px] font-semibold leading-tight text-white sm:text-base">{story.ourSideTitle}</p>
      <div className="mt-2 grid w-max grid-cols-3 gap-1">
        {site.services.map((s) => (
          <span key={s.slug} className="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-nl-blue-soft" title={s.short}>
            <ActivityIcon icon={s.icon} size={14} play={false} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** A low skyline behind the phone panorama (moves slower than the bridge while you swipe: depth). */
function Skyline() {
  const r = (n: number) => (((Math.sin(n * 12.9898) * 43758.5453) % 1) + 1) % 1; // fixed pseudo-random
  const blocks: string[] = [];
  for (let x = 0, n = 1; x < 1250; n++) {
    const w = 26 + r(n) * 44;
    const h = 40 + r(n + 99) * (x < 200 || x > 1000 ? 90 : 46);
    blocks.push(`M${x.toFixed(0)} 380 V${(380 - h).toFixed(0)} H${(x + w).toFixed(0)} V380`);
    x += w + 4 + r(n + 7) * 10;
  }
  return (
    <svg viewBox="0 0 1250 440" className="absolute inset-0 h-full w-full text-white" preserveAspectRatio="none" aria-hidden="true">
      <path d={blocks.join(" ")} fill="currentColor" fillOpacity="0.04" />
    </svg>
  );
}


/**
 * Phone: the full, detailed bridge at real size, wider than the screen. Swipe sideways along it
 * (the page still scrolls normally up and down); it snaps to three stops (your side, the middle
 * with the 9 and two-way traffic, our side), each with its caption. The skyline moves slower than
 * the bridge for depth.
 */
function PhoneBridge({
  progress,
  onGo,
  reduced,
}: {
  progress: number;
  onGo: (index: number) => void;
  reduced: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const skylineRef = useRef<HTMLDivElement>(null);

  const { story, steps } = useSite().about;
  // Left bank (Quote 1) -> Right bank (Quote 2) -> Center result & zoom out full bridge (Quote 3)
  const STOPS = [
    { label: story.yourSideLabel, s: steps[0] },
    { label: story.ourSideLabel, s: steps[1] },
    { label: story.result || "Results", s: steps[LAST] },
  ];
  const stop = progress < 0.33 ? 0 : progress < 0.66 ? 1 : 2;
  const cur = STOPS[stop];

  useEffect(() => {
    if (reduced) return;
    const containerWidth = containerRef.current?.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 390);
    // Stage base width is 1250px.
    // Calculate full bridge fit scale so the 1200px SVG + padding fits cleanly across the mobile screen:
    const sFull = Math.min(0.85, (containerWidth - 20) / 1200);

    const p = Math.min(1, Math.max(0, progress));
    let currentX: number;
    let currentScale: number;

    if (p <= 0.5) {
      // Phase 1 -> 2: Camera pans from Left side (Quote 1) to Right side (Quote 2)
      const t = p / 0.5;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      currentX = 385 + (-355 - 385) * ease;
      currentScale = 1.0;
    } else {
      // Phase 2 -> 3: Camera pans to Center and Zooms Out to reveal the full bridge (Quote 3)
      const t = (p - 0.5) / 0.5;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const target3X = 25 * sFull;
      currentX = -355 + (target3X - (-355)) * ease;
      currentScale = 1.0 + (sFull - 1.0) * ease;
    }

    if (stageRef.current) {
      stageRef.current.style.transform = `translate3d(${currentX.toFixed(1)}px, 0, 0) scale(${currentScale.toFixed(3)})`;
    }
    if (skylineRef.current) {
      skylineRef.current.style.transform = `translate3d(${(-currentX * 0.35).toFixed(1)}px, 0, 0)`;
    }
  }, [progress, reduced]);

  return (
    <div className="mt-3 pb-2 sm:mt-6">
      <div
        ref={containerRef}
        role="region"
        aria-label="The bridge between your business and Nine Labs. Scroll down to cross it."
        className="relative -mx-4 overflow-hidden touch-pan-y sm:-mx-8 h-[270px] sm:h-[310px] flex items-center justify-center"
      >
        <div
          ref={stageRef}
          className="bs-stage relative w-[1250px] px-4 pt-2 will-change-transform shrink-0"
          style={{ transformOrigin: "50% 50%", transition: "none" }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div ref={skylineRef} className="absolute inset-0 will-change-transform">
              <Skyline />
            </div>
          </div>
          <div className="relative">
            <SideBridge />
            <YouBank className="absolute left-0 top-0 w-[220px]" />
            <UsBank className="absolute right-0 top-0 w-[220px]" />
            <p className="bs-result absolute left-1/2 top-[44%] -translate-x-1/2 rounded-full border border-white/15 bg-[var(--chip-bg)] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-lg">
              {story.result}
            </p>
          </div>
        </div>
      </div>

      {/* stops: tap to travel there */}
      <div className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-[var(--chip-bg)] p-1 shadow-[0_14px_34px_-24px_rgba(53,51,203,.5)]">
        {STOPS.map((st, i) => (
          <button
            key={st.label}
            type="button"
            onClick={() => onGo(i)}
            aria-pressed={i === stop}
            className={`flex-1 rounded-full px-2 py-2 text-[12.5px] font-semibold transition-colors duration-300 ${
              i === stop ? "bg-[linear-gradient(120deg,var(--nl-purple),var(--nl-blue))] text-paper" : "text-white/60"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-[90px] text-center" aria-live="polite">
        <p key={`a${stop}`} className="bs-step-in font-display text-[18px] font-semibold leading-tight text-white">
          {cur.s.title}
        </p>
        <p key={`b${stop}`} className="bs-step-in mx-auto mt-1 max-w-[36ch] text-[14px] leading-snug text-nl-ink">
          {cur.s.text}
        </p>
        <p className="label-mono mt-2 text-white/40" aria-hidden="true">
          Scroll down to cross the bridge ↓
        </p>
      </div>
    </div>
  );
}

/**
 * "How we work" — the brand idea (a bridge between your business and your results) in three steps:
 *   1. your side: your business with its goals, ideas and feedback (left tower + cable)
 *   2. our side: Nine Labs and its nine activities (right tower, the main span, hangers)
 *   3. the deck joins: two-way traffic, the 9 lights up in the middle, "Results".
 * Pinned scroll stage on both desktop and mobile: locks until all three quotes complete.
 */
export function BridgeStory() {
  const { reduced } = useDemo();
  const { story, steps } = useSite().about;
  const wide = useMediaQuery("(min-width: 768px)", true);
  // phones held sideways: too short for cards over the bridge, so cards sit beside it
  const short = useMediaQuery("(orientation: landscape) and (max-height: 520px)");
  const root = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [phoneProgress, setPhoneProgress] = useState(0);
  const [flap, setFlap] = useState({ cur: 0, prev: 0, k: 0 });
  const step = reduced ? LAST : flap.cur;

  useGSAP(
    () => {
      const el = root.current;
      const stage = el?.querySelector(".bs-stage");
      if (!el || !stage || reduced) return;
      const q = gsap.utils.selector(el);
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      tl.from(q(".bs-1.bs-card, .bs-1 .bs-card"), { autoAlpha: 0, y: 18, duration: 0.35 }, 0)
        .from(q(".bs-1.bs-draw, .bs-1 .bs-draw"), { drawSVG: "0%", duration: 0.65, stagger: 0.01 }, 0.05)
        .from(q(".bs-1 .bs-pop, .bs-1.bs-pop"), { autoAlpha: 0, scale: 0.3, transformOrigin: "50% 50%", duration: 0.2 }, 0.6)
        .from(q(".bs-2.bs-card, .bs-2 .bs-card"), { autoAlpha: 0, y: 18, duration: 0.35 }, 1.0)
        .from(q(".bs-2.bs-draw, .bs-2 .bs-draw"), { drawSVG: "0%", duration: 0.65, stagger: 0.008 }, 1.05)
        .from(q(".bs-2 .bs-pop, .bs-2.bs-pop"), { autoAlpha: 0, scale: 0.3, transformOrigin: "50% 50%", duration: 0.2 }, 1.6)
        .from(q(".bs-deck"), { drawSVG: "50% 50%", duration: 0.45 }, 2.0)
        .from(q(".bs-nine"), { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.25 }, 2.35)
        .from(q(".bs-result"), { autoAlpha: 0, y: 10, duration: 0.2 }, 2.45)
        .to({}, { duration: 0.55 });

      const setStep = (p: number) => {
        const i = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
        setFlap((f) => (f.cur === i ? f : { cur: i, prev: f.cur, k: f.k + 1 }));
        el.dataset.live = p >= 0.72 ? "true" : "false";
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 72px",
        end: () => `+=${Math.round(window.innerHeight * 1.8)}`,
        pin: true,
        anticipatePin: 1,
        scrub: wide ? 0.3 : true,
        animation: wide ? tl : undefined,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setStep(self.progress);
          setPhoneProgress(self.progress);
          if (!wide) {
            tl.progress(self.progress);
          }
        },
      });
      stRef.current = st;
      setStep(st.progress);
      setPhoneProgress(st.progress);
      if (!wide) {
        tl.progress(st.progress);
      }
      return () => {
        stRef.current = null;
      };
    },
    { scope: root, dependencies: [reduced, wide, short], revertOnUpdate: true },
  );

  const handleGoToStop = (i: number) => {
    const st = stRef.current;
    if (st) {
      const progressTarget = i === 0 ? 0 : i === 1 ? 0.5 : 0.95;
      const target = st.start + (st.end - st.start) * progressTarget;
      window.scrollTo({ top: target, behavior: "smooth" });
    }
  };

  const s = steps[step];
  const counter = (
    <div className="flex items-end gap-3 sm:gap-4" aria-hidden="true">
      <SplitFlap
        value={String(step + 1).padStart(2, "0")}
        prev={String(flap.prev + 1).padStart(2, "0")}
        k={reduced ? 0 : flap.k}
        className="font-digits text-[44px] font-black leading-none text-white sm:text-[64px] lg:text-[76px] lsp:!text-[40px]"
      />
      <span className="pb-1 font-digits text-lg font-black text-white/25 sm:text-2xl">/ 0{steps.length}</span>
    </div>
  );

  return (
    <div ref={root} data-live="false" className="bridge-story relative mt-16 sm:mt-20">
      <div className="container-x flex flex-col">
        {/* heading + the current step (laptop) */}
        <div className="grid gap-4 md:grid-cols-12 md:items-end md:gap-8">
          <div className="md:col-span-5">
            <p className="label-mono lsp:hidden">{story.label}</p>
            <SpringHeading
              as="h3"
              text={story.heading}
              accent={story.accent || undefined}
              className="mt-3 font-display text-[clamp(1.6rem,3.6vw,3rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-white lsp:mt-0 lsp:text-[1.4rem]"
            />
          </div>
          {wide && (
            <div className="flex items-end gap-4 md:col-span-7 md:justify-end">
              {counter}
              <div className="min-w-0 max-w-[44ch] pb-1" aria-live="polite">
                <p key={step} className="bs-step-in font-display text-[17px] font-semibold leading-tight text-white sm:text-xl">
                  {s.title}
                </p>
                <p key={`t${step}`} className="bs-step-in mt-1 text-[13.5px] leading-snug text-nl-ink sm:text-[15px] lsp:hidden">
                  {s.text}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* the bridge */}
        {wide && short ? (
          <div className="bs-stage mt-3 flex items-center gap-3">
            <YouBank className="w-[150px] shrink-0" />
            <div className="relative mx-auto min-w-0 max-w-[calc((100svh_-_var(--nav-h)_-_150px)*2.72)] flex-1">
              <SideBridge />
              <p className="bs-result absolute left-1/2 top-[44%] -translate-x-1/2 rounded-full border border-white/15 bg-[var(--chip-bg)] px-3 py-1 text-[12px] font-semibold text-white shadow-lg">
                {story.result}
              </p>
            </div>
            <UsBank className="w-[150px] shrink-0" />
          </div>
        ) : wide ? (
          <div className="bs-stage relative mx-auto mt-8 w-full max-w-[min(100%,calc((100svh_-_var(--nav-h)_-_210px)*2.72))]">
            <SideBridge />
            <YouBank className="absolute left-0 top-0 w-[20%] min-w-[132px]" />
            <UsBank className="absolute right-0 top-0 w-[20%] min-w-[132px]" />
            <p className="bs-result absolute left-1/2 top-[44%] -translate-x-1/2 rounded-full border border-white/15 bg-[var(--chip-bg)] px-3 py-1 text-[12px] font-semibold text-white shadow-lg">
              {story.result}
            </p>
          </div>
        ) : (
          <PhoneBridge progress={phoneProgress} onGo={handleGoToStop} reduced={reduced} />
        )}

        {/* reduced motion: every step, plainly */}
        {reduced && (
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((st) => (
              <li key={st.n}>
                <span className="font-digits text-sm font-black text-nl-purple">{st.n}</span>
                <p className="mt-1 font-display text-lg font-semibold text-white">{st.title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-nl-ink">{st.text}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}