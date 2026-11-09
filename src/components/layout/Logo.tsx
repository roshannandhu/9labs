import { LogoMark, LogoTagline } from "@/components/brand/LogoMark";

/**
 * The client's logo (L9BS wordmark), always in its exact colours, on its own lavender paper
 * (`.logo-paper`: invisible on the light page, a badge on the dark one). In the nav it is the
 * landing animation's target: the intro's lavender shrinks into `[data-logo-9]` while the big
 * logo flies onto the small one.
 */
export function Logo({ className = "", withTagline = false }: { className?: string; withTagline?: boolean }) {
  if (withTagline) {
    return (
      <span className={`logo-paper logo-paper--lg inline-block ${className}`}>
        <span className="logo-lockup block w-[270px]">
          <LogoMark className="block h-auto w-full" />
          <LogoTagline />
        </span>
      </span>
    );
  }
  return (
    <span data-logo-9 className={`logo-paper block ${className}`}>
      <LogoMark className="block h-[24px] w-auto sm:h-[28px]" />
    </span>
  );
}
