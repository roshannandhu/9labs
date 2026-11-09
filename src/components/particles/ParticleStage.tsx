"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { digits as digitFont } from "@/lib/fonts";
import { useDemo } from "@/components/providers/DemoSettings";
import { onIntroDone } from "@/components/intro/introBus";
import { particleBus } from "./bus";
import { digitShape, GLYPH_SIZE, rng, type Shape } from "./targets";

// The logo's gradient across every number: purple (left) → cyan (right).
const FROM = [0x8c, 0x53, 0xfe];
const TO = [0x5c, 0xe0, 0xe6];
const STEPS = 16;
const hex = (c: number[]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
/** colours[edge 0|1][step]: the outline a touch brighter (dark) / deeper (light) for a crisp edge */
const colours = (dark: boolean) =>
  [0, 1].map((edge) =>
    Array.from({ length: STEPS }, (_, k) => {
      const c = mix(FROM, TO, k / (STEPS - 1));
      return hex(edge ? (dark ? mix(c, [255, 255, 255], 0.3) : mix(c, [40, 20, 120], 0.18)) : c);
    }),
  );

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Hold each number for the first and last ~22% of a step, morph in the middle — so every digit is readable. */
const plateau = (f: number) => {
  const u = clamp01((f - 0.22) / 0.56);
  return u * u * (3 - 2 * u);
};
const SLOTS = ["hero", "stage", "finale"] as const;
type SlotName = (typeof SLOTS)[number];
const slotOf = (k: number): SlotName => (k === 0 ? "hero" : k >= 10 ? "finale" : "stage");
const digitOf = (k: number) => (k === 0 || k >= 10 ? "9" : String(k));

/**
 * The particle numbers. One swarm assembles the hero 9 (after the landing animation), then —
 * driven only by scroll — splits and re-forms 1, 2 … 9 in the services stage, and finally a small
 * 9 above the "all nine" grid.
 *
 * Two layers, so a number never jitters:
 * - **Formed** (at rest): a solid, crisp glyph drawn on a small canvas that lives *inside* its
 *   slot in the page — it scrolls natively with the content, on every device.
 * - **Moving** (splitting / re-forming): ~12,000 particles (~6,000 on phones) on one fixed
 *   full-screen canvas, drawn on GSAP's ticker right after Lenis has scrolled, so the positions
 *   it reads are always this frame's. The two cross-fade while the particles sit exactly on the
 *   glyph, so the hand-over is seamless. Nothing is drawn while a number simply sits there.
 * Particles are batched by colour (a few fillStyle changes per frame, not thousands); a device
 * that can't keep up in the first second quietly draws 60% of them.
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
    const N = phone ? 6000 : 12000;
    const r = rng(9001);

    // assembly: each particle streams in from a point just beyond a screen edge
    const sx = new Float32Array(N);
    const sy = new Float32Array(N);
    const delay = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const side = Math.floor(r() * 4);
      const along = r() * 1.2 - 0.1;
      sx[i] = side === 0 ? -0.08 : side === 1 ? 1.08 : along;
      sy[i] = side === 2 ? -0.08 : side === 3 ? 1.08 : along;
      delay[i] = r() * 0.45;
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
    const pal = { dark: colours(true), light: colours(false) };
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const bucket = new Uint8Array(N);
    const order = new Uint16Array(N);
    const counts = new Int32Array(STEPS * 2 + 1);

    let thin = false;
    let probe = 0;
    let probeSum = 0;
    let lastT = 0;
    let shapes: (Shape | undefined)[] = [];
    let started = false;
    let t0 = 0;
    let visible = true;
    let dirty = false; // the fixed canvas has particles on it
    let dpr = 1;
    let W = 0;
    let H = 0;
    let family = "";

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

    // the solid glyph layer: one small canvas inside each slot
    const rest = new Map<SlotName, { el: HTMLElement; c: HTMLCanvasElement; g: CanvasRenderingContext2D; key: string; op: number }>();
    for (const name of SLOTS) {
      const el = document.querySelector<HTMLElement>(`[data-particle-slot="${name}"]`);
      const c = document.createElement("canvas");
      const g = c.getContext("2d");
      if (!el || !g) continue;
      c.setAttribute("aria-hidden", "true");
      c.style.cssText = "position:absolute;left:50%;top:50%;pointer-events:none;opacity:0;transform:translate(-50%,-50%)";
      el.appendChild(c);
      rest.set(name, { el, c, g, key: "", op: 0 });
    }
    const drawGlyph = (name: SlotName, ch: string, side: number) => {
      const s = rest.get(name);
      if (!s) return;
      const px2 = Math.max(2, Math.round(side * dpr));
      const key = `${ch}|${px2}`;
      if (s.key === key) return;
      s.key = key;
      s.c.width = px2;
      s.c.height = px2;
      s.c.style.width = `${side}px`;
      s.c.style.height = `${side}px`;
      const g = s.g;
      g.clearRect(0, 0, px2, px2);
      g.font = `900 ${Math.round(px2 * GLYPH_SIZE)}px ${family}`;
      g.textAlign = "center";
      g.textBaseline = "alphabetic";
      const m = g.measureText(ch);
      const grad = g.createLinearGradient(px2 / 2 - m.actualBoundingBoxLeft, 0, px2 / 2 + m.actualBoundingBoxRight, 0);
      grad.addColorStop(0, hex(FROM));
      grad.addColorStop(1, hex(TO));
      g.fillStyle = grad;
      g.fillText(ch, px2 / 2, px2 / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    };
    const setOpacity = (name: SlotName, op: number) => {
      const s = rest.get(name);
      if (!s) return;
      const v = Math.round(op * 100) / 100;
      if (v === s.op) return;
      s.op = v;
      s.c.style.opacity = String(v);
    };

    // the digit's height in a slot: as tall as the slot allows, but never wider than the slot
    const box = (b: DOMRect, s: Shape) => ({ cx: b.left + b.width / 2, cy: b.top + b.height / 2, h: Math.min(b.height * 0.9, (b.width * 0.94) / s.wr) });

    const frame = () => {
      if (!started || !visible || document.hidden) return;
      const now = performance.now();
      const t = Math.max(0, Math.min(10, particleBus.t));
      const k = Math.min(9, Math.floor(t));
      const f = t - k;
      const u = plateau(f);
      const ea = rest.get(slotOf(k))?.el;
      const eb = rest.get(slotOf(k + 1))?.el;
      const SA = shapes[k];
      if (!ea || !eb || !SA) return; // that digit is still being sampled (a few ms after load)
      const SB = shapes[k + 1] ?? SA;
      const ra = ea.getBoundingClientRect();
      const rb = eb.getBoundingClientRect();
      const A = box(ra, SA);
      const B = box(rb, SB);

      // how "formed" the number is: 1 while the particles sit exactly on a digit, 0 once they move
      const nearB = f >= 0.5;
      const m = nearB ? 1 - f : f;
      const formed = (1 - clamp01((m - 0.06) / 0.14)) * clamp01((now - t0 - 1700) / 450);
      const restSlot = slotOf(nearB ? k + 1 : k);
      const RB = nearB ? B : A;
      const RS = nearB ? SB : SA;
      drawGlyph(restSlot, digitOf(nearB ? k + 1 : k), RB.h / RS.hr);
      for (const name of SLOTS) setOpacity(name, name === restSlot ? formed : 0);

      // particles: only while the number is moving
      if (dirty) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        dirty = false;
      }
      const alpha = 1 - formed;
      const away = (b: DOMRect) => b.bottom < -H * 0.6 || b.top > H * 1.6 || b.width === 0;
      if (alpha < 0.01 || (away(ra) && away(rb))) return;

      const sc = scatter[k];
      const spread = Math.max(A.h, B.h) * 0.42;
      const h = A.h + (B.h - A.h) * u;
      const size = Math.max(1.2, Math.min(phone ? 2.4 : 2.8, h * (phone ? 0.0085 : 0.005)));
      const asm = clamp01((now - t0) / 1700);
      const v = 1 - u;
      if (asm >= 1 && formed < 0.5 && probe < 40) {
        if (lastT) {
          probeSum += now - lastT;
          if (++probe === 40 && probeSum / 40 > 24) thin = true;
        }
        lastT = now;
      }

      counts.fill(0);
      for (let i = 0; i < N; i++) {
        if (thin && i % 5 > 2) {
          bucket[i] = STEPS * 2;
          continue;
        }
        const ax = A.cx + SA.x[i] * A.h;
        const ay = A.cy + SA.y[i] * A.h;
        const bx = B.cx + SB.x[i] * B.h;
        const by = B.cy + SB.y[i] * B.h;
        const mx = (ax + bx) / 2 + sc.dx[i] * spread;
        const my = (ay + by) / 2 + sc.dy[i] * spread;
        let x = v * v * ax + 2 * v * u * mx + u * u * bx;
        let y = v * v * ay + 2 * v * u * my + u * u * by;
        if (asm < 1) {
          const p = clamp01(asm * 1.5 - delay[i]);
          const e = 1 - (1 - p) * (1 - p) * (1 - p);
          x = sx[i] * W + (x - sx[i] * W) * e;
          y = sy[i] * H + (y - sy[i] * H) * e;
        }
        px[i] = x;
        py[i] = y;
        const edge = SA.e[i] * v + SB.e[i] * u > 0.75 ? 1 : 0;
        const b = edge * STEPS + Math.min(STEPS - 1, Math.round((SA.g[i] * v + SB.g[i] * u) * (STEPS - 1)));
        bucket[i] = b;
        counts[b]++;
      }
      // counting sort by colour, then one fillStyle per colour
      let acc = 0;
      const start = new Int32Array(STEPS * 2 + 1);
      for (let b = 0; b <= STEPS * 2; b++) {
        start[b] = acc;
        acc += counts[b];
      }
      const fill = start.slice();
      for (let i = 0; i < N; i++) if (bucket[i] < STEPS * 2) order[fill[bucket[i]]++] = i;

      const cols = document.documentElement.dataset.theme === "dark" ? pal.dark : pal.light;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = alpha;
      const half = size / 2;
      for (let b = 0; b < STEPS * 2; b++) {
        const n0 = start[b];
        const n1 = n0 + counts[b];
        if (n1 === n0) continue;
        ctx.fillStyle = cols[b >= STEPS ? 1 : 0][b % STEPS];
        for (let j = n0; j < n1; j++) {
          const i = order[j];
          ctx.fillRect(px[i] - half, py[i] - half, size, size);
        }
      }
      ctx.globalAlpha = 1;
      dirty = true;
    };

    // Only run while the hero or the services stage is near the screen.
    const watched = ["home", "services"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target, e.isIntersecting);
        visible = [...seen.values()].some(Boolean);
        if (!visible) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, cv.width, cv.height);
          dirty = false;
        }
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    watched.forEach((el) => io.observe(el));

    let cancelled = false;
    const offIntro = onIntroDone(async () => {
      family = digitFont.style.fontFamily;
      try {
        await document.fonts.load(`900 120px ${family}`);
      } catch {
        /* fall back to whatever face is available */
      }
      if (cancelled) return;
      // the hero 9 first (it's on screen now); the other digits one per tick, so the page never stalls
      const nine = digitShape("9", N, family);
      shapes = [nine];
      shapes[9] = nine;
      shapes[10] = nine;
      started = true;
      t0 = performance.now();
      for (let dgt = 1; dgt <= 8; dgt++) {
        await new Promise((res) => setTimeout(res, 0));
        if (cancelled) return;
        shapes[dgt] = digitShape(String(dgt), N, family);
      }
    });
    // after Lenis (also on GSAP's ticker), so slot positions are this frame's
    gsap.ticker.add(frame);

    return () => {
      cancelled = true;
      offIntro();
      gsap.ticker.remove(frame);
      io.disconnect();
      window.removeEventListener("resize", resize);
      for (const s of rest.values()) s.c.remove();
    };
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[5]" aria-hidden="true" />;
}
