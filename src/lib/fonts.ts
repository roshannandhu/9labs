import { Fraunces, Inter, JetBrains_Mono, Montserrat, Sora, Unbounded } from "next/font/google";

/** Headlines. */
export const display = Sora({ subsets: ["latin"], variable: "--font-display-src", display: "swap" });
/** Body text. */
export const sans = Inter({ subsets: ["latin"], variable: "--font-sans-src", display: "swap" });
/** Rare utility numerals. */
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-src", display: "swap", weight: ["400", "500"] });
/** Warm italic serif for accent phrases ("built to deliver results"). */
export const accent = Fraunces({ subsets: ["latin"], variable: "--font-accent-src", display: "swap", weight: ["500"], style: ["italic"] });
/** The logo tagline ("NINE LABS / SOLUTIONS"), as in the client's logo file. */
export const brand = Montserrat({ subsets: ["latin"], variable: "--font-brand-src", display: "swap", weight: ["800"] });
/**
 * Every number (the particle 1 → 9, the 1–9 rail, card numbers): Unbounded Black — the public font
 * closest to the logo's lettering (wide, heavy, sharp; see docs/digit-font-comparison.png).
 * Swap here if the client names the exact font.
 */
export const digits = Unbounded({ subsets: ["latin"], variable: "--font-digits-src", display: "swap", weight: ["900"] });

export const fontVariables = [display, sans, mono, accent, brand, digits].map((f) => f.variable).join(" ");
