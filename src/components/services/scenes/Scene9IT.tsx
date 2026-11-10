import type { Service } from "@/content/site";
import { SceneShell } from "./SceneShell";

/** 09 · IT consultancy — the pieces assemble via the swarm itself; the sequence closes just after. */
export function Scene9IT({ s }: { s: Service }) {
  return <SceneShell s={s} />;
}
