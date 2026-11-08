"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { registerAnchorPrefix } from "@/lib/scroll";
import { useDemo } from "@/components/providers/DemoSettings";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { ServiceCard } from "./ServiceCard";

const services = site.services;
const LAST = services.length - 1;

/**
 * "The Nine" — desktop: a pinned stage where vertical scroll moves a horizontal track of
 * nine cards (snapping card by card), with a counter and a bridge progress line.
 * Mobile/tablet: native sticky stacking cards. Reduced motion (desktop): a 3×3 grid.
 */
export function Services() {
  const { reduced } = useDemo();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const mode: "pin" | "stack" | "grid" = desktop ? (reduced ? "grid" : "pin") : "stack";

  const section = useRef<HTMLElement>(null);
  const pinWrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      stRef.current = null;
      if (mode !== "pin" || !track.current || !pinWrap.current) return;
      const tr = track.current;
      const distance = () => Math.max(0, tr.scrollWidth - window.innerWidth);
      const tween = gsap.to(tr, { x: () => -distance(), ease: "none" });
      const st = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: () => `+=${Math.round(distance() * 1.1)}`,
        pin: pinWrap.current,
        scrub: 0.7,
        animation: tween,
        invalidateOnRefresh: true,
        snap: { snapTo: 1 / LAST, duration: { min: 0.2, max: 0.55 }, delay: 0.06, ease: "power2.inOut" },
        onUpdate: (self) => {
          const i = Math.round(self.progress * LAST);
          setActive((prev) => (prev === i ? prev : i));
          if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
        },
      });
      stRef.current = st;
    },
    { scope: section, dependencies: [mode], revertOnUpdate: true },
  );

  // Make "#service-<slug>" land on the right card inside the pinned track.
  useEffect(
    () =>
      registerAnchorPrefix("service-", (id) => {
        const st = stRef.current;
        if (!st) return null;
        const i = services.findIndex((s) => `service-${s.slug}` === id);
        if (i < 0) return null;
        setActive(i);
        return st.start + (st.end - st.start) * (i / LAST);
      }),
    [],
  );

  // Refresh trigger positions once fonts/layout settle.
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(t);
  }, [mode]);

  const heading = (
    <div className="max-w-[920px]">
      <SectionLabel index="01">Services</SectionLabel>
      <h2 id="services-title" className="mt-4 text-[clamp(2rem,4.4vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
        Nine activities. <span className="text-gradient">One team.</span>
      </h2>
      <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-nl-ink sm:text-base">
        Everything a brand needs to grow — from the first strategy session to the last frame of the event film — planned and delivered by one team.
      </p>
    </div>
  );

  if (mode === "pin") {
    return (
      <section id="services" ref={section} aria-labelledby="services-title" className="relative">
        <div ref={pinWrap} className="relative flex h-[100svh] flex-col overflow-hidden">
          <div className="container-x flex items-end justify-between gap-8 pt-[calc(var(--nav-h)+20px)]">
            {heading}
            <div className="hidden shrink-0 text-right xl:block" aria-hidden="true">
              <div className="font-display text-[88px] font-semibold leading-none tracking-[-0.05em] text-white">
                {String(active + 1).padStart(2, "0")}
                <span className="text-[34px] text-white/25"> / 09</span>
              </div>
              <p className="label-mono mt-2">{services[active].short}</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center">
            <div
              ref={track}
              className="flex items-stretch gap-7 will-change-transform"
              style={{
                paddingLeft: "calc((100vw - min(560px, 44vw)) / 2)",
                paddingRight: "calc((100vw - min(560px, 44vw)) / 2)",
              }}
            >
              {services.map((s, i) => (
                <ServiceCard
                  key={s.slug}
                  service={s}
                  mode="pin"
                  active={i === active}
                  className="h-[min(54svh,520px)] w-[min(560px,44vw)] shrink-0"
                />
              ))}
            </div>
          </div>

          {/* bridge progress */}
          <div className="container-x pb-12">
            <div className="relative h-6">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
              <div
                ref={fill}
                className="absolute inset-x-0 top-1/2 h-px origin-left bg-gradient-to-r from-nl-blue to-nl-purple shadow-[0_0_12px_var(--nl-purple)]"
                style={{ transform: "scaleX(0)" }}
              />
              {services.map((s, i) => (
                <a
                  key={s.slug}
                  href={`#service-${s.slug}`}
                  aria-label={`Go to ${s.title}`}
                  className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-2"
                  style={{ left: `${(i / LAST) * 100}%` }}
                >
                  <span
                    className={`block h-2.5 w-2.5 rotate-45 border transition-all duration-500 ${
                      i <= active ? "border-nl-purple bg-nl-purple shadow-[0_0_10px_var(--nl-purple)]" : "border-white/30 bg-nl-black group-hover:border-white/70"
                    } ${i === active ? "scale-125" : ""}`}
                  />
                  <span
                    className={`label-mono pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap !text-[9px] transition-opacity ${
                      i === active ? "opacity-100 !text-white/70" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {s.short}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" ref={section} aria-labelledby="services-title" className="relative py-24 sm:py-28">
      <div className="container-x">
        {heading}
        {mode === "grid" ? (
          <div className="mt-12 grid grid-cols-3 gap-6">
            {services.map((s) => (
              <ServiceCard key={s.slug} service={s} mode="grid" active={false} className="min-h-[520px]" />
            ))}
          </div>
        ) : (
          <div className="mt-10 pb-[10vh]">
            {services.map((s, i) => (
              <div
                key={s.slug}
                className="sticky mb-6 last:mb-0"
                style={{ top: `calc(var(--nav-h) + 12px + ${i * 10}px)`, zIndex: i + 1 }}
              >
                <ServiceCard service={s} mode="stack" active={false} className="min-h-[min(74svh,560px)] shadow-[0_-20px_60px_-20px_rgba(0,0,0,.95)]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
