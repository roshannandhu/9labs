/** Blueprint-style section label: "02 — SERVICES" with a tick line. */
export function SectionLabel({ index, children, className = "" }: { index: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`label-mono flex items-center gap-3 ${className}`}>
      <span className="text-nl-purple">{index}</span>
      <span className="relative h-px w-10 bg-gradient-to-r from-nl-purple/80 to-white/10">
        <span className="absolute -top-[3px] left-0 h-[7px] w-px bg-nl-purple" />
        <span className="absolute -top-[2px] right-0 h-[5px] w-px bg-white/30" />
      </span>
      <span>{children}</span>
    </p>
  );
}
