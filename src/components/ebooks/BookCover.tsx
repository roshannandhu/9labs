import { useId, type CSSProperties } from "react";
import { COVER_ARTS, type CoverArt, type Ebook } from "@/content/site";
import { NINE_PATH } from "@/components/hero/nine-path";

/** Break a title into short lines for the cover (works for any title the admin enters). */
function titleLines(title: string, max = 14) {
  const out: string[] = [];
  for (const w of title.split(/\s+/)) {
    const last = out[out.length - 1];
    if (last && (last + " " + w).length <= max) out[out.length - 1] = `${last} ${w}`;
    else out.push(w);
  }
  return out.slice(0, 3);
}

/** The picture a designed cover shows: the admin's pick, or (by default) one of the first three by the book number. */
export function coverArtOf(book: Pick<Ebook, "n" | "art">): CoverArt {
  if (book.art && (COVER_ARTS as readonly string[]).includes(book.art)) return book.art;
  return COVER_ARTS[((((parseInt(book.n, 10) || 1) - 1) % 3) + 3) % 3];
}

/** Names for the admin's picker. */
export const COVER_ART_LABELS: Record<CoverArt, string> = {
  foundation: "Foundation",
  signal: "Signal",
  nine: "The 9",
  growth: "Growth",
  idea: "Idea",
  network: "Network",
  target: "Target",
  bridge: "Bridge",
};

/**
 * An uploaded cover's print finish (inline, so the admin's previews get it as well as the site): the
 * hinge groove (as the designed covers' 10/200 spine band), a soft top-left light falling to a darker
 * bottom-right, and a thin inner edge.
 */
const COVER_FINISH: CSSProperties = {
  background:
    "linear-gradient(90deg, rgb(0 0 0 / 0.42) 0, rgb(0 0 0 / 0.3) 4%, rgb(255 255 255 / 0.16) 5%, rgb(255 255 255 / 0) 7.5%), linear-gradient(150deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0) 38%, rgb(0 0 0 / 0) 60%, rgb(0 0 0 / 0.26))",
  boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.1), inset -10px 0 18px -12px rgb(0 0 0 / 0.35)",
};

/**
 * The cover. If the admin uploaded an image (`book.cover`) it is used as-is; otherwise a designed
 * cover is drawn in code from the book's tone and order (viewBox 200×290).
 */
export function BookCover({ book }: { book: Ebook }) {
  const uid = useId();
  if (book.cover) {
    // An uploaded image is flat artwork: give it the same hinge groove, light and edge the designed
    // covers draw in their SVG, so it reads as a printed cover on the 3D book, not a pasted card.
    return (
      <span className="relative block h-full w-full overflow-hidden bg-[#0a0b12]" role="img" aria-label={`${book.title} — cover`}>
        {/* the designed cover sits underneath: while the image loads, or if it can't be fetched, that shows instead of an empty box */}
        <span className="absolute inset-0" aria-hidden="true">
          <BookCover book={{ ...book, cover: undefined }} />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain <img> for uploaded covers */}
        <img src={book.cover} alt="" className="relative block h-full w-full object-cover" />
        <span className="pointer-events-none absolute inset-0" style={COVER_FINISH} aria-hidden="true" />
      </span>
    );
  }
  // unique per drawing: the same book is drawn more than once (phone carousel + desktop shelf), and
  // duplicate ids make covers paint from a hidden copy's gradients — i.e. not at all
  const id = uid.replace(/:/g, "");
  const art = coverArtOf(book);
  const accent = book.tone === "purple" ? "var(--nl-purple)" : "var(--nl-blue)";
  const accent2 = book.tone === "blue" ? "var(--nl-blue-soft)" : "var(--nl-purple)";
  const lines = titleLines(book.title);
  const top = lines.length > 2 ? 228 : 248; // first title line's baseline

  return (
    <svg viewBox="0 0 200 290" className="block h-full w-full" role="img" aria-label={`${book.title} — cover`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#121528" />
          <stop offset="0.55" stopColor="#090a12" />
          <stop offset="1" stopColor="#050507" />
        </linearGradient>
        <pattern id={`grid-${id}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M12 0H0V12" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="0.5" />
        </pattern>
        <radialGradient id={`glow-${id}`} cx="0.5" cy="0.42" r="0.5">
          <stop offset="0" style={{ stopColor: accent }} stopOpacity="0.45" />
          <stop offset="1" style={{ stopColor: accent }} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`duo-${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" style={{ stopColor: "var(--nl-blue-soft)" }} />
          <stop offset="0.6" style={{ stopColor: "var(--nl-blue)" }} />
          <stop offset="1" style={{ stopColor: "var(--nl-purple)" }} />
        </linearGradient>
        <filter id={`blur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect width="200" height="290" fill={`url(#bg-${id})`} />
      <rect width="200" height="290" fill={`url(#grid-${id})`} />
      <circle cx="100" cy="118" r="92" fill={`url(#glow-${id})`} />
      {/* spine shading */}
      <rect width="10" height="290" fill="black" opacity="0.35" />
      <rect x="10" width="1" height="290" fill="white" opacity="0.08" />

      {/* art */}
      {art === "foundation" && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(0 ${-i * 30})`}>
              <path d="M58 170 L100 150 L142 170 L100 190 Z" stroke={accent} strokeWidth="5" opacity="0.35" filter={`url(#blur-${id})`} />
              <path d="M58 170 L100 150 L142 170 L100 190 Z" stroke={i === 2 ? accent2 : accent} strokeWidth="1.4" fill="#0a0c16" fillOpacity="0.85" />
              <path d="M58 170 V182 L100 202 L142 182 V170" stroke={accent} strokeOpacity="0.6" strokeWidth="1" />
            </g>
          ))}
          <path d="M40 212 H160 M40 207 V217 M160 207 V217" stroke="white" strokeOpacity="0.35" strokeWidth="0.6" />
          <text x="100" y="224" textAnchor="middle" fontSize="6" fill="white" fillOpacity="0.45" fontFamily="var(--font-mono)" letterSpacing="1.5">
            BUILD · ON · SOLID · GROUND
          </text>
        </g>
      )}
      {art === "signal" && (
        <g fill="none" strokeLinecap="round">
          {[18, 34, 50, 66].map((r, i) => (
            <path
              key={r}
              d={`M${100 - r} ${150 - r * 0.2} A ${r} ${r} 0 0 1 ${100 + r} ${150 - r * 0.2}`}
              stroke={accent}
              strokeWidth={1.4}
              strokeOpacity={1 - i * 0.2}
            />
          ))}
          <rect x="84" y="148" width="32" height="56" rx="6" stroke="white" strokeOpacity="0.85" strokeWidth="1.4" fill="#0a0c16" />
          <path d="M95 154 H105" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" />
          <circle cx="100" cy="176" r="6" fill={accent} opacity="0.9" filter={`url(#blur-${id})`} />
          <circle cx="100" cy="176" r="3" fill="#fff" />
        </g>
      )}
      {art === "nine" && (
        <g>
          <g transform="translate(66 80) scale(0.17)">
            <path d={NINE_PATH} fill="var(--nl-purple)" fillOpacity="0.5" filter={`url(#blur-${id})`} />
            <path d={NINE_PATH} fill="#0b1130" stroke={`url(#duo-${id})`} strokeWidth="9" strokeLinejoin="round" />
          </g>
          <path d="M30 206 Q100 160 170 206" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="0.8" />
          <path d="M24 206 H176" stroke="white" strokeOpacity="0.5" strokeWidth="0.8" />
          {[50, 70, 90, 110, 130, 150].map((x) => (
            <path key={x} d={`M${x} ${206 - 46 * (1 - Math.pow((x - 100) / 70, 2)) * 0.5} V206`} stroke="white" strokeOpacity="0.18" strokeWidth="0.5" />
          ))}
        </g>
      )}

      {art === "growth" && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {[0, 1, 2, 3, 4].map((i) => {
            const h = 22 + i * 18;
            return <rect key={i} x={50 + i * 22} y={204 - h} width="14" height={h} rx="2" stroke={i === 4 ? accent2 : accent} strokeWidth="1.2" fill="#0a0c16" fillOpacity="0.85" />;
          })}
          <path d="M57 166 L79 148 L101 130 L123 112 L145 84" stroke={accent} strokeWidth="5" opacity="0.3" filter={`url(#blur-${id})`} />
          <path d="M57 166 L79 148 L101 130 L123 112 L145 84" stroke="white" strokeOpacity="0.9" strokeWidth="1.5" />
          <path d="M134 84 H146 V96" stroke="white" strokeOpacity="0.9" strokeWidth="1.5" />
          <path d="M40 208 H160" stroke="white" strokeOpacity="0.35" strokeWidth="0.6" />
        </g>
      )}
      {art === "idea" && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="100" cy="132" r="34" fill={accent} opacity="0.35" filter={`url(#blur-${id})`} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const a = (k * Math.PI) / 4;
            if (Math.sin(a) > 0.5) return null; // not under the bulb
            return <path key={k} d={`M${100 + 44 * Math.cos(a)} ${132 + 44 * Math.sin(a)} L${100 + 56 * Math.cos(a)} ${132 + 56 * Math.sin(a)}`} stroke={accent} strokeWidth="1.4" strokeOpacity="0.8" />;
          })}
          <circle cx="100" cy="132" r="30" stroke="white" strokeOpacity="0.85" strokeWidth="1.4" fill="#0a0c16" fillOpacity="0.9" />
          <path d="M92 138 L100 150 L108 138 L100 124" stroke={accent2} strokeWidth="1.4" />
          <rect x="86" y="160" width="28" height="12" rx="3" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" fill="#0a0c16" />
          <rect x="90" y="175" width="20" height="6" rx="3" stroke="white" strokeOpacity="0.5" strokeWidth="1" fill="#0a0c16" />
        </g>
      )}
      {art === "network" && (
        <g fill="none" strokeLinecap="round">
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const a = (k * Math.PI) / 3 - Math.PI / 2;
            const b = ((k + 1) * Math.PI) / 3 - Math.PI / 2;
            const x = 100 + 50 * Math.cos(a);
            const y = 138 + 50 * Math.sin(a);
            return (
              <g key={k}>
                <path d={`M100 138 L${x} ${y}`} stroke={accent} strokeOpacity="0.55" strokeWidth="1" />
                <path d={`M${x} ${y} L${100 + 50 * Math.cos(b)} ${138 + 50 * Math.sin(b)}`} stroke="white" strokeOpacity="0.2" strokeWidth="0.8" />
                <circle cx={x} cy={y} r="4.5" fill="#0a0c16" stroke={k === 2 ? accent2 : accent} strokeWidth="1.3" />
              </g>
            );
          })}
          <circle cx="100" cy="138" r="12" fill={accent} opacity="0.5" filter={`url(#blur-${id})`} />
          <circle cx="100" cy="138" r="8" fill="#0a0c16" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" />
          <circle cx="100" cy="138" r="2.6" fill="#fff" />
        </g>
      )}
      {art === "target" && (
        <g fill="none" strokeLinecap="round">
          {[14, 28, 42, 56].map((r, i) => (
            <circle key={r} cx="100" cy="138" r={r} stroke={accent} strokeWidth="1.3" strokeOpacity={1 - i * 0.2} />
          ))}
          <circle cx="100" cy="138" r="6" fill={accent} opacity="0.9" filter={`url(#blur-${id})`} />
          <circle cx="100" cy="138" r="3" fill="#fff" />
          <path d="M104 134 L150 88" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" />
          <path d="M150 88 L162 90 M150 88 L148 76 M150 88 L158 80" stroke={accent2} strokeWidth="1.4" />
        </g>
      )}
      {art === "bridge" && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M60 122 Q100 190 140 122" stroke={accent} strokeWidth="5" opacity="0.3" filter={`url(#blur-${id})`} />
          <path d="M60 122 Q100 190 140 122 M30 186 Q46 140 60 122 M140 122 Q154 140 170 186" stroke={accent} strokeWidth="1.5" />
          {[70, 80, 90, 100, 110, 120, 130].map((x) => {
            const t = (x - 60) / 80;
            return <path key={x} d={`M${x} ${122 + 136 * t * (1 - t)} V190`} stroke="white" strokeOpacity="0.25" strokeWidth="0.6" />;
          })}
          <rect x="57" y="116" width="6" height="76" rx="1.5" stroke="white" strokeOpacity="0.8" strokeWidth="1.2" fill="#0a0c16" />
          <rect x="137" y="116" width="6" height="76" rx="1.5" stroke="white" strokeOpacity="0.8" strokeWidth="1.2" fill="#0a0c16" />
          <path d="M24 190 H176" stroke="white" strokeOpacity="0.8" strokeWidth="1.4" />
          <path d="M24 198 H176" stroke="white" strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="6 6" />
          <circle cx="100" cy="190" r="4" fill={accent2} />
        </g>
      )}

      {/* typography */}
      {book.coverLogo ? (
        <image href={book.coverLogo} x="20" y="12" width="84" height="18" preserveAspectRatio="xMinYMid meet" />
      ) : (
        <text x="20" y="26" fontSize="6" fill="white" fillOpacity="0.55" fontFamily="var(--font-mono)" letterSpacing="1.6">
          NINE LABS · E-BOOK {book.n}
        </text>
      )}
      <path d="M20 32 H62" stroke={accent} strokeWidth="1" />
      <text x="20" y={top} fontFamily="var(--font-display)" fontWeight="700" fontSize="19" fill="#fff" letterSpacing="-0.4">
        {lines.map((l, i) => (
          <tspan key={`${i}${l}`} x="20" dy={i === 0 ? 0 : 20}>
            {l}
          </tspan>
        ))}
      </text>
      <text x="20" y={top + lines.length * 20 - 4} fontSize="6.4" fill="white" fillOpacity="0.6" fontFamily="var(--font-sans)">
        {book.subtitle}
      </text>
      <text x="180" y="26" textAnchor="end" fontSize="6" fill={accent2} fontFamily="var(--font-mono)" letterSpacing="1.6">
        FREE
      </text>
    </svg>
  );
}

/** Spine art: vertical title. */
export function BookSpine({ book }: { book: Ebook }) {
  const accent = book.tone === "purple" ? "var(--nl-purple)" : "var(--nl-blue)";
  if (book.cover) {
    // a printed wrap: the spine stretches a thin strip of the cover's left edge (no stray lettering), darkened where it curves away
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-[#0a0b12] py-3" style={{ backgroundImage: `url("${book.cover}")`, backgroundSize: "2500% 100%", backgroundPosition: "left center" }}>
        <span className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/.55),rgb(0_0_0/.18)_45%,rgb(0_0_0/.45))]" aria-hidden="true" />
        <span className="relative font-display text-[9px] font-semibold uppercase tracking-[0.18em] text-white/90 [text-shadow:0_1px_2px_rgb(0_0_0/.6)] [writing-mode:vertical-rl] rotate-180">{book.title}</span>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-between bg-[linear-gradient(90deg,#07080d,#141729_55%,#0a0b12)] py-3">
      <span className="h-6 w-[2px] rounded" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
      <span className="font-display text-[9px] font-semibold uppercase tracking-[0.18em] text-white/80 [writing-mode:vertical-rl] rotate-180">{book.title}</span>
      <span className="font-mono text-[8px] text-white/45">{book.n}</span>
    </div>
  );
}
