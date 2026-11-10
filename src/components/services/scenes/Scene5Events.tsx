import type { Service } from "@/content/site";
import { SceneShell } from "./SceneShell";

/** 05 · Events & trade shows — a soft glow and a few drifting confetti flecks once it's formed. */
export function Scene5Events({ s, active }: { s: Service; active: boolean }) {
  return (
    <SceneShell
      s={s}
      flourish={
        <>
          <span className="scene-events-glow pointer-events-none absolute inset-[-24%] -z-10 rounded-full" style={{ opacity: active ? 1 : 0 }} aria-hidden="true" />
          {active && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={`scene-confetti scene-confetti-${i % 3}`} style={{ left: `${14 + i * 18}%`, animationDelay: `${i * 0.7}s` }} />
              ))}
            </div>
          )}
        </>
      }
    />
  );
}
