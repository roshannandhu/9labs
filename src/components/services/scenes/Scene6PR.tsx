"use client";

import { useRef } from "react";
import type { Service } from "@/content/site";
import { useSceneProgress } from "../useSceneProgress";
import { SceneCaption } from "./SceneCaption";
import { PictureCanvas } from "./PictureCanvas";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 06 · PR & communications — led by words, not a picture: a big headline assembles, then settles. */
export function Scene6PR({ s }: { s: Service }) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref, "top 30%");
  const line1 = clamp01(p / 0.35);
  const line2 = clamp01((p - 0.25) / 0.35);
  const settle = clamp01((p - 0.55) / 0.4); // the headline shrinks, the picture arrives

  return (
    <section ref={ref} id={`service-${s.slug}`} className="scene-section relative py-16 sm:py-24">
      <div className="container-x grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <h3
          className="font-display font-semibold leading-[0.98] tracking-[-0.03em]"
          style={{ fontSize: `clamp(2rem, ${7 - settle * 3}vw, ${5.4 - settle * 2.2}rem)`, transition: "font-size 0.05s linear" }}
        >
          <span style={{ opacity: line1, transform: `translateY(${(1 - line1) * 14}px)`, display: "inline-block" }}>Your story.</span>
          <br />
          <span className="font-accent text-gradient" style={{ opacity: line2, transform: `translateY(${(1 - line2) * 14}px)`, display: "inline-block" }}>
            Heard everywhere.
          </span>
        </h3>
        <div className="flex flex-col items-start" style={{ opacity: settle, transform: `translateY(${(1 - settle) * 18}px)` }}>
          <div className="h-[48vw] max-h-[320px] w-full max-w-[380px]">
            <PictureCanvas icon="pr" />
          </div>
          <SceneCaption s={s} className="mt-4" />
        </div>
      </div>
    </section>
  );
}
