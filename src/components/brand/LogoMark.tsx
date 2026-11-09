import { useId } from "react";

/** Wordmark geometry (viewBox units = pixels of the client's 1600 px logo image, wordmark crop). */
export const LOGO_VB = { w: 709, h: 185 } as const;

/** The original logo colours, sampled from the client's file: black → indigo on lavender. */
export const LOGO_COLORS = { from: "#030303", to: "#3533cb", paper: "#e9ddeb", ink: "#030303" } as const;
/**
 * On our black site the file's black end is invisible (and its indigo end is only 2.4:1), so the
 * wordmark runs from the logo's indigo to a brighter indigo — same hue, same dark→light direction.
 */
export const LOGO_ON_DARK = { from: LOGO_COLORS.to, to: "#5b58ff" } as const;

// Traced from the client's logo image (pixel contours, ±0.5 px). Swap for their SVG when supplied.
const P = {
  L: "M0.5 5.1H94.7V115H133.1V179.6H0.5Z",
  // the 9: round head + a tail whose top is a concave arc — the tail is the A's left leg
  tail: "M134.6 179.6L160.3 93.4A68.2 68.2 0 0 0 232.3 125.1L185.8 179.6Z",
  // the A's right leg (left edge slightly concave)
  leg: "M247.8 179.6L282 137.5L297.8 115L309.5 93.6L334.9 179.6Z",
  B: "M338.2 179.6V5.1H453.1L470.5 7.2L486.5 10.1L496.4 13.5L503.5 17L508.5 20.3L512.9 24.5L516.8 29.5L520.7 38.5L521.9 44.5L522.8 55.5L521.6 68.5L520.7 72.5L518.7 77.5L515.6 82.5L511.5 86.9L504.1 92L511.5 97.2L517 102.5L520.8 108.5L523.8 116.5L525 122L525.2 135.5L523.8 144.5L520.9 152.5L516.5 159.1L510.7 164.5L505.5 168L496.5 172L487.5 174.8L469.5 177.8L457.5 179.6Z" +
    // two D-shaped slot counters
    "M427.2 56.8H430.6Q434.6 56.8 434.6 61V67.2Q434.6 71.4 430.6 71.4H427.2Z" +
    "M427.2 113.1H430.6Q434.5 113.1 434.5 117.1V124Q434.5 128 430.6 128H427.2Z",
  // S: both apertures are wedges that close in a small round node
  S: "M634.5 184.5L622.5 184.9L599.5 183.8L591.5 182.8L582.5 180.9L574.5 178.9L568.5 176.7L556.5 171L550.5 166.8L546.7 163.5L542.5 159L539.1 154.5L536.3 149.5L534.2 144.5L531.2 132.5L530.6 123.5L530.9 121.9H614.4L615.4 125.5L616.3 126.5L618.5 127.1L620.5 126.5L622 124.5L621.5 121.9L620.5 121.1L618.5 120.3L597.5 117.9L583.5 115L569.5 111.7L558.5 107.1L551.5 102.9L545.5 98L539 90.5L535.1 83.5L532.1 73.5L531.3 67.5L531.2 58.5L533.3 45.5L535.3 38.5L537.4 33.5L542.9 24.5L549.6 17.5L556.5 12.4L562.5 9.1L569.5 6.2L576.5 4L590.5 1.2L610.5 -0.2L631.5 0.3L640.5 1.3L655.5 4.4L669.5 9.3L676.5 12.9L682.5 16.8L688.9 22.5L694.5 29.1L697.8 34.5L700.9 41.5L703.7 53.5L704.4 61.5L703.5 62.7H624.5L622.5 58.7L620.5 57.7L617.7 58.5L616.4 60.5V61.5L617.5 62.7L619.5 64.7L656.5 69.1L670.5 73.2L677.5 76.1L683.5 79.3L692.9 86.5L696.5 90.6L700.7 96.5L704.8 105.5L707 114.5L707.9 121.5L708.1 128.5L707.8 133.5L705.8 142.5L704.8 145.5L700.9 153.5L697.4 158.5L692.8 163.5L683.5 170.9L674.5 175.6L666.5 178.7L650.5 182.8Z",
} as const;
const HEAD = { cx: 231.8, cy: 51.4, r: 33.3 } as const;

/**
 * Intro only: a full "A" in the logo's weight, drawn on the tail's and the leg's own edge lines.
 * The landing animation starts on "LABS"; the instant the falling 9 touches it, the A is
 * swapped for the leg (no in-between frames, so no piece of the A shows through the 9).
 */
const A_PATH = "M134.6 179.6L186.6 5.1H283.4L334.9 179.6H264.5L234.8 118L205 179.6ZM234.9 50L241.8 74H228Z";

/**
 * The Nine Labs wordmark, "L9BS": "LABS" with the A built from a 9 — the 9's round head sits on
 * top, its tail is the A's left leg, and a solid triangle is the right leg. In the client's own
 * hue on our black site (see LOGO_ON_DARK).
 *
 * Every part is its own group (`data-part`), so the landing animation can move them one by one.
 * The intro-only "A" (the word "LABS" before the 9 falls) stays invisible at rest.
 */
export function LogoMark({ className = "", title = "Nine Labs Solutions" }: { className?: string; title?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `lg-${uid}`;

  return (
    <svg viewBox={`0 0 ${LOGO_VB.w} ${LOGO_VB.h}`} className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={LOGO_VB.w} y2="0">
          <stop offset="0" stopColor={LOGO_ON_DARK.from} />
          <stop offset="1" stopColor={LOGO_ON_DARK.to} />
        </linearGradient>
      </defs>

      <g fill={`url(#${grad})`}>
        <path data-part="L" d={P.L} />
        <path data-part="A" d={A_PATH} fillRule="evenodd" opacity="0" />
        <path data-part="leg" d={P.leg} />
        <path data-part="B" d={P.B} fillRule="evenodd" />
        <path data-part="S" d={P.S} />
        <g data-part="nine">
          <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} />
          <path d={P.tail} />
        </g>
      </g>

    </svg>
  );
}

/** "NINE LABS / SOLUTIONS" lockup that sits under the wordmark (sized in % of its container's width). */
export function LogoTagline({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-tagline ${className}`} aria-hidden="true">
      <span className="logo-tagline__main">NINE LABS</span>
      <span className="logo-tagline__sub">SOLUTIONS</span>
    </span>
  );
}
