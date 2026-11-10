"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { useDemo } from "@/components/providers/DemoSettings";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { StaticDigit } from "@/components/particles/StaticDigit";
import { useServiceTrack } from "./useServiceTrack";
import { Scene1Social } from "./scenes/Scene1Social";
import { Scene2Advertising } from "./scenes/Scene2Advertising";
import { Scene3Content } from "./scenes/Scene3Content";
import { Scene4Photo } from "./scenes/Scene4Photo";
import { Scene5Events } from "./scenes/Scene5Events";
import { Scene6PR } from "./scenes/Scene6PR";
import { Scene7Strategy } from "./scenes/Scene7Strategy";
import { Scene8AI } from "./scenes/Scene8AI";
import { Scene9IT } from "./scenes/Scene9IT";
import { ServiceCard } from "./ServiceCard";

const services = site.services;

/**
 * "Our 9 labs." Nine full-screen scenes, driven by one continuous read of scroll position
 * (`useServiceTrack`) — the particle swarm forms every scene's own object directly, in order,
 * reversible the whole way; scrolling that stops partway between two scenes glides the rest of
 * the way so each still lands filling the screen, the way a native swipe/snap page would, without
 * an actual scroll lock anywhere. Reduced motion: a plain list, every picture already still.
 */
export function Services() {
  const { reduced } = useDemo();

  const heading = (
    <div className="container-x max-w-[920px]">
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

  if (reduced) return <ServicesList heading={heading} />;

  return <ServicesTrack heading={heading} />;
}

function ServicesTrack({ heading }: { heading: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const finaleRef = useRef<HTMLDivElement>(null);
  const active = useServiceTrack(trackRef, finaleRef);
  const [s1, s2, s3, s4, s5, s6, s7, s8, s9] = services;

  return (
    <section id="services" aria-labelledby="services-title" className="relative py-16 sm:py-24">
      <div className="pb-8 sm:pb-12">{heading}</div>
      <div ref={trackRef}>
        <Scene1Social s={s1} />
        <Scene2Advertising s={s2} active={active === 1} />
        <Scene3Content s={s3} active={active === 2} />
        <Scene4Photo s={s4} />
        <Scene5Events s={s5} active={active === 4} />
        <Scene6PR s={s6} />
        <Scene7Strategy s={s7} />
        <Scene8AI s={s8} active={active === 7} />
        <Scene9IT s={s9} />
      </div>
      <div ref={finaleRef} className="container-x flex flex-col items-center pb-20 pt-24 text-center sm:pb-28 sm:pt-32">
        <div className="h-24 w-24 sm:h-32 sm:w-28" aria-hidden="true">
          <div data-particle-slot="finale" className="relative h-full w-full" />
        </div>
        <h3 className="mt-3 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">
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

/** Reduced motion: nothing moving — the nine cards in a list, each with a still number. */
function ServicesList({ heading }: { heading: React.ReactNode }) {
  return (
    <section id="services" aria-labelledby="services-title" className="relative pt-24 sm:pt-28">
      {heading}
      <div className="container-x">
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
