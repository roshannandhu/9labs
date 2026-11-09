/**
 * The one shared colour palette for every particle shape (digits and the service pictures) and
 * for drawing the pictures themselves. Every colour a picture's canvas drawing uses comes from
 * this object, so the particle swarm's own colour (nearest-swatch, see `nearestSwatch`) always
 * exactly matches what the formed picture looks like — no quantisation drift.
 */
export type Pal = {
  /** digit gradient endpoints — the logo gradient (globals.css --logo-from/--logo-to) */
  textFrom: string;
  textTo: string;
  /** body / outline of solid objects (phones, cameras, boards…) */
  ink: string;
  inkLight: string;
  /** secondary fill: panels, screens, paper */
  panel: string;
  /** bright brand accent (purple in light, cyan in dark) */
  accent: string;
  /** the other brand accent (indigo-ish in light, purple in dark) */
  accent2: string;
  /** likes / hearts */
  warm: string;
  /** rec dot / live indicators */
  red: string;
  /** stage lights, sparks, flashes */
  amber: string;
  /** gloss highlight */
  white: string;
  /** soft shadow under objects */
  shadow: string;
};

export function palette(dark: boolean): Pal {
  return dark
    ? {
        textFrom: "#8c53fe",
        textTo: "#5ce0e6",
        ink: "#1c2030",
        inkLight: "#2a3042",
        panel: "#11131c",
        accent: "#5ce0e6",
        accent2: "#8c53fe",
        warm: "#ff6f9c",
        red: "#ff5468",
        amber: "#ffc061",
        white: "#f4f2ff",
        shadow: "#05060a",
      }
    : {
        textFrom: "#030303",
        textTo: "#3533cb",
        ink: "#15131f",
        inkLight: "#2b2740",
        panel: "#eee9fb",
        accent: "#8c53fe",
        accent2: "#3533cb",
        warm: "#ff5a8a",
        red: "#ff4d5e",
        amber: "#f5a93f",
        white: "#ffffff",
        shadow: "#c9bfe6",
      };
}

/** Every swatch in the palette, as [r,g,b] — the fixed set particles snap to. */
function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export type SwatchTable = { hex: string[]; rgb: [number, number, number][] };

export function swatchTable(pal: Pal): SwatchTable {
  const hex = Object.values(pal);
  return { hex, rgb: hex.map(toRgb) };
}

/** The palette index whose colour is closest to [r,g,b] (plain squared distance — ≤12 entries, cheap). */
export function nearestSwatch(table: SwatchTable, r: number, g: number, b: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < table.rgb.length; i++) {
    const [tr, tg, tb] = table.rgb[i];
    const d = (tr - r) ** 2 + (tg - g) ** 2 + (tb - b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}
