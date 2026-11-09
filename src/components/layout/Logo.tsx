import { LogoMark, LogoTagline } from "@/components/brand/LogoMark";

/**
 * The client's logo (L9BS wordmark), in its exact colours on both themes. In the nav it is the
 * landing animation's target: the intro's logo flies onto `[data-logo-9]` and hands over to it.
 */
export function Logo({ className = "", withTagline = false }: { className?: string; withTagline?: boolean }) {
  if (withTagline) {
    return (
      <span className={`logo-lockup block w-[270px] ${className}`}>
        <LogoMark className="block h-auto w-full" />
        <LogoTagline />
      </span>
    );
  }
  return (
    <span data-logo-9 className={`block ${className}`}>
      <LogoMark className="block h-[24px] w-auto sm:h-[28px]" />
    </span>
  );
}
