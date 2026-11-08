/**
 * Where the particle swarm is in its story, as one number driven only by scroll:
 *   t = 0   → the 9 in the hero
 *   t = 1…9 → the digits 1…9 beside each service card (pinned stage)
 *   t = 10  → the small 9 above the "all nine" finale
 * Fractions are the in-between "split and re-form" moments. Written by ServicesStage's
 * ScrollTriggers, read every frame by ParticleStage.
 */
export const particleBus = { t: 0 };

/** Slots the swarm draws into, in story order (index = floor(t), with 10 = finale). */
export const SLOT = { hero: "hero", stage: "stage", finale: "finale" } as const;
