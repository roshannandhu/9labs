import { nearestSwatch, palette, swatchTable, type Pal } from "./palette";

/**
 * Particle targets for a shape (a digit, or a service picture): draw it fully coloured on a large
 * offscreen canvas, lay exactly `n` blue-noise (Poisson-disc) points over its filled, visible
 * pixels — evenly spaced but organic: no rows, clumps or holes — and read each point's own pixel
 * colour, snapped to the shared palette (see `palette.ts`). Because every picture is drawn from
 * that same palette, the snapped colour always exactly matches what the formed picture looks
 * like — the swarm's colour never drifts from the real thing.
 *
 * Every shape gets the same `n`, so particle i of one shape becomes particle i of the next — the
 * same swarm re-forms every time. Points are kept in **polar order** (angle around the shape's
 * centre, then radius), so a flight between two shapes reads as one coherent swirl/vortex rather
 * than criss-crossing.
 *
 * Coordinates are in units of the shape's height, centred on (0, 0): a slot just multiplies by
 * its own size. `z` is a fake depth (0 = flat/inner, 1 = near the edge/outline) used to widen and
 * brighten a particle's flight path for a bit of parallax.
 */
export type Shape = {
  x: Float32Array;
  y: Float32Array;
  /** index into the shared palette (palette.ts) — the particle's colour while flying */
  swatch: Uint8Array;
  /** fake depth 0..1, used only for the flight (size / path width), not while resting */
  z: Float32Array;
  /** the shape's height as a fraction of the sampling canvas (so a slot can draw it at the same scale) */
  hr: number;
  /** the shape's width ÷ height (so a slot can make sure a wide shape still fits) */
  wr: number;
};

/** Font size used for sampling a digit, as a fraction of the square canvas. */
export const GLYPH_SIZE = 0.78;

const SAMPLE_SIZE = 600;
const cache = new Map<string, Shape>();
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.71, 0.71],
  [-0.71, 0.71],
  [0.71, -0.71],
  [-0.71, -0.71],
];

/** Small deterministic RNG, so the same shape always samples the same way. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/**
 * Draws `draw(ctx, S)` fully coloured on a 600px canvas, then samples it into a Shape: `n`
 * blue-noise points over its visible (alpha ≥ 0.5) pixels, each carrying its own pixel colour
 * (snapped to `pal`'s shared palette) and a depth from how close it sits to the shape's edge.
 */
function sampleShape(key: string, n: number, seed: number, draw: (ctx: CanvasRenderingContext2D, S: number) => void, pal: Pal): Shape {
  const hit = cache.get(key);
  if (hit) return hit;

  const S = SAMPLE_SIZE;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  draw(ctx, S);

  const data = ctx.getImageData(0, 0, S, S).data;
  const inside = (x: number, y: number) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    return xi >= 0 && yi >= 0 && xi < S && yi < S && data[(yi * S + xi) * 4 + 3] >= 128;
  };

  // filled area + bounding box
  let area = 0;
  let minX = S;
  let maxX = 0;
  let minY = S;
  let maxY = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (data[(y * S + x) * 4 + 3] >= 128) {
        area++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const H = Math.max(1, maxY - minY);

  // blue-noise (Poisson-disc, Bridson) points: evenly spaced but organic — no rows, clumps or holes.
  const r = rng(seed);
  const poisson = (rad: number) => {
    const cell = rad / Math.SQRT2;
    const gw = Math.ceil(S / cell);
    const grid = new Int32Array(gw * gw).fill(-1);
    const out: number[] = [];
    const active: number[] = [];
    const fits = (x: number, y: number) => {
      if (!inside(x, y)) return false;
      const gx = Math.floor(x / cell);
      const gy = Math.floor(y / cell);
      for (let j = Math.max(0, gy - 2); j <= Math.min(gw - 1, gy + 2); j++) {
        for (let i = Math.max(0, gx - 2); i <= Math.min(gw - 1, gx + 2); i++) {
          const k = grid[j * gw + i];
          if (k < 0) continue;
          const dx = out[k * 2] - x;
          const dy = out[k * 2 + 1] - y;
          if (dx * dx + dy * dy < rad * rad) return false;
        }
      }
      return true;
    };
    const add = (x: number, y: number) => {
      const k = out.length / 2;
      out.push(x, y);
      grid[Math.floor(y / cell) * gw + Math.floor(x / cell)] = k;
      active.push(k);
    };
    for (let sy = rad / 2; sy < S; sy += rad) {
      for (let sx = rad / 2; sx < S; sx += rad) {
        if (!fits(sx, sy)) continue;
        add(sx, sy);
        while (active.length) {
          const ai = Math.floor(r() * active.length);
          const k = active[ai];
          let found = false;
          for (let t = 0; t < 24; t++) {
            const ang = r() * Math.PI * 2;
            const m = rad * (1 + r());
            const x = out[k * 2] + Math.cos(ang) * m;
            const y = out[k * 2 + 1] + Math.sin(ang) * m;
            if (fits(x, y)) {
              add(x, y);
              found = true;
              break;
            }
          }
          if (!found) {
            active[ai] = active[active.length - 1];
            active.pop();
          }
        }
      }
    }
    return out;
  };
  let d = Math.sqrt(area / (Math.max(1, n) * 1.25));
  let pts = poisson(d);
  for (let k = 0; k < 4 && pts.length / 2 < n; k++) {
    d *= Math.sqrt(pts.length / 2 / n) * 0.98;
    pts = poisson(d);
  }
  const count = pts.length / 2;

  // exactly n: drop evenly spread extras, or top up inside the shape
  const keep: number[] = [];
  if (count >= n) {
    for (let i = 0; i < n; i++) {
      const k = Math.floor((i * count) / n);
      keep.push(pts[k * 2], pts[k * 2 + 1]);
    }
  } else {
    keep.push(...pts);
    for (let guard = 0; keep.length / 2 < n && guard < n * 50; guard++) {
      const k = Math.floor(r() * count);
      const px = pts[k * 2] + (r() - 0.5) * d;
      const py = pts[k * 2 + 1] + (r() - 0.5) * d;
      if (inside(px, py)) keep.push(px, py);
    }
    while (keep.length / 2 < n) keep.push(keep[0], keep[1]);
  }

  // polar order: angle around the shape's centre, then radius — so a flight reads as one swirl
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const order = Array.from({ length: n }, (_, i) => i).sort((i, j) => {
    const ai = Math.atan2(keep[i * 2 + 1] - cy, keep[i * 2] - cx);
    const aj = Math.atan2(keep[j * 2 + 1] - cy, keep[j * 2] - cx);
    if (ai !== aj) return ai - aj;
    const ri = (keep[i * 2] - cx) ** 2 + (keep[i * 2 + 1] - cy) ** 2;
    const rj = (keep[j * 2] - cx) ** 2 + (keep[j * 2 + 1] - cy) ** 2;
    return ri - rj;
  });

  const radii = [0.018, 0.04, 0.07].map((f) => f * H);
  const table = swatchTable(pal);
  const shape: Shape = {
    x: new Float32Array(n),
    y: new Float32Array(n),
    swatch: new Uint8Array(n),
    z: new Float32Array(n),
    hr: H / S,
    wr: Math.max(1, maxX - minX) / H,
  };
  for (let o = 0; o < n; o++) {
    const i = order[o];
    const px = keep[i * 2];
    const py = keep[i * 2 + 1];
    let edge = 0;
    ring: for (let ri = 0; ri < radii.length; ri++) {
      for (const [dx, dy] of DIRS) {
        if (!inside(px + dx * radii[ri], py + dy * radii[ri])) {
          edge = ri === 0 ? 1 : ri === 1 ? 0.6 : 0.25;
          break ring;
        }
      }
    }
    const pi = (Math.round(py) * S + Math.round(px)) * 4;
    // a touch brighter right on the outline, for a crisp edge highlight
    const boost = edge >= 1 ? 0.22 : 0;
    const cr = data[pi] + (255 - data[pi]) * boost;
    const cg = data[pi + 1] + (255 - data[pi + 1]) * boost;
    const cb = data[pi + 2] + (255 - data[pi + 2]) * boost;
    shape.x[o] = (px - (minX + maxX) / 2) / H;
    shape.y[o] = (py - cy) / H;
    shape.swatch[o] = nearestSwatch(table, cr, cg, cb);
    shape.z[o] = Math.min(1, edge * 0.55 + r() * 0.45);
  }
  cache.set(key, shape);
  return shape;
}

export function digitShape(ch: string, n: number, family: string, dark: boolean): Shape {
  const pal = palette(dark);
  return sampleShape(`d|${ch}|${n}|${family}|${dark}`, n, ch.charCodeAt(0) * 9973 + n, (ctx, S) => {
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `900 ${Math.round(S * GLYPH_SIZE)}px ${family}`;
    const m = ctx.measureText(ch);
    const grad = ctx.createLinearGradient(S / 2 - m.actualBoundingBoxLeft, 0, S / 2 + m.actualBoundingBoxRight, 0);
    grad.addColorStop(0, pal.textFrom);
    grad.addColorStop(1, pal.textTo);
    ctx.fillStyle = grad;
    ctx.fillText(ch, S / 2, S / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  }, pal);
}

export type PictureDraw = (ctx: CanvasRenderingContext2D, S: number, pal: Pal, t: number) => void;

export function pictureShape(key: string, n: number, draw: PictureDraw, dark: boolean): Shape {
  const pal = palette(dark);
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  return sampleShape(`p|${key}|${n}|${dark}`, n, seed + n, (ctx, S) => draw(ctx, S, pal, 0), pal);
}
