import { Albert_Sans, Fraunces, Inter, JetBrains_Mono, Montserrat, Sora } from "next/font/google";

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
 * Every number (the particle 1 → 9, the 1–9 rail, card numbers): Albert Sans Black — the closest
 * match to the 9 in the client's reference artwork (round bowl and counter, straight diagonal
 * tail with a flat cut). Swap here if the client names the exact font.
 */
export const digits = Albert_Sans({ subsets: ["latin"], variable: "--font-digits-src", display: "swap", weight: ["900"] });

export const fontVariables = [display, sans, mono, accent, brand, digits].map((f) => f.variable).join(" ");
