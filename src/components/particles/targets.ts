/**
 * Particle targets for a numeral: render the digit in the logo's typeface on an offscreen canvas,
 * read the filled pixels, and pick exactly `n` of them. Every digit gets the same `n`, so particle
 * i of "1" becomes particle i of "2" — the same swarm re-forms each number.
 *
 * Coordinates are in units of the digit's height, centred on (0, 0): a slot just multiplies by its
 * own size. `e` is an edge factor (1 = on the outline, 0 = deep inside) — edges glow purple, the
 * body electric blue, as the brief describes the 9.
 */
export type Shape = { x: Float32Array; y: Float32Array; e: Float32Array };

const cache = new Map<string, Shape>();
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.7, 0.7],
  [-0.7, 0.7],
  [0.7, -0.7],
  [-0.7, -0.7],
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

  const S = 280;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `900 ${S * 0.9}px ${family}`;
  const m = ctx.measureText(ch);
  const asc = m.actualBoundingBoxAscent;
  const desc = m.actualBoundingBoxDescent;
  const H = asc + desc || S * 0.7;
  ctx.fillText(ch, S / 2, S / 2 + (asc - desc) / 2);

  const data = ctx.getImageData(0, 0, S, S).data;
  const alpha = (x: number, y: number) => (x < 0 || y < 0 || x >= S || y >= S ? 0 : data[(y * S + x) * 4 + 3]);

  const pts: number[] = [];
  const step = 2;
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      if (alpha(x, y) < 128) continue;
      let e = 0;
      for (const [dx, dy] of DIRS) {
        if (alpha(Math.round(x + dx * 3), Math.round(y + dy * 3)) < 128) e = 1;
        else if (e < 0.5 && alpha(Math.round(x + dx * 7), Math.round(y + dy * 7)) < 128) e = 0.5;
      }
      pts.push(x, y, e);
    }
  }

  const count = pts.length / 3;
  const r = rng(ch.charCodeAt(0) * 9973 + n);
  // shuffle indices, then take n (repeat with jitter if the digit has fewer pixels than n)
  const idx = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const shape: Shape = { x: new Float32Array(n), y: new Float32Array(n), e: new Float32Array(n) };
  for (let i = 0; i < n; i++) {
    const k = idx[i % Math.max(1, count)] ?? 0;
    const jx = (r() - 0.5) * step;
    const jy = (r() - 0.5) * step;
    shape.x[i] = (pts[k * 3] + jx - S / 2) / H;
    shape.y[i] = (pts[k * 3 + 1] + jy - S / 2) / H;
    shape.e[i] = pts[k * 3 + 2];
  }
  cache.set(key, shape);
  return shape;
}
