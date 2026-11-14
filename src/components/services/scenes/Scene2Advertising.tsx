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
          className="scene-echo pointer-events-none absolute left-1/2 top-1/2 flex h-[18%] w-[13%] flex-col justify-between rounded-xl border border-nl-indigo/20 bg-nl-indigo/[0.04] p-1.5 shadow-[0_4px_16px_-4px_rgba(53,48,208,0.08)] backdrop-blur-[2px] transition-all duration-500 dark:border-white/10 dark:bg-white/[0.04]"
          style={{
            left: `calc(50% + ${x * 32}%)`,
            top: `calc(50% + ${y * 32}%)`,
            transform: `translate(-50%,-50%) scale(${active ? 1 : 0.6})`,
            opacity: active ? 0.9 : 0,
            transitionDelay: `${delay}s`,
          }}
          aria-hidden="true"
        >
          <span className="h-1 w-3/5 rounded-full bg-nl-indigo/20 dark:bg-white/20" />
          <span className="h-1 w-4/5 rounded-full bg-nl-indigo/15 dark:bg-white/15" />
        </span>
      ))}
    />
  );
}
