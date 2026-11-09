"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { digits as digitFont } from "@/lib/fonts";
import { useDemo } from "@/components/providers/DemoSettings";
import { onIntroDone } from "@/components/intro/introBus";
import { palette, swatchTable, nearestSwatch, type SwatchTable } from "./palette";
import { digitShape, pictureShape, rng, type Shape } from "./targets";
import { PICTURES } from "./pictures";
import { particleBus, heroTarget, digitTarget, sameTarget, fireStageReached, type ParticleTarget } from "./bus";
import type { IconKey } from "@/content/site";

const SLOTS = ["hero", "stage"] as const;
type SlotName = (typeof SLOTS)[number];
const slotFor = (t: ParticleTarget): SlotName => (t.kind === "hero" ? "hero" : "stage");
const isDark = () => document.documentElement.dataset.theme === "dark";
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
// how far into a flight the "landing" content still shows (fades out) / the "arriving" content
// starts to show (fades in) — zero particles the rest of the time, as requested: the swarm is
// only ever visible while actually transforming between two shapes.
const EDGE = 0.09;
const earlyOp = (u: number) => (u < EDGE ? 1 - u / EDGE : 0);
const lateOp = (u: number) => (u > 1 - EDGE ? (u - (1 - EDGE)) / EDGE : 0);

/**
 * The one particle swarm. It assembles the hero 9 (after the landing animation), flies down into
 * the Services Showcase as you scroll to it, and from then on is driven entirely by the Showcase
 * (`Services.tsx`, via `bus.ts`'s `goto()`/`snapTo()`): it flies between a digit (1-9), a service
 * picture, and the finale "all nine" 9, on tap or on an auto-play timer — never by scroll.
 *
 * Two layers, so nothing ever looks like dust once it has landed:
 * - **Formed** (at rest): a crisp picture or digit, drawn at full detail *inside* its slot in the
 *   page (so it scrolls natively, no jitter). A service picture keeps being redrawn every frame
 *   with real time, so its own small details live (hearts float, a flash fires, lights sweep);
 *   a digit is drawn once and left still. The swarm itself draws **nothing** while a shape is at
 *   rest — only while flying between two shapes.
 * - **Moving** (flying): ~13,000 particles (~7,000 on phones) on one fixed full-screen canvas,
 *   each carrying its source and target colour (from the shared palette, `palette.ts`) and flying
 *   a bowed path — bowed to one consistent side (a vortex, not a scramble), the direction set by
 *   which way the Showcase is navigating. A device that can't keep up in the first second quietly
 *   draws 60% of them.
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
    const N = phone ? 7000 : 13000;
    const r = rng(9001);

    // assembly: each particle streams in from a point just beyond a screen edge (hero forming, once)
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
    // one swirl "bow" magnitude + organic jitter per particle, shared by every flight
    const bow = new Float32Array(N);
    const jitX = new Float32Array(N);
    const jitY = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      bow[i] = 0.55 + r() * 0.75;
      const a = r() * Math.PI * 2;
      jitX[i] = Math.cos(a);
      jitY[i] = Math.sin(a);
    }
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const bucket = new Uint16Array(N);
    const order = new Uint32Array(N);

    let thin = false;
    let probe = 0;
    let probeSum = 0;
    let lastT = 0;
    let started = false;
    let heroT0 = 0;
    let visible = true;
    let dirty = false;
    let dpr = 1;
    let family = "";

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = window.innerWidth;
      const H = window.innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    // the two crisp "formed" layers: one small canvas inside each slot
    const rest = new Map<
      SlotName,
      { el: HTMLElement; c: HTMLCanvasElement; g: CanvasRenderingContext2D; key: string; op: number; liveT0: number }
    >();
    for (const name of SLOTS) {
      const el = document.querySelector<HTMLElement>(`[data-particle-slot="${name}"]`);
      const c = document.createElement("canvas");
      const g = c.getContext("2d");
      if (!el || !g) continue;
      c.setAttribute("aria-hidden", "true");
      c.style.cssText = "position:absolute;left:50%;top:50%;pointer-events:none;opacity:0;transform:translate(-50%,-50%)";
      el.appendChild(c);
      rest.set(name, { el, c, g, key: "", op: -1, liveT0: performance.now() });
    }
    const slotRect = (name: SlotName) => rest.get(name)?.el.getBoundingClientRect();

    const drawFormed = (name: SlotName, target: ParticleTarget, pal: ReturnType<typeof palette>) => {
      const s = rest.get(name);
      const b = slotRect(name);
      if (!s || !b || b.height <= 0) return;
      const side = Math.min(b.height * 0.9, b.width * 0.94);
      const px2 = Math.max(2, Math.round(side * dpr));
      if (target.kind === "pic") {
        // always redrawn, so its small details can move
        s.c.width = px2;
        s.c.height = px2;
        s.c.style.width = `${side}px`;
        s.c.style.height = `${side}px`;
        if (s.key !== `pic|${target.icon}`) {
          s.key = `pic|${target.icon}`;
          s.liveT0 = performance.now();
        }
        s.g.clearRect(0, 0, px2, px2);
        PICTURES[target.icon](s.g, px2, pal, (performance.now() - s.liveT0) / 1000);
        return;
      }
      const ch = target.kind === "digit" ? target.ch : "9";
      const key = `d|${ch}|${px2}|${pal.textFrom}`;
      if (s.key === key) return;
      s.key = key;
      s.c.width = px2;
      s.c.height = px2;
      s.c.style.width = `${side}px`;
      s.c.style.height = `${side}px`;
      const g = s.g;
      g.clearRect(0, 0, px2, px2);
      g.font = `900 ${Math.round(px2 * 0.78)}px ${family}`;
      g.textAlign = "center";
      g.textBaseline = "alphabetic";
      const m = g.measureText(ch);
      const grad = g.createLinearGradient(px2 / 2 - m.actualBoundingBoxLeft, 0, px2 / 2 + m.actualBoundingBoxRight, 0);
      grad.addColorStop(0, pal.textFrom);
      grad.addColorStop(1, pal.textTo);
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

    // a shape's height in its slot: as tall as the slot allows, but never wider than the slot
    const box = (b: DOMRect, s: Shape) => ({ cx: b.left + b.width / 2, cy: b.top + b.height / 2, h: Math.min(b.height * 0.9, (b.width * 0.94) / s.wr) });

    const shapeFor = (t: ParticleTarget, dark: boolean): Shape => {
      if (t.kind === "digit") return digitShape(t.ch, N, family, dark);
      if (t.kind === "pic") return pictureShape(t.icon, N, PICTURES[t.icon as IconKey], dark);
      return digitShape("9", N, family, dark); // hero + all9 are both just "9"
    };

    let curFromKey = "";
    let curToKey = "";
    let SA: Shape | null = null;
    let SB: Shape | null = null;
    let curDark = isDark();
    let table: SwatchTable = swatchTable(palette(curDark));

    const frame = () => {
      if (!started || !visible || document.hidden) return;
      const now = performance.now();
      const dark = isDark();
      if (dark !== curDark) {
        curDark = dark;
        table = swatchTable(palette(dark));
        curFromKey = "";
        curToKey = ""; // force shape re-sample at the new theme's colours
      }
      const pal = palette(dark);
      const { from, to, u, dir } = particleBus;
      const resting = sameTarget(from, to);

      // the formed layers (always on: hero is static, the stage keeps living while resting)
      if (resting) {
        drawFormed("hero", heroTarget, pal);
        setOpacity("hero", 1);
        drawFormed("stage", to, pal);
        setOpacity("stage", 1);
      } else {
        const showFrom = u < 0.5;
        const heroInvolved = from.kind === "hero" || to.kind === "hero";
        drawFormed("hero", heroTarget, pal);
        setOpacity("hero", heroInvolved ? (showFrom ? earlyOp(u) : lateOp(u)) : 1);
        const stageContent = showFrom ? from : to;
        if (stageContent.kind === "hero") {
          setOpacity("stage", 0);
        } else {
          drawFormed("stage", stageContent, pal);
          setOpacity("stage", showFrom ? earlyOp(u) : lateOp(u));
        }
      }

      // the particles: only while flying
      if (dirty) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        dirty = false;
      }
      if (resting) return;
      const dustAlpha = 1 - earlyOp(u) - lateOp(u);
      if (dustAlpha < 0.015) return;

      const fromKey = `${from.kind}${"ch" in from ? from.ch : ""}${"icon" in from ? from.icon : ""}`;
      const toKey = `${to.kind}${"ch" in to ? to.ch : ""}${"icon" in to ? to.icon : ""}`;
      if (fromKey !== curFromKey) {
        curFromKey = fromKey;
        SA = shapeFor(from, dark);
      }
      if (toKey !== curToKey) {
        curToKey = toKey;
        SB = shapeFor(to, dark);
      }
      if (!SA || !SB) return;
      const ra = slotRect(slotFor(from));
      const rb = slotRect(slotFor(to));
      if (!ra || !rb) return;
      const A = box(ra, SA);
      const B = box(rb, SB);
      const H = window.innerHeight;
      const away = (b: DOMRect) => b.bottom < -H * 0.6 || b.top > H * 1.6 || b.width === 0;
      if (away(ra) && away(rb)) return;

      const lx = B.cx - A.cx;
      const ly = B.cy - A.cy;
      const len = Math.hypot(lx, ly) || 1;
      const perpX = -ly / len;
      const perpY = lx / len;
      const spread = Math.max(A.h, B.h) * 0.42;
      const v = 1 - u;
      const asm = clamp01((now - heroT0) / 1700);

      if (asm >= 1 && probe < 40) {
        if (lastT) {
          probeSum += now - lastT;
          if (++probe === 40 && probeSum / 40 > 24) thin = true;
        }
        lastT = now;
      }

      const PN = table.hex.length;
      const counts = new Int32Array(PN + 1);
      const W = window.innerWidth;
      for (let i = 0; i < N; i++) {
        if (thin && i % 5 > 2) {
          bucket[i] = PN;
          counts[PN]++;
          continue;
        }
        const ax = A.cx + SA.x[i] * A.h;
        const ay = A.cy + SA.y[i] * A.h;
        const bx = B.cx + SB.x[i] * B.h;
        const by = B.cy + SB.y[i] * B.h;
        const depth = 0.5 + SA.z[i] * 0.25 + SB.z[i] * 0.25;
        const bowAmt = dir * spread * bow[i] * depth;
        const mx = (ax + bx) / 2 + perpX * bowAmt + jitX[i] * spread * 0.16;
        const my = (ay + by) / 2 + perpY * bowAmt + jitY[i] * spread * 0.16;
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
        const ca = table.rgb[SA.swatch[i]];
        const cbb = table.rgb[SB.swatch[i]];
        const cr = ca[0] + (cbb[0] - ca[0]) * u;
        const cg = ca[1] + (cbb[1] - ca[1]) * u;
        const cbl = ca[2] + (cbb[2] - ca[2]) * u;
        const bIdx = nearestSwatch(table, cr, cg, cbl);
        bucket[i] = bIdx;
        counts[bIdx]++;
      }
      let acc = 0;
      const start = new Int32Array(PN + 1);
      for (let b = 0; b <= PN; b++) {
        start[b] = acc;
        acc += counts[b];
      }
      const fill = start.slice();
      for (let i = 0; i < N; i++) if (bucket[i] < PN) order[fill[bucket[i]]++] = i;

      const size = Math.max(1.1, Math.min(phone ? 2.4 : 2.8, (A.h + (B.h - A.h) * u) * (phone ? 0.0085 : 0.005)));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = dustAlpha;
      const half = size / 2;
      for (let b = 0; b < PN; b++) {
        const n0 = start[b];
        const n1 = n0 + counts[b];
        if (n1 === n0) continue;
        ctx.fillStyle = table.hex[b];
        for (let j = n0; j < n1; j++) {
          const i = order[j];
          ctx.fillRect(px[i] - half, py[i] - half, size, size);
        }
      }
      ctx.globalAlpha = 1;
      dirty = true;
    };

    // only run while the hero or the Showcase is near the screen
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
      const dark = isDark();
      started = true;
      heroT0 = performance.now();
      digitShape("9", N, family, dark); // the hero, needed immediately
      const steps: ParticleTarget[] = [];
      for (let i = 1; i <= 9; i++) steps.push(digitTarget(i));
      for (const icon of Object.keys(PICTURES) as IconKey[]) steps.push({ kind: "pic", icon });
      for (const step of steps) {
        await new Promise((res) => setTimeout(res, 0));
        if (cancelled) return;
        shapeFor(step, dark);
      }
    });
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

  // the scroll hand-off: the hero 9 flies down into the Showcase stage as you scroll to it, then
  // control passes to the Showcase itself (Services.tsx, via bus.ts's goto()/snapTo())
  const handedOff = useRef(false);
  useGSAP(() => {
    if (reduced) return;
    const stage = document.querySelector('[data-particle-slot="stage"]');
    if (!stage) return;
    ScrollTrigger.create({
      trigger: "#home",
      start: "top top",
      endTrigger: stage,
      end: "top top",
      onUpdate: (s) => {
        if (handedOff.current) return;
        particleBus.from = heroTarget;
        particleBus.to = digitTarget(1);
        particleBus.dir = 1;
        particleBus.u = s.progress;
        if (s.progress >= 0.999) {
          handedOff.current = true;
          particleBus.from = digitTarget(1);
          fireStageReached();
        }
      },
      onRefresh: (s) => {
        if (handedOff.current) return;
        particleBus.from = heroTarget;
        particleBus.to = digitTarget(1);
        particleBus.u = s.progress;
      },
    });
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[15]" aria-hidden="true" />;
}
