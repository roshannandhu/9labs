"use client";

import { useRef } from "react";
import type { Service } from "@/content/site";
import { useSceneProgress } from "../useSceneProgress";
import { SceneCaption } from "./SceneCaption";
import { PictureCanvas } from "./PictureCanvas";

/** 08 · AI consultancy — a chip under glow, tilting gently as it scrolls through (scroll, not cursor). */
export function Scene8AI({ s }: { s: Service }) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref, "top 35%");
  const tilt = (0.5 - p) * 10;

  return (
    <section ref={ref} id={`service-${s.slug}`} className="scene-section relative overflow-hidden py-16 sm:py-24">
      <span className="scene-ai-glow pointer-events-none absolute left-1/2 top-1/2 h-[60vw] w-[60vw] max-h-[480px] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ opacity: 0.4 + p * 0.6 }} aria-hidden="true" />
      <div className="container-x relative">
        <div className="mx-auto h-[62vw] max-h-[440px] w-full max-w-[440px]" style={{ perspective: "900px" }}>
          <div className="h-full w-full" style={{ transform: `rotateX(${tilt}deg) rotateY(${-tilt * 0.7}deg)`, transformStyle: "preserve-3d" }}>
            <PictureCanvas icon="ai" />
          </div>
        </div>
        <SceneCaption s={s} className="mx-auto mt-6 max-w-[480px] text-center sm:mt-10" />
      </div>
    </section>
  );
}
