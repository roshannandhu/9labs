"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { digits as digitFont } from "@/lib/fonts";
import { useDemo } from "@/components/providers/DemoSettings";
import { onIntroDone } from "@/components/intro/introBus";
import { palette, colorKey, KEY_HEX, COLOR_KEYS } from "./palette";
import { digitShape, pictureShape, rng, type Shape } from "./targets";
import { PICTURES } from "./pictures";
import { particleBus, heroTarget, allNineTarget, picTarget, sameTarget, targetKey, type ParticleTarget } from "./bus";
import { site, type IconKey } from "@/content/site";

const SLOTS = ["hero", "stage-1", "stage-2", "stage-3", "stage-4", "stage-5", "stage-6", "stage-7", "stage-8", "stage-9", "finale"] as const;
type SlotName = (typeof SLOTS)[number];
/** each service card has its own slot (`stage-<n>`) */
const STAGES = site.services.map((s) => ({ name: `stage-${s.n}` as SlotName, pic: picTarget(s.icon) }));
const ICON_SLOT = new Map<IconKey, SlotName>(site.services.map((s) => [s.icon, `stage-${s.n}` as SlotName]));
const slotFor = (t: ParticleTarget): SlotName => (t.kind === "hero" ? "hero" : t.kind === "all9" ? "finale" : (ICON_SLOT.get(t.icon) ?? "stage-1"));
const isDark = () => document.documentElement.dataset.theme === "dark";
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
// how far into a flight the "landing" content still shows (fades out) / the "arriving" content
// starts to show (fades in) — zero particles the rest of the time: the swarm is only ever visible
// while actually transforming between two shapes.
const EDGE = 0.09;
const earlyOp = (u: number) => (u < EDGE ? 1 - u / EDGE : 0);
const lateOp = (u: number) => (u > 1 - EDGE ? (u - (1 - EDGE)) / EDGE : 0);
// a particle decelerates smoothly into its landing spot — no overshoot, nothing flung past target
const easeOut = (x: number) => 1 - (1 - x) ** 3;
// particles whose landing spot sits near the target's own centre arrive first — the shape visibly
// builds from the inside out, rather than every particle moving in lockstep.
const STAGGER = 0.16;
// a card that isn't the one in focus shows its object as a faint, still ghost
const GHOST = 0.3;
// the hero 9 assembling from the screen edges after the intro
const ASM_MS = 1700;

/**
 * The one particle swarm. `useServiceTrack` writes `particleBus`: the hero 9 assembles from the
 * screen edges after the intro, flies straight into the current card's object as the services
 * carousel scrolls into view, then from object to object as the carousel is swiped (or
 * auto-advances), and finally into the finale "9" — reversible the whole way.
 *
 * Two layers, so nothing ever looks like dust once it has landed:
 * - **Formed**: a crisp picture or "9" drawn *inside* its slot in the page. The card in focus
 *   keeps redrawing with real time so its small details live; every other card shows a faint still
 *   ghost of its object. The swarm draws nothing while a shape is at rest.
 * - **Moving**: ~16,000 particles (~9,000 on phones) on one fixed full-screen canvas, each carrying
 *   its own true pixel colour from both shapes and landing exactly where the crisp version is drawn,
 *   so the hand-over has no jump. A device that can't keep up quietly draws 60% of them.
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
    const N = phone ? 9000 : 16000;
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
    const counts = new Int32Array(COLOR_KEYS + 1);
    const start = new Int32Array(COLOR_KEYS + 1);

    let thin = false;
    let probe = 0;
    let probeSum = 0;
    let lastT = 0;
    let started = false;
    let assembling = false;
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

    // the crisp "formed" layer: one small canvas inside each slot
    const rest = new Map<SlotName, { el: HTMLElement; c: HTMLCanvasElement; g: CanvasRenderingContext2D; key: string; op: number; liveT0: number; drift: number }>();
    for (const name of SLOTS) {
      const el = document.querySelector<HTMLElement>(`[data-particle-slot="${name}"]`);
      const c = document.createElement("canvas");
      const g = c.getContext("2d");
      if (!el || !g) continue;
      c.setAttribute("aria-hidden", "true");
      c.className = `particle-rest particle-rest--${name}`;
      c.style.cssText = "position:absolute;left:50%;top:50%;pointer-events:none;opacity:0";
      el.appendChild(c);
      rest.set(name, { el, c, g, key: "", op: -1, liveT0: performance.now(), drift: NaN }); // NaN: centring transform not applied yet
    }

    // a slot's on-screen rect, its layout size (unaffected by a card's scale), and that scale
    const geom = (name: SlotName) => {
      const s = rest.get(name);
      if (!s) return null;
      const b = s.el.getBoundingClientRect();
      const lw = s.el.offsetWidth;
      const lh = s.el.offsetHeight;
      if (!lw || !lh) return null;
      return { b, k: b.width / lw, side: Math.min(lh * 0.9, lw * 0.94), drift: Number.isNaN(s.drift) ? 0 : s.drift };
    };

    // a soft parallax while a picture rests: it drifts a few px against the scroll, as if it sat a
    // little in front of the page rather than glued flat to it
    const updateDrift = (name: SlotName) => {
      const s = rest.get(name);
      if (!s) return;
      const b = name === "hero" ? undefined : s.el.getBoundingClientRect();
      const off = b ? Math.round(Math.max(-14, Math.min(14, (window.innerHeight / 2 - (b.top + b.height / 2)) * 0.045)) * 10) / 10 : 0;
      if (off === s.drift) return;
      s.drift = off;
      s.c.style.transform = `translate(-50%, calc(-50% + ${off}px))`;
    };

    const fit = (s: { c: HTMLCanvasElement }, side: number, px2: number) => {
      s.c.width = px2;
      s.c.height = px2;
      s.c.style.width = `${side}px`;
      s.c.style.height = `${side}px`;
    };
    /** draws a slot's crisp layer; `still` = the faint ghost of a card that isn't in focus */
    const drawFormed = (name: SlotName, target: ParticleTarget, pal: ReturnType<typeof palette>, still = false) => {
      const s = rest.get(name);
      const gm = geom(name);
      if (!s || !gm) return;
      const px2 = Math.max(2, Math.round(gm.side * dpr));
      if (target.kind === "pic") {
        if (still) {
          const key = `g|${target.icon}|${px2}|${pal.ink}`;
          if (s.key === key) return;
          const { b } = gm;
          const W = window.innerWidth;
          const H = window.innerHeight;
          if (b.bottom < -H || b.top > 2 * H || b.right < -W || b.left > 2 * W) return; // drawn once it comes near
          s.key = key;
          fit(s, gm.side, px2);
          PICTURES[target.icon](s.g, px2, pal, 0);
          return;
        }
        // always redrawn, so its small details can move
        if (s.key !== `pic|${target.icon}`) {
          s.key = `pic|${target.icon}`;
          s.liveT0 = performance.now();
        }
        fit(s, gm.side, px2);
        PICTURES[target.icon](s.g, px2, pal, (performance.now() - s.liveT0) / 1000);
        return;
      }
      const ch = "9"; // the hero and the finale
      const key = `d|${px2}|${pal.textFrom}`;
      if (s.key === key) return;
      s.key = key;
      fit(s, gm.side, px2);
      const g = s.g;
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

    // where a shape's particles land on screen: exactly where drawFormed paints its crisp canvas
    const place = (name: SlotName, s: Shape) => {
      const gm = geom(name);
      if (!gm) return null;
      const { b, k, side, drift } = gm;
      return { b, cx: b.left + b.width / 2 + k * side * s.ox, cy: b.top + b.height / 2 + k * (drift + side * s.oy), h: k * side * s.hr };
    };

    const shapeFor = (t: ParticleTarget, dark: boolean): Shape =>
      t.kind === "pic" ? pictureShape(t.icon, N, PICTURES[t.icon], dark) : digitShape("9", N, family, dark); // hero + all9 are both "9"

    let curFromKey = "";
    let curToKey = "";
    let SA: Shape | null = null;
    let SB: Shape | null = null;
    let curDark = isDark();

    const frame = () => {
      if (!started || !visible || document.hidden) return;
      const now = performance.now();
      const dark = isDark();
      if (dark !== curDark) {
        curDark = dark;
        curFromKey = "";
        curToKey = ""; // re-sample the shapes at the new theme's colours
      }
      const pal = palette(dark);
      let { from, to, u } = particleBus;
      const { dir } = particleBus;
      for (const name of SLOTS) updateDrift(name);

      // the intro: the swarm streams in from the screen edges into the hero 9, until it lands or
      // the page starts scrolling (the normal flight then takes over, still blending in from the edges)
      const asm = clamp01((now - heroT0) / ASM_MS);
      if (assembling && (asm >= 1 || from.kind !== "hero" || u > 0.001)) assembling = false;
      const heroFade = assembling ? smooth((asm - 0.82) / 0.18) : 1;
      if (assembling) {
        from = heroTarget;
        to = heroTarget;
        u = 0;
      }
      const resting = !assembling && sameTarget(from, to);
      // how much of a target's crisp layer shows: fully at rest, fading out/in at a flight's two ends
      const shown = (match: (t: ParticleTarget) => boolean) =>
        resting ? (match(to) ? 1 : 0) : (match(from) ? earlyOp(u) : 0) + (match(to) ? lateOp(u) : 0);

      drawFormed("hero", heroTarget, pal);
      setOpacity("hero", assembling ? heroFade : from.kind === "hero" || to.kind === "hero" ? shown((t) => t.kind === "hero") : 1);

      const fin = shown((t) => t.kind === "all9");
      if (fin > 0) drawFormed("finale", allNineTarget, pal);
      setOpacity("finale", fin);

      // each card: its live picture while the swarm is resting on (or just leaving/arriving at) it,
      // otherwise a faint still ghost
      for (const { name, pic } of STAGES) {
        const p = shown((t) => sameTarget(t, pic));
        if (p > 0) drawFormed(name, pic, pal);
        else if (!assembling) drawFormed(name, pic, pal, true);
        setOpacity(name, GHOST + (1 - GHOST) * p);
      }

      // the particles: only while flying (or assembling)
      if (dirty) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        dirty = false;
      }
      if (resting) return;
      const dustAlpha = assembling ? 1 - heroFade : 1 - earlyOp(u) - lateOp(u);
      if (dustAlpha < 0.015) return;

      const fromKey = targetKey(from);
      const toKey = targetKey(to);
      if (fromKey !== curFromKey) {
        curFromKey = fromKey;
        SA = shapeFor(from, dark);
      }
      if (toKey !== curToKey) {
        curToKey = toKey;
        SB = shapeFor(to, dark);
      }
      if (!SA || !SB) return;
      const A = place(slotFor(from), SA);
      const B = place(slotFor(to), SB);
      if (!A || !B) return;
      const H = window.innerHeight;
      const W = window.innerWidth;
      const away = (b: DOMRect) => b.bottom < -H * 0.6 || b.top > H * 1.6 || b.right < -W * 0.6 || b.left > W * 1.6;
      if (away(A.b) && away(B.b)) return;

      const lx = B.cx - A.cx;
      const ly = B.cy - A.cy;
      const len = Math.hypot(lx, ly) || 1;
      const perpX = -ly / len;
      const perpY = lx / len;
      const spread = Math.max(A.h, B.h) * 0.42;

      if (asm >= 1 && probe < 40) {
        if (lastT) {
          probeSum += now - lastT;
          if (++probe === 40 && probeSum / 40 > 24) thin = true;
        }
        lastT = now;
      }

      const ra = SA.rgb;
      const rb = SB.rgb;
      counts.fill(0);
      for (let i = 0; i < N; i++) {
        if (thin && i % 5 > 2) {
          bucket[i] = COLOR_KEYS;
          counts[COLOR_KEYS]++;
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
        // this particle's own progress: it starts a little late if its landing spot sits near the
        // target's edge (STAGGER), then eases smoothly in — position only, so the crossfade/colour
        // timing stays driven by the plain, predictable global `u`.
        const d = Math.min(STAGGER, Math.hypot(SB.x[i], SB.y[i]) * 1.8 * STAGGER);
        const ue = easeOut(clamp01((u - d) / (1 - d)));
        const ve = 1 - ue;
        let x = ve * ve * ax + 2 * ve * ue * mx + ue * ue * bx;
        let y = ve * ve * ay + 2 * ve * ue * my + ue * ue * by;
        if (asm < 1) {
          const p = clamp01(asm * 1.5 - delay[i]);
          const e = 1 - (1 - p) * (1 - p) * (1 - p);
          x = sx[i] * W + (x - sx[i] * W) * e;
          y = sy[i] * H + (y - sy[i] * H) * e;
        }
        px[i] = x;
        py[i] = y;
        const j = i * 3;
        const k = colorKey(ra[j] + (rb[j] - ra[j]) * u, ra[j + 1] + (rb[j + 1] - ra[j + 1]) * u, ra[j + 2] + (rb[j + 2] - ra[j + 2]) * u);
        bucket[i] = k;
        counts[k]++;
      }
      let acc = 0;
      for (let b = 0; b <= COLOR_KEYS; b++) {
        start[b] = acc;
        acc += counts[b];
      }
      for (let i = 0; i < N; i++) if (bucket[i] < COLOR_KEYS) order[start[bucket[i]]++] = i;

      const size = Math.max(1.1, Math.min(phone ? 2.4 : 2.8, (A.h + (B.h - A.h) * u) * (phone ? 0.0085 : 0.005)));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = dustAlpha;
      const half = size / 2;
      // `start[b]` now marks the end of bucket b, so bucket b runs from end-count to end
      for (let b = 0; b < COLOR_KEYS; b++) {
        const n = counts[b];
        if (!n) continue;
        ctx.fillStyle = KEY_HEX[b];
        for (let j = start[b] - n; j < start[b]; j++) {
          const i = order[j];
          ctx.fillRect(px[i] - half, py[i] - half, size, size);
        }
      }
      ctx.globalAlpha = 1;
      dirty = true;
    };

    // only run while the hero or the services are near the screen
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
      digitShape("9", N, family, dark); // the hero (and the finale) — needed immediately
      const hero = rest.get("hero")?.el.getBoundingClientRect();
      assembling = !!hero && hero.bottom > 0 && hero.top < window.innerHeight && window.scrollY < 40;
      started = true;
      heroT0 = performance.now();
      // the nine pictures, in the order a visitor meets them
      for (const { pic: step } of STAGES) {
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

  if (reduced) return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[15]" aria-hidden="true" />;
}
