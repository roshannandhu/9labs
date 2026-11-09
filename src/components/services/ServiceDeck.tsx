"use client";

import { useLayoutEffect, useRef, type CSSProperties, type MutableRefObject } from "react";
import type { Service } from "@/content/site";
import { ServiceCard } from "./ServiceCard";

/** The logo gradient, card 1 → 9 (purple → cyan): each card's accent glow. */
const accent = (i: number, last: number) => {
  const t = last ? i / last : 0;
  const c = [0x8c + (0x5c - 0x8c) * t, 0x53 + (0xe0 - 0x53) * t, 0xfe + (0xe6 - 0xfe) * t].map(Math.round);
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/**
 * "Our 9 labs" as a stacked deck. All nine cards sit in one soft 3D stack; scroll progress (0 → 8,
 * the same value that drives the particle number, so they never drift apart) lifts the front card
 * up and tilts it away while the next one rises into place. Cards behind peek out below, scaled
 * and dimmed. Styles are written straight to the DOM every frame (no React state per frame);
 * React only re-renders when the active card changes.
 */
export function ServiceDeck({
  services,
  active,
  driveRef,
}: {
  services: Service[];
  active: number;
  /** Services hands its scroll progress to the deck through this. */
  driveRef: MutableRefObject<((progress: number) => void) | null>;
}) {
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const last = services.length - 1;

  // layout effect: ready before Services' own (parent) layout effect makes the first drive() call
  useLayoutEffect(() => {
    const phone = window.matchMedia("(max-width: 639px)").matches;
    const peek = phone ? 10 : 16; // px each card behind shows below the one in front
    driveRef.current = (p: number) => {
      cards.current.forEach((el, i) => {
        if (!el) return;
        const d = i - p; // < 0: leaving (already read) · 0: front · > 0: waiting behind
        let ty = 0;
        let rx = 0;
        let sc = 1;
        let op = 1;
        let blur = 0;
        let dim = 0;
        if (d <= -1 || d >= 3.2) {
          el.style.visibility = "hidden";
          return;
        }
        if (d < 0) {
          const t = -d; // 0 → 1 as it leaves
          ty = -t * 80; // % of its height
          rx = t * 38;
          sc = 1 - t * 0.05;
          op = clamp(1 - t * 1.9, 0, 1); // gone by ~half-way, so it never muddles the next card's text
          blur = t * 10;
        } else {
          sc = 1 - d * 0.055;
          ty = 0;
          dim = clamp(d * 0.28, 0, 0.75);
          op = d > 2.4 ? clamp((3.2 - d) / 0.8, 0, 1) : 1;
        }
        el.style.visibility = "visible";
        el.style.zIndex = String(100 - Math.round(d * 10));
        el.style.opacity = op.toFixed(3);
        el.style.transform =
          d < 0
            ? `translate3d(0, ${ty.toFixed(2)}%, 0) rotateX(${rx.toFixed(2)}deg) scale(${sc.toFixed(4)})`
            : `translate3d(0, ${(d * peek).toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
        el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
        el.style.setProperty("--dim", dim.toFixed(3));
      });
    };
    return () => {
      driveRef.current = null;
    };
  }, [driveRef]);

  return (
    <div className="deck relative grid w-full" style={{ perspective: "1400px" }}>
      {services.map((s, i) => (
        <div
          key={s.slug}
          ref={(el) => {
            cards.current[i] = el;
          }}
          className="stage-card deck-card [grid-area:1/1]"
          data-on={i === active ? "true" : "false"}
          inert={i !== active}
          style={{ "--accent": accent(i, last) } as CSSProperties}
        >
          <ServiceCard service={s} mode="stage" active={i === active} />
        </div>
      ))}
    </div>
  );
}
