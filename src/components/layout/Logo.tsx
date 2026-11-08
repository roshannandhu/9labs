import { LogoMark, LogoTagline } from "@/components/brand/LogoMark";

/**
 * The client's logo (L9BS wordmark). In the nav it is the landing animation's target: the
 * intro's big logo flies onto `[data-logo-9]` and hands over to this one.
 */
export function Logo({ className = "", withTagline = false }: { className?: string; withTagline?: boolean }) {
  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <span data-logo-9 className="block">
        <LogoMark className="block h-[26px] w-auto sm:h-[30px]" />
      </span>
      {withTagline && <LogoTagline className="mt-2.5 [--tag-size:10px]" />}
    </span>
  );
}
