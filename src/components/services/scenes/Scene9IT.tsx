"use client";

import { useRef } from "react";
import type { Service } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { StaticDigit } from "@/components/particles/StaticDigit";
import { useSceneProgress } from "../useSceneProgress";
import { SceneCaption } from "./SceneCaption";
import { PictureCanvas } from "./PictureCanvas";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
// cloud · server · laptop · shield — where each piece starts, before it converges
const PARTS: [number, number, number][] = [
  [-1.7, -1.05, -8],
  [1.75, -0.9, 9],
  [-1.55, 1.2, 10],
  [1.6, 1.25, -9],
];

/** 09 · IT consultancy — the pieces assemble as you scroll, then the whole sequence closes. */
export function Scene9IT({ s, services }: { s: Service; services: Service[] }) {
  const ref = useRef<HTMLElement>(null);
  const p = useSceneProgress(ref, "top 25%");
  const assemble = clamp01(p / 0.6);
  const finale = clamp01((p - 0.78) / 0.22);

  return (
    <section ref={ref} id={`service-${s.slug}`} className="scene-section relative py-16 sm:py-24">
      <div className="container-x">
        <div className="relative mx-auto h-[62vw] max-h-[440px] w-full max-w-[440px]">
          {PARTS.map(([x, y, rot], i) => (
            <span
              key={i}
              className="scene-echo pointer-events-none absolute left-1/2 top-1/2 h-[26%] w-[26%] rounded-2xl border border-white/10 bg-[var(--chip-bg)]"
              style={{
                transform: `translate(-50%,-50%) translate(${x * (1 - assemble) * 60}%, ${y * (1 - assemble) * 60}%) rotate(${rot * (1 - assemble)}deg) scale(${0.7 + assemble * 0.3})`,
                opacity: (1 - assemble) * 0.8,
              }}
              aria-hidden="true"
            />
          ))}
          <div className="relative h-full w-full" style={{ opacity: assemble, transform: `scale(${0.88 + assemble * 0.12})` }}>
            <PictureCanvas icon="it" />
          </div>
        </div>
        <SceneCaption s={s} className="mx-auto mt-6 max-w-[480px] text-center sm:mt-10" />

        {/* the sequence closes the way it opened: the 9, and all nine activities at a glance */}
        <div className="mx-auto mt-16 flex max-w-[760px] flex-col items-center text-center sm:mt-24" style={{ opacity: finale, transform: `translateY(${(1 - finale) * 24}px)` }}>
          <div className="h-24 w-24 sm:h-32 sm:w-28" aria-hidden="true">
            <StaticDigit ch="9" />
          </div>
          <h3 className="mt-3 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">
            All nine. <span className="font-accent text-gradient">One team.</span>
          </h3>
          <ul className="mt-8 grid w-full grid-cols-3 gap-2 sm:gap-3">
            {services.map((svc) => (
              <li key={svc.slug}>
                <a
                  href={`#service-${svc.slug}`}
                  className="finale-tile flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-2 py-4 text-nl-blue-soft transition-colors hover:border-nl-purple/50 hover:bg-nl-purple/[0.06] sm:gap-3 sm:rounded-3xl sm:py-6"
                >
                  <ActivityIcon icon={svc.icon} size={30} play={false} />
                  <span className="text-[11.5px] font-medium leading-tight text-white/80 sm:text-sm">{svc.short}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
