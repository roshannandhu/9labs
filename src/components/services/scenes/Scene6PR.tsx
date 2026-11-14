import type { Service } from "@/content/site";
import { SceneShell } from "./SceneShell";

/** 06 · PR & communications — consistent SceneShell layout with particle stage and clean caption. */
export function Scene6PR({ s }: { s: Service; active?: boolean }) {
  return <SceneShell s={s} />;
}
