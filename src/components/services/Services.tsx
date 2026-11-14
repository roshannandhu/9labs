"use client";

import { useRef } from "react";
import type { IconKey, Service } from "@/content/site";
import type { SiteData } from "@/content/types";
import { sectionNo, useSite } from "@/components/providers/SiteProvider";
import { useDemo } from "@/components/providers/DemoSettings";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { StaticDigit } from "@/components/particles/StaticDigit";
import { useServiceTrack } from "./useServiceTrack";
import { OrbitArc, OrbitFloorTrack, OrbitChevrons, OrbitCapsuleDock } from "./OrbitNav";
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

/**
 * Each activity's scene (and its own flourish — the ad echoes, the PR headline…) is tied to
 * its icon, not to a fixed slot, so a card dragged to a new position in the admin (The 9 cards)
 * takes its whole scene with it.
 */
const SCENES: Record<IconKey, (p: { s: Service; active: boolean }) => React.ReactElement> = {
  social: Scene1Social,
  advertising: Scene2Advertising,
  content: Scene3Content,
  photo: Scene4Photo,
  events: Scene5Events,
  pr: Scene6PR,
  strategy: Scene7Strategy,
  ai: Scene8AI,
  it: Scene9IT,
};

/**
 * "Our 9 labs." The nine services as a sideways carousel (`useServiceTrack`): swipe or trackpad
 * freely, the next card peeks in dimmed, it auto-advances, and the particle swarm forms each card's
 * object as it comes into focus — the page itself scrolls straight past, no lock. Reduced motion:
 * a plain list, every picture already still.
 */
export function Services() {
  const { reduced } = useDemo();
  const site = useSite();
  const t = site.servicesSection;

  const heading = (
    <div className="container-x max-w-[920px]">
      <SectionLabel index={sectionNo(site, "services")}>{t.label}</SectionLabel>
      <SpringHeading
        id="services-title"
        text={t.heading}
        accent={t.accent || undefined}
        className="mt-1.5 text-[clamp(1.75rem,3.8vw,3.2rem)] font-semibold leading-[1.04] tracking-[-0.035em] sm:mt-2.5 sm:leading-[1.02]"
      />
      {t.intro && (
        <p className="mt-1.5 max-w-[60ch] text-[13.5px] leading-snug text-nl-ink line-clamp-2 sm:mt-2.5 sm:text-[15px] sm:leading-relaxed sm:line-clamp-none">
          {t.intro}
        </p>
      )}
    </div>
  );

  if (reduced) return <ServicesList heading={heading} services={site.services} t={t} />;

  return <ServicesTrack heading={heading} services={site.services} t={t} />;
}

type Part = { heading: React.ReactNode; services: Service[]; t: SiteData["servicesSection"] };

/** "All nine. One team." + the 3×3 grid of the nine activities. */
function Finale({ services, t, gap = "" }: Omit<Part, "heading"> & { gap?: string }) {
  return (
    <>
      <h3 className={`${gap} font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]`}>
        {t.outro} {t.outroAccent && <span className="font-accent text-gradient">{t.outroAccent}</span>}
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
    </>
  );
}

function ServicesTrack({ heading, services, t }: Part) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { active, goTo, running, posRef } = useServiceTrack(scrollerRef, services);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownPos.current) return;
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    if (dx > 8 || dy > 8) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerUp = () => {
    pointerDownPos.current = null;
  };

  // Allow clicking a peeking adjacent card on laptop/desktop to navigate directly to it,
  // but ignore if the user was dragging/swiping
  const handleScrollerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    const cardEl = (e.target as HTMLElement).closest<HTMLElement>(".scene-card");
    if (!cardEl || !scrollerRef.current) return;
    const cards = Array.from(scrollerRef.current.querySelectorAll<HTMLElement>(":scope > .scene-card"));
    const idx = cards.indexOf(cardEl);
    if (idx !== -1 && idx !== active) {
      goTo(idx);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo((active - 1 + 9) % 9);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo((active + 1) % 9);
    }
  };

  return (
    <section id="services" aria-labelledby="services-title" className="relative pt-4 pb-10 sm:pt-6 sm:pb-12 lg:pt-8 lg:pb-12 scroll-mt-16">
      <div className="pb-2 sm:pb-3">{heading}</div>
      {/* 3D orbital stage: floor track, chevrons and centered carousel */}
      <div className="svc-stage">
        <OrbitFloorTrack />
        <OrbitChevrons active={active} goTo={goTo} services={services} />
        <div
          ref={scrollerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleScrollerClick}
          onKeyDown={handleKeyDown}
          data-lenis-prevent-horizontal
          data-particle-track
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Our nine services"
          className="svc-scroller"
        >
          {services.map((s, i) => {
            const Scene = SCENES[s.icon];
            return <Scene key={s.slug} s={s} active={active === i} />;
          })}
        </div>
      </div>
      {/* Laptop / desktop (>= 768px): 3B Frosted Capsule Dock with 3.5s countdown ring and counter */}
      <OrbitCapsuleDock services={services} active={active} goTo={goTo} running={running} />
      {/* Phone / touch (< 768px): The convex dome dial dock — 100% untouched */}
      <OrbitArc services={services} active={active} goTo={goTo} running={running} posRef={posRef} />
      <div className="container-x flex flex-col items-center pb-20 pt-24 text-center sm:pb-28 sm:pt-32">
        <div className="h-24 w-24 sm:h-32 sm:w-28" aria-hidden="true">
          <div data-particle-slot="finale" className="relative h-full w-full" />
        </div>
        <Finale services={services} t={t} gap="mt-3" />
      </div>
    </section>
  );
}

/** Reduced motion: nothing moving — the nine cards in a list, each with a still number. */
function ServicesList({ heading, services, t }: Part) {
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
        <Finale services={services} t={t} />
      </div>
    </section>
  );
}
