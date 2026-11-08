"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { site } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { useDemo } from "@/components/providers/DemoSettings";
import { NINE_SPINE, NINE_VB } from "./nine-path";

export type OrbitHandle = { focusIndex: (i: number) => void; next: () => void; prev: () => void };
export type OrbitFx = { spread: number; fade: number };

type Props = {
  children: React.ReactNode;
  active: number;
  onActive: (i: number) => void;
  fx: React.RefObject<OrbitFx>;
  /** Draw the elliptical track the activities travel on (2D concepts; the 3D concept has its own rings). */
  track?: boolean;
  /** Draw the bridge arc from the front activity to its segment of the 9. */
  bridge?: boolean;
  className?: string;
};

const services = site.services;
const N = services.length;
const STEP = (Math.PI * 2) / N;
const FRONT = Math.PI / 2; // bottom of the ellipse = closest to the viewer
const TAU = Math.PI * 2;

type Geo = { w: number; h: number; rx: number; ry: number; tilt: number; tile: number; hub: number };

function geometry(w: number, h: number): Geo {
  if (w >= 1024) {
    const rx = Math.min(w * 0.37, 560);
    return { w, h, rx, ry: Math.min(rx * 0.25, h * 0.38), tilt: (-7 * Math.PI) / 180, tile: 54, hub: Math.min(w, h) * 0.1 };
  }
  if (w >= 640) {
    const rx = w * 0.41;
    return { w, h, rx, ry: Math.min(rx * 0.3, h * 0.4), tilt: (-6 * Math.PI) / 180, tile: 50, hub: Math.min(w, h) * 0.1 };
  }
  const rx = w * 0.4;
  return { w, h, rx, ry: Math.min(rx * 0.44, h * 0.38), tilt: (-4 * Math.PI) / 180, tile: 44, hub: Math.min(w, h) * 0.1 };
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const OrbitCarousel = forwardRef<OrbitHandle, Props>(function OrbitCarousel(
  { children, active, onActive, fx, track = false, bridge = true, className = "" },
  ref,
) {
  const { reduced, settings } = useDemo();
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const anchorRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const trackRef = useRef<SVGEllipseElement>(null);
  const trackFront = useRef<SVGEllipseElement>(null);
  const arcRefs = useRef<(SVGPathElement | null)[]>([]);
  const arcGroup = useRef<SVGGElement>(null);

  const st = useRef({
    rot: FRONT, // item 0 starts at the front
    target: null as number | null,
    vel: 0,
    hover: false,
    focus: false,
    offscreen: false,
    resumeAt: 0,
    start: 0,
    last: 0,
    active: 0,
    geo: null as Geo | null,
    sides: new Array<string>(N).fill(""),
    fronts: new Array<boolean>(N).fill(false),
    z: new Array<number>(N).fill(0),
    drag: null as null | { id: number; x0: number; y0: number; lastX: number; lastT: number; moved: boolean },
    suppressClick: false,
    seg: [] as { x: number; y: number }[], // midpoints of the 9's nine spine segments (glyph units)
    arc: null as null | { x: number; y: number }, // eased end point of the bridge arc (px)
  });

  const speedRef = useRef(settings.orbitSpeed);
  const reducedRef = useRef(reduced);
  const onActiveRef = useRef(onActive);
  useEffect(() => {
    speedRef.current = settings.orbitSpeed;
    reducedRef.current = reduced;
    onActiveRef.current = onActive;
  });

  const focusIndex = useCallback((i: number) => {
    const s = st.current;
    let t = FRONT - i * STEP;
    t += TAU * Math.round((s.rot - t) / TAU);
    s.target = t;
    s.vel = 0;
    s.resumeAt = performance.now() + 3500;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focusIndex,
      next: () => focusIndex((st.current.active + 1) % N),
      prev: () => focusIndex((st.current.active - 1 + N) % N),
    }),
    [focusIndex],
  );

  // Measure the stage (+ the midpoints of the 9's segments, for the bridge arc).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
    probe.setAttribute("d", NINE_SPINE);
    const L = probe.getTotalLength();
    st.current.seg = Array.from({ length: N }, (_, k) => {
      const p = probe.getPointAtLength(((k + 0.5) / N) * L);
      return { x: p.x, y: p.y };
    });
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      st.current.geo = geometry(width, height);
      el.style.setProperty("--tile", `${st.current.geo.tile}px`);
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      st.current.offscreen = !entry.isIntersecting;
    });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // Animation loop.
  useEffect(() => {
    const s = st.current;
    s.start = performance.now();
    s.last = s.start;
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      const g = s.geo;
      if (!g || s.offscreen || document.hidden) return;
      const isReduced = reducedRef.current;

      // --- motion state -------------------------------------------------------------
      if (!s.drag?.moved) {
        if (Math.abs(s.vel) > 0.0004) {
          s.rot += s.vel * dt * 60;
          s.vel *= Math.pow(0.92, dt * 60);
          if (Math.abs(s.vel) <= 0.0004) {
            s.vel = 0;
            s.target = FRONT + Math.round((s.rot - FRONT) / STEP) * STEP;
            s.resumeAt = now + 2200;
          }
        } else if (s.target != null) {
          const k = isReduced ? 1 : 1 - Math.exp(-dt * 6.5);
          s.rot += (s.target - s.rot) * k;
          if (Math.abs(s.target - s.rot) < 0.0005) {
            s.rot = s.target;
            s.target = null;
          }
        } else if (!isReduced && !s.hover && !s.focus && now > s.resumeAt) {
          const period = 64 / Math.max(0.2, speedRef.current);
          s.rot += (TAU / period) * dt;
        }
      }

      // --- layout -------------------------------------------------------------------
      const intro = isReduced ? 1 : easeOutExpo(Math.max(0, Math.min(1, (now - s.start - 1100) / 1500)));
      const fxv = fx.current ?? { spread: 1, fade: 1 };
      const spread = (0.35 + 0.65 * intro) * fxv.spread;
      const cx = g.w / 2;
      const cy = g.h / 2;
      const cosT = Math.cos(g.tilt);
      const sinT = Math.sin(g.tilt);

      let best = 0;
      let bestD = -1;
      const pts: { x: number; y: number; d: number }[] = [];
      for (let i = 0; i < N; i++) {
        const th = s.rot + i * STEP;
        const c = Math.cos(th);
        const sn = Math.sin(th);
        const x = g.rx * c * spread;
        const y = g.ry * sn * spread;
        const X = x * cosT - y * sinT;
        const Y = x * sinT + y * cosT;
        const d = (sn + 1) / 2;
        pts.push({ x: cx + X, y: cy + Y, d });
        if (d > bestD) {
          bestD = d;
          best = i;
        }
      }

      for (let i = 0; i < N; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const { x, y, d } = pts[i];
        const scale = 0.56 + 0.54 * d;
        // Fake occlusion: items passing behind the 9 (back half, near the centre) fade further.
        const behind = d < 0.5 ? Math.max(0, 1 - Math.abs(x - cx) / (g.w * 0.1)) : 0;
        const op = (0.26 + 0.74 * Math.pow(d, 1.5)) * (1 - 0.75 * behind) * intro * fxv.fade;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        el.style.opacity = op.toFixed(3);
        const z = d > 0.5 ? 20 + Math.round(d * 10) : 1 + Math.round(d * 8);
        if (s.z[i] !== z) {
          s.z[i] = z;
          el.style.zIndex = String(z);
        }
        const side = x < cx - 2 ? "l" : "r";
        if (s.sides[i] !== side) {
          s.sides[i] = side;
          el.dataset.side = side;
        }
        const front = i === best;
        if (s.fronts[i] !== front) {
          s.fronts[i] = front;
          el.dataset.front = front ? "true" : "false";
        }
      }

      // Elliptical track (2D concepts).
      for (const el of [trackRef.current, trackFront.current]) {
        if (!el) continue;
        el.setAttribute("cx", cx.toFixed(1));
        el.setAttribute("cy", cy.toFixed(1));
        el.setAttribute("rx", (g.rx * spread).toFixed(1));
        el.setAttribute("ry", (g.ry * spread).toFixed(1));
        el.setAttribute("transform", `rotate(${((g.tilt * 180) / Math.PI).toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
        el.style.opacity = (intro * fxv.fade).toFixed(3);
      }

      // Bridge arc: from the front activity to its own segment of the 9, bowed around the 9's side.
      if (arcGroup.current && s.seg.length === N) {
        const H9 = g.h * 0.84;
        const W9 = (H9 * NINE_VB.w) / NINE_VB.h;
        const sp = s.seg[best];
        const tx = cx + (sp.x / NINE_VB.w - 0.5) * W9;
        const ty = cy + (sp.y / NINE_VB.h - 0.5) * H9;
        const k = !s.arc || isReduced ? 1 : 1 - Math.exp(-dt * 5);
        s.arc = s.arc ? { x: s.arc.x + (tx - s.arc.x) * k, y: s.arc.y + (ty - s.arc.y) * k } : { x: tx, y: ty };
        const c = pts[best];
        const side = s.arc.x < cx ? -1 : 1;
        const qx = cx + side * W9 * 0.78;
        const qy = (c.y + s.arc.y) / 2 + H9 * 0.08;
        const d = `M${c.x.toFixed(1)} ${c.y.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${s.arc.x.toFixed(1)} ${s.arc.y.toFixed(1)}`;
        for (const el of arcRefs.current) el?.setAttribute("d", d);
        arcGroup.current.style.opacity = (Math.max(0, (intro - 0.6) / 0.4) * fxv.fade).toFixed(3);
      }

      if (best !== s.active) {
        s.active = best;
        onActiveRef.current(best);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [fx]);

  // --- pointer: drag / swipe with inertia ------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    st.current.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lastX: e.clientX, lastT: performance.now(), moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = st.current;
    const d = s.drag;
    if (!d || d.id !== e.pointerId || !s.geo) return;
    const totalX = e.clientX - d.x0;
    const totalY = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.abs(totalX) > 8 && Math.abs(totalX) > Math.abs(totalY)) {
        d.moved = true;
        s.target = null;
        s.vel = 0;
        stageRef.current?.setPointerCapture(e.pointerId);
      } else if (Math.abs(totalY) > 12) {
        s.drag = null;
        return;
      } else return;
    }
    const now = performance.now();
    const dx = e.clientX - d.lastX;
    const dth = -dx / (s.geo.rx * 1.05);
    s.rot += dth;
    const dtFrames = Math.max(1, ((now - d.lastT) / 1000) * 60);
    s.vel = dth / dtFrames;
    d.lastX = e.clientX;
    d.lastT = now;
  };
  const endDrag = (e: React.PointerEvent) => {
    const s = st.current;
    if (!s.drag || s.drag.id !== e.pointerId) return;
    if (s.drag.moved) {
      s.suppressClick = true;
      window.setTimeout(() => (s.suppressClick = false), 60);
      if (Math.abs(s.vel) <= 0.0004) {
        s.target = FRONT + Math.round((s.rot - FRONT) / STEP) * STEP;
      }
      s.resumeAt = performance.now() + 2500;
      if (stageRef.current?.hasPointerCapture(e.pointerId)) stageRef.current.releasePointerCapture(e.pointerId);
    }
    s.drag = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k !== "ArrowRight" && k !== "ArrowLeft" && k !== "ArrowDown" && k !== "ArrowUp") return;
    e.preventDefault();
    const dir = k === "ArrowRight" || k === "ArrowDown" ? 1 : -1;
    const i = (st.current.active + dir + N) % N;
    anchorRefs.current[i]?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={stageRef}
      className={`relative isolate h-full w-full touch-pan-y select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      data-cursor="Drag"
    >
      {track && (
        <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="orbit-track" x1="0" x2="1">
              <stop offset="0" style={{ stopColor: "var(--nl-blue)" }} stopOpacity="0.15" />
              <stop offset="0.5" style={{ stopColor: "var(--nl-purple)" }} stopOpacity="0.55" />
              <stop offset="1" style={{ stopColor: "var(--nl-blue)" }} stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <ellipse ref={trackRef} fill="none" stroke="white" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="2 7" style={{ opacity: 0 }} />
          <ellipse ref={trackFront} fill="none" stroke="url(#orbit-track)" strokeWidth="1.2" style={{ opacity: 0 }} />
        </svg>
      )}

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">{children}</div>

      {bridge && (
        <svg className="pointer-events-none absolute inset-0 z-[15] h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <filter id="bridge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <g ref={arcGroup} className="bridge-arc" style={{ opacity: 0 }}>
            {[
              { cls: "", stroke: "var(--nl-purple)", w: 5, op: 0.35, filter: "url(#bridge-glow)" },
              { cls: "", stroke: "var(--nl-purple)", w: 1.1, op: 0.85 },
              { cls: "bridge-pulse", stroke: "var(--nl-blue-soft)", w: 2.4, op: 1 },
              { cls: "bridge-pulse bridge-pulse--back", stroke: "#e9dcff", w: 2.4, op: 1 },
            ].map((l, i) => (
              <path
                key={i}
                ref={(el) => {
                  arcRefs.current[i] = el;
                }}
                className={l.cls}
                pathLength={1}
                fill="none"
                stroke={l.stroke}
                strokeOpacity={l.op}
                strokeWidth={l.w}
                strokeLinecap="round"
                filter={l.filter}
              />
            ))}
          </g>
        </svg>
      )}

      <ul className="absolute inset-0 m-0 list-none p-0" aria-label="Our nine activities" onKeyDown={onKeyDown}>
        {services.map((s, i) => (
          <li
            key={s.slug}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="orbit-item"
            data-front={i === 0 ? "true" : "false"}
            data-side="r"
            style={{ opacity: 0 }}
          >
            <a
              ref={(el) => {
                anchorRefs.current[i] = el;
              }}
              href={`#service-${s.slug}`}
              className="orbit-link"
              data-cursor="Explore"
              aria-label={`${s.title} — ${s.description}`}
              onClick={(e) => {
                if (st.current.suppressClick) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                focusIndex(i);
              }}
              onFocus={() => {
                st.current.focus = true;
                focusIndex(i);
              }}
              onBlur={() => {
                st.current.focus = false;
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") st.current.hover = true;
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") {
                  st.current.hover = false;
                  st.current.resumeAt = performance.now() + 600;
                }
              }}
            >
              <span className="orbit-tile">
                <ActivityIcon icon={s.icon} size={26} play={i === active} />
              </span>
              <span className="orbit-label">{s.short}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
