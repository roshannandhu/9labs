"use client";

import type { ReactNode } from "react";
import type { Service } from "@/content/site";
import { SceneCaption } from "./SceneCaption";

/**
 * The chrome every one of the nine scenes shares: one full screen, the particle-formed picture
 * (its own slot, named by the service's number — `useServiceTrack` drives what forms there),
 * `SceneCaption` (title/line/WhatsApp CTA), and a spot for that scene's own small personality
 * (`flourish`) layered around the picture. No border, no card background — the scene *is* the page.
 */
export function SceneShell({ s, flourish, captionClassName = "" }: { s: Service; flourish?: ReactNode; captionClassName?: string }) {
  return (
    <section id={`service-${s.slug}`} className="scene-section relative flex h-[100svh] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:px-8">
      <div className="relative mx-auto aspect-square w-full max-w-[440px]">
        {flourish}
        <div data-particle-slot={`stage-${s.n}`} className="absolute inset-[4%]" aria-hidden="true" />
      </div>
      <SceneCaption s={s} className={`mx-auto mt-6 max-w-[480px] text-center sm:mt-10 ${captionClassName}`} />
    </section>
  );
}
