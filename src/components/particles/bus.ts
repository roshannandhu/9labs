import type { IconKey } from "@/content/site";

/** A single particle target: the hero 9, a service picture, or the finale "all nine" 9. */
export type ParticleTarget = { kind: "hero" } | { kind: "pic"; icon: IconKey } | { kind: "all9" };

export const heroTarget: ParticleTarget = { kind: "hero" };
export const allNineTarget: ParticleTarget = { kind: "all9" };
export const picTarget = (icon: IconKey): ParticleTarget => ({ kind: "pic", icon });

export function targetKey(t: ParticleTarget): string {
  return t.kind === "pic" ? `p${t.icon}` : t.kind;
}
export function sameTarget(a: ParticleTarget, b: ParticleTarget): boolean {
  return targetKey(a) === targetKey(b);
}

/**
 * Where the one particle swarm is, as a flight between two targets:
 *   - **resting** (`sameTarget(from, to)`): the swarm is fully formed at `to` — ParticleStage
 *     draws no particles, the slot's own crisp canvas shows the picture, alive.
 *   - **flying** (`from !== to`, `u` 0→1): the swarm is between `from` and `to`; `dir` only steers
 *     which way the flight swirls (+1 clockwise / −1 anticlockwise).
 *
 * Only `services/useServiceTrack.ts` writes this, from scroll position.
 */
export const particleBus: { from: ParticleTarget; to: ParticleTarget; u: number; dir: 1 | -1 } = {
  from: heroTarget,
  to: heroTarget,
  u: 0,
  dir: 1,
};
