import { gsap } from "@/lib/gsap";
import type { IconKey } from "@/content/site";

/** A single particle target: the hero 9, a digit 1-9, a service picture, or the finale "all nine" 9. */
export type ParticleTarget = { kind: "hero" } | { kind: "digit"; ch: string } | { kind: "pic"; icon: IconKey } | { kind: "all9" };

export const heroTarget: ParticleTarget = { kind: "hero" };
export const allNineTarget: ParticleTarget = { kind: "all9" };
export const digitTarget = (n: number): ParticleTarget => ({ kind: "digit", ch: String(n) });
export const picTarget = (icon: IconKey): ParticleTarget => ({ kind: "pic", icon });

export function targetKey(t: ParticleTarget): string {
  return t.kind === "digit" ? `d${t.ch}` : t.kind === "pic" ? `p${t.icon}` : t.kind;
}
export function sameTarget(a: ParticleTarget, b: ParticleTarget): boolean {
  return targetKey(a) === targetKey(b);
}

/**
 * Where the one particle swarm is, as a flight between two targets:
 *   - **resting** (`sameTarget(from, to)`): the swarm is fully formed at `to` — ParticleStage
 *     draws no particles, the slot's own crisp canvas shows the picture/digit, alive.
 *   - **flying** (`from !== to`, `u` tweening 0→1): the swarm is between `from` and `to`; `dir`
 *     only steers which way the flight swirls (+1 clockwise / −1 anticlockwise).
 * `t0` is when the current flight started (performance.now()), used for the crossfade timing.
 *
 * Written two ways: the hero→stage scroll hand-off (ParticleStage.tsx) while scrolling through
 * it, and `goto()` below (the Services Showcase director) once the stage has been reached.
 */
export const particleBus: { from: ParticleTarget; to: ParticleTarget; u: number; dir: 1 | -1; t0: number } = {
  from: heroTarget,
  to: heroTarget,
  u: 0,
  dir: 1,
  t0: 0,
};

/** Flies the swarm from its current resting target to `target`, resolving once it has landed. */
export function goto(target: ParticleTarget, dir: 1 | -1 = 1, duration = 0.85): Promise<void> {
  return new Promise((resolve) => {
    const from = particleBus.to;
    if (sameTarget(from, target)) {
      resolve();
      return;
    }
    gsap.killTweensOf(particleBus);
    particleBus.from = from;
    particleBus.to = target;
    particleBus.dir = dir;
    particleBus.u = 0;
    particleBus.t0 = performance.now();
    gsap.to(particleBus, {
      u: 1,
      duration,
      ease: "power3.inOut",
      onComplete: () => {
        particleBus.from = target;
        resolve();
      },
    });
  });
}

/** Jumps straight to `target` with no flight (reduced motion). */
export function snapTo(target: ParticleTarget) {
  gsap.killTweensOf(particleBus);
  particleBus.from = target;
  particleBus.to = target;
  particleBus.u = 0;
}

const stageListeners = new Set<() => void>();
/** Fired once the hero→stage scroll hand-off reaches the stage (ParticleStage.tsx → Services.tsx). */
export function onStageReached(cb: () => void): () => void {
  stageListeners.add(cb);
  return () => stageListeners.delete(cb);
}
export function fireStageReached() {
  stageListeners.forEach((cb) => cb());
}
