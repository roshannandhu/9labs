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
 * "Our 9 labs" — the travelling swarm. Nothing pins or snaps: the nine cards scroll normally, each
 * with its own number. Between two cards the particle swarm (ParticleStage) leaves one number and
 * re-forms the next; the card whose number is formed lights up. It ends on "All nine. One team." —
 * the swarm becomes a small 9 above a 3×3 grid of every activity.
 * Reduced motion: a plain list of the nine cards with a still number each.
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
  const anchors = useRef<number[]>([]);
  const [active, setActive] = useState(-1);

  useGSAP(
    () => {
      const root = section.current;
      if (!root) return;
      // The scroll position where each number is "home": 0 = the hero 9, 1–9 = each card's row, 10 = the finale.
      // A row is home when it is centred in the screen below the nav — or, if it is taller, when its number
      // sits just under the nav.
      const measure = () => {
        const H = window.innerHeight;
        const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
        const S = [0];
        for (const row of root.querySelectorAll<HTMLElement>("[data-swarm-row]")) {
          const r = row.getBoundingClientRect();
          const slot = row.querySelector("[data-particle-slot]")?.getBoundingClientRect() ?? r;
          const at = window.scrollY + Math.min(r.top + r.height / 2 - (H + nav) / 2, slot.top - nav - 12);
          S.push(Math.max(at, S[S.length - 1] + 1));
        }
        anchors.current = S;
      };
      // 0 → 10 between those positions; ParticleStage holds each number and morphs in between
      const write = (y: number) => {
        const S = anchors.current;
        let t = S.length - 1;
        for (let k = 0; k < S.length - 1; k++) {
          if (y < S[k + 1]) {
            t = k + Math.max(0, (y - S[k]) / (S[k + 1] - S[k]));
            break;
          }
        }
        particleBus.t = t;
        const i = Math.round(t) - 1;
        const on = i >= 0 && i <= LAST ? i : -1;
        setActive((prev) => (prev === on ? prev : on));
      };
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (st) => write(st.scroll()),
        onRefresh: (st) => {
          measure();
          write(st.scroll());
        },
      });
      return () => {
        particleBus.t = 0;
      };
    },
    { scope: section },
  );

  // "#service-<slug>" lands where that card's number is formed.
  useEffect(
    () =>
      registerAnchorPrefix("service-", (id) => {
        const i = services.findIndex((s) => `service-${s.slug}` === id);
        return i < 0 ? null : (anchors.current[i + 1] ?? null);
      }),
    [],
  );

  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section ref={section} id="services" aria-labelledby="services-title" className="relative">
      <div className="container-x pt-24 sm:pt-28">{heading}</div>

      {/* One number per card. Scrolling from one card to the next, the number's particles lift off and pour
          into the next card's number (ParticleStage). Laptop: rows zig-zag, so the swarm sweeps across. */}
      <ol className="container-x mt-4 lg:mt-0">
        {services.map((s, i) => (
          <li
            key={s.slug}
            data-swarm-row
            className="swarm-row grid items-center gap-1 py-8 sm:py-12 lg:min-h-[78svh] lg:grid-cols-2 lg:gap-16 lg:py-[5svh] lsp:min-h-[100svh] lsp:grid-cols-2 lsp:gap-8 lsp:py-4"
          >
            <div
              data-particle-slot={`s${i + 1}`}
              className={`relative mx-auto h-[24svh] w-full max-w-[520px] sm:h-[30svh] lg:h-[min(60svh,540px)] lsp:h-[70svh] ${i % 2 ? "lg:order-2 lsp:order-2" : ""}`}
              aria-hidden="true"
            />
            <div className="stage-card mx-auto w-full max-w-[520px]">
              <ServiceCard service={s} mode="stage" active={i === active} />
            </div>
          </li>
        ))}
      </ol>

      <div data-swarm-row>
        <Finale />
      </div>
    </section>
  );
}

function Finale({ still = false }: { still?: boolean }) {
  return (
    <div className="container-x flex flex-col items-center pb-20 pt-14 text-center sm:pb-28 sm:pt-20">
      <div data-particle-slot="finale" className="relative h-32 w-32 sm:h-44 sm:w-40" aria-hidden="true">
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
              <ServiceCard service={s} mode="list" className="mt-3 flex-1" />
            </li>
          ))}
        </ol>
      </div>
      <Finale still />
    </section>
  );
}
