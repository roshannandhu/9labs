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
 *   - **flying** (`from !== to`, `u` 0→1): the swarm is between `from` and `to`; `dir` only steers
 *     which way the flight swirls (+1 clockwise / −1 anticlockwise).
 * `t0` is when the current flight started (performance.now()), used for the crossfade timing.
 *
 * Only `scenes/Scene1Social.tsx` writes this now — directly, from its own (non-pinned, reversible)
 * scroll trigger, every other scene never touches it.
 */
export const particleBus: { from: ParticleTarget; to: ParticleTarget; u: number; dir: 1 | -1; t0: number } = {
  from: heroTarget,
  to: heroTarget,
  u: 0,
  dir: 1,
  t0: 0,
};
