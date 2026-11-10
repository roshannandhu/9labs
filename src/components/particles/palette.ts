/**
 * The one shared colour palette the service pictures and digits are drawn from. Particles take
 * their colour from the drawn pixels themselves (see `targets.ts`), so gradients, gloss and shading
 * carry into the swarm as they really look.
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

/** 16 levels per channel: the swarm batches its draw calls by this 12-bit key (≤ 4096 fill colours). */
export const COLOR_KEYS = 4096;
export const colorKey = (r: number, g: number, b: number) => (Math.round(r / 17) << 8) | (Math.round(g / 17) << 4) | Math.round(b / 17);
export const KEY_HEX: string[] = Array.from({ length: COLOR_KEYS }, (_, k) => {
  const c = (v: number) => (v * 17).toString(16).padStart(2, "0");
  return `#${c(k >> 8)}${c((k >> 4) & 15)}${c(k & 15)}`;
});
