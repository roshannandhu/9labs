"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { ServicesRing } from "./ServicesRing";
import { ServiceCard } from "./ServiceCard";

const services = site.services;
const N = services.length;
/** Where stacked cards stick, below the nav and the progress line (px). */
const STICK_GAP = 64;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "The Nine" — desktop: the Mirror Hall ring (see ServicesRing).
 * Mobile/tablet: a deck of sticky cards. Each new card slides over the last; the covered cards
 * shrink and dim (at most two edges peek above) and are hidden once three cards lie on top,
 * so the phone never has more than a few layers to draw. A "07 / 09" bridge line tracks progress.
 * Reduced motion (desktop): a 3×3 grid.
 */
export function Services() {
  const { reduced } = useDemo();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const mode: "pin" | "stack" | "grid" = desktop ? (reduced ? "grid" : "pin") : "stack";

  // Refresh trigger positions once fonts/layout settle.
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(t);
  }, [mode]);

  const heading = (
    <div className="max-w-[920px]">
      <SectionLabel index="01">Services</SectionLabel>
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

  if (mode === "pin") return <ServicesRing heading={heading} />;

  return (
    <section id="services" aria-labelledby="services-title" className="relative py-24 sm:py-28">
      <div className="container-x">
        {heading}
        {mode === "grid" ? (
          <div className="mt-12 grid grid-cols-3 gap-6">
            {services.map((s) => (
              <ServiceCard key={s.slug} service={s} mode="grid" active={false} className="min-h-[520px]" />
            ))}
          </div>
        ) : (
          <ServicesStack reduced={reduced} />
        )}
      </div>
    </section>
  );
}

function ServicesStack({ reduced }: { reduced: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const inners = useRef<(HTMLDivElement | null)[]>([]);
  const shades = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const navH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
      const stick = () => navH() + STICK_GAP;
      services.forEach((_, i) => {
        const el = items.current[i];
        if (!el) return;
        // progress: the current card is the last one that has reached the stick line
        ScrollTrigger.create({
          trigger: el,
          start: () => `top ${stick() + 2}px`,
          onEnter: () => setActive(i),
          onLeaveBack: () => setActive(Math.max(0, i - 1)),
        });
        if (reduced || i === N - 1) return;
        const inner = inners.current[i];
        const shade = shades.current[i];
        const k = Math.min(3, N - 1 - i); // cards that will land on top of this one
        const until = items.current[i + k];
        if (!inner || !shade || !until) return;
        // depth 1 → 2: shrink, lift a few px (its edge peeks) and dim; depth 3: hidden entirely
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: items.current[i + 1], start: "top bottom", endTrigger: until, end: () => `top ${stick()}px`, scrub: true },
        });
        tl.fromTo(inner, { y: 0, scale: 1 }, { y: -10, scale: 0.95, duration: 1 }).fromTo(shade, { opacity: 0 }, { opacity: 0.3, duration: 1 }, "<");
        if (k >= 2) tl.to(inner, { y: -20, scale: 0.9, duration: 1 }).to(shade, { opacity: 0.55, duration: 1 }, "<");
        if (k >= 3) tl.to(inner, { autoAlpha: 0, duration: 1 });
      });
    },
    { scope: wrap, dependencies: [reduced] },
  );

  return (
    <div ref={wrap} className="mt-8 pb-[10vh]">
      {/* progress along the bridge: 07 / 09 */}
      <div className="sticky z-40 mb-5" style={{ top: "calc(var(--nav-h) + 8px)" }}>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#07080c]/95 px-4 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,.9)]">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-white/50" aria-live="polite">
            <span className="text-nl-purple">{pad(active + 1)}</span> / 09
          </span>
          <span className="relative h-px flex-1 bg-white/10" aria-hidden="true">
            <span
              className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-nl-blue to-nl-purple shadow-[0_0_8px_var(--nl-purple)] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
              style={{ transform: `scaleX(${(active + 1) / N})` }}
            />
          </span>
          <span className="max-w-[42%] truncate text-[11px] font-medium uppercase tracking-[0.08em] text-white/60">{services[active].short}</span>
        </div>
      </div>

      {services.map((s, i) => (
        <div
          key={s.slug}
          ref={(el) => {
            items.current[i] = el;
          }}
          className="sticky mb-6 last:mb-0"
          style={{ top: `calc(var(--nav-h) + ${STICK_GAP}px)`, zIndex: i + 1 }}
        >
          <div
            ref={(el) => {
              inners.current[i] = el;
            }}
            className="relative origin-top"
          >
            <ServiceCard service={s} mode="stack" active={false} className="min-h-[min(60svh,500px)] shadow-[0_-16px_40px_-18px_rgba(0,0,0,.9)]" />
            <div
              ref={(el) => {
                shades.current[i] = el;
              }}
              className="pointer-events-none absolute inset-0 rounded-[28px] bg-black opacity-0"
              aria-hidden="true"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
