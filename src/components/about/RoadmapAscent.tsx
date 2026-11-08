"use client";

import { useRef, useState } from "react";
import { site } from "@/content/site";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { SplitFlap } from "./SplitFlap";

const steps = site.about.steps;
const LAST = steps.length - 1;

/**
 * "How we work" as a roadmap: a glowing node glides down a spine, lighting each step as it
 * arrives, while a split-flap counter rolls 01 → 02 → 03. Desktop pins the panel for a short
 * scroll; mobile scrubs the node without pinning. Reduced motion shows every step lit.
 */
export function RoadmapAscent() {
  const { reduced } = useDemo();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const markers = useRef<(HTMLSpanElement | null)[]>([]);
  const node = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const [flap, setFlap] = useState({ cur: 0, prev: 0, k: 0 });
  const lit = reduced ? LAST : flap.cur;

  useGSAP(
    () => {
      const ol = list.current;
      if (!ol) return;
      // Spine runs from the first marker to the last one.
      const measure = () => {
        const top = ol.getBoundingClientRect().top;
        const c = markers.current.map((m) => {
          const r = m?.getBoundingClientRect();
          return r ? r.top - top + r.height / 2 : 0;
        });
        ol.style.setProperty("--sp-a", `${c[0]}px`);
        ol.style.setProperty("--sp-len", `${c[LAST] - c[0]}px`);
      };
      measure();
      if (reduced) {
        if (fill.current) fill.current.style.transform = "scaleY(1)";
        if (node.current) node.current.style.transform = "translateY(var(--sp-len))";
        return;
      }
      const apply = (p: number) => {
        if (fill.current) fill.current.style.transform = `scaleY(${p.toFixed(4)})`;
        if (node.current) {
          node.current.style.transform = `translateY(calc(var(--sp-len) * ${p.toFixed(4)}))`;
          node.current.style.setProperty("--trail", Math.min(1, p * 5).toFixed(3));
        }
        let i = 0;
        for (let s = 0; s <= LAST; s++) if (p >= s / LAST - 0.04) i = s;
        setFlap((f) => (f.cur === i ? f : { cur: i, prev: f.cur, k: f.k + 1 }));
      };
      const st = desktop
        ? ScrollTrigger.create({
            trigger: panel.current,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 1.5)}`,
            pin: true,
            // any refreshPriority makes ScrollTrigger sort triggers by page position on refresh,
            // so pins created out of order (media-query mounts) still measure correctly.
            refreshPriority: 0,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onRefresh: measure,
            onUpdate: (self) => apply(self.progress),
          })
        : ScrollTrigger.create({
            trigger: ol,
            start: "top 72%",
            end: "bottom 58%",
            scrub: 0.5,
            onRefresh: measure,
            onUpdate: (self) => apply(self.progress),
          });
      apply(st.progress);
    },
    { scope: root, dependencies: [desktop, reduced], revertOnUpdate: true },
  );

  return (
    <div ref={root} className="relative mt-16 sm:mt-20">
      <div ref={panel} className="relative lg:flex lg:h-[100svh] lg:items-center">
        <div className="container-x grid w-full gap-10 lg:grid-cols-12 lg:gap-12">
          {/* left: heading + split-flap counter */}
          <div className="lg:col-span-5 lg:self-center">
            <p className="label-mono">How we work</p>
            <SpringHeading
              as="h3"
              text="Three steps"
              accent="across the bridge."
              className="mt-4 max-w-[13ch] font-display text-[clamp(1.9rem,3.8vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-white"
            />
            <div className="mt-8 hidden items-end gap-4 lg:flex" aria-hidden="true">
              <SplitFlap
                value={String(lit + 1).padStart(2, "0")}
                prev={String(flap.prev + 1).padStart(2, "0")}
                k={reduced ? 0 : flap.k}
                className="font-display text-[88px] font-bold leading-none text-white"
              />
              <div className="pb-2">
                <span className="font-display text-2xl font-semibold text-white/25">/ 0{steps.length}</span>
                <p className="label-mono mt-1 !text-white/60">{steps[lit].title}</p>
              </div>
            </div>
          </div>

          {/* right: spine + steps */}
          <ol ref={list} className="roadmap relative lg:col-span-7">
            <div className="roadmap-spine" aria-hidden="true">
              <div ref={fill} className="roadmap-fill" style={{ transform: "scaleY(0)" }} />
              <div ref={node} className="roadmap-node">
                <span className="roadmap-trail" />
              </div>
            </div>
            {steps.map((s, i) => {
              const on = i <= lit;
              return (
                <li key={s.n} className="relative pb-10 pl-14 last:pb-0 sm:pl-20 lg:pb-14" data-lit={on}>
                  <span
                    ref={(el) => {
                      markers.current[i] = el;
                    }}
                    className="roadmap-marker"
                    aria-hidden="true"
                  />
                  <div className={`transition-[opacity,transform] duration-700 ${on ? "opacity-100" : "translate-x-2 opacity-35"}`}>
                    <span className="font-mono text-sm tracking-[0.2em] text-nl-purple">{s.n}</span>
                    <h4 className="mt-2 font-display text-[clamp(1.35rem,2.2vw,1.85rem)] font-semibold tracking-[-0.02em] text-white">{s.title}</h4>
                    <p className="mt-2 max-w-[46ch] text-[15.5px] leading-relaxed text-nl-ink">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
