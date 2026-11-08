"use client";

import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";

/**
 * Section divider in the bridge motif: two small pylons, a cable that draws itself as the divider
 * scrolls into view, and one light dot that crosses it (once per visit; again if you scroll back).
 * Reduced motion shows the finished bridge with no dot. Pure SVG + CSS; the cable is stretched
 * with `preserveAspectRatio="none"` and `non-scaling-stroke`, so it stays crisp at any width.
 */
export function BridgeDivider({ className = "" }: { className?: string }) {
  const { reduced } = useDemo();
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || reduced) return;
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        end: "top 52%",
        scrub: true,
        onUpdate: (self) => el.style.setProperty("--draw", self.progress.toFixed(3)),
      });
      ScrollTrigger.create({
        trigger: el,
        start: "top 62%",
        onEnter: () => (el.dataset.cross = "true"),
        onLeaveBack: () => (el.dataset.cross = "false"),
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  const line = { fill: "none", stroke: "var(--nl-purple)", vectorEffect: "non-scaling-stroke" as const, strokeLinecap: "round" as const };
  return (
    <div
      ref={root}
      className={`bridge-divider container-x pointer-events-none relative h-14 sm:h-16 ${className}`}
      style={{ ["--draw" as string]: reduced ? 1 : 0 }}
      data-cross="false"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1000 64" preserveAspectRatio="none" className="absolute inset-x-[6%] top-0 h-full w-[88%] overflow-visible">
        {/* deck */}
        <path d="M0 52H1000" className="bd-deck" {...line} strokeOpacity="0.18" strokeWidth="1" />
        {/* pylons */}
        <path d="M60 52V8M60 14H70M60 14H50" pathLength={1} className="bd-pylon" {...line} strokeOpacity="0.7" strokeWidth="1.4" />
        <path d="M940 52V8M940 14H950M940 14H930" pathLength={1} className="bd-pylon" {...line} strokeOpacity="0.7" strokeWidth="1.4" />
        {/* main cable, drawn by scroll */}
        <path d="M60 10Q500 92 940 10" pathLength={1} className="bd-cable" {...line} strokeOpacity="0.75" strokeWidth="1.2" />
        {/* the dot: crosses once, in both directions */}
        <path d="M60 10Q500 92 940 10" pathLength={1} className="bd-dot" {...line} stroke="#f1e8ff" strokeWidth="5" />
      </svg>
    </div>
  );
}
