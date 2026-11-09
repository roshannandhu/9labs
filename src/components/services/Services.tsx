"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { registerAnchorPrefix } from "@/lib/scroll";
import { useDemo } from "@/components/providers/DemoSettings";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { particleBus } from "@/components/particles/bus";
import { StaticDigit } from "@/components/particles/StaticDigit";
import { ServiceCard } from "./ServiceCard";

const services = site.services;
const LAST = services.length - 1; // 8 steps between 1 and 9

/**
 * "Our 9 labs" — the pinned split stage. The section holds still while you scroll; on one side
 * the particle swarm (ParticleStage) forms the number, on the other the matching card swaps in,
 * one per step from 1 to 9, with a 1–9 rail underneath. It ends on "All nine. One team." — the
 * swarm becomes a small 9 above a 3×3 grid of every activity.
 * Reduced motion: no pin — a plain list of the nine cards with a still number each.
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

  return reduced ? <ServicesList heading={heading} /> : <ServicesStage heading={heading} />;
}

function ServicesStage({ heading }: { heading: React.ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const p = { a: 0, b: 0, c: 0 };
      const write = () => {
        // 0 → 1: hero 9 to the first digit · 1 → 9: the stage · 9 → 10: the finale's small 9
        particleBus.t = p.a + LAST * p.b + p.c;
        const i = Math.min(LAST, Math.max(0, Math.round(p.b * LAST)));
        setActive((prev) => (prev === i ? prev : i));
      };
      ScrollTrigger.create({
        trigger: document.getElementById("home"),
        start: "top top",
        endTrigger: pin.current,
        end: "top top",
        onUpdate: (s) => {
          p.a = s.progress;
          write();
        },
        onRefresh: (s) => {
          p.a = s.progress;
          write();
        },
      });
      stRef.current = ScrollTrigger.create({
        trigger: pin.current,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 0.75 * LAST)}`,
        pin: true,
        // any refreshPriority makes ScrollTrigger sort triggers by page position on refresh
        refreshPriority: 0,
        invalidateOnRefresh: true,
        // always come to rest on a whole number, so every digit and card is readable
        snap: { snapTo: 1 / LAST, duration: { min: 0.2, max: 0.6 }, delay: 0.08, ease: "power2.inOut" },
        onUpdate: (s) => {
          p.b = s.progress;
          write();
        },
        onRefresh: (s) => {
          p.b = s.progress;
          write();
        },
      });
      ScrollTrigger.create({
        trigger: finale.current,
        start: "top 85%",
        end: "top 30%",
        onUpdate: (s) => {
          p.c = s.progress;
          write();
        },
        onRefresh: (s) => {
          p.c = s.progress;
          write();
        },
      });
      write();
      return () => {
        stRef.current = null;
        particleBus.t = 0;
      };
    },
    { scope: section },
  );

  // "#service-<slug>" lands on that step of the stage.
  useEffect(
    () =>
      registerAnchorPrefix("service-", (id) => {
        const st = stRef.current;
        const i = services.findIndex((s) => `service-${s.slug}` === id);
        if (!st || i < 0) return null;
        return st.start + (st.end - st.start) * (i / LAST);
      }),
    [],
  );

  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section ref={section} id="services" aria-labelledby="services-title" className="relative">
      <div className="container-x pb-4 pt-24 sm:pt-28">{heading}</div>

      <div ref={pin} className="relative h-[100svh]">
        {/* sm+: the rail sits above the floating WhatsApp / Concept Lab buttons (phones hide WhatsApp here) */}
        <div className="container-x flex h-full flex-col pb-5 pt-[calc(var(--nav-h)+8px)] sm:pb-[92px] lsp:pb-4">
          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-5 lg:grid-cols-2 lg:grid-rows-1 lg:gap-12 lsp:grid-cols-2 lsp:grid-rows-1">
            <div
              data-particle-slot="stage"
              className="relative mx-auto h-[26svh] w-full max-w-[520px] sm:h-[32svh] lg:h-[min(62svh,560px)] lsp:h-[56svh]"
              aria-hidden="true"
            />
            <div className="grid w-full max-w-[520px] self-center justify-self-center lg:justify-self-start">
              {services.map((s, i) => (
                <div key={s.slug} className="stage-card [grid-area:1/1]" data-on={i === active ? "true" : "false"} inert={i !== active}>
                  <ServiceCard service={s} mode="stage" active={i === active} />
                </div>
              ))}
            </div>
          </div>

          {/* 1–9 rail */}
          <nav aria-label="Jump to an activity" className="relative mx-auto mt-4 w-full max-w-[640px] sm:mt-6">
            <span className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/10" aria-hidden="true" />
            <span
              className="absolute left-3 top-1/2 h-px origin-left -translate-y-1/2 bg-gradient-to-r from-nl-blue to-nl-purple transition-[width] duration-500"
              style={{ width: `calc((100% - 1.5rem) * ${active / LAST})` }}
              aria-hidden="true"
            />
            <ol className="relative flex items-center justify-between">
              {services.map((s, i) => (
                <li key={s.slug}>
                  <a
                    href={`#service-${s.slug}`}
                    aria-label={`${i + 1}. ${s.title}`}
                    aria-current={i === active ? "step" : undefined}
                    className={`rail-step grid h-8 w-8 place-items-center rounded-full border font-brand text-xs font-black transition-all duration-500 sm:h-9 sm:w-9 ${
                      i === active
                        ? "scale-110 border-transparent bg-[linear-gradient(135deg,var(--nl-blue),var(--nl-indigo))] text-white shadow-[0_0_18px_-2px_var(--nl-blue)]"
                        : i < active
                          ? "border-nl-purple/50 bg-[#0b0c14] text-white/80"
                          : "border-white/15 bg-[#0b0c14] text-white/45 hover:text-white"
                    }`}
                  >
                    {i + 1}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <div ref={finale}>
        <Finale />
      </div>
    </section>
  );
}

function Finale({ still = false }: { still?: boolean }) {
  return (
    <div className="container-x flex flex-col items-center pb-20 pt-14 text-center sm:pb-28 sm:pt-20">
      <div data-particle-slot="finale" className="relative h-24 w-20 sm:h-32 sm:w-24" aria-hidden="true">
        {still && <StaticDigit ch="9" />}
      </div>
      <h3 className="mt-4 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">
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
  );
}

/** Reduced motion: nothing pinned or moving — the nine cards in a list, each with a still number. */
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
              <ServiceCard service={s} mode="list" className="mt-3 flex-1" />
            </li>
          ))}
        </ol>
      </div>
      <Finale still />
    </section>
  );
}
