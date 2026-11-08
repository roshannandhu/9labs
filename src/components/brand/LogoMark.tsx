import { useId } from "react";

/** Wordmark geometry (viewBox units). Traced from the client's logo image; swap for their SVG when supplied. */
export const LOGO_VB = { w: 709, h: 185 } as const;

const P = {
  L: "M0 6H94V116H147L123 180H0Z",
  nineTail: "M135 180H187Q244 123 267 65L232 85Q182 113 135 180Z",
  leg: "M249 180L308 93L335 180Z",
  B: "M338 6H447C507 6 522 38 522 65C522 83 512 93 502 96C522 103 527 123 527 138C527 168 507 180 457 180H338Z",
} as const;

/**
 * The Nine Labs wordmark, "L9BS": "LABS" with the A built from a 9 — the 9's round head is the
 * A's hole, its tail is the A's left leg, and a solid triangle is the right leg. B has two slot
 * counters; S is cut by two slits that end in round "node" dots.
 *
 * Every part is its own group (`data-part`), so the landing animation can move them one by one.
 * Three extra parts are invisible until the intro uses them: a light `sweep` (clipped to the
 * letters), the glowing node `dots`, and the `flash` when the 9 locks into the A.
 *
 * Colours: the original runs near-black → indigo on lavender; on our black site the black end
 * would vanish, so this dark-background version runs lavender → violet → the brand indigo.
 */
export function LogoMark({ className = "", title = "Nine Labs Solutions" }: { className?: string; title?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `lg-${uid}`;
  const holes = `lh-${uid}`;
  const clip = `lc-${uid}`;
  const sweep = `ls-${uid}`;
  const glow = `lw-${uid}`;

  return (
    <svg viewBox={`0 0 ${LOGO_VB.w} ${LOGO_VB.h}`} className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={LOGO_VB.w} y2="0">
          <stop offset="0" stopColor="#efe8fb" />
          <stop offset="0.45" style={{ stopColor: "color-mix(in oklab, var(--nl-blue-soft) 70%, #ffffff)" }} />
          <stop offset="1" style={{ stopColor: "var(--nl-blue)" }} />
        </linearGradient>
        <linearGradient id={sweep} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={glow} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {/* B's counters and S's slits + node dots are real holes (the page shows through) */}
        <mask id={holes} maskUnits="userSpaceOnUse" x="-20" y="-20" width={LOGO_VB.w + 40} height={LOGO_VB.h + 40}>
          <rect x="-20" y="-20" width={LOGO_VB.w + 40} height={LOGO_VB.h + 40} fill="#fff" />
          <rect x="425" y="57" width="10" height="16" rx="5" fill="#000" />
          <rect x="425" y="113" width="10" height="16" rx="5" fill="#000" />
          <rect x="619" y="60.5" width="100" height="5" fill="#000" />
          <circle cx="619" cy="63" r="5.5" fill="#000" />
          <rect x="520" y="120.5" width="99" height="5" fill="#000" />
          <circle cx="619" cy="123" r="5.5" fill="#000" />
        </mask>
        <clipPath id={clip}>
          <path d={P.L} />
          <circle cx="232" cy="51" r="34" />
          <path d={P.nineTail} />
          <path d={P.leg} />
          <path d={P.B} />
          <rect x="530" y="0" width="179" height="185" rx="86" ry="72" />
        </clipPath>
      </defs>

      <g fill={`url(#${grad})`}>
        <g data-part="L">
          <path d={P.L} />
        </g>
        <g data-part="nine">
          <circle cx="232" cy="51" r="34" />
          <path d={P.nineTail} />
        </g>
        <g data-part="leg">
          <path d={P.leg} />
        </g>
        <g data-part="B" mask={`url(#${holes})`}>
          <path d={P.B} />
        </g>
        <g data-part="S" mask={`url(#${holes})`}>
          <rect x="530" y="0" width="179" height="185" rx="86" ry="72" />
        </g>
      </g>

      {/* intro-only extras (invisible at rest) */}
      <g clipPath={`url(#${clip})`}>
        <rect data-part="sweep" x="-220" y="0" width="200" height={LOGO_VB.h} fill={`url(#${sweep})`} opacity="0" />
      </g>
      <g data-part="dots" opacity="0">
        <circle cx="619" cy="63" r="9" fill="#d8d0ff" filter={`url(#${glow})`} />
        <circle cx="619" cy="123" r="9" fill="#d8d0ff" filter={`url(#${glow})`} />
        <circle cx="619" cy="63" r="4.5" fill="#fff" />
        <circle cx="619" cy="123" r="4.5" fill="#fff" />
      </g>
      <circle data-part="flash" cx="232" cy="51" r="44" fill="#fff" opacity="0" filter={`url(#${glow})`} />
    </svg>
  );
}

/** "NINE LABS / SOLUTIONS" lockup that sits under the wordmark. */
export function LogoTagline({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-tagline flex flex-col items-center leading-none ${className}`} aria-hidden="true">
      <span className="logo-tagline__main">NINE LABS</span>
      <span className="logo-tagline__sub">SOLUTIONS</span>
    </span>
  );
}
