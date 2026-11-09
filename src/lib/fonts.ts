import { Fraunces, Inter, JetBrains_Mono, Montserrat, Sora } from "next/font/google";

/** Headlines. */
export const display = Sora({ subsets: ["latin"], variable: "--font-display-src", display: "swap" });
/** Body text. */
export const sans = Inter({ subsets: ["latin"], variable: "--font-sans-src", display: "swap" });
/** Rare utility numerals. */
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-src", display: "swap", weight: ["400", "500"] });
/** Warm italic serif for accent phrases ("built to deliver results"). */
export const accent = Fraunces({ subsets: ["latin"], variable: "--font-accent-src", display: "swap", weight: ["500"], style: ["italic"] });
/**
 * The logo's own typeface family (heavy geometric sans — closest public match to the L9BS
 * wordmark). Used for the logo tagline and for every particle numeral (the hero 9 and 1 → 9),
 * so the numbers speak the logo's language. Swap here if the client names the exact font.
 */
export const brand = Montserrat({ subsets: ["latin"], variable: "--font-brand-src", display: "swap", weight: ["800", "900"] });

export const fontVariables = [display, sans, mono, accent, brand].map((f) => f.variable).join(" ");
