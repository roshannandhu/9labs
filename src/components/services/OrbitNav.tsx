"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Service } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { gsap, useGSAP } from "@/lib/gsap";
import { ringOffset } from "./useServiceTrack";

/** Desktop: A subtle 3D floor ellipse orbit track behind the cards */
export function OrbitFloorTrack() {
  return (
    <div className="orbital-floor-track pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[520px] overflow-hidden -z-10 hidden md:block" aria-hidden="true">
      <svg className="mx-auto h-full w-[1240px] max-w-full" viewBox="0 0 1240 520" fill="none">
        <ellipse cx="620" cy="260" rx="590" ry="180" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" strokeDasharray="4 7" className="text-nl-purple dark:text-nl-purple/50" />
      </svg>
    </div>
  );
}

/** Desktop: Floating circular glass chevron buttons flanking the carousel with premium hover effect */
export function OrbitChevrons({
  active,
  goTo,
  services,
}: {
  active: number;
  goTo: (i: number) => void;
  services?: Service[];
}) {
  const prevIdx = (active - 1 + 9) % 9;
  const nextIdx = (active + 1) % 9;
  const prevTitle = services?.[prevIdx]?.short || "Previous";
  const nextTitle = services?.[nextIdx]?.short || "Next";

  return (
    <div className="pointer-events-none absolute inset-y-0 inset-x-3 lg:inset-x-6 z-30 hidden md:flex items-center justify-between">
      <button
        type="button"
        onClick={() => goTo(prevIdx)}
        aria-label={`Previous service: ${prevTitle}`}
        className="orbit-chev orbit-chev--left pointer-events-auto group"
        data-cursor="Prev"
      >
        <span className="orbit-chev-arrow orbit-chev-arrow--left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="6" y2="12" className="orbit-arrow-stem" />
            <polyline points="12 18 6 12 12 6" />
          </svg>
        </span>
        <span className="orbit-chev-badge pointer-events-none">
          {prevTitle}
        </span>
      </button>
      <button
        type="button"
        onClick={() => goTo(nextIdx)}
        aria-label={`Next service: ${nextTitle}`}
        className="orbit-chev orbit-chev--right pointer-events-auto group"
        data-cursor="Next"
      >
        <span className="orbit-chev-arrow orbit-chev-arrow--right">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="18" y2="12" className="orbit-arrow-stem" />
            <polyline points="12 6 18 12 12 18" />
          </svg>
        </span>
        <span className="orbit-chev-badge pointer-events-none">
          {nextTitle}
        </span>
      </button>
    </div>
  );
}

/** Laptop / Desktop: 3B Frosted capsule dock with countdown ring and 02/09 counter */
export function OrbitCapsuleDock({
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
  return (
    <div className="orbit-dock-wrap hidden md:flex" role="group" aria-label="Choose a service">
      <div className="orbit-capsule-dock">
        {services.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to ${s.short}`}
              aria-current={isActive ? "true" : undefined}
              title={s.short}
              className={`orbit-capsule-node group relative ${isActive ? "orbit-capsule-node--active" : ""}`}
            >
              {isActive && (
                <svg
                  className={`timing-ring ${running ? "timing-ring--running" : "timing-ring--paused"}`}
                  viewBox="0 0 60 60"
                  aria-hidden="true"
                >
                  <circle
                    key={active}
                    cx="30"
                    cy="30"
                    r="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeDasharray="163.36"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <ActivityIcon icon={s.icon} size={20} play={isActive} />
              <span className="orbit-node-tooltip pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-nl-panel px-2 py-0.5 text-[10.5px] font-semibold text-nl-ink shadow-sm opacity-0 transition-opacity group-hover:opacity-100 dark:border dark:border-white/10 dark:text-white">
                {s.short}
              </span>
            </button>
          );
        })}
        <div className="dock-counter pl-3 pr-1 text-[12px] font-bold font-mono text-nl-indigo dark:text-nl-purple select-none border-l border-black/[0.08] dark:border-white/10">
          {String(active + 1).padStart(2, "0")} / 09
        </div>
      </div>
    </div>
  );
}

/** Kept for backwards-compatibility: renders the desktop floor track on large screens */
export function OrbitGear() {
  return <OrbitFloorTrack />;
}

/** Phone / touch: a convex semi-circular dome dial dock auto-centred on the active service. */
export function OrbitArc({
  services,
  active,
  goTo,
  running,
  posRef,
}: {
  services: Service[];
  active: number;
  goTo: (i: number) => void;
  running: boolean;
  posRef?: RefObject<number>;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<SVGPathElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const n = services.length;

  useGSAP(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    let cx = 0;
    let cy = 0;
    let rx = 0;
    let ry = 0;
    let dirty = true;
    let lastVis = NaN;

    const measure = () => {
      const w = zone.clientWidth || 360;
      cx = w / 2;
      cy = w < 380 ? 66 : 72;
      rx = Math.max(105, Math.min(w * 0.42, 156));
      ry = Math.max(26, Math.min(w < 380 ? 30 : 35, rx * 0.25));

      const path = trackRef.current;
      if (path) {
        const x0 = (cx - rx).toFixed(1);
        const x1 = (cx + rx).toFixed(1);
        const y0 = cy.toFixed(1);
        const rxStr = rx.toFixed(1);
        const ryStr = ry.toFixed(1);
        path.setAttribute("d", `M ${x0} ${y0} A ${rxStr} ${ryStr} 0 0 1 ${x1} ${y0}`);
      }
      dirty = true;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(zone);

    const render = () => {
      const vis = posRef?.current ?? active;
      if (!dirty && vis === lastVis) return;
      dirty = false;
      lastVis = vis;

      for (let i = 0; i < n; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;

        const offset = ringOffset(i - vis); // in [-4.5, 4.5)
        const phi = offset * 0.36; // in radians
        const s = Math.sin(phi);
        const c = Math.cos(phi);
        const x = cx + rx * s;
        const y = cy - ry * c;

        const absOff = Math.abs(offset);
        const closeness = Math.max(0, c);
        const isOn = absOff < 0.36;
        const scale = isOn ? 1.14 : Math.max(0.64, 0.64 + 0.34 * closeness ** 1.8);
        const opacity = absOff > 4.2 ? 0 : Math.max(0.35, 0.35 + 0.65 * closeness ** 2.2);

        const t = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        if (el.style.transform !== t) el.style.transform = t;
        const o = opacity.toFixed(2);
        if (el.style.opacity !== o) el.style.opacity = o;

        const z = String(isOn ? 20 : Math.round(closeness * 10));
        if (el.style.zIndex !== z) el.style.zIndex = z;

        if (el.classList.contains("dial-node--on") !== isOn) {
          el.classList.toggle("dial-node--on", isOn);
        }
      }
    };

    render();
    gsap.ticker.add(render);
    return () => {
      ro.disconnect();
      gsap.ticker.remove(render);
    };
  }, [services, active, posRef]);

  // Touch scrubbing on the dome dial
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    let isTouching = false;
    let startX = 0;
    let startVis = 0;
    let hasMoved = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isTouching = true;
      hasMoved = false;
      startX = e.touches[0].clientX;
      startVis = posRef?.current ?? active;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouching || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dx) > 6) hasMoved = true;
      const deltaVis = -dx / 70;
      const rawVis = startVis + deltaVis;
      const targetVis = ((rawVis % n) + n) % n;
      if (posRef) posRef.current = targetVis;
    };

    const onTouchEnd = () => {
      if (!isTouching) return;
      isTouching = false;
      if (hasMoved && posRef) {
        const finalTarget = ((Math.round(posRef.current) % n) + n) % n;
        goTo(finalTarget);
      }
    };

    zone.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      zone.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [active, goTo, n, posRef]);

  return (
    <div ref={zoneRef} className="orbit-arc orbit-dial container-x" role="group" aria-label="Choose a service">
      <svg className="orbit-dial-svg" aria-hidden="true">
        <defs>
          <linearGradient id="dial-arch-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--nl-purple)" stopOpacity="0" />
            <stop offset="25%" stopColor="var(--nl-purple)" stopOpacity="0.25" />
            <stop offset="50%" stopColor="var(--nl-indigo)" stopOpacity="0.85" />
            <stop offset="75%" stopColor="var(--nl-purple)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--nl-purple)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path ref={trackRef} fill="none" stroke="url(#dial-arch-glow)" strokeWidth="1.5" strokeDasharray="3 5" />
      </svg>
      {services.map((s, i) => (
        <button
          key={s.slug}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          type="button"
          onClick={() => goTo(i)}
          aria-label={`Go to ${s.short}`}
          aria-current={i === active ? "true" : undefined}
          title={s.short}
          className="dial-node"
        >
          <ActivityIcon icon={s.icon} size={16} play={i === active} />
        </button>
      ))}
      <div className="dial-label-wrap">
        <p className="dial-label">
          {services[active].short}
          {running && <span key={active} className="arc-label-fill" aria-hidden="true" />}
        </p>
      </div>
    </div>
  );
}
