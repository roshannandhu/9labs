import { LogoMark, LogoTagline } from "@/components/brand/LogoMark";

/**
 * The client's logo (L9BS wordmark) in its own colours, on its own lavender "paper" badge.
 * In the nav it is the landing animation's target: the intro's lavender screen shrinks into this
 * badge (`[data-logo-9]`) while the big logo flies onto the small one.
 */
export function Logo({ className = "", withTagline = false }: { className?: string; withTagline?: boolean }) {
  if (withTagline) {
    return (
      <span className={`logo-badge inline-block rounded-2xl px-5 pb-5 pt-5 ${className}`}>
        <span className="logo-lockup block w-[248px]">
          <LogoMark className="block h-auto w-full" />
          <LogoTagline />
        </span>
      </span>
    );
  }
  return (
    <span data-logo-9 className={`logo-badge block rounded-[10px] px-2.5 py-2 sm:rounded-xl sm:px-3 sm:py-2.5 ${className}`}>
      <LogoMark className="block h-[20px] w-auto sm:h-[24px]" />
    </span>
  );
}
