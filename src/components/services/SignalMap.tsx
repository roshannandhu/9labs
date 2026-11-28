"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { palette } from "@/components/particles/palette";
import { ENDS, HUB, MAP_ASPECT, landDots } from "./worldDots";

const EDGE_IN = 0.45; // share of the flight each dot spends moving (the rest is its stagger)
const LAUNCH_MS = 140; // a new signal this often, working round every country
// every country once per round, in a scattered (but fixed) order so the signals spread across the map
const ORDER = ENDS.map((_, i) => i).sort((a, b) => ((a * 7919) % 173) - ((b * 7919) % 173));
const TRAIL = 0.32; // trail length, share of the route
const ARC = 0.3; // arc lift, share of the route length

const isDark = () => document.documentElement.dataset.theme === "dark";
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (v: number) => 1 - (1 - v) ** 3;

/**
 * "One vision": a dotted world map below the finale 9. As the carousel scrolls away, the map's dots lift
 * off the card in focus — the same moment the swarm leaves it for the 9 — and fly down onto the map,
 * spreading out from Dubai (scrubbed, reversible). Then signals fly from Dubai South to the centre of
 * every country. Canvas only, no card, no names: just the connections.
 * Cheap by design: the map is decoded only near the screen, the land is painted once per size/theme,
 * the flight redraws only while the scroll moves, and the loop runs only while the map is near.
 */
export function SignalMap() {
  const { reduced } = useDemo();
  const boxRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const ovRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const cv = cvRef.current;
    const ov = ovRef.current;
    const g = cv?.getContext("2d");
    const o = ov?.getContext("2d");
    if (!box || !cv || !ov || !g || !o) return;

    let dots: Float32Array | null = null;
    let near = false;
    let raf = 0;
    let p = reduced ? 1 : 0; // flight progress
    let drawnP = -1;
    let lastY = NaN;
    let ovDirty = false;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let dark = isDark();
    let land: HTMLCanvasElement | null = null;
    let track: HTMLElement | null = null;
    let slots: HTMLElement[] = [];
    let delay = new Float32Array(0);
    let bowX = new Float32Array(0);
    let fx = new Float32Array(0); // each dot's take-off spot inside the card's picture, 0..1
    let fy = new Float32Array(0);
    const sigs: { i: number; t0: number; dur: number }[] = [];
    const landed = new Float64Array(ENDS.length).fill(-1e9);
    let next = 0;
    let lastLaunch = 0;

    const measure = () => {
      const b = box.getBoundingClientRect();
      W = b.width;
      H = b.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ov.width = Math.round(window.innerWidth * dpr);
      ov.height = Math.round(window.innerHeight * dpr);
      ovDirty = false;
      track = document.querySelector<HTMLElement>("[data-particle-track]");
      slots = Array.from(document.querySelectorAll<HTMLElement>('[data-particle-slot^="stage-"]'));
      land = null;
      drawnP = -1;
      lastY = NaN;
    };

    const prep = () => {
      if (!dots) return;
      const n = dots.length / 2;
      delay = new Float32Array(n);
      bowX = new Float32Array(n);
      fx = new Float32Array(n);
      fy = new Float32Array(n);
      let max = 0;
      for (let i = 0; i < n; i++) {
        const d = Math.hypot(dots[2 * i] - HUB.x, (dots[2 * i + 1] - HUB.y) / MAP_ASPECT);
        delay[i] = d;
        if (d > max) max = d;
        bowX[i] = ((i * 2654435761) % 1000) / 1000 - 0.5; // stable per-dot swirl
        fx[i] = 0.15 + (((i * 40503) % 997) / 997) * 0.7;
        fy[i] = 0.15 + (((i * 69069) % 991) / 991) * 0.7;
      }
      for (let i = 0; i < n; i++) delay[i] = (delay[i] / max) * (1 - EDGE_IN);
    };

    const r = () => Math.max(0.8, (W / 104) * 0.3);
    const dotColour = () => (dark ? "rgba(214,210,240,0.30)" : "rgba(40,32,80,0.22)");

    const paintLand = () => {
      if (!dots) return;
      land = document.createElement("canvas");
      land.width = cv.width;
      land.height = cv.height;
      const l = land.getContext("2d")!;
      l.setTransform(dpr, 0, 0, dpr, 0, 0);
      l.fillStyle = dotColour();
      l.beginPath();
      const rad = r();
      for (let i = 0; i < dots.length; i += 2) {
        const x = dots[i] * W;
        const y = dots[i + 1] * H;
        l.moveTo(x + rad, y);
        l.arc(x, y, rad, 0, Math.PI * 2);
      }
      l.fill();
    };

    const clearOverlay = () => {
      if (!ovDirty) return;
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.clearRect(0, 0, ov.width, ov.height);
      ovDirty = false;
    };
    // the card in focus: the picture slot nearest the middle of the screen
    const source = () => {
      let best: DOMRect | null = null;
      let bestD = Infinity;
      const mid = window.innerWidth / 2;
      for (const el of slots) {
        const rc = el.getBoundingClientRect();
        const d = Math.abs(rc.left + rc.width / 2 - mid);
        if (d < bestD) [best, bestD] = [rc, d];
      }
      return best;
    };

    // the flight, on the full-screen overlay: each dot lifts off the card's picture and lands on its
    // spot in the map, in screen coordinates (alpha in bands = 5 fills)
    const paintFlight = () => {
      if (!dots) return;
      const src = source();
      if (!src) return;
      const b = box.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.clearRect(0, 0, ov.width, ov.height);
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      ovDirty = true;
      const rad = r();
      const pal = palette(dark);
      for (let band = 1; band <= 4; band++) {
        o.beginPath();
        let any = false;
        for (let i = 0, j = 0; i < dots.length; i += 2, j++) {
          const u = clamp01((p - delay[j]) / EDGE_IN);
          if (Math.min(4, Math.ceil(u * 4)) !== band) continue;
          const e = ease(u);
          const sx = src.left + fx[j] * src.width;
          const sy = src.top + fy[j] * src.height;
          const tx = b.left + dots[i] * W;
          const ty = b.top + dots[i + 1] * H;
          const x = sx + (tx - sx) * e + Math.sin(e * Math.PI) * bowX[j] * W * 0.3;
          const y = sy + (ty - sy) * e;
          if (x < -4 || y < -4 || x > vw + 4 || y > vh + 4) continue;
          const sz = rad * (0.6 + 0.4 * e);
          o.moveTo(x + sz, y);
          o.arc(x, y, sz, 0, Math.PI * 2);
          any = true;
        }
        if (!any) continue;
        // (dots still waiting on the card aren't drawn: each appears as it lifts off) in flight they glow
        // in the brand colour, settling into the map's quiet grey as they land
        o.globalAlpha = band === 4 ? 1 : 0.35 + band * 0.15;
        o.fillStyle = band === 4 ? dotColour() : pal.accent;
        o.fill();
      }
      o.globalAlpha = 1;
    };

    const pt = (c: { x: number; y: number }) => [c.x * W, c.y * H] as const;
    // quadratic arc hub → end point, lifted upwards by ARC of its length
    const arcAt = (i: number, t: number) => {
      const [x0, y0] = pt(HUB);
      const [x1, y1] = pt(ENDS[i]);
      const len = Math.hypot(x1 - x0, y1 - y0);
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2 - len * ARC;
      const m = 1 - t;
      return [m * m * x0 + 2 * m * t * cx + t * t * x1, m * m * y0 + 2 * m * t * cy + t * t * y1] as const;
    };

    const fire = (i: number, now = performance.now()) => {
      const [x0, y0] = pt(HUB);
      const [x1, y1] = pt(ENDS[i]);
      sigs.push({ i, t0: now, dur: 900 + (Math.hypot(x1 - x0, y1 - y0) / Math.max(1, W)) * 1400 });
    };

    const paintLive = (now: number) => {
      if (!land) paintLand();
      if (!land) return;
      const pal = palette(dark);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(land, 0, 0);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rad = r();
      const spacing = W / 104;

      if (!reduced && now - lastLaunch > LAUNCH_MS) {
        lastLaunch = now;
        fire(ORDER[next], now);
        next = (next + 1) % ENDS.length;
      }

      g.lineCap = "round";
      for (let k = sigs.length - 1; k >= 0; k--) {
        const s = sigs[k];
        const age = (now - s.t0) / s.dur;
        if (age >= 1 && landed[s.i] < s.t0) landed[s.i] = now;
        if (age > 2.6) {
          sigs.splice(k, 1);
          continue;
        }
        // the faint trace of the route, fading after the landing
        const trace = age < 1 ? 0.1 : 0.1 * (1 - (age - 1) / 1.6);
        if (trace > 0) {
          g.strokeStyle = pal.accent;
          g.globalAlpha = trace;
          g.lineWidth = Math.max(0.6, rad * 0.6);
          g.beginPath();
          const end = Math.min(1, age);
          for (let q = 0; q <= 24; q++) {
            const [x, y] = arcAt(s.i, (q / 24) * end);
            if (q) g.lineTo(x, y);
            else g.moveTo(x, y);
          }
          g.stroke();
        }
        // the signal: a light trail running ahead to the end point
        if (age < 1) {
          const head = ease(age);
          const tail = Math.max(0, head - TRAIL);
          for (let q = 0; q < 10; q++) {
            const a = tail + ((head - tail) * q) / 10;
            const b = tail + ((head - tail) * (q + 1)) / 10;
            const [xa, ya] = arcAt(s.i, a);
            const [xb, yb] = arcAt(s.i, b);
            g.globalAlpha = ((q + 1) / 10) ** 1.6;
            g.strokeStyle = q > 6 ? pal.textTo : pal.accent;
            g.lineWidth = rad * (0.8 + (q / 10) * 1.4);
            g.beginPath();
            g.moveTo(xa, ya);
            g.lineTo(xb, yb);
            g.stroke();
          }
          const [hx, hy] = arcAt(s.i, head);
          g.globalAlpha = 1;
          g.fillStyle = pal.white;
          g.beginPath();
          g.arc(hx, hy, rad * 1.5, 0, Math.PI * 2);
          g.fill();
        }
      }

      // the end point markers, each rippling through the map's dots when its signal lands
      for (let i = 0; i < ENDS.length; i++) {
        const [x, y] = pt(ENDS[i]);
        const since = now - landed[i];
        const on = since < 2400;
        if (since < 1100) {
          const k = since / 1100;
          g.globalAlpha = (1 - k) * 0.7;
          g.strokeStyle = pal.accent;
          g.lineWidth = rad * 1.2;
          g.setLineDash([0.1, spacing]);
          g.beginPath();
          g.arc(x, y, spacing * (1 + k * 2.5), 0, Math.PI * 2);
          g.stroke();
          g.setLineDash([]);
        }
        g.globalAlpha = on ? 1 : 0.55;
        g.fillStyle = pal.accent;
        g.beginPath();
        g.arc(x, y, rad * (on ? 1.8 : 1.1), 0, Math.PI * 2);
        g.fill();
      }
      // the hub (Dubai South), breathing
      const [hx, hy] = pt(HUB);
      const breath = reduced ? 0 : (Math.sin(now / 420) + 1) / 2;
      g.globalAlpha = 0.18 + 0.12 * breath;
      g.fillStyle = pal.textTo;
      g.beginPath();
      g.arc(hx, hy, rad * (4 + 2 * breath), 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      g.beginPath();
      g.arc(hx, hy, rad * 2.4, 0, Math.PI * 2);
      g.fill();
    };

    const draw = (now: number) => {
      if (!dots || !W) return;
      if (p < 1) {
        if (drawnP >= 1) {
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.clearRect(0, 0, cv.width, cv.height);
        }
        if (p <= 0) clearOverlay();
        // redrawn only when the scrub or the page moved (the card and the map both move with it)
        else if (p !== drawnP || window.scrollY !== lastY) paintFlight();
        drawnP = p;
        lastY = window.scrollY;
        return;
      }
      clearOverlay();
      drawnP = 1;
      paintLive(now);
    };

    const loop = (now: number) => {
      raf = 0;
      if (!near || document.hidden) {
        clearOverlay();
        return;
      }
      draw(now);
      if (!reduced) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && near && dots) raf = requestAnimationFrame(loop);
    };

    // reduced motion: everything already in place, every route traced once, still
    const paintStill = () => {
      if (!dots || !W) return;
      const now = performance.now();
      for (let i = 0; i < ENDS.length; i++) sigs.push({ i, t0: now - 1000, dur: 999 });
      paintLive(now);
      sigs.length = 0;
    };

    let st: ScrollTrigger | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near && !dots) {
          dots = landDots();
          prep();
          measure();
          if (reduced) paintStill();
          else {
            // starts with the swarm's own card → 9 flight (useServiceTrack: carousel bottom at 55%),
            // lands as the map is well on screen
            st = ScrollTrigger.create({
              trigger: track ?? box,
              start: track ? "bottom 55%" : "top bottom",
              endTrigger: box,
              end: "top 45%",
              scrub: true,
              onUpdate: (s) => {
                p = s.progress;
                kick();
              },
              onRefresh: (s) => {
                measure();
                p = s.progress;
                kick();
              },
            });
            p = st.progress;
            kick();
          }
        } else if (near) kick();
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(box);

    const ro = new ResizeObserver(() => {
      if (!dots) return;
      measure();
      if (reduced) paintStill();
      else kick();
    });
    ro.observe(box);
    const onResize = () => {
      if (!dots || reduced) return;
      measure();
      kick();
    };
    window.addEventListener("resize", onResize);
    const mo = new MutationObserver(() => {
      if (isDark() === dark) return;
      dark = isDark();
      land = null;
      drawnP = -1;
      if (reduced) paintStill();
      else kick();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      st?.kill();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    // phones: edge to edge (out past the page gutter); tablets and laptops: as wide as fits so the 9, the
    // heading and the whole map share one screen (never narrower than 520px, never wider than the page)
    <div
      ref={boxRef}
      className="relative -mx-4 mt-8 w-[calc(100%+2rem)] sm:mx-0 sm:mt-10 sm:w-[clamp(min(100%,520px),calc((100svh_-_320px)*1.857),100%)]"
      style={{ aspectRatio: String(MAP_ASPECT) }}
    >
      <canvas ref={cvRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      {/* the flight from the cards: full screen, on the swarm's own layer, empty at rest */}
      <canvas ref={ovRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[15] h-screen w-screen" />
    </div>
  );
}
