import type { Service } from "@/content/site";
import { SceneCaption } from "./SceneCaption";

/** 06 · PR & communications — a short headline leads, the swarm forms the picture below it. */
export function Scene6PR({ s }: { s: Service }) {
  return (
    <section id={`service-${s.slug}`} className="scene-section relative flex h-[100svh] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:px-8">
      <h3 className="mx-auto max-w-[16ch] text-center font-display text-[clamp(2rem,6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
        Your story. <span className="font-accent text-gradient">Heard everywhere.</span>
      </h3>
      <div className="relative mx-auto mt-6 aspect-square w-full max-w-[360px] sm:mt-8">
        <div data-particle-slot={`stage-${s.n}`} className="absolute inset-[4%]" aria-hidden="true" />
      </div>
      <SceneCaption s={s} className="mx-auto mt-4 max-w-[480px] text-center" />
    </section>
  );
}
