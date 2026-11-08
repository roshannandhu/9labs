"use client";

import { useEffect, useRef, useState } from "react";
import type { Service } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { useQuiz } from "@/components/providers/QuizProvider";

type Props = {
  service: Service;
  mode: "pin" | "stack" | "grid";
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function ServiceCard({ service: s, mode, active, className = "", style }: Props) {
  const quiz = useQuiz();
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (mode === "pin") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.55 });
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  const isOn = mode === "pin" ? active : inView;
  const num = String(s.n).padStart(2, "0");
  // Stacked cards (phones/tablets) are mostly covered by the next card, and only their top band
  // stays visible — so there the name and one-liner come first, the icon and tags after.
  const stack = mode === "stack";

  const text = (
    <>
      <h3 className="text-[22px] font-semibold leading-tight sm:text-[26px]">{s.title}</h3>
      <p className="mt-2.5 max-w-[46ch] text-[15px] leading-relaxed text-nl-ink">{s.description}</p>
    </>
  );
  const cta = (
    <button
      type="button"
      onClick={() => quiz.open(`I'm interested in ${s.title.toLowerCase()} for my business. `)}
      className={`link-glow inline-flex items-center gap-2 text-sm font-medium text-white ${stack ? "" : "mt-5"}`}
      data-cursor="Ask"
    >
      Talk to us about this
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <article
      ref={ref}
      id={`service-${s.slug}`}
      data-on={isOn ? "true" : "false"}
      data-mode={mode}
      style={style}
      className={`svc-card group relative flex flex-col overflow-hidden rounded-[28px] border border-white/[0.09] bg-[linear-gradient(160deg,#0d0f17_0%,#07080c_60%)] p-6 sm:p-8 ${className}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
      }}
    >
      {/* cursor spotlight + active glow */}
      <span className="svc-spot pointer-events-none absolute inset-0" aria-hidden="true" />
      <span className="svc-glow pointer-events-none absolute inset-0 rounded-[inherit]" aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-4">
        <span className="label-mono !text-[10px]">{num} / 09</span>
        <span className="svc-num grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] font-display text-[13px] font-semibold text-white/60 transition-colors duration-500 group-data-[on=true]:border-nl-purple/50 group-data-[on=true]:bg-nl-purple/15 group-data-[on=true]:text-white">
          {num}
        </span>
      </div>

      {stack && <div className="relative mt-5">{text}</div>}

      <div className={`relative flex items-center gap-5 sm:gap-7 ${stack ? "mt-6" : "mt-5 sm:mt-6"}`}>
        <div className="svc-icon relative grid h-[104px] w-[104px] shrink-0 place-items-center rounded-3xl border border-white/10 bg-white/[0.02] text-nl-blue-soft sm:h-[128px] sm:w-[128px]">
          <span className="absolute inset-x-3 top-1/2 h-px bg-white/[0.06]" aria-hidden="true" />
          <span className="absolute inset-y-3 left-1/2 w-px bg-white/[0.06]" aria-hidden="true" />
          <span className="svc-icon-glow absolute inset-4 rounded-full" aria-hidden="true" />
          <ActivityIcon icon={s.icon} size={72} play={isOn} className="relative sm:hidden" />
          <ActivityIcon icon={s.icon} size={88} play={isOn} className="relative hidden sm:block" />
        </div>
        <ul className="flex min-w-0 flex-col gap-2.5" aria-label="Capabilities">
          {s.tags.map((t, i) => (
            <li key={t} className="flex items-center gap-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-white/60 sm:text-[12.5px]">
              <span className="relative h-px w-5 shrink-0 bg-white/20">
                <span
                  className="absolute inset-y-0 left-0 w-full origin-left bg-nl-purple transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-data-[on=true]:scale-x-100 scale-x-0"
                  style={{ transitionDelay: `${i * 90}ms` }}
                />
              </span>
              <span className="truncate">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {stack ? (
        <div className="relative mt-auto pt-6">{cta}</div>
      ) : (
        <div className="relative mt-auto pt-7">
          {text}
          {cta}
        </div>
      )}
    </article>
  );
}
