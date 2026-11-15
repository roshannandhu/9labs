"use client";

import { useRef, useState } from "react";
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

/* ---------------------------------------------------------------- the scene (one drawing for phone and laptop) */
const quad = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
const H = { deck: 300, top: 70, water: 380, towers: [330, 870], x0: 120, x1: 1080, mid: 600 };
/** Deck lamps: clear of the towers and the 9 in the middle; they light from both ends inward. */
const LAMPS = [170, 230, 290, 380, 440, 500, 700, 760, 820, 910, 970, 1030];
/** Your side: a small town on the left bank (x, width, height, window columns). */
const TOWN = [
  { x: 10, w: 30, h: 98, cols: 2 },
  { x: 44, w: 22, h: 64, cols: 1 },
  { x: 70, w: 40, h: 44, cols: 0 }, // the shop (awning, no window grid)
];

/**
 * The 3 timeline beats. Times are in timeline units; both layouts share them, the phone only adds a
 * camera on top. `rightAt`/`spanAt` let the phone build the cable while it pans, before our side shows.
 */
const T = { span: 0.7, deck: 2.1, nine: 2.4, live: 2.5, end: 3.0 };

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
        <radialGradient id="bs-sun-fill">
          <stop offset="0" stopColor="var(--brand-b)" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="var(--brand-a)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--brand-a)" stopOpacity="0" />
        </radialGradient>
        <filter id="bs-glow" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* the sun rises behind the result (step 3) */}
      <g className="bs-sun">
        <circle cx={H.mid} cy="150" r="120" fill="url(#bs-sun-fill)" />
        <circle cx={H.mid} cy="150" r="34" fill="none" stroke="url(#bs-cable)" strokeOpacity="0.45" strokeWidth="1.2" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <path
              key={i}
              d={`M${(H.mid + Math.cos(a) * 46).toFixed(1)} ${(150 + Math.sin(a) * 46).toFixed(1)} L${(H.mid + Math.cos(a) * 58).toFixed(1)} ${(150 + Math.sin(a) * 58).toFixed(1)}`}
              {...stroke}
              stroke="var(--brand-a)"
              strokeOpacity="0.35"
            />
          );
        })}
      </g>

      {/* birds (step 3) */}
      <g className="bs-birds" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        {[
          [470, 112, 1],
          [500, 96, 0.8],
          [722, 124, 0.9],
          [748, 104, 0.7],
        ].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <path className="bs-bird" style={{ animationDelay: `${i * -0.3}s` }} d="M-8 0 Q-4 -6 0 0 Q4 -6 8 0" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </g>

      {/* water + reflections, and a boat (always there: the scene is alive before anything is built) */}
      <path d={`M0 ${H.water} H1200`} {...stroke} stroke="currentColor" strokeOpacity="0.14" />
      <path d={`M180 ${H.water + 14} H460 M620 ${H.water + 14} H1020 M300 ${H.water + 28} H900`} {...stroke} stroke="currentColor" strokeOpacity="0.07" strokeDasharray="10 14" />
      <g className="bs-boat">
        <path d={`M452 ${H.water - 2} H500 L492 ${H.water + 7} H460 Z`} fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={`M476 ${H.water - 2} V${H.water - 40} L496 ${H.water - 8} Z`} fill="var(--brand-b)" fillOpacity="0.35" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </g>

      {/* ------------------------------------------------ step 1: your side */}
      <path className="bs-draw bs-1 bs-bank" d={`M0 ${H.deck} H${H.x0} L${H.x0 + 26} ${H.water}`} {...stroke} stroke="currentColor" strokeOpacity="0.5" strokeWidth={1.4} />
      <g className="bs-1">
        {TOWN.map((b, i) => (
          <g key={b.x} className="bs-rise">
            <rect x={b.x} y={H.deck - b.h} width={b.w} height={b.h} rx="2" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {Array.from({ length: b.cols * Math.floor((b.h - 16) / 14) }, (_, k) => {
              const c = k % b.cols;
              const r = Math.floor(k / b.cols);
              return <rect key={k} className="bs-win" x={b.x + 6 + c * 11} y={H.deck - b.h + 8 + r * 14} width="7" height="8" rx="1" fill={(k + i) % 3 === 0 ? "var(--brand-b)" : "var(--brand-a)"} fillOpacity="0.7" />;
            })}
            {b.cols === 0 && (
              <>
                {/* awning + door */}
                <path d={`M${b.x - 3} ${H.deck - b.h + 12} H${b.x + b.w + 3} L${b.x + b.w} ${H.deck - b.h} H${b.x} Z`} fill="var(--brand-a)" fillOpacity="0.55" />
                <rect className="bs-win" x={b.x + 6} y={H.deck - 24} width="12" height="24" fill="var(--brand-b)" fillOpacity="0.55" />
                <rect className="bs-win" x={b.x + 23} y={H.deck - 24} width="12" height="12" fill="var(--brand-a)" fillOpacity="0.5" />
              </>
            )}
          </g>
        ))}
        {/* goals, ideas, feedback — floating up from your side */}
        {[
          { x: 40, y: 168, d: "M0 -6 A6 6 0 1 1 -0.01 -6 M0 -2.5 A2.5 2.5 0 1 1 -0.01 -2.5" }, // target
          { x: 92, y: 140, d: "M-4 2 A5.5 5.5 0 1 1 4 2 V5 H-4 Z M-2.5 8 H2.5" }, // bulb
          { x: 144, y: 168, d: "M-7 -5 H7 V4 H-1 L-5 8 V4 H-7 Z" }, // chat
        ].map((b, i) => (
          <g key={i} className="bs-bubble" transform={`translate(${b.x} ${b.y})`}>
            <g className="bs-float" style={{ animationDelay: `${i * -1.1}s` }}>
              <circle r="15" fill="var(--chip-bg)" stroke="var(--brand-a)" strokeOpacity="0.55" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d={b.d} fill="none" stroke="var(--brand-a)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </g>
          </g>
        ))}
      </g>

      {/* ------------------------------------------------ step 2: our side — the studio and its nine lit windows */}
      <path className="bs-draw bs-2 bs-bank" d={`M1200 ${H.deck} H${H.x1} L${H.x1 - 26} ${H.water}`} {...stroke} stroke="currentColor" strokeOpacity="0.5" strokeWidth={1.4} />
      <g className="bs-2">
        <g className="bs-rise">
          <rect x="1096" y={H.deck - 104} width="66" height="104" rx="3" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <rect x="1162" y={H.deck - 48} width="30" height="48" rx="2" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={`M1129 ${H.deck - 104} V${H.deck - 128}`} {...stroke} stroke="currentColor" strokeOpacity="0.5" />
          <circle cx="1129" cy={H.deck - 130} r="2.5" fill="var(--brand-b)" />
          {[10, 18].map((r) => (
            <path key={r} className="bs-signal" d={`M${1129 - r} ${H.deck - 130 - r * 0.6} A${r} ${r} 0 0 1 ${1129 + r} ${H.deck - 130 - r * 0.6}`} {...stroke} stroke="var(--brand-b)" strokeOpacity="0.6" />
          ))}
          <rect className="bs-win" x="1170" y={H.deck - 22} width="14" height="22" fill="var(--brand-a)" fillOpacity="0.5" />
        </g>
        {/* the nine activities: a 3 × 3 grid of windows */}
        {Array.from({ length: 9 }, (_, k) => (
          <rect
            key={k}
            className="bs-nine-win"
            x={1105 + (k % 3) * 17}
            y={H.deck - 92 + Math.floor(k / 3) * 22}
            width="13"
            height="15"
            rx="2"
            fill={k % 2 ? "var(--brand-b)" : "var(--brand-a)"}
            fillOpacity="0.85"
          />
        ))}
      </g>

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
          <circle className="bs-pop" cx={x} cy={H.top - 10} r="4" fill={i === 0 ? "var(--brand-a)" : "var(--brand-b)"} filter="url(#bs-glow)" />
        </g>
      ))}

      {/* hangers: the back spans with their side, the main span is strung left → right toward our side */}
      {hangers.map((h) => (
        <path
          key={`${h.side}${h.x}`}
          className={`bs-draw ${h.side === "l" ? "bs-1 bs-hang-l" : h.side === "r" ? "bs-2 bs-hang-r" : "bs-hang-c"}`}
          d={`M${h.x} ${h.y.toFixed(1)} V${H.deck}`}
          {...stroke}
          stroke="currentColor"
          strokeOpacity="0.22"
        />
      ))}

      {/* main cables */}
      <g filter="url(#bs-glow)">
        <path className="bs-draw bs-1 bs-cable-l" d={`M${H.x0} 290 Q225 190 330 ${H.top}`} {...stroke} stroke="url(#bs-cable)" strokeWidth={1.8} />
        <path className="bs-draw bs-span" d={`M330 ${H.top} Q600 470 870 ${H.top}`} {...stroke} stroke="url(#bs-cable)" strokeWidth={1.8} />
        <path className="bs-draw bs-2 bs-cable-r" d={`M870 ${H.top} Q975 190 ${H.x1} 290`} {...stroke} stroke="url(#bs-cable)" strokeWidth={1.8} />
      </g>
      {/* the spark at the head of the cable while it is strung */}
      <circle className="bs-spark" r="5" fill="var(--brand-b)" filter="url(#bs-glow)" opacity="0" />

      {/* ------------------------------------------------ step 3: the deck meets in the middle */}
      <g>
        {[0, 8, 16].map((dy) => (
          <g key={dy}>
            {[H.x0, H.x1].map((from) => (
              <path
                key={from}
                className="bs-draw bs-deck"
                d={`M${from} ${H.deck + dy} H${H.mid}`}
                {...stroke}
                stroke="currentColor"
                strokeOpacity={dy === 0 ? 0.85 : dy === 8 ? 0.2 : 0.3}
                strokeWidth={dy === 0 ? 1.8 : 1}
                strokeDasharray={dy === 8 ? "8 10" : undefined}
              />
            ))}
          </g>
        ))}
      </g>
      {/* deck lamps */}
      {LAMPS.map((x) => (
        <g key={x} className="bs-lamp">
          <path d={`M${x} ${H.deck} V${H.deck - 16}`} {...stroke} stroke="currentColor" strokeOpacity="0.4" />
          <circle cx={x} cy={H.deck - 18} r="2.6" fill="var(--brand-b)" filter="url(#bs-glow)" />
        </g>
      ))}

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

      {/* the meeting point: the 9, with a burst and sparkles */}
      <g transform={`translate(${H.mid} ${H.deck + 8})`}>
        <circle className="bs-burst" r="34" fill="none" stroke="url(#bs-cable)" strokeWidth="2" opacity="0" />
        <g className="bs-nine">
          <circle r="34" fill="var(--nl-bg)" stroke="url(#bs-cable)" strokeWidth="2" filter="url(#bs-glow)" />
          <text y="10" textAnchor="middle" className="bs-nine-text">
            9
          </text>
        </g>
        {[
          [-58, -30, 1],
          [54, -40, 0.8],
          [64, 14, 0.6],
          [-66, 18, 0.7],
        ].map(([x, y, s], i) => (
          <path key={i} className="bs-star" transform={`translate(${x} ${y}) scale(${s})`} d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z" fill={i % 2 ? "var(--brand-b)" : "var(--brand-a)"} />
        ))}
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- the two banks (HTML, so text stays crisp and wraps) */
function YouBank({ className = "" }: { className?: string }) {
  const { story } = useSite().about;
  return (
    <div className={`bs-card bs-card-you ${className}`}>
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
    <div className={`bs-card bs-card-us ${className}`}>
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

/** A low skyline behind the phone panorama (moves slower than the bridge while you scroll: depth). */
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

/** Phone camera window height (px); the stage is 1200 × 440 at scale 1 inside it. */
const PH = 340;

/**
 * Phone: the same three beats as the laptop, with a camera.
 *   1. on your side (your town, the left tower, "Your business");
 *   2. the cable is strung toward our side and the camera follows it right, onto the Nine Labs studio;
 *   3. the camera moves to the middle: the deck meets, the 9 lights up and the result appears;
 *      then it pulls back to the whole bridge, with the two sides and the result labelled.
 */
function PhoneBridge({ stop, flap, onGo, reduced }: { stop: number; flap: { cur: number; prev: number; k: number }; onGo: (index: number) => void; reduced: boolean }) {
  const { story, steps } = useSite().about;
  const STOPS = [
    { label: story.yourSideLabel, s: steps[0] },
    { label: story.ourSideLabel, s: steps[1] },
    { label: story.result || "Results", s: steps[LAST] },
  ];

  return (
    <div className="bs-phone mt-2 pb-6 sm:mt-4">
      {reduced ? (
        <div className="relative py-4">
          <SideBridge />
        </div>
      ) : (
        <div
          role="region"
          aria-label="The bridge between your business and Nine Labs. Scroll down to cross it."
          className="bs-cam relative -mx-4 flex select-none items-start justify-start overflow-hidden sm:-mx-8"
          style={{ height: PH }}
        >
          <div className="bs-phone-stage relative h-[440px] w-[1200px] shrink-0 will-change-transform" style={{ transformOrigin: "0 0" }}>
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="bs-skyline absolute inset-0 will-change-transform">
                <Skyline />
              </div>
            </div>
            <div className="relative h-[440px] w-[1200px]">
              <SideBridge />
              <div className="bs-stage-card absolute left-[24px] top-[22px] w-[224px]">
                <YouBank />
              </div>
              <div className="bs-stage-card absolute left-[952px] top-[22px] w-[224px]">
                <UsBank />
              </div>
              <p className="bs-result absolute left-[600px] top-[188px] -translate-x-1/2 rounded-full border border-white/15 bg-[var(--chip-bg)] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-lg">
                {story.result}
              </p>
            </div>
          </div>

          {/* the pulled-back view: labels at readable size, outside the scaled stage */}
          <p className="bs-wide-tag pointer-events-none absolute left-4 top-3 rounded-full border border-[color:var(--brand-a)]/40 bg-[var(--chip-bg)] px-3 py-1 text-[12px] font-semibold text-white">
            {story.yourSideTitle}
          </p>
          <p className="bs-wide-tag pointer-events-none absolute right-4 top-3 rounded-full border border-[color:var(--brand-b)]/50 bg-[var(--chip-bg)] px-3 py-1 text-[12px] font-semibold text-white">
            {story.ourSideTitle}
          </p>
          <p className="bs-wide-result pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-[linear-gradient(120deg,var(--nl-purple),var(--nl-blue))] px-4 py-1.5 text-[14px] font-semibold text-[#fff] shadow-[0_14px_34px_-14px_rgba(53,51,203,.7)]">
            {story.result}
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 pl-1" aria-hidden="true">
          <SplitFlap value={String(stop + 1).padStart(2, "0")} prev={String(flap.prev + 1).padStart(2, "0")} k={reduced ? 0 : flap.k} className="font-digits text-[26px] font-black leading-none text-white" />
          <span className="font-digits text-xs font-black text-white/30">/ 0{steps.length}</span>
        </div>

        {/* stops: tap to travel there */}
        <div className="relative flex flex-1 items-center justify-between rounded-full border border-white/10 bg-[var(--chip-bg)] p-1 shadow-[0_14px_34px_-24px_rgba(53,51,203,.5)]">
          <div
            className="bs-tab-pill pointer-events-none absolute bottom-1 top-1 rounded-full bg-[linear-gradient(120deg,var(--nl-purple),var(--nl-blue))] shadow-sm will-change-transform"
            style={{ width: "calc(33.333% - 2.67px)", left: 4, transform: reduced ? "translateX(200%)" : undefined }}
          />
          {STOPS.map((st, i) => (
            <button
              key={st.label}
              type="button"
              onClick={() => onGo(i)}
              className={`relative z-10 flex-1 rounded-full py-1.5 text-center text-[12px] font-semibold transition-colors ${stop === i ? "text-[#fff]" : "text-white/70 hover:text-white"}`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* the three quotes crossfade with the scroll (stacked, so nothing jumps) */}
      <div className="relative mt-3 min-h-[82px] text-center" aria-live="polite">
        {STOPS.map((st, i) => (
          <div key={st.label} className={`bs-quote-${i} absolute inset-x-0 top-0 will-change-transform`} style={reduced && i !== LAST ? { opacity: 0 } : undefined}>
            <p className="font-display text-[17px] font-semibold leading-tight text-white">{st.s.title}</p>
            <p className="mx-auto mt-1 max-w-[34ch] text-[13.5px] leading-snug text-nl-ink">{st.s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Builds the three beats into `tl` (shared by phone and laptop). `scope` is the layout's own wrapper;
 * `rightAt` is when our side appears and `spanAt` when the main cable starts toward it.
 */
function buildBeats(tl: gsap.core.Timeline, q: (s: string) => Element[], scope: string, rightAt: number, spanAt: number) {
  const $ = (s: string) => q(s.split(",").map((p) => `${scope} ${p.trim()}`).join(", "));
  const span = $(".bs-span")[0];

  // 1 · your side
  tl.from($(".bs-card-you"), { autoAlpha: 0, y: 18, duration: 0.3 }, 0)
    .from($(".bs-1.bs-bank"), { drawSVG: "0%", duration: 0.3 }, 0.05)
    .from($(".bs-1 .bs-rise"), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.3, stagger: 0.07, ease: "back.out(1.6)" }, 0.12)
    .from($(".bs-1 .bs-win"), { autoAlpha: 0, duration: 0.04, stagger: 0.012 }, 0.32)
    .from($(".bs-bubble"), { autoAlpha: 0, y: 24, scale: 0.4, transformOrigin: "50% 50%", duration: 0.25, stagger: 0.08, ease: "back.out(2)" }, 0.4)
    .from($(".bs-1 .bs-draw:not(.bs-hang-l):not(.bs-cable-l)"), { drawSVG: "0%", duration: 0.4, stagger: 0.01 }, 0.25)
    .from($(".bs-1 .bs-pop, .bs-1.bs-pop"), { autoAlpha: 0, scale: 0.3, transformOrigin: "50% 50%", duration: 0.15 }, 0.65)
    .from($(".bs-cable-l"), { drawSVG: "0%", duration: 0.3 }, 0.55)
    .from($(".bs-hang-l"), { drawSVG: "0%", duration: 0.12, stagger: 0.03 }, 0.6);

  // 2 · our side + the main span strung toward it
  tl.from($(".bs-card-us"), { autoAlpha: 0, y: 18, duration: 0.3 }, rightAt)
    .from($(".bs-2.bs-bank"), { drawSVG: "0%", duration: 0.3 }, rightAt)
    .from($(".bs-2 .bs-rise"), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.3, ease: "back.out(1.4)" }, rightAt + 0.08)
    .from($(".bs-nine-win"), { autoAlpha: 0, scale: 0.2, transformOrigin: "50% 50%", duration: 0.08, stagger: 0.04 }, rightAt + 0.3)
    .from($(".bs-2 .bs-win"), { autoAlpha: 0, duration: 0.06 }, rightAt + 0.3)
    .from($(".bs-2 .bs-draw:not(.bs-hang-r):not(.bs-cable-r)"), { drawSVG: "0%", duration: 0.4, stagger: 0.01 }, rightAt + 0.1)
    .from($(".bs-2 .bs-pop, .bs-2.bs-pop"), { autoAlpha: 0, scale: 0.3, transformOrigin: "50% 50%", duration: 0.15 }, rightAt + 0.5)
    .from($(".bs-cable-r"), { drawSVG: "0%", duration: 0.25 }, rightAt + 0.45)
    .from($(".bs-hang-r"), { drawSVG: "0%", duration: 0.1, stagger: 0.025 }, rightAt + 0.5)
    .from(span, { drawSVG: "0%", duration: T.span }, spanAt)
    .from($(".bs-hang-c"), { drawSVG: "0%", duration: 0.12, stagger: (T.span - 0.12) / 16 }, spanAt);
  if (span) {
    tl.set($(".bs-spark"), { opacity: 1 }, spanAt)
      .to($(".bs-spark"), { motionPath: { path: span as SVGPathElement, align: span as SVGPathElement, alignOrigin: [0.5, 0.5] }, duration: T.span }, spanAt)
      .set($(".bs-spark"), { opacity: 0 }, spanAt + T.span);
  }

  // 3 · together: the deck meets in the middle, the 9 lights up, the result
  tl.from($(".bs-deck"), { drawSVG: "0%", duration: 0.3 }, T.deck)
    .from($(".bs-nine"), { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.18, ease: "back.out(2.2)" }, T.nine)
    .fromTo($(".bs-burst"), { opacity: 0.9, scale: 1, transformOrigin: "50% 50%" }, { opacity: 0, scale: 2.6, duration: 0.35, ease: "power2.out", immediateRender: false }, T.nine + 0.05)
    .from($(".bs-star"), { autoAlpha: 0, scale: 0, transformOrigin: "50% 50%", duration: 0.15, stagger: 0.04, ease: "back.out(3)" }, T.nine + 0.1)
    .from($(".bs-lamp"), { autoAlpha: 0, duration: 0.06, stagger: { each: 0.03, from: "edges" } }, T.deck + 0.1)
    .from($(".bs-result"), { autoAlpha: 0, y: 10, duration: 0.18 }, T.nine + 0.12)
    .from($(".bs-sun"), { autoAlpha: 0, y: 70, duration: 0.45, ease: "power2.out" }, T.nine)
    .from($(".bs-birds"), { autoAlpha: 0, x: -40, duration: 0.4 }, T.nine + 0.15);
}

/**
 * "How we work" — the brand idea (a bridge between your business and your results) in three scroll steps:
 *   1. your side: your business — a small town with its goals, ideas and feedback (left tower + cable)
 *   2. our side: the Nine Labs studio with nine lit windows; the cable is strung across toward it
 *   3. the deck meets in the middle: the 9 lights up, lamps come on, the sun rises on "Results".
 * Pinned on both phone and laptop; the phone adds a camera (your side → our side → middle → whole bridge).
 */
export function BridgeStory() {
  const { reduced } = useDemo();
  const { story, steps } = useSite().about;
  const wide = useMediaQuery("(min-width: 768px)", true);
  // phones held sideways: too short for cards over the bridge, so cards sit beside it
  const short = useMediaQuery("(orientation: landscape) and (max-height: 520px)");
  const root = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const stopsRef = useRef<number[]>([0, 0.5, 1]);
  const [flap, setFlap] = useState({ cur: 0, prev: 0, k: 0 });
  const step = reduced ? LAST : flap.cur;

  useGSAP(
    () => {
      const el = root.current;
      if (!el || reduced) return;
      const q = gsap.utils.selector(el);
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      // step boundaries and the "traffic runs" point, in timeline time
      const marks = { s1: 0.95, s2: 2.0, live: T.live };

      if (wide) {
        buildBeats(tl, q, ".bs-stage", 1.0, 1.3);
        tl.to({}, { duration: 0.4 }, T.end);
      } else {
        // the camera: x/scale of the 1200 × 440 stage inside a window W wide and PH tall
        const W = el.querySelector(".bs-cam")?.clientWidth || window.innerWidth;
        const focus = (cx: number) => W / 2 - cx;
        const sFull = Math.min(1, W / 1100);
        const yFull = Math.max(44, (PH - 440 * sFull) / 2 + 14);
        const y0 = -6;

        gsap.set(q(".bs-phone-stage"), { x: focus(170), y: y0, scale: 1 });
        gsap.set(q(".bs-skyline"), { x: 0 });
        gsap.set(q(".bs-wide-tag, .bs-wide-result"), { autoAlpha: 0 });
        gsap.set(q(".bs-wide-result"), { y: yFull + 400 * sFull + 8 });
        gsap.set(q(".bs-quote-1, .bs-quote-2"), { autoAlpha: 0, y: 12 });
        gsap.set(q(".bs-tab-pill"), { xPercent: 0 });

        buildBeats(tl, q, ".bs-phone", 1.3, 0.95);
        const cam = (x: number, y: number, scale: number, at: number, duration: number) =>
          tl
            .to(q(".bs-phone-stage"), { x, y, scale, duration, ease: "power2.inOut" }, at)
            .to(q(".bs-skyline"), { x: (focus(170) - x) * 0.25, duration, ease: "power2.inOut" }, at);

        // 1 → 2: follow the cable toward our side
        cam(focus(1030), y0, 1, 0.95, 0.95);
        tl.to(q(".bs-quote-0"), { autoAlpha: 0, y: -10, duration: 0.12 }, 0.95)
          .to(q(".bs-quote-1"), { autoAlpha: 1, y: 0, duration: 0.2 }, 1.08)
          .to(q(".bs-tab-pill"), { xPercent: 100, duration: 0.6, ease: "power2.inOut" }, 0.95);
        // 2 → 3: to the middle, where the deck meets
        cam(focus(H.mid), y0, 1, 2.0, 0.35);
        tl.to(q(".bs-quote-1"), { autoAlpha: 0, y: -10, duration: 0.12 }, 2.0)
          .to(q(".bs-quote-2"), { autoAlpha: 1, y: 0, duration: 0.2 }, 2.13)
          .to(q(".bs-tab-pill"), { xPercent: 200, duration: 0.35, ease: "power2.inOut" }, 2.0);
        // pull back to the whole bridge; small in-stage text gives way to readable labels
        cam(W / 2 - H.mid * sFull, yFull, sFull, 2.8, 0.55);
        tl.to(q(".bs-stage-card, .bs-phone .bs-result"), { autoAlpha: 0, duration: 0.2 }, 2.8)
          .to(q(".bs-wide-tag"), { autoAlpha: 1, duration: 0.2, stagger: 0.08 }, 3.2)
          .to(q(".bs-wide-result"), { autoAlpha: 1, duration: 0.2 }, 3.3)
          .to({}, { duration: 0.35 }, 3.5);
      }

      const dur = tl.duration();
      stopsRef.current = [0.5 / dur, 1.85 / dur, 1];
      const setStep = (p: number) => {
        const t = p * dur;
        const i = t < marks.s1 ? 0 : t < marks.s2 ? 1 : 2;
        setFlap((f) => (f.cur === i ? f : { cur: i, prev: f.cur, k: f.k + 1 }));
        el.dataset.live = t >= marks.live ? "true" : "false";
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 72px",
        // about three scrolls: one screen per step
        end: () => `+=${Math.round(window.innerHeight * (wide ? 2.4 : 2.6))}`,
        pin: true,
        anticipatePin: 1,
        scrub: wide ? 0.3 : true,
        animation: tl,
        invalidateOnRefresh: true,
        onUpdate: (self) => setStep(self.progress),
      });
      stRef.current = st;
      setStep(st.progress);
      return () => {
        stRef.current = null;
      };
    },
    { scope: root, dependencies: [reduced, wide, short], revertOnUpdate: true },
  );

  const handleGoToStop = (i: number) => {
    const st = stRef.current;
    if (!st) return;
    window.scrollTo({ top: st.start + (st.end - st.start) * stopsRef.current[i], behavior: "smooth" });
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
    <div ref={root} data-live={reduced ? "true" : "false"} className="bridge-story relative mt-16 sm:mt-20">
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
              <p className="bs-result absolute left-1/2 top-[38%] -translate-x-1/2 rounded-full border border-white/15 bg-[var(--chip-bg)] px-3 py-1 text-[12px] font-semibold text-white shadow-lg">
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
            <p className="bs-result absolute left-1/2 top-[38%] -translate-x-1/2 rounded-full border border-white/15 bg-[var(--chip-bg)] px-3 py-1 text-[12px] font-semibold text-white shadow-lg">
              {story.result}
            </p>
          </div>
        ) : (
          <PhoneBridge stop={step} flap={flap} onGo={handleGoToStop} reduced={reduced} />
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
