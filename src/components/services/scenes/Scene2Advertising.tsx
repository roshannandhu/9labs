import type { Service } from "@/content/site";
import { SceneShell } from "./SceneShell";

const ECHOES: [number, number, number][] = [
  [-1.25, -0.55, 0],
  [1.2, -0.7, 0.08],
  [-1.4, 0.65, 0.16],
  [1.35, 0.6, 0.24],
];

/** 02 · Advertising — once the megaphone has formed, a few echo "phones" fade in around it: reach. */
export function Scene2Advertising({ s, active }: { s: Service; active: boolean }) {
  return (
    <SceneShell
      s={s}
      flourish={ECHOES.map(([x, y, delay], i) => (
        <span
          key={i}
          className="scene-echo pointer-events-none absolute left-1/2 top-1/2 h-[18%] w-[14%] rounded-2xl border border-white/10 bg-[var(--chip-bg)]"
          style={{
            left: `calc(50% + ${x * 32}%)`,
            top: `calc(50% + ${y * 32}%)`,
            transform: `translate(-50%,-50%) scale(${active ? 1 : 0.6})`,
            opacity: active ? 0.85 : 0,
            transitionDelay: `${delay}s`,
          }}
          aria-hidden="true"
        />
      ))}
    />
  );
}
