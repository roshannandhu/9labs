"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ICON_COLORS } from "@/content/site";
import { digits } from "@/lib/fonts";
import { onIntroDone } from "@/components/intro/introBus";
import { useSite } from "@/components/providers/SiteProvider";
import { useDemo } from "@/components/providers/DemoSettings";
import { CtaButton } from "@/components/layout/CtaButton";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { createSplitHero, type IconTargetRect, type SplitHero, type SplitStage } from "./heroSplitEngine";

function splitWords(text: string, startDelay: number, step = 0.045) {
  return text.split(" ").map((w, i) => (
    <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <span className="rise-in inline-block" style={{ animationDelay: `${startDelay + i * step}s` }}>
        {w}&nbsp;
      </span>
    </span>
  ));
}

/**
 * Alternate hero (`?hero=split`): particles stream in from across all screen edges to fuse into a
 * solid, condensed 3D Albert Sans "9", fracture directly into the 3×3 `.finale-tile` blocks
 * ("Nine teams. One vision.") with live animated icons, pause 1.0s before revealing service names,
 * and scatter outward across the frame to loop back into the 3D 9.
 * Reduced motion: static theme-aware 3×3 `.finale-tile` grid with zero canvas motion.
 */
export function HeroSplit() {
  const { reduced } = useDemo();
  const { hero, services } = useSite();

  const slotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const engineRef = useRef<SplitHero | null>(null);
  const capBoldRef = useRef<HTMLElement>(null);
  const capLineRef = useRef<HTMLElement>(null);

  const [stage, setStage] = useState<SplitStage>("nine");

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let hero3d: SplitHero | null = null;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let cancelled = false;

    const family = digits.style.fontFamily;
    const svc = services.map((s) => ({ icon: s.icon, short: s.short, title: s.title, n: s.n }));

    const measureGrid = () => {
      const cv = canvasRef.current;
      const slot = slotRef.current;
      if (!cv || !slot) return null;
      const cr = cv.getBoundingClientRect();
      const sr = slot.getBoundingClientRect();
      if (!cr.width || !sr.width) return null;
      const icons: IconTargetRect[] = [];
      for (let i = 0; i < 9; i++) {
        const el = iconRefs.current[i];
        if (!el) return null;
        const ir = el.getBoundingClientRect();
        icons.push({
          x: ir.left + ir.width * 0.5 - cr.left,
          y: ir.top + ir.height * 0.5 - cr.top,
          size: Math.min(ir.width, ir.height) || 32,
        });
      }
      return {
        cx: sr.left + sr.width * 0.5 - cr.left,
        cy: sr.top + sr.height * 0.5 - cr.top,
        scale: Math.min(sr.width * 0.78, sr.height * 0.92),
        icons,
      };
    };

    const mount = () => {
      if (cancelled || !canvasRef.current) return;
      hero3d = createSplitHero(canvasRef.current, {
        services: svc,
        colorFor: (icon) => ICON_COLORS[icon],
        family,
        measureGrid,
        onStageChange: (next) => setStage(next),
        onCaption: (bold, line) => {
          if (capBoldRef.current) capBoldRef.current.textContent = bold;
          if (capLineRef.current) capLineRef.current.textContent = line;
        },
      });
      engineRef.current = hero3d;
      ro = new ResizeObserver(() => hero3d?.resize());
      ro.observe(canvasRef.current);
      if (slotRef.current) ro.observe(slotRef.current);
      io = new IntersectionObserver(([e]) => hero3d?.setPaused(!e.isIntersecting), { threshold: 0.01 });
      io.observe(slotRef.current || canvasRef.current);
    };

    // Wait for the intro curtain + font, then mount on an idle slot so the heavy canvas init stays
    // out of the critical load window (keeps the Lighthouse trace / LCP quiet). Starts a beat later.
    const offIntro = onIntroDone(() => {
      if (cancelled) return;
      const ready = document.fonts?.load ? document.fonts.load(`900 120px ${family}`) : Promise.resolve();
      ready.catch(() => {}).finally(() => {
        if (cancelled) return;
        const ric = window.requestIdleCallback;
        if (ric) ric(() => mount(), { timeout: 600 });
        else mount();
      });
    });

    return () => {
      cancelled = true;
      offIntro();
      ro?.disconnect();
      io?.disconnect();
      hero3d?.destroy();
      engineRef.current = null;
    };
  }, [reduced, services]);

  const copy = (
    <div className="text-center lg:text-left lsp:text-left">
      <p className="label-mono rise-in mb-3 inline-flex items-center gap-2.5 sm:mb-4" style={{ animationDelay: "0.1s" }}>
        <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-nl-purple shadow-[0_0_10px_var(--nl-purple)]" />
        <span>
          {hero.eyebrow}
          {hero.eyebrowExtra && <span className="hidden sm:inline">{hero.eyebrowExtra}</span>}
        </span>
      </p>
      <h1
        id="hero-title"
        className="text-[clamp(1.9rem,7.6vw,2.6rem)] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[clamp(2.6rem,5.6vw,3.4rem)] lg:text-[clamp(2.8rem,4vw,4.1rem)] lsp:text-[1.9rem]"
      >
        {splitWords(hero.headline, 0.18)}
        {hero.headlineAccent && (
          <span className="block">
            <span className="rise-in font-accent text-gradient inline-block pb-[0.08em]" style={{ animationDelay: "0.42s" }}>
              {hero.headlineAccent}
            </span>
          </span>
        )}
      </h1>
      <p
        className="rise-in mx-auto mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-nl-ink sm:mt-4 sm:text-[17px] lg:mx-0 lsp:mx-0 lsp:text-sm"
        style={{ animationDelay: "0.6s" }}
      >
        {hero.sub}
      </p>
      <div className="mt-5 flex flex-col items-stretch gap-2.5 sm:mt-7 sm:flex-row sm:items-center sm:justify-center sm:gap-3 lg:justify-start lsp:mt-4 lsp:flex-row lsp:justify-start">
        {hero.primary.label && (
          <CtaButton cta={hero.primary} className="btn btn-primary rise-in" style={{ animationDelay: "0.75s" }} data-cursor="Start">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </CtaButton>
        )}
        {hero.secondary.label && <CtaButton cta={hero.secondary} className="btn btn-outline rise-in" style={{ animationDelay: "0.85s" }} data-cursor="Read" />}
      </div>
    </div>
  );

  const gridLive = stage !== "nine";

  return (
    <section id="home" aria-labelledby="hero-title" className="relative flex min-h-[84svh] items-center overflow-x-clip pb-6 pt-[calc(var(--nav-h)+0.35rem)] sm:min-h-[100svh] sm:items-start sm:pb-0 lg:items-center lg:pt-[var(--nav-h)]">
      {!reduced && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 block h-full w-full"
        />
      )}

      <div className="container-x relative z-10 grid w-full items-center gap-3 py-2 sm:gap-10 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-12 lsp:grid-cols-2 lsp:py-6">
        {copy}

        <div className="relative mx-auto w-full max-w-[560px]">
          <div
            ref={slotRef}
            className="relative h-[clamp(228px,28svh,262px)] w-full sm:h-[clamp(340px,46svh,450px)] lg:h-[min(62svh,520px)] lsp:h-[62svh]"
          >
            {/* Identical 3×3 `.finale-tile` blocks from "Nine teams. One vision." */}
            <ul
              data-split-grid
              data-stage={reduced ? "names" : stage}
              className="hero-split-grid relative z-10 grid h-full w-full grid-cols-3 grid-rows-3 gap-2 sm:gap-3"
            >
              {services.map((s, idx) => (
                <li key={s.slug} className="min-h-0">
                  <a
                    href={`#service-${s.slug}`}
                    style={
                      {
                        "--icon-accent": ICON_COLORS[s.icon],
                        "--card-accent": ICON_COLORS[s.icon],
                        "--stagger": `${idx * 55}ms`,
                      } as CSSProperties
                    }
                    onMouseEnter={() => engineRef.current?.setHovered(idx)}
                    onMouseLeave={() => engineRef.current?.setHovered(-1)}
                    onFocus={() => engineRef.current?.setHovered(idx)}
                    onBlur={() => engineRef.current?.setHovered(-1)}
                    className="finale-tile hero-split-tile group relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] px-1.5 py-2 text-nl-blue-soft transition-all duration-300 hover:border-nl-purple/50 hover:bg-nl-purple/[0.06] sm:rounded-3xl sm:px-3 sm:py-4"
                  >
                    <span className="hero-split-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500" aria-hidden="true" />
                    <span
                      ref={(el) => {
                        iconRefs.current[idx] = el;
                      }}
                      data-split-icon={idx}
                      className="hero-split-icon-wrap relative z-10 flex items-center justify-center transition-transform duration-300 ease-out"
                    >
                      <ActivityIcon icon={s.icon} size={30} play={!reduced && gridLive} />
                    </span>
                    <span className="hero-split-name relative z-10 mt-1 text-center text-[10.5px] font-medium leading-tight text-white/80 transition-all duration-300 sm:mt-2 sm:text-sm">
                      {s.short}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {!reduced && (
            <div className="mt-1 min-h-[2.3em] text-center sm:mt-2.5" aria-hidden="true">
              <b ref={capBoldRef} className="font-accent text-gradient block text-[13.5px] leading-tight sm:text-[15px]" />
              <span ref={capLineRef} className="mt-0.5 block text-[11px] leading-snug text-nl-ink sm:text-[12px]" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
