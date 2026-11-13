"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Service } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { gsap, useGSAP } from "@/lib/gsap";
import { NOTCH, ringOffset } from "./useServiceTrack";

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
      const targetVis = Math.max(0, Math.min(n - 1, startVis + deltaVis));
      if (posRef) posRef.current = targetVis;
    };

    const onTouchEnd = () => {
      if (!isTouching) return;
      isTouching = false;
      if (hasMoved && posRef) {
        const finalTarget = Math.round(posRef.current);
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
