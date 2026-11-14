"use client";

import Link from "next/link";
import { sectionNo, useSite } from "@/components/providers/SiteProvider";
import ScrollReveal from "@/components/reactbits/ScrollReveal";
import CountUp from "@/components/reactbits/CountUp";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { BridgeStory } from "./BridgeStory";
import { ValueCards } from "./ValueCards";
import { SpringHeading } from "@/components/layout/SpringHeading";

const STAT_COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };

export function About() {
  const site = useSite();
  const a = site.about;

  return (
    <section id="about" aria-labelledby="about-title" className="relative py-24 sm:py-32">
      <div className="container-x">
        <SectionLabel index={sectionNo(site, "about")}>{a.label}</SectionLabel>
        <span id="about-title" className="sr-only">
          About {site.name}
        </span>
        <ScrollReveal
          containerClassName="mt-6"
          textClassName="max-w-[17ch] font-display text-[clamp(2.1rem,5.4vw,4.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-white"
          baseOpacity={0.12}
          blurStrength={6}
          baseRotation={0}
          wordAnimationEnd="center 55%"
          rotationEnd="center 55%"
        >
          {a.statement}
        </ScrollReveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <AnimatedContent distance={40} duration={1} ease="expo.out" className="lg:col-span-7">
            <p className="text-[17px] leading-relaxed text-nl-ink sm:text-lg">{a.body}</p>
            {a.philosophy && <p className="mt-5 border-l-2 border-nl-purple/60 pl-4 text-[15px] italic leading-relaxed text-white/65">“{a.philosophy}”</p>}
            {a.more && (
              <Link href="/about" className="link-glow mt-6 inline-flex items-center gap-2 py-1 text-sm font-medium text-white">
                {a.more}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
          </AnimatedContent>
          <AnimatedContent distance={40} duration={1} delay={0.1} ease="expo.out" className="lg:col-span-5">
            <dl className={`grid ${STAT_COLS[a.stats.length] ?? "grid-cols-3"} divide-x divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]`}>
              {a.stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center px-3 py-6 text-center sm:py-8">
                  <dt className="label-mono order-2 mt-2">{s.label}</dt>
                  <dd className="order-1 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[56px]">
                    <CountUp from={0} to={s.value} prefix="0" duration={1.6} />
                  </dd>
                </div>
              ))}
            </dl>
            {a.strip && <p className="label-mono mt-3 text-center !text-white/35">{a.strip}</p>}
          </AnimatedContent>
        </div>
      </div>

      {/* How we work: the bridge, built in three steps as you scroll */}
      <BridgeStory />

      {/* Values */}
      <div className="container-x mt-24 sm:mt-28">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <SectionLabel index={sectionNo(site, "values")}>{a.valuesLabel}</SectionLabel>
            <SpringHeading text={a.valuesHeading} className="mt-4 text-[clamp(1.8rem,3.6vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.03em]" />
          </div>
          {a.valuesIntro && <p className="max-w-[40ch] text-[15px] text-nl-ink">{a.valuesIntro}</p>}
        </div>
        <div className="mt-10">
          <ValueCards values={site.values} />
        </div>
      </div>
    </section>
  );
}
