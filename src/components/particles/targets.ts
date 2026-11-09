/**
 * Particle targets for a numeral: render the digit in the digit typeface on a large offscreen
 * canvas and lay exactly `n` blue-noise (Poisson-disc) points over its filled pixels — evenly
 * spaced but organic: no rows, clumps or holes — so the number reads like print. Every digit gets the
 * same `n`, so particle i of "1" becomes particle i of "2" — the same swarm re-forms each number.
 * Points are kept in reading order (top → bottom, left → right), so a morph moves each region of
 * one digit to the matching region of the next.
 *
 * Coordinates are in units of the digit's height, centred on (0, 0): a slot just multiplies by its
 * own size. `e` is an edge factor (1 = on the outline, 0 = deep inside); `g` is the horizontal
 * position across the digit (0 = left, 1 = right), used for the logo gradient.
 */
export type Shape = {
  x: Float32Array;
  y: Float32Array;
  e: Float32Array;
  g: Float32Array;
  /** the digit's height as a fraction of the sampling canvas (to draw the solid glyph at the same size) */
  hr: number;
  /** the digit's width ÷ height (so a slot can make sure a wide digit still fits) */
  wr: number;
};

/** Font size used for sampling, as a fraction of the square canvas (the solid glyph uses the same). */
export const GLYPH_SIZE = 0.78;

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

/** Small deterministic RNG, so the same digit always samples the same way. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export function digitShape(ch: string, n: number, family: string): Shape {
  const key = `${ch}|${n}|${family}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const S = 600;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `900 ${Math.round(S * GLYPH_SIZE)}px ${family}`;
  const m = ctx.measureText(ch);
  const asc = m.actualBoundingBoxAscent;
  const desc = m.actualBoundingBoxDescent;
  const H = asc + desc || S * 0.6;
  ctx.fillText(ch, S / 2, S / 2 + (asc - desc) / 2);

  const data = ctx.getImageData(0, 0, S, S).data;
  const inside = (x: number, y: number) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    return xi >= 0 && yi >= 0 && xi < S && yi < S && data[(yi * S + xi) * 4 + 3] >= 128;
  };

  // filled area and horizontal extent
  let area = 0;
  let minX = S;
  let maxX = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (data[(y * S + x) * 4 + 3] >= 128) {
        area++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }

  // blue-noise (Poisson-disc, Bridson) points: evenly spaced but organic — no rows, clumps or holes.
  // The spacing is tuned until there are at least n points.
  const r = rng(ch.charCodeAt(0) * 9973 + n);
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
    // seed every separate part of the digit, then grow outwards from each seed
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
  // reading order (bands top → bottom, left → right) so morphs map region to region
  {
    const band = d * 1.5;
    const order = Array.from({ length: pts.length / 2 }, (_, i) => i).sort(
      (i, j) => Math.floor(pts[i * 2 + 1] / band) - Math.floor(pts[j * 2 + 1] / band) || pts[i * 2] - pts[j * 2],
    );
    pts = order.flatMap((i) => [pts[i * 2], pts[i * 2 + 1]]);
  }
  const count = pts.length / 2;

  // exactly n: drop evenly spread extras (keeps reading order), or top up inside the digit
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

  // distance to the outline, in fractions of the digit's height
  const radii = [0.018, 0.04, 0.07].map((f) => f * H);
  const shape: Shape = { x: new Float32Array(n), y: new Float32Array(n), e: new Float32Array(n), g: new Float32Array(n), hr: H / S, wr: (maxX - minX) / H };
  const span = Math.max(1, maxX - minX);
  for (let i = 0; i < n; i++) {
    const px = keep[i * 2];
    const py = keep[i * 2 + 1];
    let e = 0;
    edge: for (let ri = 0; ri < radii.length; ri++) {
      for (const [dx, dy] of DIRS) {
        if (!inside(px + dx * radii[ri], py + dy * radii[ri])) {
          e = ri === 0 ? 1 : ri === 1 ? 0.6 : 0.25;
          break edge;
        }
      }
    }
    shape.x[i] = (px - S / 2) / H;
    shape.y[i] = (py - S / 2) / H;
    shape.e[i] = e;
    shape.g[i] = (px - minX) / span;
  }
  cache.set(key, shape);
  return shape;
}
