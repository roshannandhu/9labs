"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Service } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { gsap, useGSAP } from "@/lib/gsap";
import { NOTCH } from "./useServiceTrack";

/**
 * Laptop/tablet: the icon wheel. Nine icons on an ellipse, turning one notch per card — the
 * same notch as the card wheel beside it (useServiceTrack's orbit), and the same direction at
 * the point where they meet, so the two read as a pair of gears: the active icon sits at the
 * wheel's front edge, a fixed gap from the active card. It lives in the page beside the cards
 * (not fixed to the screen), so it scrolls with them on the compositor instead of trailing a
 * frame behind. Positions come from `posRef` — continuous, and still turning across 9 → 1 —
 * written every frame, which is why there's no CSS transition on transform/opacity here.
 */
export function OrbitGear({
  services,
  active,
  goTo,
  posRef,
}: {
  services: Service[];
  active: number;
  goTo: (i: number) => void;
  posRef: RefObject<number>;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<SVGEllipseElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const capRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    const n = services.length;
    let geo = { cx: 0, cy: 0, rx: 0, ry: 0 };
    let dirty = true;
    let lastVis = NaN;

    // the wheel fills the zone: its front edge (the active icon) 10px in from the zone's right,
    // which itself sits 14px short of the card (globals.css `.orbit-gear`)
    const measure = () => {
      const w = zone.clientWidth;
      const h = zone.clientHeight;
      const margin = 10;
      const half = 22;
      const rx = Math.max(28, (w - 2 * margin - 2 * half) / 2);
      const ry = Math.max(60, Math.min(h / 2 - 40, rx * 2.6));
      geo = { cx: w - margin - half - rx, cy: h / 2, rx, ry };
      const t = trackRef.current;
      if (t) {
        t.setAttribute("cx", geo.cx.toFixed(1));
        t.setAttribute("cy", geo.cy.toFixed(1));
        t.setAttribute("rx", geo.rx.toFixed(1));
        t.setAttribute("ry", geo.ry.toFixed(1));
      }
      dirty = true;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(zone);

    const render = () => {
      const vis = posRef.current;
      if (!dirty && vis === lastVis) return; // at rest this costs nothing
      dirty = false;
      lastVis = vis;
      const on = ((Math.round(vis) % n) + n) % n;
      for (let i = 0; i < n; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const phi = (i - vis) * NOTCH;
        const c = Math.cos(phi);
        const closeness = (c + 1) / 2; // 1 at the front, ~0 at the back of the wheel
        const isOn = i === on;
        const x = geo.cx + geo.rx * c;
        const y = geo.cy + geo.ry * Math.sin(phi);
        const scale = isOn ? 1 : 0.5 + 0.42 * closeness ** 1.6;
        const opacity = isOn ? 1 : 0.12 + 0.78 * closeness ** 2;
        const t = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        if (el.style.transform !== t) el.style.transform = t;
        const o = opacity.toFixed(2);
        if (el.style.opacity !== o) el.style.opacity = o;
        const z = String(Math.round(closeness * 10));
        if (el.style.zIndex !== z) el.style.zIndex = z;
        if (el.classList.contains("orbit-icon--on") !== isOn) el.classList.toggle("orbit-icon--on", isOn);
        const cap = capRefs.current[i];
        const show = String(isOn || closeness > 0.84); // the active icon and its two neighbours
        if (cap && cap.dataset.show !== show) cap.dataset.show = show;
      }
    };
    render();
    gsap.ticker.add(render);
    return () => {
      ro.disconnect();
      gsap.ticker.remove(render);
    };
  }, [services]);

  return (
    <div ref={zoneRef} className="orbit-gear" role="group" aria-label="Choose a service">
      <svg className="orbit-track" aria-hidden="true">
        <ellipse ref={trackRef} fill="none" />
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
          className="orbit-icon"
        >
          <ActivityIcon icon={s.icon} size={20} play={i === active} />
          <span
            ref={(el) => {
              capRefs.current[i] = el;
            }}
            className="orbit-cap"
            data-show="false"
          >
            {s.short}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Phone: a shallow horizontal arc, auto-centred on the active icon. */
export function OrbitArc({
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
    <div className="orbit-arc container-x">
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
