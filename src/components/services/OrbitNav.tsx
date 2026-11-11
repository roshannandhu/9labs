"use client";

import { useEffect, useRef } from "react";
import type { Service } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";

/**
 * Replaces the flat dot row with an orbit: on laptop a fixed half-circle fan to the left of the
 * carousel (shown only while the section is in view — `inView`, from `useServiceTrack`'s own
 * visibility observer), on phone a shallow arc in the dock's old spot. Both are pure presentation
 * over the same `active`/`goTo`/`running` state the dock used — no scroll, particle or swipe logic
 * lives here, so neither can regress from this change.
 */
export function OrbitNav({
  services,
  active,
  goTo,
  running,
  inView,
}: {
  services: Service[];
  active: number;
  goTo: (i: number) => void;
  running: boolean;
  inView: boolean;
}) {
  return (
    <>
      <div
        className={`orbit-fan pointer-events-none fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-500 lg:block xl:left-8 ${
          inView ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!inView}
      >
        <div className={`relative h-[520px] w-[190px] ${inView ? "pointer-events-auto" : "pointer-events-none"}`} role="group" aria-label="Choose a service">
          {services.map((s, i) => {
            const d = i - active;
            const rawAd = Math.abs(d);
            // eases toward (never reaches) 4, so every raw distance still maps to its own
            // position — a hard cap here would stack every icon past the cap on one spot,
            // hiding all but the last in the DOM behind it
            const ad = (4 * rawAd) / (1 + rawAd);
            // anchored from the zone's own right edge (facing the card), never the viewport —
            // the distance in only ever grows inward, so it can't push an icon off-screen
            const right = 10 + ad * 32;
            const y = Math.sign(d) * ad * 42;
            const scale = Math.max(0.44, 1 - ad * 0.14);
            const opacity = Math.max(0.16, 1 - ad * 0.22);
            const isOn = i === active;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to ${s.short}`}
                aria-current={isOn ? "true" : undefined}
                title={isOn ? undefined : s.short}
                className={`orbit-icon${isOn ? " orbit-icon--on" : ""}`}
                style={{
                  right,
                  transform: `translateY(calc(-50% + ${y}px)) scale(${scale})`,
                  opacity,
                  zIndex: 9 - ad,
                }}
              >
                <ActivityIcon icon={s.icon} size={20} play={isOn} />
                {isOn && (
                  <span className="orbit-tag">
                    {s.short}
                    {running && <span key={active} className="orbit-tag-fill" aria-hidden="true" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <OrbitArc services={services} active={active} goTo={goTo} running={running} />
    </>
  );
}

/** Phone/tablet: a shallow horizontal arc, auto-centred on the active icon. */
function OrbitArc({
  services,
  active,
  goTo,
  running,
}: {
  services: Service[];
  active: number;
  goTo: (i: number) => void;
  running: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const btn = row?.children[active] as HTMLElement | undefined;
    if (!row || !btn) return;
    row.scrollTo({ left: btn.offsetLeft - row.clientWidth / 2 + btn.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <div className="container-x lg:hidden">
      <div ref={rowRef} className="orbit-arc-row" role="group" aria-label="Choose a service">
        {services.map((s, i) => {
          const d = i - active;
          const rawAd = Math.abs(d);
          const ad = (4 * rawAd) / (1 + rawAd);
          const y = -Math.max(0, 14 - ad * 4);
          const scale = Math.max(0.58, 1 - ad * 0.12);
          const opacity = Math.max(0.4, 1 - ad * 0.16);
          const isOn = i === active;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to ${s.short}`}
              aria-current={isOn ? "true" : undefined}
              className={`arc-icon${isOn ? " arc-icon--on" : ""}`}
              style={{ transform: `translateY(${y}px) scale(${scale})`, opacity }}
            >
              <ActivityIcon icon={s.icon} size={16} play={isOn} />
            </button>
          );
        })}
      </div>
      <p className="arc-label">
        {services[active].short}
        {running && <span key={active} className="arc-label-fill" aria-hidden="true" />}
      </p>
    </div>
  );
}
