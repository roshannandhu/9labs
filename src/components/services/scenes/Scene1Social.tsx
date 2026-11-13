import type { Service } from "@/content/site";
import { SceneShell } from "./SceneShell";

/** 01 · Social media — carries straight on from the hero's own swarm. */
export function Scene1Social({ s }: { s: Service; active?: boolean }) {
  return <SceneShell s={s} />;
}
