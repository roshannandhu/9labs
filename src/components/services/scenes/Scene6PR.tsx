import type { Service } from "@/content/site";
import { SceneCaption } from "./SceneCaption";

/** 06 · PR & communications — a short headline leads, the swarm forms the picture below it. */
export function Scene6PR({ s }: { s: Service }) {
  return (
    <section id={`service-${s.slug}`} aria-roledescription="slide" aria-label={`${s.n} of 9: ${s.title}`} className="scene-section scene-card">
      <h3 className="mx-auto max-w-[16ch] text-center font-display text-[clamp(1.8rem,5vw,3.2rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
        Your story. <span className="font-accent text-gradient">Heard everywhere.</span>
      </h3>
      <div className="relative mx-auto mt-5 aspect-square w-full max-w-[min(300px,26svh)] sm:mt-7">
        <div data-particle-slot={`stage-${s.n}`} className="absolute inset-[4%]" aria-hidden="true" />
      </div>
      <SceneCaption s={s} className="mx-auto mt-4 max-w-[480px] text-center" />
    </section>
  );
}
