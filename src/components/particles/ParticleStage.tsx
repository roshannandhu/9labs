"use client";

import { useEffect, useRef } from "react";
import { brand } from "@/lib/fonts";
import { useDemo } from "@/components/providers/DemoSettings";
import { onIntroDone } from "@/components/intro/introBus";
import { particleBus } from "./bus";
import { digitShape, rng, type Shape } from "./targets";

// The brief's colours for the 9: electric-blue body, neon purple towards the edges.
const BLUE = "#3b82ff";
const MID = "#7f86ff";
const PURPLE = "#b98cff";

function sprite(color: string, size = 32) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(0.16, color);
  grd.addColorStop(0.42, `${color}66`);
  grd.addColorStop(1, `${color}00`);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Hold each number for the first and last ~22% of a step, morph in the middle — so every digit is readable. */
const plateau = (f: number) => {
  const u = clamp01((f - 0.22) / 0.56);
  return u * u * (3 - 2 * u);
};

/**
 * One fixed canvas behind the content. A single swarm of particles: it assembles the hero 9
 * (after the landing animation), then — driven only by scroll — splits and re-forms 1, 2 … 9 in
 * the services stage, and finally a small 9 above the "all nine" grid.
 *
 * Particles fly between DOM "slots" ([data-particle-slot]), measured every frame, so layout,
 * breakpoints and pinning stay in CSS. Positions are a pure function of the scroll position
 * (reversible: scrolling back re-forms the earlier number). No mouse/touch reaction by design.
 * Cost: one 2D canvas, 2,200 particles (1,400 on phones), DPR ≤ 2, paused off-screen.
 */
export function ParticleStage() {
  const { reduced } = useDemo();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const phone = window.matchMedia("(max-width: 639px)").matches;
    const N = phone ? 1400 : 2200;
    const r = rng(9001);

    // assembly: each particle streams in from a point just beyond a screen edge
    const sx = new Float32Array(N);
    const sy = new Float32Array(N);
    const delay = new Float32Array(N);
    const phase = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const side = Math.floor(r() * 4);
      const along = r() * 1.2 - 0.1;
      sx[i] = side === 0 ? -0.08 : side === 1 ? 1.08 : along;
      sy[i] = side === 2 ? -0.08 : side === 3 ? 1.08 : along;
      delay[i] = r() * 0.45;
      phase[i] = r() * Math.PI * 2;
    }
    // one scatter direction per particle per transition (the "split")
    const scatter = Array.from({ length: 10 }, () => {
      const dx = new Float32Array(N);
      const dy = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const a = r() * Math.PI * 2;
        const m = 0.35 + r() * 0.65;
        dx[i] = Math.cos(a) * m;
        dy[i] = Math.sin(a) * m;
      }
      return { dx, dy };
    });
    const sprites = [sprite(BLUE), sprite(MID), sprite(PURPLE)];

    let shapes: Shape[] = [];
    let raf = 0;
    let started = false;
    let t0 = 0;
    let visible = true;
    let dpr = 1;
    let W = 0;
    let H = 0;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const slotEl = (k: number) =>
      document.querySelector<HTMLElement>(`[data-particle-slot="${k === 0 ? "hero" : k >= 10 ? "finale" : "stage"}"]`);
    const box = (b: DOMRect) => ({ cx: b.left + b.width / 2, cy: b.top + b.height / 2, h: Math.min(b.height * 0.9, b.width * 1.3) });

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!started || !visible || document.hidden) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const t = Math.max(0, Math.min(10, particleBus.t));
      const k = Math.min(9, Math.floor(t));
      const u = plateau(t - k);
      const ea = slotEl(k);
      const eb = slotEl(k + 1);
      if (!ea || !eb) return;
      const ra = ea.getBoundingClientRect();
      const rb = eb.getBoundingClientRect();
      const away = (b: DOMRect) => b.bottom < -H * 0.6 || b.top > H * 1.6 || b.width === 0;
      if (away(ra) && away(rb)) return;

      const A = box(ra);
      const B = box(rb);
      const SA = shapes[k];
      const SB = shapes[k + 1];
      const sc = scatter[k];
      const spread = Math.max(A.h, B.h) * 0.42;
      const h = A.h + (B.h - A.h) * u;
      const size = Math.max(3, Math.min(phone ? 8 : 9, h * (phone ? 0.024 : 0.018)));
      const half = size / 2;
      const asm = clamp01((now - t0) / 1700);
      const v = 1 - u;
      const tw = now * 0.0016;

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const ax = A.cx + SA.x[i] * A.h;
        const ay = A.cy + SA.y[i] * A.h;
        const bx = B.cx + SB.x[i] * B.h;
        const by = B.cy + SB.y[i] * B.h;
        const mx = (ax + bx) / 2 + sc.dx[i] * spread;
        const my = (ay + by) / 2 + sc.dy[i] * spread;
        let x = v * v * ax + 2 * v * u * mx + u * u * bx;
        let y = v * v * ay + 2 * v * u * my + u * u * by;
        if (asm < 1) {
          const p = clamp01((asm * 1.5 - delay[i]) / 1);
          const e = 1 - (1 - p) * (1 - p) * (1 - p);
          x = sx[i] * W + (x - sx[i] * W) * e;
          y = sy[i] * H + (y - sy[i] * H) * e;
        }
        const edge = SA.e[i] * v + SB.e[i] * u;
        ctx.globalAlpha = 0.72 + 0.22 * Math.sin(tw + phase[i]);
        ctx.drawImage(sprites[edge > 0.7 ? 2 : edge > 0.25 ? 1 : 0], x - half, y - half, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // Only run while the hero or the services stage is near the screen.
    const watched = ["home", "services"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target, e.isIntersecting);
        visible = [...seen.values()].some(Boolean);
        if (!visible) ctx.clearRect(0, 0, cv.width, cv.height);
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    watched.forEach((el) => io.observe(el));

    let cancelled = false;
    const offIntro = onIntroDone(async () => {
      const family = brand.style.fontFamily;
      try {
        await document.fonts.load(`900 120px ${family}`);
      } catch {
        /* fall back to whatever face is available */
      }
      if (cancelled) return;
      const digits = Array.from({ length: 9 }, (_, d) => digitShape(String(d + 1), N, family));
      shapes = [digits[8], ...digits, digits[8]];
      started = true;
      t0 = performance.now();
    });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      offIntro();
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[5]" aria-hidden="true" />;
}
