"use client";

import { useEffect, useRef } from "react";
import { digits as digitFont } from "@/lib/fonts";
import { useDemo } from "@/components/providers/DemoSettings";
import { onIntroDone } from "@/components/intro/introBus";
import { particleBus } from "./bus";
import { digitShape, rng, type Shape } from "./targets";

// The logo's gradient across every number: purple (left) → cyan (right).
const FROM = [0x8c, 0x53, 0xfe];
const TO = [0x5c, 0xe0, 0xe6];
const STEPS = 16;
const hex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

/** A fine dot: crisp core, short soft edge. Dark theme gets a touch more halo. */
function sprite(color: string, dark: boolean, size = 16) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, color);
  grd.addColorStop(dark ? 0.45 : 0.6, color);
  grd.addColorStop(dark ? 0.7 : 0.8, `${color}66`);
  grd.addColorStop(1, `${color}00`);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}
/** sprites[theme][edge 0|1][gradient step] */
function sprites(dark: boolean) {
  return [0, 1].map((edge) =>
    Array.from({ length: STEPS }, (_, k) => {
      let col = mix(FROM, TO, k / (STEPS - 1));
      // the outline reads a little brighter (dark) / deeper (light), so each number has a crisp edge
      if (edge) col = dark ? mix(col, [255, 255, 255], 0.3) : mix(col, [40, 20, 120], 0.18);
      return sprite(hex(col), dark);
    }),
  );
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
 * Cost: one 2D canvas, ~6,000 fine particles (~3,000 on phones), DPR ≤ 2, paused off-screen;
 * if a device can't keep up in the first second, it quietly draws 60% of them.
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
    const N = phone ? 3000 : 6000;
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
    const sets = { dark: sprites(true), light: sprites(false) };
    // adaptive quality: sample the first ~40 drawn frames; thin out if they're slow
    let thin = false;
    let probe = 0;
    let probeSum = 0;
    let last = 0;

    let shapes: (Shape | undefined)[] = [];
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
      if (!SA) return; // that digit is still being sampled (a few ms after load)
      const SB = shapes[k + 1] ?? SA;
      const sc = scatter[k];
      const spread = Math.max(A.h, B.h) * 0.42;
      const h = A.h + (B.h - A.h) * u;
      const size = Math.max(1.6, Math.min(phone ? 3 : 3.4, h * (phone ? 0.0125 : 0.0068)));
      const asm = clamp01((now - t0) / 1700);
      const v = 1 - u;
      const tw = now * 0.0016;
      const dark = document.documentElement.dataset.theme === "dark";
      const set = dark ? sets.dark : sets.light;
      if (asm >= 1 && probe < 40) {
        if (last) {
          probeSum += now - last;
          if (++probe === 40 && probeSum / 40 > 24) thin = true;
        }
        last = now;
      }

      for (let i = 0; i < N; i++) {
        if (thin && i % 5 > 2) continue;
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
        const g = SA.g[i] * v + SB.g[i] * u;
        ctx.globalAlpha = (edge > 0.5 ? 0.95 : 0.8) + 0.05 * Math.sin(tw + phase[i]);
        const s = edge > 0.75 ? size * 1.08 : size;
        ctx.drawImage(set[edge > 0.75 ? 1 : 0][Math.min(STEPS - 1, Math.round(g * (STEPS - 1)))], x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
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
      const family = digitFont.style.fontFamily;
      try {
        await document.fonts.load(`900 120px ${family}`);
      } catch {
        /* fall back to whatever face is available */
      }
      if (cancelled) return;
      // the hero 9 first (it's on screen now); the other digits one per tick, so the page never stalls
      const nine = digitShape("9", N, family);
      shapes = [nine];
      shapes[10] = nine;
      shapes[9] = nine;
      started = true;
      t0 = performance.now();
      for (let dgt = 1; dgt <= 8; dgt++) {
        await new Promise((res) => setTimeout(res, 0));
        if (cancelled) return;
        shapes[dgt] = digitShape(String(dgt), N, family);
      }
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
