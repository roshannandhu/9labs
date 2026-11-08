"use client";

import { useEffect, useRef, useState } from "react";
import type { Service } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { useQuiz } from "@/components/providers/QuizProvider";

type Props = {
  service: Service;
  /** stage = the pinned 1→9 stage (driven by `active`); list = reduced-motion list (lights up in view). */
  mode: "stage" | "list";
  active?: boolean;
  className?: string;
};

export function ServiceCard({ service: s, mode, active = false, className = "" }: Props) {
  const quiz = useQuiz();
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (mode === "stage") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.55 });
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  const isOn = mode === "stage" ? active : inView;
  const num = String(s.n).padStart(2, "0");

  return (
    <article
      ref={ref}
      id={`service-${s.slug}`}
      data-on={isOn ? "true" : "false"}
      data-mode={mode}
      className={`svc-card group relative flex flex-col overflow-hidden rounded-[28px] border border-white/[0.09] bg-[linear-gradient(160deg,#0d0f17_0%,#07080c_60%)] p-5 sm:p-8 ${className}`}
    >
      <span className="svc-glow pointer-events-none absolute inset-0 rounded-[inherit]" aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-4">
        <span className="label-mono !text-[10px]">{num} / 09</span>
        <span className="svc-num grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] font-brand text-[13px] font-black text-white/60 transition-colors duration-500 group-data-[on=true]:border-nl-purple/50 group-data-[on=true]:bg-nl-purple/15 group-data-[on=true]:text-white">
          {s.n}
        </span>
      </div>

      <h3 className="relative mt-3 text-[21px] font-semibold leading-tight sm:mt-4 sm:text-[26px]">{s.title}</h3>
      <p className="relative mt-2 max-w-[46ch] text-[14.5px] leading-relaxed text-nl-ink sm:mt-2.5 sm:text-[15px]">{s.description}</p>

      <div className="relative mt-4 flex items-center gap-4 sm:mt-6 sm:gap-6 [@media(max-height:680px)]:hidden">
        <div className="svc-icon relative grid h-[76px] w-[76px] shrink-0 place-items-center rounded-3xl border border-white/10 bg-white/[0.02] text-nl-blue-soft sm:h-[104px] sm:w-[104px]">
          <span className="svc-icon-glow absolute inset-3 rounded-full" aria-hidden="true" />
          <ActivityIcon icon={s.icon} size={52} play={isOn} className="relative sm:hidden" />
          <ActivityIcon icon={s.icon} size={72} play={isOn} className="relative hidden sm:block" />
        </div>
        <ul className="flex min-w-0 flex-col gap-2" aria-label="Capabilities">
          {s.tags.map((t, i) => (
            <li key={t} className="flex items-center gap-2.5 text-[11.5px] font-medium uppercase tracking-[0.1em] text-white/60 sm:text-[12.5px]">
              <span className="relative h-px w-4 shrink-0 bg-white/20 sm:w-5">
                <span
                  className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-nl-purple transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-data-[on=true]:scale-x-100"
                  style={{ transitionDelay: `${i * 90}ms` }}
                />
              </span>
              <span className="truncate">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-auto pt-5 sm:pt-7">
        <button
          type="button"
          onClick={() => quiz.open(`I'm interested in ${s.title.toLowerCase()} for my business. `)}
          className="link-glow inline-flex items-center gap-2 text-sm font-medium text-white"
          data-cursor="Ask"
        >
          Talk to us about this
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </article>
  );
}
