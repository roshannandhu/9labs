"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { getLenis, registerAnchorPrefix, scrollToId } from "@/lib/scroll";
import { ServiceCard } from "./ServiceCard";

const services = site.services;
const N = services.length;
const LAST = N - 1;
const STEP = 360 / N; // 40°

/**
 * "Mirror Hall" services (desktop): the nine activity cards stand in a 3D ring on a dark
 * reflective pool. Scrolling (pinned, snapping card by card) or dragging spins the ring;
 * the card facing the visitor glows and plays its icon. Pure CSS 3D — every card is real
 * HTML for SEO and accessibility.
 */
export function ServicesRing({ heading }: { heading: React.ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const pinWrap = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const stageEl = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const fill = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const drag = useRef<{ x: number; y0: number; moved: boolean } | null>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      if (!pinWrap.current) return;
      const apply = (p: number) => {
        const theta = -p * LAST * STEP;
        if (ring.current) ring.current.style.transform = `translateZ(calc(var(--R) * -1)) rotateY(${theta.toFixed(2)}deg)`;
        cards.current.forEach((el, i) => {
          if (!el) return;
          let diff = (((i * STEP + theta) % 360) + 540) % 360 - 180; // −180..180, 0 = facing front
          diff = Math.abs(diff);
          const facing = (Math.cos((diff * Math.PI) / 180) + 1) / 2; // 1 front … 0 back
          el.style.opacity = (0.06 + 0.94 * Math.pow(facing, 2.4)).toFixed(3);
          el.dataset.far = diff > 70 ? "true" : "false";
        });
        if (fill.current) fill.current.style.transform = `scaleX(${p})`;
        const i = Math.round(p * LAST);
        setActive((prev) => (prev === i ? prev : i));
      };
      const st = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 4.2)}`,
        pin: pinWrap.current,
        // any refreshPriority makes ScrollTrigger sort triggers by page position on refresh,
        // so pins created out of order (media-query mounts) still measure correctly.
        refreshPriority: 0,
        scrub: 0.8,
        invalidateOnRefresh: true,
        snap: { snapTo: 1 / LAST, duration: { min: 0.25, max: 0.7 }, delay: 0.05, ease: "power2.inOut" },
        onUpdate: (self) => apply(self.progress),
      });
      stRef.current = st;
      apply(0);
      // The hero's nine items ride down and swell toward this ring: as they arrive, the cards
      // assemble out of that light (rise, scale up, fade in), so the cover turns into the Services.
      gsap.fromTo(
        stageEl.current,
        { opacity: 0.12, scale: 0.88, y: 70 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          ease: "none",
          scrollTrigger: { trigger: section.current, start: "top 82%", end: "top 6%", scrub: true },
        },
      );
      return () => {
        stRef.current = null;
      };
    },
    { scope: section },
  );

  // "#service-<slug>" lands on the right card.
  useEffect(
    () =>
      registerAnchorPrefix("service-", (id) => {
        const st = stRef.current;
        if (!st) return null;
        const i = services.findIndex((s) => `service-${s.slug}` === id);
        if (i < 0) return null;
        return st.start + (st.end - st.start) * (i / LAST);
      }),
    [],
  );

  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(t);
  }, []);

  // Drag to spin: dragging scrolls the pinned section, so ScrollTrigger stays the single source of truth.
  const scrollTo = (y: number) => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.pointerType !== "mouse") return;
    drag.current = { x: e.clientX, y0: window.scrollY, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const st = stRef.current;
    if (!d || !st) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    d.moved = true;
    const perCard = (st.end - st.start) / LAST;
    const y = Math.min(st.end, Math.max(st.start, d.y0 - (dx / 240) * perCard));
    scrollTo(y);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    window.setTimeout(() => (drag.current = null), 0);
  };

  return (
    <section id="services" ref={section} aria-labelledby="services-title" className="relative">
      <div ref={pinWrap} className="relative flex h-[100svh] flex-col overflow-hidden">
        <div className="container-x flex items-end justify-between gap-8 pt-[calc(var(--nav-h)+16px)]">
          {heading}
          <div className="hidden shrink-0 text-right xl:block" aria-hidden="true">
            <div className="font-display text-[84px] font-semibold leading-none tracking-[-0.05em] text-white">
              {String(active + 1).padStart(2, "0")}
              <span className="text-[32px] text-white/25"> / 09</span>
            </div>
            <p className="label-mono mt-2">{services[active].short}</p>
          </div>
        </div>

        {/* the ring on the pool */}
        <div
          ref={stageEl}
          className="ring-stage relative min-h-0 flex-1 cursor-grab select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          data-cursor="Drag"
        >
          <div className="ring-pool" aria-hidden="true" />
          <div className="ring-reflect">
            <div ref={ring} className="ring" style={{ transform: "translateZ(calc(var(--R) * -1))" }}>
              {services.map((s, i) => (
                <div
                  key={s.slug}
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  className="ring-card"
                  style={{ transform: `rotateY(${i * STEP}deg) translateZ(var(--R))` }}
                  onClickCapture={(e) => {
                    if (drag.current?.moved) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    if (i !== active) {
                      e.preventDefault();
                      e.stopPropagation();
                      scrollToId(`service-${s.slug}`);
                    }
                  }}
                >
                  <ServiceCard service={s} mode="pin" active={i === active} className="h-full w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* bridge progress */}
        <div className="container-x relative z-10 pb-9">
          <div className="relative h-6">
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
            <div
              ref={fill}
              className="absolute inset-x-0 top-1/2 h-px origin-left bg-gradient-to-r from-nl-blue to-nl-purple shadow-[0_0_12px_var(--nl-purple)]"
              style={{ transform: "scaleX(0)" }}
            />
            {services.map((s, i) => (
              <a
                key={s.slug}
                href={`#service-${s.slug}`}
                aria-label={`Go to ${s.title}`}
                className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-2"
                style={{ left: `${(i / LAST) * 100}%` }}
              >
                <span
                  className={`block h-2.5 w-2.5 rotate-45 border transition-all duration-500 ${
                    i <= active ? "border-nl-purple bg-nl-purple shadow-[0_0_10px_var(--nl-purple)]" : "border-white/30 bg-nl-black group-hover:border-white/70"
                  } ${i === active ? "scale-125" : ""}`}
                />
                <span
                  className={`label-mono pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap !text-[9px] transition-opacity ${
                    i === active ? "opacity-100 !text-white/70" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {s.short}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
