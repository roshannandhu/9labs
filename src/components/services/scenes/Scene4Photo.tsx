import type { Service } from "@/content/site";
import { SceneShell } from "./SceneShell";

/** 04 · Photography & filming — the dust assembling is the "coming into focus" moment. */
export function Scene4Photo({ s }: { s: Service; active?: boolean }) {
  return <SceneShell s={s} />;
}
