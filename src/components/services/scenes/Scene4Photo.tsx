"use client";

import { useRef } from "react";
import type { Service } from "@/content/site";
import { useSceneProgress } from "../useSceneProgress";
import { SceneCaption } from "./SceneCaption";
import { PictureCanvas } from "./PictureCanvas";

/** 04 · Photography & filming — the scene starts out of focus and pulls sharp as it scrolls in. */
export function Scene4Photo({ s }: { s: Service }) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref, "top 40%");
  const blur = (1 - p) * 16;

  return (
    <section ref={ref} id={`service-${s.slug}`} className="scene-section relative py-16 sm:py-24">
      <div className="container-x">
        <div className="relative mx-auto h-[62vw] max-h-[460px] w-full max-w-[460px]" style={{ filter: `blur(${blur.toFixed(1)}px)`, opacity: 0.5 + p * 0.5 }}>
          <PictureCanvas icon="photo" />
        </div>
        <SceneCaption s={s} className="mx-auto mt-6 max-w-[480px] text-center sm:mt-10" />
      </div>
    </section>
  );
}
