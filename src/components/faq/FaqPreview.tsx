"use client";

import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { FaqList } from "./FaqList";

/** The first few questions on the homepage, switched on in the admin (Website → Homepage → FAQ on the homepage). */
export function FaqPreview() {
  const { faqPreview: f } = useSite();
  if (!f.enabled || !f.items.length) return null;
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative py-20 sm:py-28">
      <div className="container-x max-w-[920px]">
        <SectionLabel index="?">{f.label}</SectionLabel>
        <SpringHeading id="faq-title" text={f.heading} accent={f.accent || undefined} className="mt-4 text-[clamp(1.8rem,3.6vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.03em]" />
        <AnimatedContent distance={40} duration={0.9} ease="expo.out" className="mt-8">
          <FaqList items={f.items} />
        </AnimatedContent>
        {f.cta && (
          <Link href="/faq" className="link-glow mt-6 inline-flex items-center gap-2 py-1 text-sm font-medium text-white">
            {f.cta}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </div>
    </section>
  );
}
