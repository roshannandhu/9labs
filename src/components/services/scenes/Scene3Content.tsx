import type { Service } from "@/content/site";
import { SceneShell } from "./SceneShell";

/** 03 · Content & creative — a couple of quiet frame tiles flank the picture once it's formed. */
export function Scene3Content({ s, active }: { s: Service; active: boolean }) {
  return (
    <SceneShell
      s={s}
      flourish={
        <>
          <span
            className="scene-echo scene-frame-fill pointer-events-none absolute right-[-14%] top-1/2 h-[46%] w-[20%] -translate-y-1/2 rounded-2xl border border-white/10"
            style={{ transform: `translateY(-50%) scale(${active ? 1 : 0.85})`, opacity: active ? 0.8 : 0 }}
            aria-hidden="true"
          />
          <span
            className="scene-echo scene-frame-fill pointer-events-none absolute left-[-14%] top-1/2 h-[40%] w-[16%] -translate-y-1/2 rounded-2xl border border-white/10"
            style={{ transform: `translateY(-50%) scale(${active ? 1 : 0.85})`, opacity: active ? 0.6 : 0, transitionDelay: "0.06s" }}
            aria-hidden="true"
          />
        </>
      }
    />
  );
}
