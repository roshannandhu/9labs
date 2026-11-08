"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { site } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { useDemo } from "@/components/providers/DemoSettings";
import { NINE_VB } from "./nine-path";
import { LEAN } from "./BlueprintConstruction";

export type OrbitHandle = { focusIndex: (i: number) => void; next: () => void; prev: () => void };
/** Live values the hero writes (scroll + pointer) and the orbit reads every frame. */
export type OrbitFx = {
  /** ring radius multiplier: 1 at rest, > 1 when the ring opens on scroll */
  spread: number;
  /** opacity multiplier */
  fade: number;
  /** px the items fall toward Services on scroll (front items fall further) */
  drop: number;
  /** extra ring tilt in degrees (mouse) */
  tilt: number;
};

/** The 9's height inside the stage: 84% of it, capped so it never gets absurd on huge screens. */
export const nineHeight = (stageH: number) => Math.min(stageH * 0.84, 640);

type Props = {
  children: React.ReactNode;
  active: number;
  onActive: (i: number) => void;
  fx: React.RefObject<OrbitFx>;
  className?: string;
};

const services = site.services;
const N = services.length;
const STEP = (Math.PI * 2) / N;
const FRONT = Math.PI / 2; // bottom of the ellipse = closest to the viewer
const TAU = Math.PI * 2;
const GLIDE = 1300; // ms an item takes to glide to the front
const HOLD = 3100; // ms it holds there (≈ 40 s per full loop at speed 1)
const INTRO_AT = 2000; // ms: items fly in once the 9 is lit…
const INTRO_FLY = 900; // …each over this long, the front one last
const T7 = Math.tan((LEAN * Math.PI) / 180);

type Geo = { w: number; h: number; rx: number; ry: number; tile: number };

function geometry(w: number, h: number): Geo {
  if (w >= 1024) {
    const rx = Math.min(w * 0.34, 640);
    return { w, h, rx, ry: Math.min(rx * 0.26, h * 0.4), tile: 54 };
  }
  if (w >= 640) {
    const rx = w * 0.3;
    return { w, h, rx, ry: Math.min(rx * 0.3, h * 0.4), tile: 50 };
  }
  // Phones: the ring is wider than the screen, so side items slide off the edges and come back
  // (narrower when the phone is held sideways and the ring shares the screen with the copy).
  const rx = w * (h < w * 0.8 ? 0.4 : 0.62);
  return { w, h, rx, ry: Math.min(rx * 0.32, h * 0.36), tile: 44 };
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/**
 * "Saturn ring": the nine activities on an ellipse tilted 7° (matching the 9's lean). Back-half
 * items render under the opaque 9 and front-half items over it, so they really go around it.
 * Step-and-hold: each item glides to the front, holds ~3 s, then the next one comes. Hover
 * pauses; drag/swipe spins with inertia; arrow keys rotate; on touch the first tap brings an
 * item to the front and the second opens its service. While an item holds the front, one short
 * purple bridge arc links it to the 9 with a light dot running both ways.
 */
export const OrbitCarousel = forwardRef<OrbitHandle, Props>(function OrbitCarousel({ children, active, onActive, fx, className = "" }, ref) {
  const { reduced, settings } = useDemo();
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const anchorRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const ringBack = useRef<SVGEllipseElement>(null);
  const ringFront = useRef<SVGPathElement>(null);
  const arcRefs = useRef<(SVGPathElement | null)[]>([]);
  const arcGroup = useRef<SVGGElement>(null);

  const st = useRef({
    rot: FRONT, // item 0 starts at the front
    tween: null as null | { from: number; to: number; t0: number; dur: number },
    vel: 0,
    hover: false,
    focus: false,
    offscreen: false,
    holdUntil: 0,
    start: 0,
    last: 0,
    active: 0,
    tiltCur: 0,
    pointer: "mouse",
    geo: null as Geo | null,
    sides: new Array<string>(N).fill(""),
    fronts: new Array<boolean>(N).fill(false),
    z: new Array<number>(N).fill(0),
    arcOn: false,
    drag: null as null | { id: number; x0: number; y0: number; lastX: number; lastT: number; moved: boolean },
    suppressClick: false,
  });

  const speedRef = useRef(settings.orbitSpeed);
  const reducedRef = useRef(reduced);
  const onActiveRef = useRef(onActive);
  useEffect(() => {
    speedRef.current = settings.orbitSpeed;
    reducedRef.current = reduced;
    onActiveRef.current = onActive;
  });

  const glide = useCallback((to: number, dur = GLIDE) => {
    const s = st.current;
    s.tween = { from: s.rot, to, t0: performance.now(), dur };
    s.vel = 0;
  }, []);

  const focusIndex = useCallback(
    (i: number) => {
      const s = st.current;
      let t = FRONT - i * STEP;
      t += TAU * Math.round((s.rot - t) / TAU);
      glide(t, Math.min(GLIDE, 500 + Math.abs(t - s.rot) * 900));
      s.holdUntil = performance.now() + GLIDE + 4200;
    },
    [glide],
  );

  useImperativeHandle(
    ref,
    () => ({
      focusIndex,
      next: () => focusIndex((st.current.active + 1) % N),
      prev: () => focusIndex((st.current.active - 1 + N) % N),
    }),
    [focusIndex],
  );

  // Measure the stage; pause when off-screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
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
    s.holdUntil = s.start + INTRO_AT + INTRO_FLY + 1000 + HOLD;
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      const g = s.geo;
      if (!g || s.offscreen || document.hidden) return;
      const isReduced = reducedRef.current;
      const fxv = fx.current ?? { spread: 1, fade: 1, drop: 0, tilt: 0 };

      // --- motion state -------------------------------------------------------------
      if (!s.drag?.moved) {
        if (Math.abs(s.vel) > 0.0004) {
          s.rot += s.vel * dt * 60;
          s.vel *= Math.pow(0.92, dt * 60);
          if (Math.abs(s.vel) <= 0.0004) {
            glide(FRONT + Math.round((s.rot - FRONT) / STEP) * STEP, 600);
            s.holdUntil = now + 600 + HOLD;
          }
        } else if (s.tween) {
          const tw = s.tween;
          const k = isReduced ? 1 : clamp01((now - tw.t0) / tw.dur);
          s.rot = tw.from + (tw.to - tw.from) * easeInOut(k);
          if (k >= 1) s.tween = null;
        } else if (!isReduced && !s.hover && !s.focus && now > s.holdUntil) {
          const hold = HOLD / Math.max(0.2, speedRef.current);
          glide(FRONT + Math.round((s.rot - FRONT) / STEP) * STEP - STEP);
          s.holdUntil = now + GLIDE + hold;
        }
      }
      const settled = !s.tween && !s.drag?.moved && Math.abs(s.vel) <= 0.0004;

      // --- layout -------------------------------------------------------------------
      const tIntro = now - s.start;
      const introDone = isReduced || tIntro > INTRO_AT + INTRO_FLY + 500;
      s.tiltCur += (fxv.tilt - s.tiltCur) * (1 - Math.exp(-dt * 4));
      const tilt = ((-LEAN + s.tiltCur) * Math.PI) / 180;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const cx = g.w / 2;
      const cy = g.h / 2;
      const rx = g.rx * fxv.spread;
      const ry = g.ry * fxv.spread;
      const far = Math.max(g.w, g.h) * 0.9;

      let best = 0;
      let bestD = -1;
      const pts: { x: number; y: number; d: number }[] = [];
      for (let i = 0; i < N; i++) {
        const th = s.rot + i * STEP;
        const sn = Math.sin(th);
        const x = rx * Math.cos(th);
        const y = ry * sn;
        let X = x * cosT - y * sinT;
        let Y = x * sinT + y * cosT;
        const d = (sn + 1) / 2;
        Y += fxv.drop * (0.55 + 0.45 * d);
        // Intro: fly in from beyond the screen edges; the front item lands last.
        const e = isReduced ? 1 : easeOutExpo(clamp01((tIntro - INTRO_AT - d * 450) / INTRO_FLY));
        if (e < 1) {
          const len = Math.hypot(X, Y) || 1;
          X += (X / len) * far * (1 - e);
          Y += (Y / len) * far * (1 - e);
        }
        pts.push({ x: cx + X, y: cy + Y, d: d * e });
        if (d > bestD) {
          bestD = d;
          best = i;
        }
      }

      for (let i = 0; i < N; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const { x, y, d } = pts[i];
        const e = isReduced ? 1 : clamp01((tIntro - INTRO_AT - d * 450) / 300);
        const scale = 0.62 + 0.78 * Math.pow(d, 1.6);
        const op = (0.4 + 0.6 * Math.pow(d, 1.2)) * e * fxv.fade;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        el.style.opacity = op.toFixed(3);
        // Back half under the 9 (z-10), front half over it.
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

      // Saturn ring: back half drawn under the 9, front half over it.
      const ringOp = (isReduced ? 1 : clamp01((tIntro - INTRO_AT) / 800)) * fxv.fade;
      const rot = `rotate(${((tilt * 180) / Math.PI).toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})`;
      if (ringBack.current) {
        const r = ringBack.current;
        r.setAttribute("cx", cx.toFixed(1));
        r.setAttribute("cy", cy.toFixed(1));
        r.setAttribute("rx", rx.toFixed(1));
        r.setAttribute("ry", ry.toFixed(1));
        r.setAttribute("transform", rot);
        r.style.opacity = ringOp.toFixed(3);
      }
      if (ringFront.current) {
        const r = ringFront.current;
        r.setAttribute("d", `M${(cx - rx).toFixed(1)} ${cy.toFixed(1)}A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 0 ${(cx + rx).toFixed(1)} ${cy.toFixed(1)}`);
        r.setAttribute("transform", rot);
        r.style.opacity = ringOp.toFixed(3);
      }

      // Bridge arc: front item → the 9's right edge, only while the item holds the front.
      if (arcGroup.current) {
        const H9 = nineHeight(g.h);
        const W9 = (H9 * NINE_VB.w) / NINE_VB.h;
        const gy = 300; // glyph units: the right edge of the 9's bowl, where light enters it
        const gx = 392 - T7 * (gy - 309);
        const tx = cx + (gx / NINE_VB.w - 0.5) * W9;
        const ty = cy + (gy / NINE_VB.h - 0.5) * H9;
        const c = pts[best];
        const mx = (c.x + tx) / 2;
        const my = (c.y + ty) / 2;
        const len = Math.hypot(tx - c.x, ty - c.y) || 1;
        // bow the arc away from the 9 so it reads as a bridge, not a line across the glyph
        const bow = Math.min(90, len * 0.32);
        let qx = mx - ((ty - c.y) / len) * bow;
        let qy = my + ((tx - c.x) / len) * bow;
        if (Math.hypot(qx - cx, qy - cy) < Math.hypot(mx - cx, my - cy)) {
          qx = 2 * mx - qx;
          qy = 2 * my - qy;
        }
        const d = `M${c.x.toFixed(1)} ${c.y.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
        for (const el of arcRefs.current) el?.setAttribute("d", d);
        const on = settled && introDone && fxv.fade > 0.6;
        if (on !== s.arcOn) {
          s.arcOn = on;
          arcGroup.current.dataset.on = on ? "true" : "false";
        }
      }

      if (best !== s.active) {
        s.active = best;
        onActiveRef.current(best);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [fx, glide]);

  // --- pointer: drag / swipe with inertia ------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    st.current.pointer = e.pointerType;
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
        s.tween = null;
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
      if (Math.abs(s.vel) <= 0.0004) glide(FRONT + Math.round((s.rot - FRONT) / STEP) * STEP, 600);
      s.holdUntil = performance.now() + 2500 + HOLD;
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
      <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible" aria-hidden="true">
        <ellipse ref={ringBack} fill="none" stroke="white" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="2 7" style={{ opacity: 0 }} />
      </svg>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">{children}</div>

      <svg className="pointer-events-none absolute inset-0 z-[15] h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="orbit-front" x1="0" x2="1">
            <stop offset="0" style={{ stopColor: "var(--nl-blue)" }} stopOpacity="0.1" />
            <stop offset="0.5" style={{ stopColor: "var(--nl-purple)" }} stopOpacity="0.6" />
            <stop offset="1" style={{ stopColor: "var(--nl-blue)" }} stopOpacity="0.1" />
          </linearGradient>
          <filter id="bridge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <path ref={ringFront} fill="none" stroke="url(#orbit-front)" strokeWidth="1.2" style={{ opacity: 0 }} />
        <g ref={arcGroup} className="bridge-arc" data-on="false">
          {[
            { cls: "bridge-line", stroke: "var(--nl-purple)", w: 5, op: 0.35, filter: "url(#bridge-glow)" },
            { cls: "bridge-line", stroke: "var(--nl-purple)", w: 1.2, op: 0.9 },
            { cls: "bridge-dot", stroke: "#f1e8ff", w: 4, op: 1, filter: undefined },
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
                const st0 = st.current;
                if (st0.suppressClick) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                // Touch: the first tap brings the item to the front, the second opens it.
                if (st0.pointer !== "mouse" && i !== st0.active) {
                  e.preventDefault();
                  e.stopPropagation();
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
                  st.current.holdUntil = Math.max(st.current.holdUntil, performance.now() + 900);
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
