"use client";

import { useRef } from "react";
import type { Service } from "@/content/site";
import { useSceneProgress } from "../useSceneProgress";
import { SceneCaption } from "./SceneCaption";
import { PictureCanvas } from "./PictureCanvas";

/** 05 · Events & trade shows — backdrop, stage and crowd drift at different speeds: real depth. */
export function Scene5Events({ s }: { s: Service }) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref, "top 35%");
  const rise = (1 - p) * 22;

  return (
    <section ref={ref} id={`service-${s.slug}`} className="scene-section relative overflow-hidden py-16 sm:py-24">
      <span
        className="scene-events-glow pointer-events-none absolute left-1/2 top-1/2 h-[70vw] w-[70vw] max-h-[560px] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ transform: `translate(-50%, calc(-50% + ${rise * 0.3}px))` }}
        aria-hidden="true"
      />
      <div className="container-x relative">
        <div className="relative mx-auto h-[58vw] max-h-[420px] w-full max-w-[520px]" style={{ transform: `translateY(${rise * 0.5}px)` }}>
          <PictureCanvas icon="events" />
        </div>
        <div className="pointer-events-none mx-auto -mt-4 flex max-w-[380px] justify-center gap-2" style={{ transform: `translateY(${rise}px)`, opacity: p }} aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="h-2 w-2 rounded-full bg-[var(--nl-purple)]" style={{ opacity: 0.3 + (i % 3) * 0.2 }} />
          ))}
        </div>
        <SceneCaption s={s} className="mx-auto mt-6 max-w-[480px] text-center sm:mt-8" />
      </div>
    </section>
  );
}
