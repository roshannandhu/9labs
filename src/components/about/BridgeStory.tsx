"use client";

import { useRef, useState } from "react";
import { site } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { SplitFlap } from "./SplitFlap";

const steps = site.about.steps;
const LAST = steps.length - 1;
const stroke = { fill: "none", vectorEffect: "non-scaling-stroke" as const, strokeLinecap: "round" as const };

/* ---------------------------------------------------------------- side view (laptop / tablet) */
const quad = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
const H = { deck: 300, top: 70, water: 380, towers: [330, 870], x0: 120, x1: 1080 };

function SideBridge() {
  const hangers: { x: number; y: number; side: "l" | "c" | "r" }[] = [];
  for (let x = 360; x <= 840; x += 30) hangers.push({ x, y: quad(H.top, 470, H.top, (x - 330) / 540), side: "c" });
  for (let x = 150; x <= 310; x += 30) hangers.push({ x, y: quad(290, 190, H.top, (x - H.x0) / (330 - H.x0)), side: "l" });
  for (let x = 890; x <= 1050; x += 30) hangers.push({ x, y: quad(H.top, 190, 290, (x - 870) / (H.x1 - 870)), side: "r" });

  return (
    <svg viewBox="0 0 1200 440" className="block h-auto w-full overflow-visible text-white" aria-hidden="true">
      <defs>
        <linearGradient id="bs-cable" x1="0" x2="1">
          <stop offset="0" stopColor="#8c53fe" />
          <stop offset="1" stopColor="#5ce0e6" />
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
          <circle className="bs-pop" cx={x} cy={H.top - 10} r="4" fill={i === 0 ? "#8c53fe" : "#5ce0e6"} filter="url(#bs-glow)" />
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
          <rect x={H.x0 + 4} y={H.deck - 26} width="112" height="22" rx="11" fill="#8c53fe" />
          <text x={H.x0 + 60} y={H.deck - 11} textAnchor="middle" className="bs-pill-text">
            Your goals →
          </text>
        </g>
        <g className="bs-rtl" style={{ ["--run" as string]: `${H.x1 - H.x0 - 136}px` }}>
          <rect x={H.x1 - 140} y={H.deck + 22} width="136" height="22" rx="11" fill="#5ce0e6" />
          <text x={H.x1 - 72} y={H.deck + 37} textAnchor="middle" className="bs-pill-text bs-pill-text--dark">
            ← Our expertise
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

/* ---------------------------------------------------------------- top-down view (phone) */
const V = { l: 158, r: 202, y0: 70, y1: 630, towers: [220, 480] };

function TopBridge() {
  const hang: { y: number; xl: number }[] = [];
  // the cables bulge outwards between the towers (a top-down suspension bridge)
  const cableX = (y: number) => {
    if (y < V.towers[0]) return V.l - 18 - (36 * (y - V.y0)) / (V.towers[0] - V.y0);
    if (y > V.towers[1]) return V.l - 18 - (36 * (V.y1 - y)) / (V.y1 - V.towers[1]);
    return quad(V.l - 54, V.l - 118, V.l - 54, (y - V.towers[0]) / (V.towers[1] - V.towers[0]));
  };
  for (let y = 100; y <= 600; y += 26) hang.push({ y, xl: cableX(y) });
  const mirror = (x: number) => 360 - x;

  return (
    <svg viewBox="0 0 360 700" className="block h-full w-auto max-w-full overflow-visible text-white" aria-hidden="true">
      <defs>
        <linearGradient id="bt-cable" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8c53fe" />
          <stop offset="1" stopColor="#5ce0e6" />
        </linearGradient>
        <filter id="bt-glow" x="-200%" y="-50%" width="500%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* towers (crossbars): top one in step 1, bottom one in step 2 */}
      {V.towers.map((y, i) => (
        <g key={y} className={i === 0 ? "bs-1" : "bs-2"}>
          <path className="bs-draw" d={`M${V.l - 70} ${y} H${V.r + 70}`} {...stroke} stroke="currentColor" strokeOpacity="0.6" strokeWidth={1.6} />
          <circle className="bs-pop" cx={V.l - 74} cy={y} r="3.5" fill={i === 0 ? "#8c53fe" : "#5ce0e6"} filter="url(#bt-glow)" />
          <circle className="bs-pop" cx={V.r + 74} cy={y} r="3.5" fill={i === 0 ? "#8c53fe" : "#5ce0e6"} filter="url(#bt-glow)" />
        </g>
      ))}

      {/* cables + hangers, both sides */}
      {[false, true].map((m) => {
        const X = (x: number) => (m ? mirror(x) : x);
        const pts = Array.from({ length: 57 }, (_, k) => V.y0 + ((V.y1 - V.y0) * k) / 56);
        const top = pts.filter((y) => y <= V.towers[0]);
        const rest = pts.filter((y) => y >= V.towers[0]);
        return (
          <g key={String(m)}>
            <path className="bs-draw bs-1" d={`M${top.map((y) => `${X(cableX(y)).toFixed(1)} ${y.toFixed(1)}`).join(" L")}`} {...stroke} stroke="url(#bt-cable)" strokeWidth={1.7} filter="url(#bt-glow)" />
            <path className="bs-draw bs-2" d={`M${rest.map((y) => `${X(cableX(y)).toFixed(1)} ${y.toFixed(1)}`).join(" L")}`} {...stroke} stroke="url(#bt-cable)" strokeWidth={1.7} filter="url(#bt-glow)" />
            {hang.map((h) => (
              <path
                key={h.y}
                className={`bs-draw ${h.y <= V.towers[0] ? "bs-1" : "bs-2"}`}
                d={`M${X(h.xl).toFixed(1)} ${h.y} H${X(m ? V.r : V.l)}`}
                {...stroke}
                stroke="currentColor"
                strokeOpacity="0.2"
              />
            ))}
          </g>
        );
      })}

      {/* deck (step 3) */}
      <g className="bs-3">
        <path className="bs-draw bs-deck" d={`M${V.l} ${V.y0} V${V.y1} M${V.r} ${V.y0} V${V.y1}`} {...stroke} stroke="currentColor" strokeOpacity="0.85" strokeWidth={1.7} />
        <path className="bs-draw bs-deck" d={`M180 ${V.y0} V${V.y1}`} {...stroke} stroke="currentColor" strokeOpacity="0.22" strokeDasharray="8 10" />
      </g>

      {/* traffic */}
      <g className="bs-traffic">
        <g className="bs-down" style={{ ["--run" as string]: `${V.y1 - V.y0 - 90}px` }}>
          <rect x={V.l - 118} y={V.y0} width="132" height="38" rx="19" fill="#8c53fe" />
          <text x={V.l - 52} y={V.y0 + 26} textAnchor="middle" className="bs-pill-text bs-pill-text--lg">
            Goals ↓
          </text>
        </g>
        <g className="bs-up" style={{ ["--run" as string]: `${V.y1 - V.y0 - 90}px` }}>
          <rect x={V.r - 14} y={V.y1 - 38} width="152" height="38" rx="19" fill="#5ce0e6" />
          <text x={V.r + 62} y={V.y1 - 12} textAnchor="middle" className="bs-pill-text bs-pill-text--lg bs-pill-text--dark">
            ↑ Expertise
          </text>
        </g>
      </g>

      <g className="bs-nine" transform="translate(180 350)">
        <circle r="44" fill="var(--nl-bg)" stroke="url(#bt-cable)" strokeWidth="2.5" filter="url(#bt-glow)" />
        <text y="15" textAnchor="middle" className="bs-nine-text bs-nine-text--lg">
          9
        </text>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- the two banks (HTML, so text stays crisp and wraps) */
function YouBank({ className = "" }: { className?: string }) {
  return (
    <div className={`bs-card bs-1 ${className}`}>
      <p className="label-mono !text-[10.5px]">Your side</p>
      <p className="mt-1 font-display text-[15px] font-semibold leading-tight text-white sm:text-base">Your business</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["Goals", "Ideas", "Feedback"].map((t) => (
          <span key={t} className="rounded-full border border-[#8c53fe]/40 bg-[#8c53fe]/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
function UsBank({ className = "" }: { className?: string }) {
  return (
    <div className={`bs-card bs-2 ${className}`}>
      <p className="label-mono !text-[10.5px]">Our side</p>
      <p className="mt-1 font-display text-[15px] font-semibold leading-tight text-white sm:text-base">Nine Labs</p>
      <div className="mt-2 grid w-max grid-cols-9 gap-1 sm:grid-cols-3">
        {site.services.map((s) => (
          <span key={s.slug} className="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-nl-blue-soft" title={s.short}>
            <ActivityIcon icon={s.icon} size={14} play={false} />
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * "How we work" — the brand idea (a bridge between your business and your results) told in three
 * steps as you scroll. The scene is pinned; scrolling builds it:
 *   1. your side: your business with its goals, ideas and feedback (left tower + cable)
 *   2. our side: Nine Labs and its nine activities (right tower, the main span, hangers)
 *   3. the deck joins: two-way traffic, the 9 lights up in the middle, "Results".
 * Laptop/tablet: a side view. Phone: the same bridge seen from above, standing vertically (you at
 * the top, Nine Labs at the bottom) so it's big and readable. Reduced motion: the finished bridge
 * and all three steps, nothing pinned.
 */
export function BridgeStory() {
  const { reduced } = useDemo();
  const wide = useMediaQuery("(min-width: 768px)", true);
  // phones held sideways: too short for cards over the bridge, so cards sit beside it
  const short = useMediaQuery("(orientation: landscape) and (max-height: 520px)");
  const root = useRef<HTMLDivElement>(null);
  const [flap, setFlap] = useState({ cur: 0, prev: 0, k: 0 });
  const step = reduced ? LAST : flap.cur;

  useGSAP(
    () => {
      const el = root.current;
      if (!el || reduced) return;
      const q = gsap.utils.selector(el);
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      tl.from(q(".bs-1.bs-card, .bs-1 .bs-card"), { autoAlpha: 0, y: 18, duration: 0.35 }, 0)
        .from(q(".bs-1.bs-draw, .bs-1 .bs-draw"), { drawSVG: "0%", duration: 0.7, stagger: 0.01 }, 0.05)
        .from(q(".bs-1 .bs-pop, .bs-1.bs-pop"), { autoAlpha: 0, scale: 0.3, transformOrigin: "50% 50%", duration: 0.2 }, 0.6)
        .from(q(".bs-2.bs-card, .bs-2 .bs-card"), { autoAlpha: 0, y: 18, duration: 0.35 }, 1)
        .from(q(".bs-2.bs-draw, .bs-2 .bs-draw"), { drawSVG: "0%", duration: 0.7, stagger: 0.008 }, 1.05)
        .from(q(".bs-2 .bs-pop, .bs-2.bs-pop"), { autoAlpha: 0, scale: 0.3, transformOrigin: "50% 50%", duration: 0.2 }, 1.6)
        .from(q(".bs-deck"), { drawSVG: "50% 50%", duration: 0.6 }, 2)
        .from(q(".bs-nine"), { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.3 }, 2.45)
        .from(q(".bs-result"), { autoAlpha: 0, y: 10, duration: 0.3 }, 2.6)
        .to({}, { duration: 0.15 });

      const setStep = (p: number) => {
        const i = Math.min(LAST, Math.floor(p * 3 + 0.02));
        setFlap((f) => (f.cur === i ? f : { cur: i, prev: f.cur, k: f.k + 1 }));
        el.dataset.live = p > 0.86 ? "true" : "false";
      };
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 2.4)}`,
        pin: true,
        refreshPriority: 0,
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (s) => {
          tl.progress(s.progress);
          setStep(s.progress);
        },
      });
      tl.progress(st.progress);
      setStep(st.progress);
    },
    { scope: root, dependencies: [reduced, wide, short], revertOnUpdate: true },
  );

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
      <div className={`container-x flex flex-col ${reduced ? "" : "h-[100svh] pb-[88px] pt-[calc(var(--nav-h)+12px)] md:pb-8"}`}>
        {/* heading + the current step */}
        <div className="grid gap-4 md:grid-cols-12 md:items-end md:gap-8">
          <div className="md:col-span-5">
            <p className="label-mono lsp:hidden">How we work</p>
            <SpringHeading
              as="h3"
              text="Three steps"
              accent="across the bridge."
              className="mt-3 font-display text-[clamp(1.6rem,3.6vw,3rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-white lsp:mt-0 lsp:text-[1.4rem]"
            />
          </div>
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
        </div>

        {/* the bridge */}
        {wide && short ? (
          <div className="mt-3 flex min-h-0 flex-1 items-center gap-3">
            <YouBank className="w-[150px] shrink-0" />
            <div className="relative mx-auto min-w-0 max-w-[calc((100svh_-_var(--nav-h)_-_150px)*2.72)] flex-1">
              <SideBridge />
              <p className="bs-result absolute left-1/2 top-[44%] -translate-x-1/2 rounded-full border border-white/15 bg-[var(--chip-bg)] px-3 py-1 text-[12px] font-semibold text-white shadow-lg">
                ✓ Results
              </p>
            </div>
            <UsBank className="w-[150px] shrink-0" />
          </div>
        ) : wide ? (
          <div className="relative mx-auto mt-6 w-full max-w-[min(100%,calc((100svh_-_var(--nav-h)_-_210px)*2.72))] flex-1 sm:mt-8">
            <div className="relative">
              <SideBridge />
              <YouBank className="absolute left-0 top-0 w-[20%] min-w-[132px]" />
              <UsBank className="absolute right-0 top-0 w-[20%] min-w-[132px]" />
              <p className="bs-result absolute left-1/2 top-[44%] -translate-x-1/2 rounded-full border border-white/15 bg-[var(--chip-bg)] px-3 py-1 text-[12px] font-semibold text-white shadow-lg">
                ✓ Results
              </p>
            </div>
          </div>
        ) : (
          <div className="relative mt-4 flex min-h-0 flex-1 flex-col items-center">
            <YouBank className="relative z-10 w-full max-w-[320px]" />
            <div className="relative -my-3 flex min-h-0 w-full flex-1 justify-center">
              <TopBridge />
              <p className="bs-result absolute left-1/2 top-[58%] -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[var(--chip-bg)] px-3 py-1 text-[12px] font-semibold text-white shadow-lg">
                ✓ Results
              </p>
            </div>
            <UsBank className="relative z-10 w-full max-w-[320px]" />
          </div>
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
