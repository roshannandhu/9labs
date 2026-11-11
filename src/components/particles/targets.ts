import { palette, type Pal } from "./palette";

/**
 * Particle targets for a shape (a digit, or a service picture): draw it fully coloured on a large
 * offscreen canvas, lay exactly `n` blue-noise (Poisson-disc) points over its filled, visible
 * pixels — evenly spaced but organic: no rows, clumps or holes — and keep each point's own pixel
 * colour, so the swarm carries the picture's real gradients and shading.
 *
 * Every shape gets the same `n`, so particle i of one shape becomes particle i of the next — the
 * same swarm re-forms every time. Points are kept in **polar order** (angle around the shape's
 * centre, then radius), so a flight between two shapes reads as one coherent swirl/vortex rather
 * than criss-crossing.
 *
 * Coordinates are in units of the shape's height, centred on its bounding box. `hr`, `ox` and `oy`
 * place that box inside the square canvas the crisp version is drawn on, so a slot can land the
 * particles exactly on top of it. `z` is a fake depth (0 = flat/inner, 1 = near the edge/outline)
 * used to widen a particle's flight path for a bit of parallax.
 */
export type Shape = {
  x: Float32Array;
  y: Float32Array;
  /** the particle's own pixel colour, [r, g, b] per particle */
  rgb: Uint8Array;
  /** fake depth 0..1, used only for the flight (size / path width), not while resting */
  z: Float32Array;
  /** the shape's height as a fraction of the sampling canvas */
  hr: number;
  /** the bounding box centre's offset from the canvas centre, as a fraction of the canvas */
  ox: number;
  oy: number;
};

/** Font size used for sampling a digit, as a fraction of the square canvas. */
export const GLYPH_SIZE = 0.78;

const SAMPLE_SIZE = 320;
const cache = new Map<string, Shape>();
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
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
 * Draws `draw(ctx, S)` fully coloured on a 320px canvas, then samples it into a Shape: `n`
 * blue-noise points over its visible (alpha ≥ 0.5) pixels, each carrying its own pixel colour and
 * a depth from how close it sits to the shape's edge.
 */
function sampleShape(key: string, n: number, seed: number, draw: (ctx: CanvasRenderingContext2D, S: number) => void): Shape {
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
  const mask = new Uint8Array(S * S);

  // filled area + bounding box + opaque alpha mask in one pass
  let area = 0;
  let minX = S;
  let maxX = 0;
  let minY = S;
  let maxY = 0;
  for (let y = 0; y < S; y++) {
    const row = y * S;
    for (let x = 0; x < S; x++) {
      const p = row + x;
      if (data[p * 4 + 3] >= 128) {
        mask[p] = 1;
        area++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const inside = (x: number, y: number) => {
    if (x < -0.5 || y < -0.5) return false;
    const xi = (x + 0.5) | 0;
    const yi = (y + 0.5) | 0;
    return xi < S && yi < S && mask[yi * S + xi] === 1;
  };
  const H = Math.max(1, maxY - minY);

  // blue-noise (Poisson-disc, Bridson) points: evenly spaced but organic — no rows, clumps or holes.
  const r = rng(seed);
  const TWO_PI = Math.PI * 2;
  const poisson = (rad: number) => {
    const cell = rad / Math.SQRT2;
    const invCell = 1 / cell;
    const rad2 = rad * rad;
    const gw = Math.ceil(S * invCell);
    const grid = new Int32Array(gw * gw).fill(-1);
    const out: number[] = [];
    const active: number[] = [];
    const fits = (x: number, y: number) => {
      if (!inside(x, y)) return false;
      const gx = Math.max(0, (x * invCell) | 0);
      const gy = Math.max(0, (y * invCell) | 0);
      const j0 = gy > 2 ? gy - 2 : 0;
      const j1 = gy + 2 < gw ? gy + 2 : gw - 1;
      const i0 = gx > 2 ? gx - 2 : 0;
      const i1 = gx + 2 < gw ? gx + 2 : gw - 1;
      for (let j = j0; j <= j1; j++) {
        const gRow = j * gw;
        for (let i = i0; i <= i1; i++) {
          const k = grid[gRow + i];
          if (k < 0) continue;
          const dx = out[k * 2] - x;
          const dy = out[k * 2 + 1] - y;
          if (dx * dx + dy * dy < rad2) return false;
        }
      }
      return true;
    };
    const add = (x: number, y: number) => {
      const k = out.length >> 1;
      out.push(x, y);
      const gx = Math.max(0, Math.min(gw - 1, (x * invCell) | 0));
      const gy = Math.max(0, Math.min(gw - 1, (y * invCell) | 0));
      grid[gy * gw + gx] = k;
      active.push(k);
    };
    for (let sy = rad * 0.5; sy < S; sy += rad) {
      for (let sx = rad * 0.5; sx < S; sx += rad) {
        if (!fits(sx, sy)) continue;
        add(sx, sy);
        while (active.length) {
          const ai = (r() * active.length) | 0;
          const k = active[ai];
          const kx = out[k * 2];
          const ky = out[k * 2 + 1];
          let found = false;
          for (let t = 0; t < 12; t++) {
            const ang = r() * TWO_PI;
            const m = rad * (1 + r());
            const x = kx + Math.cos(ang) * m;
            const y = ky + Math.sin(ang) * m;
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
  let d = Math.sqrt(area / (Math.max(1, n) * 1.72));
  let pts = poisson(d);
  for (let k = 0; k < 1 && pts.length / 2 < n; k++) {
    d *= Math.sqrt(pts.length / 2 / n) * 0.96;
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
  const angles = new Float32Array(n);
  const dists = new Float32Array(n);
  const order = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    order[i] = i;
    const dx = keep[i * 2] - cx;
    const dy = keep[i * 2 + 1] - cy;
    angles[i] = Math.atan2(dy, dx);
    dists[i] = dx * dx + dy * dy;
  }
  order.sort((i, j) => {
    const da = angles[i] - angles[j];
    return da !== 0 ? da : dists[i] - dists[j];
  });

  const radii = [0.018, 0.04, 0.07].map((f) => f * H);
  const shape: Shape = {
    x: new Float32Array(n),
    y: new Float32Array(n),
    rgb: new Uint8Array(n * 3),
    z: new Float32Array(n),
    hr: H / S,
    ox: ((minX + maxX) / 2 - S / 2) / S,
    oy: (cy - S / 2) / S,
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
    shape.x[o] = (px - (minX + maxX) / 2) / H;
    shape.y[o] = (py - cy) / H;
    shape.rgb[o * 3] = data[pi];
    shape.rgb[o * 3 + 1] = data[pi + 1];
    shape.rgb[o * 3 + 2] = data[pi + 2];
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
  });
}

export type PictureDraw = (ctx: CanvasRenderingContext2D, S: number, pal: Pal, t: number) => void;

export function pictureShape(key: string, n: number, draw: PictureDraw, dark: boolean): Shape {
  const pal = palette(dark);
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  return sampleShape(`p|${key}|${n}|${dark}`, n, seed + n, (ctx, S) => draw(ctx, S, pal, 0));
}
