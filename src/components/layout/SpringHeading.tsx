"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";

type Props = {
  /** Plain part, split into words that spring in. */
  text: string;
  /** Optional gradient accent at the end (animated as one unit so the gradient stays intact). */
  accent?: string;
  id?: string;
  className?: string;
  as?: "h2" | "h3";
};

/**
 * Section heading with a springy word-by-word reveal (inspired by spring text presets).
 * Words are split on the server (no layout shift, text stays in the DOM for SEO);
 * GSAP springs them up with a slight 3D tilt when the heading scrolls into view.
 */
export function SpringHeading({ text, accent, id, className = "", as = "h2" }: Props) {
  const { reduced } = useDemo();
  const ref = useRef<HTMLHeadingElement>(null);
  const Tag = as;

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const parts = ref.current.querySelectorAll<HTMLElement>("[data-spring]");
      gsap.set(parts, { yPercent: 110, rotateX: -55, opacity: 0, transformOrigin: "50% 100%" });
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top 88%",
        once: true,
        onEnter: () =>
          gsap.to(parts, {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            duration: 1.1,
            ease: "back.out(2.1)",
            stagger: 0.055,
          }),
      });
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  const words = text.split(" ").filter(Boolean);
  // each word reveals through its own mask. The word's box is padded below and right so the italic
  // accent's descenders and overhang (the "g" and "?" in "the bridge?") stay inside both the mask
  // and the gradient, which `background-clip: text` only paints within that box; the mask's negative
  // margins cancel the padding so line spacing and word spacing are unchanged.
  const mask = "inline-block overflow-hidden align-bottom -mb-[0.15em] -mr-[0.1em]";
  const word = "inline-block will-change-transform pb-[0.25em] pr-[0.1em]";
  return (
    <Tag ref={ref} id={id} className={`[perspective:800px] ${className}`}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className={mask}>
          <span data-spring className={word}>
            {w}
            {i < words.length - 1 || accent ? " " : ""}
          </span>
        </span>
      ))}
      {accent && (
        <span className={mask}>
          <span data-spring className={`font-accent text-gradient ${word}`}>
            {accent}
          </span>
        </span>
      )}
    </Tag>
  );
}
