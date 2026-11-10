"use client";

import { useEffect, useRef } from "react";
import type { IconKey } from "@/content/site";
import { palette } from "@/components/particles/palette";
import { PICTURES } from "@/components/particles/pictures";

/**
 * One of the nine already-detailed illustrations (`pictures.ts`), drawn live inside a scene —
 * the same continuous redraw ParticleStage uses for a landed picture (so its own small details
 * keep moving: hearts float, a flash fires, lights sweep), just standalone, not tied to the
 * particle swarm. Reused by every scene except Social (which the swarm itself still forms).
 */
export function PictureCanvas({ icon, className = "" }: { icon: IconKey; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let raf = 0;
    let visible = true;
    const t0 = performance.now();
    const isDark = () => document.documentElement.dataset.theme === "dark";

    const resize = () => {
      const side = cv.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const px = Math.max(2, Math.round(side * dpr));
      if (cv.width !== px) {
        cv.width = px;
        cv.height = px;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "30% 0px 30% 0px" });
    io.observe(cv);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || cv.width === 0) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      PICTURES[icon](ctx, cv.width, palette(isDark()), (performance.now() - t0) / 1000);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [icon]);

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden="true" />;
}
