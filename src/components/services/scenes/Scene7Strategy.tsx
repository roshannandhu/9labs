"use client";

import { useRef } from "react";
import type { Service } from "@/content/site";
import { useSceneProgress } from "../useSceneProgress";
import { SceneCaption } from "./SceneCaption";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const LINE = "M4 150 L55 128 L95 138 L140 92 L185 104 L232 44 L268 30";
const TARGET = { x: 268, y: 30 };

/** 07 · Strategy & consultancy — the growth line draws itself exactly as far as you've scrolled. */
export function Scene7Strategy({ s }: { s: Service }) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref, "top 35%");
  const draw = clamp01(p / 0.75);
  const strike = clamp01((p - 0.75) / 0.25);
  const ax = TARGET.x + 60 - 60 * strike;
  const ay = TARGET.y - 46 + 46 * strike;

  return (
    <section ref={ref} id={`service-${s.slug}`} className="scene-section relative py-16 sm:py-24">
      <div className="container-x">
        <svg viewBox="0 0 300 180" className="mx-auto block w-full max-w-[520px] overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="svc7-grad" x1="0" x2="1">
              <stop offset="0" stopColor="var(--logo-from)" />
              <stop offset="1" stopColor="var(--logo-to)" />
            </linearGradient>
          </defs>
          <path d={LINE} fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={LINE}
            fill="none"
            stroke="url(#svc7-grad)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - draw }}
          />
          <g style={{ opacity: clamp01(p / 0.2) }}>
            <circle cx={TARGET.x} cy={TARGET.y} r="22" fill="none" stroke="var(--nl-purple)" strokeOpacity="0.4" />
            <circle cx={TARGET.x} cy={TARGET.y} r="13" fill="none" stroke="var(--nl-purple)" strokeOpacity="0.6" />
            <circle cx={TARGET.x} cy={TARGET.y} r="4" fill="var(--nl-purple)" />
          </g>
          <g style={{ opacity: clamp01((p - 0.6) / 0.2), transform: `translate(${ax}px, ${ay}px) rotate(135deg)`, transformOrigin: `${ax}px ${ay}px` }}>
            <path d="M-20 0 H14 M14 0 L4 -7 M14 0 L4 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        </svg>
        <SceneCaption s={s} className="mx-auto mt-6 max-w-[480px] text-center sm:mt-10" />
      </div>
    </section>
  );
}
