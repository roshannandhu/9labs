"use client";

import { useRef } from "react";
import type { Service } from "@/content/site";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { particleBus, heroTarget, digitTarget, picTarget, sameTarget } from "@/components/particles/bus";
import { SceneCaption } from "./SceneCaption";

/**
 * 01 · Social media — the only scene the swarm still forms from dust: it carries straight on from
 * the hero (the "9" becomes "1," blooms into the phone), driven purely by this scene's own scroll
 * position — no pin, reversible, exactly like the other eight. Everything after the phone is
 * formed (the feed's own likes/chat animate) is the picture's own continuous life, same as always.
 */
export function Scene1Social({ s }: { s: Service }) {
  const { reduced } = useDemo();
  const sectionRef = useRef<HTMLElement>(null);
  const pic = picTarget(s.icon);

  useGSAP(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    const write = (p: number) => {
      if (p <= 0.001) {
        particleBus.from = heroTarget;
        particleBus.to = heroTarget;
        particleBus.u = 0;
        return;
      }
      if (p >= 0.999) {
        particleBus.from = pic;
        particleBus.to = pic;
        particleBus.u = 0;
        return;
      }
      particleBus.dir = 1;
      if (p < 0.5) {
        particleBus.from = heroTarget;
        particleBus.to = digitTarget(1);
        particleBus.u = p / 0.5;
      } else {
        particleBus.from = digitTarget(1);
        particleBus.to = pic;
        particleBus.u = (p - 0.5) / 0.5;
      }
    };
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "top 30%",
      scrub: true,
      onUpdate: (st) => write(st.progress),
      onRefresh: (st) => write(st.progress),
    });
    return () => {
      st.kill();
      if (sameTarget(particleBus.to, pic) || sameTarget(particleBus.to, digitTarget(1))) {
        particleBus.from = heroTarget;
        particleBus.to = heroTarget;
        particleBus.u = 0;
      }
    };
  }, [reduced]);

  return (
    <section ref={sectionRef} id={`service-${s.slug}`} className="scene-section relative py-16 sm:py-24">
      <div className="container-x">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] sm:aspect-square">
          <div data-particle-slot="stage" className="absolute inset-[4%]" aria-hidden="true" />
        </div>
        <SceneCaption s={s} className="mx-auto mt-6 max-w-[480px] text-center sm:mt-10" />
      </div>
    </section>
  );
}
