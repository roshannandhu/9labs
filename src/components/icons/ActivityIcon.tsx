import type { IconKey } from "@/content/site";

const P = "var(--nl-purple)";

const heart = "M0 2.2C0 .9 1 0 2.1 0c.8 0 1.5.5 1.9 1.1C4.4.5 5.1 0 5.9 0 7 0 8 .9 8 2.2 8 4.6 4 7 4 7S0 4.6 0 2.2z";

const ICONS: Record<IconKey, React.ReactNode> = {
  // 1 — Phone screen with likes and chat bubbles
  social: (
    <>
      <rect x="19" y="7" width="26" height="50" rx="6" />
      <path d="M29 12.5h6" />
      <circle cx="32" cy="51.5" r="1.3" fill="currentColor" stroke="none" />
      <path d="M24 22h16a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-9l-4.5 3.5V34H24a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 24 22z" />
      <circle data-anim className="ai-blink" cx="27.5" cy="28" r="1.4" fill="currentColor" stroke="none" />
      <circle data-anim className="ai-blink-2" cx="32" cy="28" r="1.4" fill="currentColor" stroke="none" />
      <circle data-anim className="ai-blink-3" cx="36.5" cy="28" r="1.4" fill="currentColor" stroke="none" />
      <path d="M25 42h14M25 46h9" strokeOpacity=".5" />
      <g transform="translate(48 26)">
        <path data-anim className="ai-float" d={heart} fill={P} stroke="none" />
      </g>
      <g transform="translate(52 36) scale(.75)">
        <path data-anim className="ai-float-2" d={heart} fill={P} stroke="none" />
      </g>
    </>
  ),
  // 2 — Megaphone
  advertising: (
    <>
      <path d="M12 27v10h7l19 11V16L19 27z" />
      <path d="M19 37l3 11h5.5l-2.5-11" />
      <path d="M12 27h-1.5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2H12" />
      <path data-anim className="ai-wave" d="M44 25.5q4.5 6.5 0 13" stroke={P} />
      <path data-anim className="ai-wave-2" d="M48.5 21q8 11 0 22" stroke={P} />
      <path data-anim className="ai-wave-3" d="M53 16.5q11.5 15.5 0 31" stroke={P} />
    </>
  ),
  // 3 — Film frame with play button
  content: (
    <>
      <rect x="8" y="13" width="48" height="38" rx="5" />
      <path data-anim className="ai-film" d="M8 19.5h48M8 44.5h48" strokeDasharray="4 4" />
      <path d="M8 23.5h48M8 40.5h48" strokeOpacity=".35" />
      <path data-anim className="ai-pop" d="M28 26.5l10 5.5-10 5.5z" fill={P} stroke={P} />
    </>
  ),
  // 4 — Camera lens with turning aperture
  photo: (
    <>
      <circle cx="32" cy="33" r="21" />
      <circle cx="32" cy="33" r="14" strokeOpacity=".6" />
      <g data-anim className="ai-spin">
        <path d="M32 24l7.8 4.5v9L32 42l-7.8-4.5v-9z" stroke={P} />
        <path d="M32 24v-9.8M39.8 28.5l8.5-4.9M39.8 37.5l8.5 4.9M32 42v9.8M24.2 37.5l-8.5 4.9M24.2 28.5l-8.5-4.9" strokeOpacity=".45" />
      </g>
      <path data-anim className="ai-flash" d="M51 6.5l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill={P} stroke="none" />
    </>
  ),
  // 5 — Stage with a sweeping spotlight
  events: (
    <>
      <path d="M6 13h52" />
      <path d="M9 13q5 17 0 35M55 13q-5 17 0 35" strokeOpacity=".7" />
      <path d="M6 50h52M10 50v6M54 50v6" />
      <path data-anim className="ai-sweep" d="M32 14l-11 34h22z" fill={P} fillOpacity=".22" stroke="none" />
      <circle cx="32" cy="16" r="2.5" fill={P} stroke="none" />
      <circle cx="32" cy="36.5" r="2.6" />
      <path d="M32 39.5v6M28 43l4-2 4 2" />
    </>
  ),
  // 6 — Speech bubble and press page
  pr: (
    <>
      <rect x="30" y="8" width="25" height="31" rx="2.5" strokeOpacity=".75" />
      <path d="M35 15h15M35 20h15M35 25h10" strokeOpacity=".5" />
      <path
        d="M13 26h24a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H23l-7.5 6.5V46H13a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4z"
        fill="var(--nl-black)"
      />
      <circle data-anim className="ai-blink" cx="18.5" cy="36" r="1.7" fill={P} stroke="none" />
      <circle data-anim className="ai-blink-2" cx="25" cy="36" r="1.7" fill={P} stroke="none" />
      <circle data-anim className="ai-blink-3" cx="31.5" cy="36" r="1.7" fill={P} stroke="none" />
    </>
  ),
  // 7 — Chart and compass
  strategy: (
    <>
      <path d="M9 8v46h47" />
      <path data-anim className="ai-draw" pathLength={1} d="M14 47l10-11 8 5 10-16 10-7" stroke={P} />
      <circle cx="52" cy="18" r="2" fill={P} stroke="none" />
      <circle cx="23" cy="20" r="8" strokeOpacity=".75" />
      <path data-anim className="ai-needle" d="M23 14.5l2 5.5-2 5.5-2-5.5z" fill="currentColor" stroke="none" />
    </>
  ),
  // 8 — Neural network nodes
  ai: (
    <>
      <path
        d="M13 18L32 12M13 18L32 27M13 32L32 27M13 32L32 42M13 46L32 42M13 46L32 53M32 12L51 24M32 27L51 24M32 27L51 40M32 42L51 40M32 42L51 24M32 53L51 40M13 18L32 42M13 46L32 27"
        strokeOpacity=".35"
      />
      {[
        [13, 18, 0],
        [13, 32, 0.15],
        [13, 46, 0.3],
        [32, 12, 0.5],
        [32, 27, 0.65],
        [32, 42, 0.8],
        [32, 53, 0.95],
        [51, 24, 1.2],
        [51, 40, 1.35],
      ].map(([x, y, delay]) => (
        <circle key={`${x}-${y}`} data-anim className="ai-node" cx={x} cy={y} r="3.6" fill={P} style={{ animationDelay: `${delay}s` }} />
      ))}
    </>
  ),
  // 9 — Circuit traces around a chip
  it: (
    <>
      <rect x="22" y="22" width="20" height="20" rx="3" />
      <rect x="27.5" y="27.5" width="9" height="9" rx="1.5" stroke={P} />
      <path d="M32 22V11H14M42 32h12V13M32 42v11h18M22 32H10v18" strokeOpacity=".7" />
      <path data-anim className="ai-flow" pathLength={1} d="M32 22V11H14" stroke={P} />
      <path data-anim className="ai-flow" pathLength={1} d="M42 32h12V13" stroke={P} style={{ animationDelay: ".45s" }} />
      <path data-anim className="ai-flow" pathLength={1} d="M32 42v11h18" stroke={P} style={{ animationDelay: ".9s" }} />
      <path data-anim className="ai-flow" pathLength={1} d="M22 32H10v18" stroke={P} style={{ animationDelay: "1.35s" }} />
      <circle cx="14" cy="11" r="2" fill="currentColor" stroke="none" />
      <circle cx="54" cy="13" r="2" fill="currentColor" stroke="none" />
      <circle cx="50" cy="53" r="2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="50" r="2" fill="currentColor" stroke="none" />
    </>
  ),
};

export function ActivityIcon({
  icon,
  size = 32,
  play = false,
  className = "",
}: {
  icon: IconKey;
  size?: number;
  play?: boolean;
  className?: string;
}) {
  const sw = Math.max(1.15, Math.min(3.4, (1.7 * 64) / size));
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`ai-icon overflow-visible ${className}`}
      data-play={play ? "true" : "false"}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[icon]}
    </svg>
  );
}
