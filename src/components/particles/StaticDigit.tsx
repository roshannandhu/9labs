/**
 * Still numeral for reduced motion (and the server-rendered first paint): the digit in the logo's
 * typeface, electric blue with a neon-purple edge glow — the particles' resting look, without motion.
 */
export function StaticDigit({ ch, className = "" }: { ch: string; className?: string }) {
  return (
    <span className={`static-digit pointer-events-none grid h-full w-full select-none place-items-center ${className}`} aria-hidden="true">
      <span className="static-digit__ch">{ch}</span>
    </span>
  );
}
