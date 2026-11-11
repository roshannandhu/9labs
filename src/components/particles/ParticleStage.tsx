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
 * - **Moving**: ~11,000 particles (~6,000 on phones), drawn on a canvas that scrolls with the page
 *   (or, card to card, with the carousel), each carrying its own true pixel colour from both shapes
 *   and landing exactly where the crisp version is drawn, so the hand-over has no jump. A device
 *   that can't keep up quietly draws 60% of them.
 */
export function ParticleStage() {
  const { reduced } = useDemo();
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!wrap || !cv || !ctx) return;

    const phone = window.matchMedia("(max-width: 639px)").matches;
    // fillRect scales linearly with N and profiled as the single largest per-frame cost during an
    // active flight; the "exact formation" accuracy (true per-pixel colour, exact placement) is
    // independent of density, so this is a pure smoothness win, not a quality trade
    const N = phone ? 4400 : 6000;
    const dustDpr = 1;
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
    let dpr = 1;
    let family = "";
    let lastScrollY = -1;
    let lastTrackScroll = -1;
    let forceGeoms = true; // always read fresh geometry on the very first frame

    /*
     * Two drawing surfaces, both inside the scrolling content rather than fixed over the screen. The
     * browser scrolls the page (touch, fling) and a swiped carousel on its compositor thread, a frame
     * ahead of anything the main thread draws, so dust on a fixed overlay trailed the cards by a whole
     * scroll step and then jumped to catch up (measured: ~18px every step of a phone scroll). Living
     * inside the content, the dust is carried along with the cards; only its flight *progress* is a
     * frame behind, which nobody can see.
     *  - `page`: inside <main>, re-placed each frame to cover the screen plus a margin above and below
     *  - `track`: inside the services carousel, for card-to-card flights, so a swipe carries it too
     */
    type Surface = { c: HTMLCanvasElement; g: CanvasRenderingContext2D; tx: number; ty: number; box: number[] | null };
    const page: Surface = { c: cv, g: ctx, tx: NaN, ty: NaN, box: null };
    const trackEl = document.querySelector<HTMLElement>("[data-particle-track]");
    const tcv = document.createElement("canvas");
    const tctx = tcv.getContext("2d");
    const track: Surface | null = trackEl && tctx ? { c: tcv, g: tctx, tx: NaN, ty: NaN, box: null } : null;
    if (trackEl && track) {
      tcv.setAttribute("aria-hidden", "true");
      tcv.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;z-index:50";
      trackEl.appendChild(tcv);
    }
    let drawn: Surface | null = null; // the surface the swarm drew on last frame (its patch is in `.box`)
    let margin = 0; // page surface: extra height above and below the screen

    // the crisp "formed" layer: one small canvas inside each slot
    type SlotItem = {
      el: HTMLElement;
      c: HTMLCanvasElement;
      g: CanvasRenderingContext2D;
      key: string;
      op: number;
      liveT0: number;
      drift: number;
      fitPx: number;
      lw: number;
      lh: number;
      side: number;
    };
    const rest = new Map<SlotName, SlotItem>();
    for (const name of SLOTS) {
      const el = document.querySelector<HTMLElement>(`[data-particle-slot="${name}"]`);
      const c = document.createElement("canvas");
      const g = c.getContext("2d");
      if (!el || !g) continue;
      c.setAttribute("aria-hidden", "true");
      c.className = `particle-rest particle-rest--${name}`;
      c.style.cssText = "position:absolute;left:50%;top:50%;pointer-events:none;opacity:0;z-index:10";
      el.appendChild(c);
      rest.set(name, { el, c, g, key: "", op: -1, liveT0: performance.now(), drift: NaN, fitPx: -1, lw: 0, lh: 0, side: 0 }); // NaN/-1: not sized yet
    }

    const measureSlots = () => {
      for (const s of rest.values()) {
        s.lw = s.el.offsetWidth || 1;
        s.lh = s.el.offsetHeight || 1;
        s.side = Math.min(s.lh * 0.9, s.lw * 0.94);
      }
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = window.innerWidth;
      const H = window.innerHeight;
      margin = Math.round(H * 0.2);
      cv.width = Math.round(W * dustDpr);
      cv.height = Math.round((H + 2 * margin) * dustDpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${H + 2 * margin}px`;
      page.box = null; // resizing cleared it
      measureSlots();
      forceGeoms = true; // a resize can change every slot's size/position
    };
    resize();
    window.addEventListener("resize", resize);

    type Geom = { b: DOMRect; k: number; side: number; drift: number };
    // every slot's on-screen rect, read in one pass at the top of each frame — `getBoundingClientRect`
    // forces a synchronous layout if anything was written (style/canvas size) since the last read, so
    // reading all 11 slots back to back before any writes costs one layout instead of ~20+. One `Map`
    // reused every frame (cleared, not reallocated) so this hot path doesn't churn the garbage collector.
    const geoms = new Map<SlotName, Geom | null>();
    let wrapRect: DOMRect | null = null;
    const tm = { left: 0, top: 0, scroll: 0, cw: 0, ch: 0, sw: 0 }; // the carousel, for `track`
    const readGeoms = () => {
      wrapRect = wrap.getBoundingClientRect();
      if (trackEl) {
        const tr = trackEl.getBoundingClientRect();
        tm.left = tr.left;
        tm.top = tr.top;
        tm.scroll = trackEl.scrollLeft;
        tm.cw = trackEl.clientWidth;
        tm.ch = trackEl.clientHeight;
        tm.sw = trackEl.scrollWidth;
      }
      for (const name of SLOTS) {
        const s = rest.get(name);
        if (!s) {
          geoms.set(name, null);
          continue;
        }
        const b = s.el.getBoundingClientRect();
        // Uses pre-measured s.lw, s.lh, s.side to avoid forced synchronous layout reflows during scroll
        geoms.set(name, s.lw && s.lh ? { b, k: b.width / s.lw, side: s.side, drift: Number.isNaN(s.drift) ? 0 : s.drift } : null);
      }
    };

    // a soft parallax while a picture rests: it drifts a few px against the scroll, as if it sat a
    // little in front of the page rather than glued flat to it
    const updateDrift = (name: SlotName, gm: Geom | null) => {
      const s = rest.get(name);
      if (!s) return;
      if (name !== "hero" && gm && (gm.b.right < -80 || gm.b.left > window.innerWidth + 80 || gm.b.bottom < -80 || gm.b.top > window.innerHeight + 80)) {
        return;
      }
      const off = name !== "hero" && gm ? Math.round(Math.max(-14, Math.min(14, (window.innerHeight / 2 - (gm.b.top + gm.b.height / 2)) * 0.045)) * 10) / 10 : 0;
      if (off === s.drift) return;
      s.drift = off;
      s.c.style.transform = `translate(-50%, calc(-50% + ${off}px))`;
    };

    // setting canvas.width/height (even to the same value) clears it, but — unlike clearRect — also
    // forces a layout recalc, which the live picture would otherwise pay every single frame for no
    // reason (its size is only ever actually different after a resize or a breakpoint change)
    const fit = (s: { c: HTMLCanvasElement; g: CanvasRenderingContext2D; fitPx: number }, side: number, px2: number) => {
      if (s.fitPx !== px2) {
        s.c.width = px2;
        s.c.height = px2;
        s.c.style.width = `${side}px`;
        s.c.style.height = `${side}px`;
        s.fitPx = px2;
      } else {
        s.g.clearRect(0, 0, px2, px2);
      }
    };
    /** draws a slot's crisp layer; `still` = the faint ghost of a card that isn't in focus */
    const drawFormed = (name: SlotName, target: ParticleTarget, pal: ReturnType<typeof palette>, gm: Geom | null, still = false) => {
      const s = rest.get(name);
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
    const place = (gm: Geom | null, s: Shape) => {
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

      // skip the (layout-forcing) geometry read entirely when nothing could have moved: at rest,
      // with the page not scrolled since last frame and no resize pending — reusing last frame's
      // geoms is exactly correct then, and this is what makes "just sitting there" cost ~0
      const scrollY = window.scrollY;
      const trackScroll = trackEl?.scrollLeft ?? 0;
      if (forceGeoms || !resting || scrollY !== lastScrollY || trackScroll !== lastTrackScroll) {
        readGeoms();
        lastScrollY = scrollY;
        lastTrackScroll = trackScroll;
        forceGeoms = false;
      }
      for (const name of SLOTS) updateDrift(name, geoms.get(name) ?? null);

      // how much of a target's crisp layer shows: fully at rest, fading out/in at a flight's two ends
      const shown = (match: (t: ParticleTarget) => boolean) =>
        resting ? (match(to) ? 1 : 0) : (match(from) ? earlyOp(u) : 0) + (match(to) ? lateOp(u) : 0);

      drawFormed("hero", heroTarget, pal, geoms.get("hero") ?? null);
      setOpacity("hero", assembling ? heroFade : from.kind === "hero" || to.kind === "hero" ? shown((t) => t.kind === "hero") : 1);

      const fin = shown((t) => t.kind === "all9");
      if (fin > 0) drawFormed("finale", allNineTarget, pal, geoms.get("finale") ?? null);
      setOpacity("finale", fin);

      // each card: its live picture while the swarm is resting on (or just leaving/arriving at) it,
      // otherwise a faint still ghost
      for (const { name, pic } of STAGES) {
        const gm = geoms.get(name) ?? null;
        const p = shown((t) => sameTarget(t, pic));
        if (p > 0) drawFormed(name, pic, pal, gm);
        else if (!assembling) drawFormed(name, pic, pal, gm, true);
        setOpacity(name, GHOST + (1 - GHOST) * p);
      }

      // the particles: only while flying (or assembling). First wipe just the patch drawn last frame.
      if (drawn) {
        if (drawn.box) {
          drawn.g.setTransform(1, 0, 0, 1, 0, 0);
          drawn.g.clearRect(drawn.box[0], drawn.box[1], drawn.box[2], drawn.box[3]);
          drawn.box = null;
        }
        drawn = null;
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
      let A = place(geoms.get(slotFor(from)) ?? null, SA);
      let B = place(geoms.get(slotFor(to)) ?? null, SB);
      if (!A || !B) return;

      const fromSlot = slotFor(from);
      const toSlot = slotFor(to);
      const isLoopWrap =
        from.kind === "pic" &&
        to.kind === "pic" &&
        ((fromSlot === "stage-9" && toSlot === "stage-1") ||
         (fromSlot === "stage-1" && toSlot === "stage-9"));

      // the flat row (phone): the far end of the row really is 8 cards off to the side, so stand it
      // in next to the card in focus. The orbit (laptop/tablet) already has both on screen — the
      // wheel turns 9 → 1 like any other step — so leave its real positions alone.
      const offSide = (b: DOMRect) => b.right < 0 || b.left > window.innerWidth;
      if (isLoopWrap && (offSide(A.b) || offSide(B.b))) {
        const stepDist = Math.min(window.innerWidth * 0.82, (tm.cw || window.innerWidth) * 0.82);
        if (Math.abs(A.b.left - tm.left) < Math.abs(B.b.left - tm.left)) {
          // A is the card in focus on screen; project B to adjacent spot
          B = { ...B, cx: A.cx + dir * stepDist, cy: A.cy, h: A.h };
        } else {
          // B is the card in focus on screen; project A to adjacent spot
          A = { ...A, cx: B.cx - dir * stepDist, cy: B.cy, h: B.h };
        }
      }

      const H = window.innerHeight;
      const W = window.innerWidth;
      const away = (b: DOMRect) => b.bottom < -H * 0.6 || b.top > H * 1.6 || b.right < -W * 0.6 || b.left > W * 1.6;
      if (!isLoopWrap && away(A.b) && away(B.b)) return;

      const lx = B.cx - A.cx;
      const ly = B.cy - A.cy;
      const len = Math.hypot(lx, ly) || 1;
      const perpX = -ly / len;
      const perpY = lx / len;
      const spread = Math.max(A.h, B.h) * 0.42;

      // where to draw: a card-to-card flight goes on the carousel's own surface, everything else on
      // the page's. Place that canvas for this frame; (ox, oy) is its origin on screen, so drawing
      // can stay in screen coordinates.
      const S = track && from.kind === "pic" && to.kind === "pic" ? track : page;
      let ox: number;
      let oy: number;
      let tx: number;
      let ty: number;
      if (S === page) {
        if (!wrapRect) return;
        tx = 0;
        ty = Math.round(-wrapRect.top - margin);
        ox = wrapRect.left;
        oy = wrapRect.top + ty;
      } else {
        const mx = Math.round(tm.cw * 0.2);
        const w = tm.cw + 2 * mx;
        const wpx = Math.round(w * dustDpr);
        const hpx = Math.round(tm.ch * dustDpr);
        if (S.c.width !== wpx || S.c.height !== hpx) {
          S.c.width = wpx;
          S.c.height = hpx;
          S.c.style.width = `${w}px`;
          S.c.style.height = `${tm.ch}px`;
        }
        // kept within the carousel's own content, so it never widens what can be scrolled
        tx = Math.round(Math.max(0, Math.min(tm.scroll - mx, tm.sw - w)));
        ty = 0;
        ox = tm.left - tm.scroll + tx;
        oy = tm.top;
      }
      if (S.tx !== tx || S.ty !== ty) {
        S.tx = tx;
        S.ty = ty;
        S.c.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }

      if (asm >= 1 && probe < 40) {
        // only back-to-back flight frames count: a pause between two flights isn't a slow device
        // (it used to be counted, which could switch on thinning mid-session for no reason)
        const dt = now - lastT;
        if (lastT && dt < 100) {
          probeSum += dt;
          if (++probe === 40 && probeSum / 40 > 24) thin = true;
        }
        lastT = now;
      }

      const ra = SA.rgb;
      const rb = SB.rgb;
      counts.fill(0);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
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
        // inlined easeOut(clamp01(...)) — called once per particle per frame, a hot enough path
        // (profiled) that the extra call frame was worth cutting
        const p0 = (u - d) / (1 - d);
        const t0 = p0 < 0 ? 0 : p0 > 1 ? 1 : p0;
        const ue = 1 - (1 - t0) * (1 - t0) * (1 - t0);
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
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
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

      const size = Math.max(1.2, Math.min(phone ? 2.6 : 3.0, (A.h + (B.h - A.h) * u) * (phone ? 0.0088 : 0.0056)));
      const g = S.g;
      g.setTransform(dustDpr, 0, 0, dustDpr, -ox * dustDpr, -oy * dustDpr);
      g.globalAlpha = dustAlpha;
      const half = size / 2;
      // `start[b]` now marks the end of bucket b, so bucket b runs from end-count to end
      for (let b = 0; b < COLOR_KEYS; b++) {
        const n = counts[b];
        if (!n) continue;
        g.fillStyle = KEY_HEX[b];
        for (let j = start[b] - n; j < start[b]; j++) {
          const i = order[j];
          g.fillRect(px[i] - half, py[i] - half, size, size);
        }
      }
      g.globalAlpha = 1;
      // remember the patch drawn (in this canvas's own pixels), so next frame clears only that
      if (minX <= maxX) {
        S.box = [
          Math.floor((minX - half - ox) * dustDpr) - 2,
          Math.floor((minY - half - oy) * dustDpr) - 2,
          Math.ceil((maxX - minX + size) * dustDpr) + 4,
          Math.ceil((maxY - minY + size) * dustDpr) + 4,
        ];
        drawn = S;
      }
    };

    // only run while the hero or the services are near the screen
    const watched = ["home", "services"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target, e.isIntersecting);
        visible = [...seen.values()].some(Boolean);
        if (!visible) {
          for (const s of [page, track]) {
            if (!s) continue;
            s.g.setTransform(1, 0, 0, 1, 0, 0);
            s.g.clearRect(0, 0, s.c.width, s.c.height);
            s.box = null;
          }
          drawn = null;
        }
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    watched.forEach((el) => io.observe(el));

    let cancelled = false;
    let lastActivity = 0;
    let idleTimer: number | undefined;
    let idleHandle: number | undefined;
    const bumpActivity = () => {
      lastActivity = performance.now();
    };
    window.addEventListener("scroll", bumpActivity, { passive: true });
    window.addEventListener("wheel", bumpActivity, { passive: true });
    window.addEventListener("pointermove", bumpActivity, { passive: true });

    const ric = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

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

      const waitIdle = () =>
        new Promise<void>((resolve) => {
          const poll = () => {
            if (cancelled) {
              resolve();
              return;
            }
            const busy = assembling || drawn !== null || performance.now() - lastActivity < 180;
            if (busy) {
              idleTimer = window.setTimeout(poll, 120);
              return;
            }
            if (ric.requestIdleCallback) {
              idleHandle = ric.requestIdleCallback(
                () => {
                  idleHandle = undefined;
                  if (cancelled) {
                    resolve();
                    return;
                  }
                  if (assembling || drawn !== null || performance.now() - lastActivity < 140) {
                    idleTimer = window.setTimeout(poll, 120);
                    return;
                  }
                  resolve();
                },
                { timeout: 600 },
              );
            } else {
              idleTimer = window.setTimeout(() => {
                if (cancelled || (!assembling && drawn === null && performance.now() - lastActivity >= 140)) {
                  resolve();
                } else {
                  poll();
                }
              }, 32);
            }
          };
          idleTimer = window.setTimeout(poll, 220);
        });

      // the nine pictures, in the order a visitor meets them, sampled only during idle windows
      for (const { pic: step } of STAGES) {
        await waitIdle();
        if (cancelled) return;
        shapeFor(step, dark);
      }
    });
    gsap.ticker.add(frame);

    return () => {
      cancelled = true;
      window.clearTimeout(idleTimer);
      if (idleHandle !== undefined) ric.cancelIdleCallback?.(idleHandle);
      offIntro();
      gsap.ticker.remove(frame);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", bumpActivity);
      window.removeEventListener("wheel", bumpActivity);
      window.removeEventListener("pointermove", bumpActivity);
      for (const s of rest.values()) s.c.remove();
      tcv.remove();
    };
  }, [reduced]);

  if (reduced) return null;
  // rendered inside <main> and clipped to it: the dust canvas scrolls with the page (see `page`)
  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 z-[15] overflow-clip" aria-hidden="true">
      <canvas ref={ref} className="absolute left-0 top-0" />
    </div>
  );
}
