import type { Ebook } from "@/content/site";
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

/**
 * The cover. If the admin uploaded an image (`book.cover`) it is used as-is; otherwise a designed
 * cover is drawn in code from the book's tone and order (viewBox 200×290).
 */
export function BookCover({ book }: { book: Ebook }) {
  if (book.cover) {
    // eslint-disable-next-line @next/next/no-img-element -- static export: plain <img> for uploaded covers
    return <img src={book.cover} alt={`${book.title} — cover`} className="block h-full w-full object-cover" />;
  }
  const id = book.slug;
  const art = (parseInt(book.n, 10) - 1 + 3) % 3; // three art styles, by order
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
      {art === 0 && (
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
      {art === 1 && (
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
      {art === 2 && (
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

      {/* typography */}
      <text x="20" y="26" fontSize="6" fill="white" fillOpacity="0.55" fontFamily="var(--font-mono)" letterSpacing="1.6">
        NINE LABS · E-BOOK {book.n}
      </text>
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
  return (
    <div className="flex h-full w-full flex-col items-center justify-between bg-[linear-gradient(90deg,#07080d,#141729_55%,#0a0b12)] py-3">
      <span className="h-6 w-[2px] rounded" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
      <span className="font-display text-[9px] font-semibold uppercase tracking-[0.18em] text-white/80 [writing-mode:vertical-rl] rotate-180">{book.title}</span>
      <span className="font-mono text-[8px] text-white/45">{book.n}</span>
    </div>
  );
}
