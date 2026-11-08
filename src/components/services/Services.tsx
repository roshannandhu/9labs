"use client";

import { useEffect } from "react";
import { site } from "@/content/site";
import { ScrollTrigger } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { ServicesRing } from "./ServicesRing";
import { ServiceCard } from "./ServiceCard";

const services = site.services;

/**
 * "The Nine" — desktop: the Mirror Hall ring (see ServicesRing).
 * Mobile/tablet: native sticky stacking cards that pile up as you scroll.
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
