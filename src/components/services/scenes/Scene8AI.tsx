import type { Service } from "@/content/site";
import { SceneShell } from "./SceneShell";

/** 08 · AI consultancy — once settled, a slow autonomous tilt/breathing motion plays. */
export function Scene8AI({ s, active }: { s: Service; active: boolean }) {
  return (
    <SceneShell
      s={s}
      flourish={<span className="scene-ai-glow pointer-events-none absolute inset-[-22%] -z-10 rounded-full" style={{ opacity: active ? 1 : 0 }} aria-hidden="true" />}
      captionClassName=""
    />
  );
}
