"use client";

import { useRef } from "react";
import type { Service } from "@/content/site";
import { useSceneProgress } from "../useSceneProgress";
import { SceneCaption } from "./SceneCaption";
import { PictureCanvas } from "./PictureCanvas";

const FRAMES = 7;
const HERO_FRAME = 3; // which frame in the strip shows the real picture

/** 03 · Content & creative — a film strip of frames pans sideways as the page scrolls down. */
export function Scene3Content({ s }: { s: Service }) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref, "top 35%");
  const pan = (0.5 - p) * 26; // %, drifts left as p goes 0 → 1

  return (
    <section ref={ref} id={`service-${s.slug}`} className="scene-section relative overflow-hidden py-16 sm:py-24">
      <div className="container-x">
        <div className="scene-strip-mask -mx-4 overflow-hidden py-4 sm:-mx-8">
          <div className="flex w-max gap-3 sm:gap-4" style={{ transform: `translateX(${pan}%)` }}>
            {Array.from({ length: FRAMES }, (_, i) => (
              <div
                key={i}
                className={`relative h-[34vw] w-[26vw] shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:h-[260px] sm:w-[200px] ${
                  i === HERO_FRAME ? "bg-[var(--chip-bg)]" : "scene-frame-fill"
                }`}
              >
                {i === HERO_FRAME && <PictureCanvas icon="content" />}
              </div>
            ))}
          </div>
        </div>
        <SceneCaption s={s} className="mt-8 sm:mt-10" />
      </div>
    </section>
  );
}
