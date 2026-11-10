"use client";

import { useRef } from "react";
import type { Service } from "@/content/site";
import { useSceneProgress } from "../useSceneProgress";
import { SceneCaption } from "./SceneCaption";
import { PictureCanvas } from "./PictureCanvas";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// where the echo phones sit around the centre, as a fraction of the stage's own size
const ECHOES: [number, number, number][] = [
  [-1.25, -0.55, 0],
  [1.2, -0.7, 0.08],
  [-1.4, 0.65, 0.16],
  [1.35, 0.6, 0.24],
  [-0.15, -1.15, 0.32],
  [0.1, 1.2, 0.4],
];

/** 02 · Advertising — opens tight on one ad, then pulls back to reveal it reaching everywhere. */
export function Scene2Advertising({ s }: { s: Service }) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref, "top 35%");
  const pullBack = clamp01((p - 0.1) / 0.75); // the zoom-out itself starts a touch after entering
  const scale = 1.55 - 0.55 * pullBack;

  return (
    <section ref={ref} id={`service-${s.slug}`} className="scene-section relative overflow-hidden py-16 sm:py-24">
      <div className="container-x">
        <div className="relative mx-auto flex aspect-[4/5] w-full max-w-[520px] items-center justify-center sm:aspect-square">
          {ECHOES.map(([x, y, start], i) => {
            const u = clamp01((pullBack - start) / 0.3);
            return (
              <span
                key={i}
                className="scene-echo pointer-events-none absolute h-[22%] w-[17%] rounded-2xl border border-white/10 bg-[var(--chip-bg)]"
                style={{
                  left: `calc(50% + ${x * 32}%)`,
                  top: `calc(50% + ${y * 32}%)`,
                  transform: `translate(-50%,-50%) scale(${0.5 + u * 0.5})`,
                  opacity: u * 0.9,
                }}
                aria-hidden="true"
              />
            );
          })}
          <div className="relative z-10 h-[46%] w-[46%]" style={{ transform: `scale(${scale})` }}>
            <PictureCanvas icon="advertising" />
          </div>
        </div>
        <SceneCaption s={s} className="mx-auto mt-6 max-w-[480px] text-center sm:mt-10" />
      </div>
    </section>
  );
}
