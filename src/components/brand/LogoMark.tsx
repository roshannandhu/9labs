import { useId } from "react";

/** Wordmark geometry (viewBox units; the client's logo file scaled so the wordmark is 708 wide). */
export const LOGO_VB = { w: 709, h: 186 } as const;


// Traced from the client's logo file (pixel contours: 25 of 87,583 px differ). Swap for their SVG when supplied.
const P = {
  L: "M0.4 5.4H94.6V115.3H133V179.7H0.4Z",
  // the A = the logo's A parts: the 9's eye (a disc), the tail (left leg), the triangle (right leg)
  tail: "M134.6 179.7L160.3 93.6A69.35 69.35 0 0 0 231.9 125.6L185.8 179.7Z",
  leg: "M247.3 179.7L282.8 136.2L298 113.9L309.3 93.8L334.5 179.7Z",
  B: "M449.5 179.7H337.6V5.4H453.5L468.7 7.4L486.3 10.6L493.4 13L499 15.4L504.6 18.4L509.4 22L512.6 25.2L516.2 30L518.3 34L520 38.8L521.6 46.7L522.1 58.7L520.8 69.9L518.4 77.1L514.5 83.5L510.2 87.7L503 92.3L503.4 93.1L511.5 97.9L515.8 102.2L519.9 108.3L522.3 113.9L524.1 121.1L524.7 133L523.3 144.2L520.9 151.4L518.7 155.4L515.8 159.4L510.8 164.2L504.6 168.3L497.4 171.6L487.8 174.7L479.9 176.4L468.7 178ZM430.5 71.5L432.5 70.7L433.6 69.1L434.1 65.1L433.8 60.3L433.2 58.7L431.9 57.5L427.9 56.9L426.8 57.9L426.8 70.7L427.9 71.7ZM432.3 127.5L433.6 125.9L433.9 124.3L433.7 116.3L432.7 114.5L431.1 113.6L426.8 113.7L426.8 127.5L427.9 128.2Z",
  S: "M630.1 185L622.9 185.2L606.1 184.6L595.7 183.6L582.1 181.2L573.4 178.9L566.2 176.3L556.6 171.6L551 167.8L546.2 163.9L542.1 159.4L538 153.8L535.7 149.8L533.2 143.4L531.6 137.8L530.6 131.5L530 123.5L530.2 122.7L531 122.2L612.5 122.1L613.7 122.7L614.9 126.1L615.7 126.8L617.3 127.3L619.7 126.8L620.7 125.9L621.4 124.3L620.5 121.9L618.1 120.7L596.5 118.1L582.9 115.8L568.6 111.8L559 107.8L551 103.2L544.6 98L539 91.5L534.7 84.3L533.2 80.3L531.5 73.9L530.8 68.3L530.7 59.5L532.4 46.7L533.9 41.2L536.4 34.8L542 25.2L548.9 18L556.6 12.4L568.6 6.7L576.5 4.2L588.5 1.8L610.1 0.2L621.3 0.2L632.5 0.9L645.3 2.6L655.7 5L662.9 7.3L670.8 10.6L678.8 15.2L682.7 18L687.6 22.4L693.5 29.2L697.4 35.6L699.8 41.2L701.4 45.9L703 53.9L703.6 61.9L702.8 62.8L624.5 62.9L623.7 62.7L622.1 59.2L619.7 58L617.3 58.6L615.9 60.3L616 62.7L617.3 64.3L619 65.1L646.9 68L656.5 69.7L672.4 74.5L683.6 80.1L690 84.9L693.2 87.9L697.4 93.1L700.5 97.9L704.6 107.5L706.2 114.7L707 120.3L707.4 127.5L707.1 133L706.1 138.6L703.9 145.8L700.5 153L696.7 158.6L692.4 163.3L688.4 166.9L683.4 170.6L678.8 173.3L672.4 176.4L666 178.7L657.3 181.3L646.1 183.6Z",
} as const;
const EYE = { cx: 231.6, cy: 51.7, r: 33.3 } as const;

/**
 * Intro only. In this logo the 9 is NEGATIVE space: one solid A with a 9 carved out of it (the
 * 9's ring and down-stroke are the gaps; the disc is the 9's eye, where the A shows through).
 *  - A_FULL: the whole A, on the legs' own edge lines; its counter and notch sit inside the 9.
 *  - NINE: that 9 (outline + eye hole), used as a mask, so it is truly invisible — it only ever
 *    removes A, showing whatever is behind (light or dark page).
 * A_FULL minus NINE is exactly the logo's A (checked by rasterising both), so when the 9 has
 * fallen into place the frame is the logo — no swaps, no morphs, nothing left over.
 * NINE never crosses the L or the B, wherever it is on its fall.
 */
const A_FULL = "M134.6 179.7L186.6 5.4H283.4L334.5 179.7H243L233 137L189 179.7ZM233 92L240 112H226Z";
const NINE = "M185.8 179.7L231.9 125.6A69.35 69.35 0 0 1 160.3 93.6A87.4 87.4 0 1 1 309.3 93.8L298 113.9L282.8 136.2L247.3 179.7ZM264.9 51.7A33.3 33.3 0 1 0 198.3 51.7A33.3 33.3 0 1 0 264.9 51.7Z";
/** How far above its place the invisible 9 starts (fully clear of the A). */
export const NINE_START_Y = -260;

/**
 * The Nine Labs wordmark, "L9BS": LABS whose A has a 9 carved into it. Exact file colours in both
 * themes. `intro` renders the full A + the falling (masked) 9 for the landing animation;
 * `data-part="nine"` is the mask group the intro moves.
 */
export function LogoMark({ className = "", title = "Nine Labs Solutions", intro = false }: { className?: string; title?: string; intro?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const grad = `lg-${uid}`;
  const cut = `lm-${uid}`;

  return (
    <svg viewBox={`0 0 ${LOGO_VB.w} ${LOGO_VB.h}`} className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={LOGO_VB.w} y2="0">
          {/* theme-aware (globals.css): light = black → indigo, dark = purple → cyan — the two logo files */}
          <stop offset="0" style={{ stopColor: "var(--logo-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--logo-to)" }} />
        </linearGradient>
        {intro && (
          <mask id={cut} maskUnits="userSpaceOnUse" x="-40" y="-700" width={LOGO_VB.w + 80} height="1000">
            <rect x="-40" y="-700" width={LOGO_VB.w + 80} height="1000" fill="#fff" />
            <g data-part="nine" transform={`translate(0 ${NINE_START_Y})`}>
              <path d={NINE} fill="#000" fillRule="evenodd" />
            </g>
          </mask>
        )}
      </defs>

      <g fill={`url(#${grad})`}>
        <path d={P.L} />
        {intro ? (
          <path data-part="A" d={A_FULL} fillRule="evenodd" mask={`url(#${cut})`} />
        ) : (
          <>
            <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} />
            <path d={P.tail} />
            <path d={P.leg} />
          </>
        )}
        <path d={P.B} fillRule="evenodd" />
        <path d={P.S} />
      </g>
    </svg>
  );
}

/** "NINE LABS / SOLUTIONS" lockup under the wordmark (sized in % of its container's width). */
export function LogoTagline({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-tagline ${className}`} aria-hidden="true">
      <span className="logo-tagline__main">NINE LABS</span>
      <span className="logo-tagline__sub">SOLUTIONS</span>
    </span>
  );
}
