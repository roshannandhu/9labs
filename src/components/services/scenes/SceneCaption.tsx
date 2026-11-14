"use client";

import type { Service } from "@/content/site";
import { useEnquiry } from "@/components/enquiry/EnquiryProvider";
import { useSite } from "@/components/providers/SiteProvider";

/**
 * The one constant every scene shares: a quiet index + name + one line, and the service's own
 * "Talk to us" → WhatsApp trigger (`useEnquiry().open(slug)`, unchanged). Never competes with the
 * scene's own visual — same small type, same position pattern, in every one of the nine. Colour
 * follows the theme as usual (`text-white` = the page's foreground token); a scene with an
 * always-dark backdrop (e.g. Events) wraps itself in the existing `.on-dark` island instead of a
 * prop here.
 */
export function SceneCaption({ s, className = "" }: { s: Service; className?: string }) {
  const enquiry = useEnquiry();
  const { cardCta } = useSite().servicesSection;
  return (
    <div className={`scene-caption ${className}`}>
      <p className="label-mono !text-[10.5px] sm:!text-[11px]">{String(s.n).padStart(2, "0")} / 09</p>
      <h3 className="mt-1 text-[20px] font-semibold leading-tight sm:mt-1.5 sm:text-[25px] lg:text-[27px]">{s.title}</h3>
      <p className="mt-1 max-w-[48ch] text-[13px] leading-snug text-nl-ink line-clamp-2 sm:mt-1.5 sm:text-[14.5px] sm:leading-relaxed sm:line-clamp-none">
        {s.description}
      </p>
      {s.tags && s.tags.length > 0 && (
        <div className="mt-2.5 hidden flex-wrap items-center justify-center gap-1.5 sm:flex sm:mt-3">
          {s.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-black/[0.07] bg-black/[0.03] px-3 py-0.5 text-[11px] font-medium tracking-wide text-nl-ink/80 transition-colors dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => enquiry.open(s.slug)}
        className="link-glow mt-2.5 inline-flex items-center gap-2 py-1 text-xs font-medium text-white sm:mt-3 sm:text-sm"
        data-cursor="Ask"
      >
        {cardCta}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
