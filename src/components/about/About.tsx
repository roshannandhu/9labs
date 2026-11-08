"use client";

import { site } from "@/content/site";
import ScrollReveal from "@/components/reactbits/ScrollReveal";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { BridgeIllustration } from "./BridgeIllustration";
import { RoadmapAscent } from "./RoadmapAscent";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { useDemo } from "@/components/providers/DemoSettings";

const VALUE_ICONS: Record<string, React.ReactNode> = {
  partnership: (
    <>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" stroke="var(--nl-purple)" />
    </>
  ),
  ownership: (
    <>
      <path d="M12 3l7 3v5.5c0 4.4-3 7.9-7 9.5-4-1.6-7-5.1-7-9.5V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" stroke="var(--nl-purple)" />
    </>
  ),
  trust: (
    <>
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15.5" r="1.6" fill="var(--nl-purple)" stroke="none" />
    </>
  ),
  quality: (
    <>
      <path d="M6 4h12l3 5-9 11L3 9z" />
      <path d="M3 9h18M9 4l3 16 3-16" stroke="var(--nl-purple)" strokeOpacity=".9" />
    </>
  ),
  loyalty: (
    <path d="M7.5 9c-3 0-4.5 1.5-4.5 3s1.5 3 4.5 3c3.5 0 5.5-6 9-6 3 0 4.5 1.5 4.5 3s-1.5 3-4.5 3c-3.5 0-5.5-6-9-6z" />
  ),
};

export function About() {
  const { settings } = useDemo();
  const a = site.about;

  return (
    <section id="about" aria-labelledby="about-title" className="relative py-24 sm:py-32">
      <div className="container-x">
        <SectionLabel index="02">About us</SectionLabel>
        <span id="about-title" className="sr-only">
          About Nine Labs Solutions
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
            <p className="mt-5 border-l-2 border-nl-purple/60 pl-4 text-[15px] italic leading-relaxed text-white/65">“{a.philosophy}”</p>
          </AnimatedContent>
          <AnimatedContent distance={40} duration={1} delay={0.1} ease="expo.out" className="lg:col-span-5">
            <dl className="grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
              {a.stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center px-3 py-6 text-center sm:py-8">
                  <dt className="label-mono order-2 mt-2">{s.label}</dt>
                  <dd className="order-1 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[56px]">
                    <CountUp from={0} to={s.value} prefix="0" duration={1.6} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="label-mono mt-3 text-center !text-white/35">Nine activities · one team · one aim</p>
          </AnimatedContent>
        </div>
      </div>

      {/* The bridge */}
      <div className="relative mt-20 sm:mt-28">
        <div className="container-x">
          <div className="-mx-2 overflow-x-auto pb-2 sm:mx-0 sm:overflow-visible">
            <div className="min-w-[680px] px-2 sm:min-w-0 sm:px-0">
              <BridgeIllustration />
            </div>
          </div>
        </div>
      </div>

      {/* How we work — Roadmap Ascent */}
      <RoadmapAscent />

      {/* Values */}
      <div className="container-x mt-24 sm:mt-28">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <SectionLabel index="03">Our values</SectionLabel>
            <SpringHeading text="What we stand on." className="mt-4 text-[clamp(1.8rem,3.6vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.03em]" />
          </div>
          <p className="max-w-[40ch] text-[15px] text-nl-ink">Five values that hold the bridge up — in every campaign, video, event and strategy.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {site.values.map((v, i) => (
            <AnimatedContent key={v.key} distance={50} duration={0.9} delay={i * 0.07} ease="expo.out" className={i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}>
              <SpotlightCard
                className="h-full !rounded-3xl !p-6"
                spotlightColor={settings.purple}
                intensity={0.22}
                spotlightSize={260}
                style={{ ["--spotlight-card-surface" as string]: "linear-gradient(160deg,#0d0f17,#07080c)" }}
              >
                <div className="relative flex h-full flex-col">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-nl-blue-soft">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {VALUE_ICONS[v.key]}
                    </svg>
                  </span>
                  <span className="label-mono mt-6 !text-[10px]">0{i + 1}</span>
                  <h3 className="mt-1.5 text-xl font-semibold">{v.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-nl-ink">{v.line}</p>
                </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
