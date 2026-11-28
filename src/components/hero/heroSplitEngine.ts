import type { IconKey } from "@/content/site";
import { palette, type Pal } from "@/components/particles/palette";

/** The site theme — light by default; `data-theme="dark"` is the only dark trigger (same as ParticleStage). */
const isDark = () => (typeof document !== "undefined" ? document.documentElement.dataset.theme === "dark" : false);

export type SplitService = { icon: IconKey; short: string; title: string; n: number };
export type SplitStage = "nine" | "icons" | "names";
export type IconTargetRect = { x: number; y: number; size: number };

export type SplitHeroOpts = {
  services: SplitService[]; // 9 services in display order
  colorFor: (icon: IconKey) => string; // per-service accent (ICON_COLORS)
  family: string; // Albert Sans Black face matching the main hero 9
  measureGrid: () => { cx: number; cy: number; scale: number; icons: IconTargetRect[] } | null;
  onStageChange?: (stage: SplitStage) => void;
  onCaption?: (bold: string, line: string) => void;
};

export type SplitHero = {
  resize: () => void;
  setPaused: (paused: boolean) => void;
  setHovered: (idx: number) => void;
  destroy: () => void;
};

/** Ordered index into icon silhouette drawing routine, independent of admin reorder. */
const ICON_INDEX: Record<IconKey, number> = {
  social: 0,
  advertising: 1,
  content: 2,
  photo: 3,
  events: 4,
  pr: 5,
  strategy: 6,
  ai: 7,
  it: 8,
};

/** Subtle horizontal condense factor; the flat "9" keeps it so it matches the sampled particle "9". */
const CONDENSE_X = 0.88;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth01 = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
const cubicIO = (x: number) => {
  const c = clamp01(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
const easeOut = (x: number) => {
  const c = clamp01(x);
  return 1 - (1 - c) * (1 - c) * (1 - c);
};

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Deterministic PRNG matching ParticleStage style dispersion. */
function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/**
 * Draws a crisp service ActivityIcon matching `ActivityIcon.tsx` (`primaryCol` = `--nl-blue-soft`,
 * `accentCol` = `ICON_COLORS[icon]`, `bgFill` = `--nl-bg` for PR bubble interior).
 */
function drawSiteIcon(
  ctx: CanvasRenderingContext2D,
  idx: number,
  cx: number,
  cy: number,
  size: number,
  primaryCol: string,
  accentCol: string,
  bgFill: string,
  extraStroke: number,
) {
  const sc = size / 64;
  ctx.save();
  ctx.translate(cx - size * 0.5, cy - size * 0.5);
  ctx.scale(sc, sc);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = extraStroke || 2.5;
  ctx.strokeStyle = primaryCol;
  ctx.fillStyle = primaryCol;

  const pStroke = (d: string, col?: string, alpha?: number) => {
    ctx.save();
    if (col) ctx.strokeStyle = col;
    if (alpha !== undefined) ctx.globalAlpha *= alpha;
    ctx.stroke(new Path2D(d));
    ctx.restore();
  };
  const pFill = (d: string, col?: string, alpha?: number) => {
    ctx.save();
    if (col) ctx.fillStyle = col;
    if (alpha !== undefined) ctx.globalAlpha *= alpha;
    ctx.fill(new Path2D(d));
    ctx.restore();
  };
  const dot = (x: number, y: number, r: number, col?: string) => {
    ctx.save();
    ctx.fillStyle = col || primaryCol;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  const heart = (x: number, y: number, s: number, col: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    pFill("M0 2.2C0 .9 1 0 2.1 0c.8 0 1.5.5 1.9 1.1C4.4.5 5.1 0 5.9 0 7 0 8 .9 8 2.2 8 4.6 4 7 4 7S0 4.6 0 2.2z", col);
    ctx.restore();
  };

  if (idx === 0) {
    rrect(ctx, 19, 7, 26, 50, 6);
    ctx.stroke();
    pStroke("M29 12.5h6");
    dot(32, 51.5, 1.5);
    pStroke("M24 22h16a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-9l-4.5 3.5V34H24a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 24 22z");
    dot(27.5, 28, 1.5);
    dot(32, 28, 1.5);
    dot(36.5, 28, 1.5);
    pStroke("M25 42h14M25 46h9", primaryCol, 0.55);
    heart(48, 26, 1, accentCol);
    heart(52, 36, 0.78, accentCol);
  } else if (idx === 1) {
    pStroke("M12 27v10h7l19 11V16L19 27z");
    pStroke("M19 37l3 11h5.5l-2.5-11");
    pStroke("M12 27h-1.5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2H12");
    pStroke("M44 25.5q4.5 6.5 0 13", accentCol);
    pStroke("M48.5 21q8 11 0 22", accentCol);
    pStroke("M53 16.5q11.5 15.5 0 31", accentCol);
  } else if (idx === 2) {
    rrect(ctx, 8, 13, 48, 38, 5);
    ctx.stroke();
    ctx.save();
    ctx.setLineDash([4, 4]);
    pStroke("M8 19.5h48M8 44.5h48");
    ctx.restore();
    pStroke("M8 23.5h48M8 40.5h48", primaryCol, 0.4);
    pFill("M28 26.5l10 5.5-10 5.5z", accentCol);
    pStroke("M28 26.5l10 5.5-10 5.5z", accentCol);
  } else if (idx === 3) {
    ctx.beginPath();
    ctx.arc(32, 33, 21, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha *= 0.6;
    ctx.beginPath();
    ctx.arc(32, 33, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    pStroke("M32 24l7.8 4.5v9L32 42l-7.8-4.5v-9z", accentCol);
    pStroke("M32 24v-9.8M39.8 28.5l8.5-4.9M39.8 37.5l8.5 4.9M32 42v9.8M24.2 37.5l-8.5 4.9M24.2 28.5l-8.5-4.9", primaryCol, 0.48);
    pFill("M51 6.5l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z", accentCol);
  } else if (idx === 4) {
    pStroke("M6 13h52");
    pStroke("M9 13q5 17 0 35M55 13q-5 17 0 35", primaryCol, 0.72);
    pStroke("M6 50h52M10 50v6M54 50v6");
    pFill("M32 14l-11 34h22z", accentCol, 0.34);
    dot(32, 16, 2.6, accentCol);
    ctx.beginPath();
    ctx.arc(32, 36.5, 2.8, 0, Math.PI * 2);
    ctx.stroke();
    pStroke("M32 39.5v6M28 43l4-2 4 2");
  } else if (idx === 5) {
    ctx.save();
    ctx.globalAlpha *= 0.75;
    rrect(ctx, 30, 8, 25, 31, 2.5);
    ctx.stroke();
    ctx.restore();
    pStroke("M35 15h15M35 20h15M35 25h10", primaryCol, 0.55);
    pFill("M13 26h24a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H23l-7.5 6.5V46H13a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4z", bgFill);
    pStroke("M13 26h24a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H23l-7.5 6.5V46H13a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4z");
    dot(18.5, 36, 1.8, accentCol);
    dot(25, 36, 1.8, accentCol);
    dot(31.5, 36, 1.8, accentCol);
  } else if (idx === 6) {
    pStroke("M9 8v46h47");
    pStroke("M14 47l10-11 8 5 10-16 10-7", accentCol);
    dot(52, 18, 2.2, accentCol);
    ctx.save();
    ctx.globalAlpha *= 0.75;
    ctx.beginPath();
    ctx.arc(23, 20, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    pFill("M23 14.5l2 5.5-2 5.5-2-5.5z", primaryCol);
  } else if (idx === 7) {
    pStroke(
      "M13 18L32 12M13 18L32 27M13 32L32 27M13 32L32 42M13 46L32 42M13 46L32 53M32 12L51 24M32 27L51 24M32 27L51 40M32 42L51 40M32 42L51 24M32 53L51 40M13 18L32 42M13 46L32 27",
      primaryCol,
      0.42,
    );
    ([[13, 18], [13, 32], [13, 46], [32, 12], [32, 27], [32, 42], [32, 53], [51, 24], [51, 40]] as const).forEach((pt) => {
      dot(pt[0], pt[1], 3.4, accentCol);
    });
  } else {
    rrect(ctx, 22, 22, 20, 20, 3);
    ctx.stroke();
    ctx.save();
    ctx.strokeStyle = accentCol;
    rrect(ctx, 27.5, 27.5, 9, 9, 1.5);
    ctx.stroke();
    ctx.restore();
    pStroke("M32 22V11H14", accentCol);
    pStroke("M42 32h12V13", accentCol);
    pStroke("M32 42v11h18", accentCol);
    pStroke("M22 32H10v18", accentCol);
    dot(14, 11, 2.2);
    dot(54, 13, 2.2);
    dot(50, 53, 2.2);
    dot(10, 50, 2.2);
  }
  ctx.restore();
}

export function createSplitHero(canvas: HTMLCanvasElement, opts: SplitHeroOpts): SplitHero {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { resize: () => {}, setPaused: () => {}, setHovered: () => {}, destroy: () => {} };
  const g2 = ctx;
  const { services, colorFor, family, measureGrid, onStageChange, onCaption } = opts;

  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const phone = window.innerWidth < 760;
  // Dense particle cloud (always exact multiple of 9) for rich seamless streaming
  const PER_LOGO = phone ? 300 : cores >= 8 && mem >= 8 ? 640 : cores >= 4 ? 460 : 320;
  const N = PER_LOGO * 9;

  // Normalized coordinates of the condensed 9 (`S9`) & each service icon (`SL`)
  const nineX = new Float32Array(N);
  const nineY = new Float32Array(N);
  const nineC = new Uint8Array(N * 3);
  const logoX = new Float32Array(N);
  const logoY = new Float32Array(N);
  const logoC = new Uint8Array(N * 3);
  const partG = new Uint8Array(N);

  // Full-frame perimeter edge emission (`edge 0..3`, zero circular halo!) matching ParticleStage
  const edgeX = new Float32Array(N);
  const edgeY = new Float32Array(N);
  const edgeDelay = new Float32Array(N);
  const edgeSpd = new Float32Array(N);

  // Full-field multi-directional shatter scatter — continuous organic dispersion around the stage, zero square/ring cutoff
  const fieldX = new Float32Array(N);
  const fieldY = new Float32Array(N);
  const bow = new Float32Array(N);
  const jitX = new Float32Array(N);
  const jitY = new Float32Array(N);

  const rnd = makeRng(202609);
  for (let i = 0; i < N; i++) {
    const side = Math.floor(rnd() * 4);
    const along = -0.04 + rnd() * 1.08;
    edgeX[i] = side === 0 ? -0.04 : side === 1 ? 1.04 : along;
    edgeY[i] = side === 2 ? -0.04 : side === 3 ? 1.04 : along;
    edgeDelay[i] = rnd() * 0.42;
    edgeSpd[i] = 0.82 + rnd() * 0.42;

    // Centered RADIAL (polar) dispersion so the scatter/gather cloud reads as a soft feathered ellipse,
    // never a rectangular "box" envelope — independent x/y spreads fill a rectangle; a radius fills a disc.
    const fa = rnd() * Math.PI * 2;
    const fr = Math.sqrt(rnd()) * (0.8 + rnd() * 0.35);
    fieldX[i] = Math.cos(fa) * fr;
    fieldY[i] = Math.sin(fa) * fr;
    bow[i] = (rnd() < 0.5 ? -1 : 1) * (0.04 + rnd() * 0.1);
    const ja = rnd() * Math.PI * 2;
    jitX[i] = Math.cos(ja) * (0.02 + rnd() * 0.04);
    jitY[i] = Math.sin(ja) * (0.02 + rnd() * 0.04);
  }

  /**
   * Timeline (seconds):
   * - First paint starts at T_SCATTER (the gather) so the opening matches the loop — no edge "frame".
   * - Endless loop: T_FORM (1.45) -> CYCLE (10.30) -> jumps seamlessly to T_FORM!
   * - Phase 0 (edge sweep) is kept for reference but is no longer reached.
   */
  const T_FORM = 1.45; //    0.00..1.45   edge sweep -> solid 3D condensed "9"
  const T_HOLD9 = 2.65; //   1.45..2.65   solid 3D sculpted "9" holds & tilts interactively
  const T_EXPLODE = 3.70; // 2.65..3.70   "9" fractures directly onto all 9 DOM icon slots
  const T_ICONS = 4.70; //   3.70..4.70   1.00s hold: all 9 attractive animated icons before names
  const T_NAMES = 7.95; //   4.70..7.95   staggered service names revealed, hover pauses loop
  const T_SCATTER = 8.85; // 7.95..8.85   tiles release & scatter multi-directionally across frame
  const CYCLE = 10.30; //    8.85..10.30  wide scattered field sweeps inward back to solid 3D "9"

  let clock = T_SCATTER; // open on the seamless gather (phase 6), skipping the one-time edge-sweep that rendered a rectangular "frame"
  let hoveredIdx = -1;
  let mx = -999;
  let my = -999;
  let W = 0;
  let H = 0;
  let dpr = 1;
  let built = false;
  let builtDark = false;
  let pal: Pal = palette(isDark());
  const rotX = 0; // flat 2D "9": no perspective rotation (kept at 0 so particle projection stays flat)
  const rotY = 0;
  let lastStage: SplitStage | null = null;
  let lastBold = "";
  let lastLine = "";

  const idxFor = (i: number) => ICON_INDEX[services[i].icon];

  function emitStage(s: SplitStage) {
    if (s === lastStage) return;
    lastStage = s;
    onStageChange?.(s);
  }

  function caption(bold: string, line: string) {
    if (bold === lastBold && line === lastLine) return;
    lastBold = bold;
    lastLine = line;
    onCaption?.(bold, line);
  }

  function buildShapes() {
    if (built) return;
    built = true;
    builtDark = isDark();
    pal = palette(builtDark);

    const cs = getComputedStyle(document.documentElement);
    const strokeBlueSoft = cs.getPropertyValue("--nl-blue-soft").trim() || (builtDark ? "#9fa4ff" : "#4338ca");
    const bubbleBg = cs.getPropertyValue("--nl-bg").trim() || (builtDark ? "#050507" : "#e9ddeb");

    // 1. Sample exact Albert Sans 900 "9" with CONDENSE_X so particle endpoints align 1:1 with drawSolid3DNine
    const S9 = 280;
    const c9 = document.createElement("canvas");
    c9.width = c9.height = S9;
    const g9 = c9.getContext("2d", { willReadFrequently: true });
    if (!g9) return;
    g9.save();
    g9.translate(S9 * 0.5, S9 * 0.5);
    g9.scale(CONDENSE_X, 1);
    g9.font = `900 ${Math.round(S9 * 0.84)}px ${family}`;
    g9.textAlign = "center";
    g9.textBaseline = "middle";
    const grad = g9.createLinearGradient(-S9 * 0.32, -S9 * 0.36, S9 * 0.34, S9 * 0.38);
    grad.addColorStop(0, pal.textFrom);
    grad.addColorStop(1, pal.textTo);
    g9.fillStyle = grad;
    g9.fillText("9", 0, S9 * 0.02);
    g9.restore();

    const d9 = g9.getImageData(0, 0, S9, S9).data;
    const pts9: [number, number, number, number, number][] = [];
    for (let y = 0; y < S9; y += 2) {
      for (let x = 0; x < S9; x += 2) {
        const pi = (y * S9 + x) * 4;
        if (d9[pi + 3] > 96) pts9.push([(x - S9 * 0.5) / S9, (y - S9 * 0.5) / S9, d9[pi], d9[pi + 1], d9[pi + 2]]);
      }
    }
    // Sort by polar sweep + radius so shards peel cleanly off strokes without donut clumping
    pts9.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
    for (let i = 0; i < N; i++) {
      const sp = pts9[Math.floor((i * pts9.length) / N) % pts9.length];
      nineX[i] = sp[0];
      nineY[i] = sp[1];
      nineC[i * 3] = sp[2];
      nineC[i * 3 + 1] = sp[3];
      nineC[i * 3 + 2] = sp[4];
    }

    // 2. Sample all 9 real ActivityIcons using resolved theme ink (--nl-blue-soft) + per-service hue
    for (let s = 0; s < 9; s++) {
      const SL = 96;
      const cl = document.createElement("canvas");
      cl.width = cl.height = SL;
      const gl = cl.getContext("2d", { willReadFrequently: true });
      if (!gl) continue;
      drawSiteIcon(gl, idxFor(s), SL * 0.5, SL * 0.5, 76, strokeBlueSoft, colorFor(services[s].icon), bubbleBg, 3.6);
      const dl = gl.getImageData(0, 0, SL, SL).data;
      const ptsL: [number, number, number, number, number][] = [];
      for (let ly = 0; ly < SL; ly += 2) {
        for (let lx = 0; lx < SL; lx += 2) {
          const lpi = (ly * SL + lx) * 4;
          if (dl[lpi + 3] > 80) ptsL.push([(lx - SL * 0.5) / SL, (ly - SL * 0.5) / SL, dl[lpi], dl[lpi + 1], dl[lpi + 2]]);
        }
      }
      // Shuffle icon sample order for organic fracture landings
      const lr = makeRng(401 + s * 97);
      for (let a = ptsL.length - 1; a > 0; a--) {
        const b = (lr() * (a + 1)) | 0;
        const tmp = ptsL[a];
        ptsL[a] = ptsL[b];
        ptsL[b] = tmp;
      }
      for (let p = 0; p < PER_LOGO; p++) {
        const idx = s * PER_LOGO + p;
        const lp = ptsL[p % ptsL.length] || [0, 0, 90, 72, 245];
        partG[idx] = s;
        logoX[idx] = lp[0];
        logoY[idx] = lp[1];
        logoC[idx * 3] = lp[2];
        logoC[idx * 3 + 1] = lp[3];
        logoC[idx * 3 + 2] = lp[4];
      }
    }
  }

  /** Draws a flat 2D condensed Albert Sans "9" in the brand gradient (no extrusion / perspective). */
  function drawFlatNine(cx: number, cy: number, scale: number, alpha: number) {
    if (alpha <= 0.01) return;
    const fontPx = Math.round(scale * 0.84);
    g2.save();
    g2.globalAlpha = alpha;
    g2.font = `900 ${fontPx}px ${family}`;
    g2.textAlign = "center";
    g2.textBaseline = "middle";
    g2.translate(cx, cy);
    g2.scale(CONDENSE_X, 1); // same horizontal condense as the sampled particle "9" so the hand-off aligns

    const frontG = g2.createLinearGradient(-scale * 0.32, -scale * 0.36, scale * 0.34, scale * 0.38);
    frontG.addColorStop(0, pal.textFrom);
    frontG.addColorStop(1, pal.textTo);
    g2.fillStyle = frontG;
    if (builtDark) {
      g2.shadowColor = "rgba(92,224,230,.30)";
      g2.shadowBlur = 14;
    }
    g2.fillText("9", 0, scale * 0.02);
    g2.restore();
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function update(dt: number) {
    if (!built || builtDark !== isDark()) {
      built = false;
      buildShapes();
    }
    if (!W) resize();
    if (!W) return;

    if (hoveredIdx < 0) {
      clock += dt;
      if (clock >= CYCLE) {
        // Wrap straight into Hold 3D 9 so the post-gather solid 9 holds seamlessly without re-entering edges
        clock = T_FORM + (clock - CYCLE);
      }
    }

    const metrics = measureGrid();
    const cx = metrics ? metrics.cx : W * 0.5;
    const cy = metrics ? metrics.cy : H * 0.5;
    const nineScale = metrics ? metrics.scale : Math.min(W, H) * 0.72;
    const targets = metrics?.icons || [];

    g2.clearRect(0, 0, W, H);

    // Phase segmentation:
    // 0: Form from all viewport edges (0..1.45)
    // 1: Solid 3D "9" Hold (1.45..2.65)
    // 2: Explode/Fracture directly onto 9 measured ActivityIcon centers (2.65..3.70)
    // 3: Hold live animated 3x3 .finale-tile icons ONLY (3.70..4.70 = exact 1.00s!)
    // 4: Names revealed + interactive hover/explore (4.70..7.95)
    // 5: Release -> Scatter multi-directionally across full canvas field (7.95..8.85)
    // 6: Gather inward from scattered full-canvas field back into 3D "9" (8.85..10.30)
    const phase =
      clock < T_FORM
        ? 0
        : clock < T_HOLD9
          ? 1
          : clock < T_EXPLODE
            ? 2
            : clock < T_ICONS
              ? 3
              : clock < T_NAMES
                ? 4
                : clock < T_SCATTER
                  ? 5
                  : 6;

    // Synchronize real DOM .finale-tile 3x3 overlay visibility & staggered name reveal
    if (phase === 2) {
      const eu = (clock - T_HOLD9) / (T_EXPLODE - T_HOLD9);
      emitStage(eu > 0.74 ? "icons" : "nine");
    } else if (phase === 3) {
      emitStage("icons");
    } else if (phase === 4) {
      emitStage("names");
    } else {
      emitStage("nine");
    }

    // Flat 2D "9": no perspective lean (rotX/rotY stay 0, so the glyph and particles render flat).

    // Compute solid 3D "9" vs particle swarm opacities so "9" never looks grainy when settled
    let solidOp = 0;
    let swarmOp = 0;
    let pU = 0;

    if (phase === 0) {
      pU = clock / T_FORM;
      solidOp = pU > 0.78 ? smooth01((pU - 0.78) / 0.22) : 0;
      swarmOp = 1 - solidOp;
    } else if (phase === 1) {
      solidOp = 1;
      swarmOp = 0;
    } else if (phase === 2) {
      pU = (clock - T_HOLD9) / (T_EXPLODE - T_HOLD9);
      solidOp = pU < 0.14 ? 1 - smooth01(pU / 0.14) : 0;
      const landFade = pU > 0.78 ? smooth01((pU - 0.78) / 0.22) : 0;
      swarmOp = (1 - solidOp * 0.6) * (1 - landFade);
    } else if (phase === 5) {
      pU = (clock - T_NAMES) / (T_SCATTER - T_NAMES);
      swarmOp = pU < 0.16 ? smooth01(pU / 0.16) : 1;
    } else if (phase === 6) {
      pU = (clock - T_SCATTER) / (CYCLE - T_SCATTER);
      solidOp = pU > 0.80 ? smooth01((pU - 0.80) / 0.20) : 0;
      swarmOp = 1 - solidOp;
    }

    // Draw particle swarm (ZERO particles rendered when solid 3D "9" or live 3x3 DOM cards are at rest!)
    if (swarmOp > 0.01 && targets.length === 9) {
      const sz = Math.max(1.8, Math.min(3.4, nineScale * (phone ? 0.0092 : 0.0068)));
      const half = sz * 0.5;
      const sxTilt = Math.cos(rotY);
      const syTilt = Math.cos(rotX);
      const spreadW = Math.max(nineScale * 1.55, W * (phone ? 0.48 : 0.31));
      const spreadH = Math.max(nineScale * 1.25, H * 0.38);

      for (let i = 0; i < N; i++) {
        const tg = targets[partG[i]];
        const tIconSz = tg ? tg.size * 1.18 : 38;
        const lxp = (tg ? tg.x : cx) + logoX[i] * tIconSz;
        const lyp = (tg ? tg.y : cy) + logoY[i] * tIconSz;

        // Perspective-matched position inside condensed 3D 9 silhouette
        const nx = cx + nineX[i] * nineScale * sxTilt;
        const ny = cy + nineY[i] * nineScale * syTilt;
        const fx = cx + fieldX[i] * spreadW;
        const fy = cy + fieldY[i] * spreadH;

        let px: number;
        let py: number;
        let colM: number;

        if (phase === 0) {
          // Stream in continuously across all 4 hero outer borders with staggered individual speeds
          const p = clamp01((pU * 1.44 - edgeDelay[i]) * edgeSpd[i]);
          const e = easeOut(p);
          const sx0 = edgeX[i] * W;
          const sy0 = edgeY[i] * H;
          const midX = (sx0 + nx) * 0.5 + bow[i] * W * 0.34;
          const midY = (sy0 + ny) * 0.5 + jitY[i] * H * 0.5;
          const ve = 1 - e;
          px = ve * ve * sx0 + 2 * ve * e * midX + e * e * nx;
          py = ve * ve * sy0 + 2 * ve * e * midY + e * e * ny;
          colM = 0;
        } else if (phase === 2) {
          // Crack directly outward out of 9 silhouette along vivid luminous arcs straight into each 3x3 icon slot
          const u = cubicIO(pU);
          const bell = Math.sin(u * Math.PI);
          const outX = nx + nineX[i] * nineScale * 0.34;
          const outY = ny + nineY[i] * nineScale * 0.34;
          const ctrlX = (outX + lxp) * 0.5 + (bow[i] + jitX[i]) * nineScale * 0.62;
          const ctrlY = (outY + lyp) * 0.5 + jitY[i] * nineScale * 0.62;
          const ve = 1 - u;
          px = ve * ve * nx + 2 * ve * u * (ctrlX + bell * nineX[i] * nineScale * 0.14) + u * u * lxp;
          py = ve * ve * ny + 2 * ve * u * (ctrlY + bell * nineY[i] * nineScale * 0.14) + u * u * lyp;
          colM = clamp01(u * 1.3);
        } else if (phase === 5) {
          // Explode multi-directionally with soft organic falloff (zero circular ring or box wall)
          const u = easeOut(pU);
          const midX = (lxp + fx) * 0.5 + bow[i] * spreadW * 0.36;
          const midY = (lyp + fy) * 0.5 + jitY[i] * spreadH * 0.42;
          const ve = 1 - u;
          px = ve * ve * lxp + 2 * ve * u * midX + u * u * fx;
          py = ve * ve * lyp + 2 * ve * u * midY + u * u * fy;
          colM = 1 - u * 0.45;
        } else {
          // Phase 6: Gather back in from distributed cloud back into condensed 3D 9
          const p = clamp01((pU * 1.28 - edgeDelay[i] * 0.55) * edgeSpd[i]);
          const e = cubicIO(p);
          const midX = (fx + nx) * 0.5 - bow[i] * spreadW * 0.42;
          const midY = (fy + ny) * 0.5 + jitX[i] * spreadH * 0.42;
          const ve = 1 - e;
          px = ve * ve * fx + 2 * ve * e * midX + e * e * nx;
          py = ve * ve * fy + 2 * ve * e * midY + e * e * ny;
          colM = 0.55 * (1 - e);
        }

        // Gentle magnetic cursor parting during 9 assembly/converge transitions
        if (mx > 0 && (phase === 0 || phase === 6)) {
          const dx = px - mx;
          const dy = py - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < 3600 && d2 > 0.1) {
            const d = Math.sqrt(d2);
            const f = (1 - d / 60) * 14;
            px += (dx / d) * f;
            py += (dy / d) * f;
          }
        }

        const r = nineC[i * 3] + (logoC[i * 3] - nineC[i * 3]) * colM;
        const gg = nineC[i * 3 + 1] + (logoC[i * 3 + 1] - nineC[i * 3 + 1]) * colM;
        const b = nineC[i * 3 + 2] + (logoC[i * 3 + 2] - nineC[i * 3 + 2]) * colM;
        // Soften alpha where a wide particle glides across the left copy / bottom caption — a GRADUAL
        // ramp, not a hard cutoff, so the fade never draws a straight box edge through the cloud.
        const copyFade = phone ? 1 : 0.36 + 0.64 * clamp01((px - (cx - nineScale * 1.04)) / (nineScale * 0.34));
        const capFade = 0.42 + 0.58 * (1 - clamp01((py - (cy + nineScale * 0.62)) / (nineScale * 0.34)));
        g2.globalAlpha = swarmOp * 0.92 * copyFade * capFade;
        g2.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
        g2.fillRect(px - half, py - half, sz, sz);
      }
      g2.globalAlpha = 1;
    }

    // Crisp flat 2D condensed "9" (zero grain when settled)
    if (solidOp > 0.01) {
      drawFlatNine(cx, cy, nineScale, solidOp);
    }

    // Bottom caption copy
    if (hoveredIdx >= 0 && services[hoveredIdx]) {
      const hs = services[hoveredIdx];
      caption(`0${hs.n} · ${hs.title}`, `Click to explore ${hs.short}.`);
    } else if (phase === 0) {
      caption("Forming the 9", "Particles stream in from every direction to lock into the 3D 9.");
    } else if (phase === 1) {
      caption("One team, one core", "Nine capabilities united inside the solid 3D Nine.");
    } else if (phase === 2) {
      caption("Exploding into 9 live capabilities…", "Fracturing cleanly into all nine Nine Labs blocks.");
    } else if (phase === 3) {
      caption("Nine logos formed", "Animated straight from the Nine Labs icon suite.");
    } else if (phase === 4) {
      caption("All nine ways we grow your brand", "Hover or click any block to explore · auto-loops cleanly.");
    } else {
      caption("Reuniting back into 9", "Scattering wide before sweeping back into the 3D 9.");
    }
  }

  let raf = 0;
  let last = 0;
  let paused = false;

  const tick = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000) || 0;
    last = t;
    if (!document.hidden) update(dt);
    raf = requestAnimationFrame(tick);
  };
  const startLoop = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stopLoop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const lx = e.clientX - r.left;
    const ly = e.clientY - r.top;
    // pointermove is on window (the canvas is pointer-events:none), so gate to the canvas
    // bounds — otherwise particles react to the cursor anywhere in the viewport before it arrives.
    if (lx < 0 || lx > r.width || ly < 0 || ly > r.height) {
      mx = my = -999;
      return;
    }
    mx = lx;
    my = ly;
  };
  const onLeave = () => {
    mx = my = -999;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  canvas.addEventListener("pointerleave", onLeave, { passive: true });

  const onVisibility = () => {
    if (document.hidden) stopLoop();
    else if (!paused) startLoop();
  };
  document.addEventListener("visibilitychange", onVisibility);

  resize();
  startLoop();

  return {
    resize,
    setPaused: (p: boolean) => {
      paused = p;
      if (p) stopLoop();
      else if (!document.hidden) startLoop();
    },
    setHovered: (idx: number) => {
      hoveredIdx = idx;
    },
    destroy: () => {
      stopLoop();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
