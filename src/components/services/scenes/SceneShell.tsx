"use client";

import type { ReactNode } from "react";
import type { Service } from "@/content/site";
import { SceneCaption } from "./SceneCaption";

/**
 * The card every one of the nine services shares in the carousel: the particle-formed picture (its
 * own slot, named by the service's number — `useServiceTrack` drives what forms there),
 * `SceneCaption` (title/line/WhatsApp CTA), and a spot for that card's own small personality
 * (`flourish`) layered around the picture.
 */
export function SceneShell({ s, flourish, captionClassName = "" }: { s: Service; flourish?: ReactNode; captionClassName?: string }) {
  return (
    <section id={`service-${s.slug}`} aria-roledescription="slide" aria-label={`${s.n} of 9: ${s.title}`} className="scene-section scene-card">
      {/* sized from the card's own height, so the caption and its CTA always fit below it */}
      <div className="relative mx-auto aspect-square w-full max-w-[min(400px,calc(var(--card-h)_-_290px))]">
        {flourish}
        <div data-particle-slot={`stage-${s.n}`} className="absolute inset-[4%]" aria-hidden="true" />
      </div>
      <SceneCaption s={s} className={`mx-auto mt-5 max-w-[480px] text-center sm:mt-8 ${captionClassName}`} />
    </section>
  );
}
