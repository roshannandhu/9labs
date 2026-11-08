"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";

const DECK_Y = 270;
const X0 = 40;
const X1 = 1160;
const TOWERS = [330, 870];
const TOP = 62;

const quad = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

function hangers() {
  const out: { x: number; y: number }[] = [];
  // centre span: (330,62) → control (600,428) → (870,62)
  for (let x = 360; x <= 840; x += 30) {
    const t = (x - 330) / 540;
    out.push({ x, y: quad(TOP, 428, TOP, t) });
  }
  // side spans
  for (let x = 70; x <= 310; x += 30) {
    const t = (x - X0) / (330 - X0);
    out.push({ x, y: quad(255, 160, TOP, t) });
  }
  for (let x = 890; x <= 1130; x += 30) {
    const t = (x - 870) / (X1 - 870);
    out.push({ x, y: quad(TOP, 160, 255, t) });
  }
  return out.filter((h) => h.y < DECK_Y - 6);
}

/**
 * The brand idea, drawn: a suspension bridge that builds itself as you scroll, with traffic
 * moving in both directions — your goals (blue) reach us, our expertise (purple) reaches
 * you — meeting at the 9 in the middle. A pure shape with no lettering baked into it, so it
 * scales to any width (phone included) without ever needing to scroll sideways; the caption
 * lives in normal HTML underneath where it can wrap and stay readable at any size.
 */
export function BridgeIllustration() {
  const { reduced } = useDemo();
  const root = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 85%", end: "center 50%", scrub: 0.6 },
      });
      tl.from(q(".br-tower"), { drawSVG: "0%", duration: 1, stagger: 0.1, ease: "none" })
        .from(q(".br-deck"), { drawSVG: "50% 50%", duration: 1, ease: "none" }, 0.2)
        .from(q(".br-cable"), { drawSVG: "0%", duration: 1.2, stagger: 0.15, ease: "none" }, 0.6)
        .from(q(".br-hanger"), { drawSVG: "0%", duration: 0.4, stagger: 0.02, ease: "none" }, 1.2)
        .from(q(".br-mark"), { opacity: 0, scale: 0.6, transformOrigin: "center", duration: 0.5, stagger: 0.15 }, 1.3);
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  const hs = hangers();
  const stroke = { fill: "none", vectorEffect: "non-scaling-stroke" as const, strokeLinecap: "round" as const };

  return (
    <svg
      ref={root}
      viewBox="0 0 1200 380"
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label="A bridge between your business and your results: your goals travel to us, our expertise travels to you, and we meet in the middle."
    >
      <defs>
        <linearGradient id="br-cable" x1="0" x2="1">
          <stop offset="0" style={{ stopColor: "var(--nl-blue)" }} />
          <stop offset="0.5" style={{ stopColor: "#ffffff" }} stopOpacity="0.85" />
          <stop offset="1" style={{ stopColor: "var(--nl-purple)" }} />
        </linearGradient>
        <linearGradient id="br-tail-a" x1="1" x2="0">
          <stop offset="0" style={{ stopColor: "var(--nl-blue-soft)" }} />
          <stop offset="1" style={{ stopColor: "var(--nl-blue)" }} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="br-tail-b" x1="0" x2="1">
          <stop offset="0" style={{ stopColor: "var(--nl-purple)" }} />
          <stop offset="1" style={{ stopColor: "var(--nl-purple)" }} stopOpacity="0" />
        </linearGradient>
        <filter id="br-glow" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* water / ground line */}
      <path d={`M0 336 H1200`} {...stroke} stroke="white" strokeOpacity="0.1" strokeDasharray="2 8" />

      {/* towers */}
      {TOWERS.map((x) => (
        <g key={x}>
          <path className="br-tower" d={`M${x - 12} 336 V${TOP}`} {...stroke} stroke="white" strokeOpacity="0.55" strokeWidth={1.4} />
          <path className="br-tower" d={`M${x + 12} 336 V${TOP}`} {...stroke} stroke="white" strokeOpacity="0.55" strokeWidth={1.4} />
          <path className="br-tower" d={`M${x - 12} 110 L${x + 12} 160 M${x + 12} 110 L${x - 12} 160 M${x - 12} 190 L${x + 12} 240 M${x + 12} 190 L${x - 12} 240`} {...stroke} stroke="white" strokeOpacity="0.22" strokeWidth={1} />
          <path className="br-tower" d={`M${x - 16} ${TOP} H${x + 16}`} {...stroke} stroke="white" strokeOpacity="0.6" strokeWidth={1.4} />
        </g>
      ))}

      {/* hangers */}
      {hs.map((h) => (
        <path key={`${h.x}`} className="br-hanger" d={`M${h.x} ${h.y.toFixed(1)} V${DECK_Y}`} {...stroke} stroke="white" strokeOpacity="0.2" strokeWidth={1} />
      ))}

      {/* main cables */}
      <g filter="url(#br-glow)">
        <path className="br-cable" d={`M${X0} 255 Q185 160 330 ${TOP}`} {...stroke} stroke="url(#br-cable)" strokeWidth={1.6} />
        <path className="br-cable" d={`M330 ${TOP} Q600 428 870 ${TOP}`} {...stroke} stroke="url(#br-cable)" strokeWidth={1.6} />
        <path className="br-cable" d={`M870 ${TOP} Q1015 160 ${X1} 255`} {...stroke} stroke="url(#br-cable)" strokeWidth={1.6} />
      </g>

      {/* deck */}
      <path className="br-deck" d={`M${X0} ${DECK_Y} H${X1}`} {...stroke} stroke="white" strokeOpacity="0.75" strokeWidth={1.6} />
      <path className="br-deck" d={`M${X0} ${DECK_Y + 12} H${X1}`} {...stroke} stroke="white" strokeOpacity="0.18" strokeWidth={1} />

      {/* end markers */}
      <circle className="br-mark" cx={X0} cy={DECK_Y} r="5" fill="var(--nl-black)" stroke="var(--nl-blue)" strokeWidth="1.5" />
      <circle className="br-mark" cx={X1} cy={DECK_Y} r="5" fill="var(--nl-black)" stroke="var(--nl-purple)" strokeWidth="1.5" />

      {/* two-way traffic */}
      {!reduced && (
        <>
          <g style={{ ["--deck-len" as string]: `${X1 - X0}px`, animation: "deck-ltr 4.8s cubic-bezier(.45,0,.55,1) infinite" }}>
            <rect x={X0 - 90} y={DECK_Y - 1.5} width="90" height="3" rx="1.5" fill="url(#br-tail-a)" />
            <circle cx={X0} cy={DECK_Y} r="4.5" fill="var(--nl-blue-soft)" filter="url(#br-glow)" />
          </g>
          <g style={{ ["--deck-len" as string]: `${X1 - X0}px`, animation: "deck-rtl 4.8s cubic-bezier(.45,0,.55,1) infinite" }}>
            <rect x={X1} y={DECK_Y - 1.5} width="90" height="3" rx="1.5" fill="url(#br-tail-b)" />
            <circle cx={X1} cy={DECK_Y} r="4.5" fill="var(--nl-purple)" filter="url(#br-glow)" />
          </g>
        </>
      )}

      {/* meeting point: the 9 */}
      <g className="br-mark" transform={`translate(600 ${DECK_Y})`}>
        <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: reduced ? undefined : "meet-flash 4.8s ease-in-out infinite" }}>
          <circle r="26" fill="var(--nl-black)" stroke="var(--nl-purple)" strokeOpacity="0.8" strokeWidth="1.5" filter="url(#br-glow)" />
          <circle r="34" fill="none" stroke="white" strokeOpacity="0.12" strokeDasharray="2 5" />
        </g>
        <text y="9" textAnchor="middle" className="font-display text-[26px] font-semibold" style={{ fill: "#fff" }}>
          9
        </text>
      </g>
    </svg>
  );
}
