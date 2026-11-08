import { NINE_PATH } from "@/components/hero/nine-path";

/** Placeholder logo (final logo files to be supplied by the client): neon 9 monogram + wordmark. */
export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="logo-9 relative grid h-9 w-9 place-items-center rounded-[10px] border border-white/10 bg-white/[0.03]" data-logo-9>
        <svg viewBox="10 60 380 500" className="h-6 w-6 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="logo9" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--nl-blue-soft)" }} />
              <stop offset="60%" style={{ stopColor: "var(--nl-blue)" }} />
              <stop offset="100%" style={{ stopColor: "var(--nl-purple)" }} />
            </linearGradient>
          </defs>
          <path d={NINE_PATH} fill="var(--nl-blue)" opacity=".55" style={{ filter: "blur(16px)" }} />
          <path d={NINE_PATH} fill="url(#logo9)" stroke="url(#logo9)" strokeWidth="10" strokeLinejoin="round" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-semibold tracking-[0.06em] text-white">NINE LABS</span>
          <span className="mt-1 text-[8.5px] font-semibold tracking-[0.3em] text-white/45">SOLUTIONS</span>
        </span>
      )}
    </span>
  );
}
