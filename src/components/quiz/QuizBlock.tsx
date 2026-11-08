"use client";

import { site } from "@/content/site";
import { useQuiz } from "@/components/providers/QuizProvider";
import { ShaderGradient } from "@/components/background/ShaderGradient";
import TextType from "@/components/reactbits/TextType";
import StarBorder from "@/components/reactbits/StarBorder";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";

export function QuizBlock() {
  const quiz = useQuiz();
  const q = site.quiz;

  return (
    <section id="quiz" aria-labelledby="quiz-title" className="relative py-16 sm:py-24">
      <div className="container-x">
        <div className="relative isolate overflow-hidden rounded-[32px] border border-white/10 sm:rounded-[40px]">
          <ShaderGradient className="absolute inset-0 -z-10" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_70%_at_50%_45%,transparent_0%,rgba(5,5,7,.55)_70%,rgba(5,5,7,.85)_100%)]" />
          <div
            className="absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(70%_70%_at_50%_50%,#000,transparent)]"
            aria-hidden="true"
          />

          <AnimatedContent distance={60} duration={1.1} ease="expo.out" className="relative mx-auto flex max-w-3xl flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-28">
            <SectionLabel index="04" className="justify-center">
              The 9 Quiz
            </SectionLabel>
            <SpringHeading
              id="quiz-title"
              text="Meet"
              accent="The 9 Quiz."
              className="mt-5 text-[clamp(2.6rem,8vw,6rem)] font-semibold leading-[0.95] tracking-[-0.045em]"
            />
            <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-white/75 sm:text-lg">{q.text}</p>

            {/* faux input */}
            <button
              type="button"
              onClick={() => quiz.open()}
              data-cursor="Type"
              className="group mt-9 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/15 bg-black/45 p-2 pl-5 text-left backdrop-blur-xl transition-colors hover:border-nl-purple/70"
              aria-label="Open The 9 Quiz and describe what you need"
            >
              <span className="label-mono hidden shrink-0 !text-nl-purple sm:inline">Need ›</span>
              <span className="min-h-[1.5em] flex-1 truncate text-[15px] text-white/80">
                <TextType
                  as="span"
                  text={q.examples}
                  typingSpeed={34}
                  deletingSpeed={16}
                  pauseDuration={1800}
                  cursorCharacter="▍"
                  cursorClassName="text-nl-purple"
                  startOnVisible
                />
              </span>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-nl-purple text-[#0b0618] transition-transform group-hover:scale-105">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            <div className="mt-4 flex max-w-xl flex-wrap justify-center gap-2">
              {q.chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => quiz.open(`${c}. `)}
                  className="rounded-full border border-white/12 bg-black/30 px-3.5 py-1.5 text-[13px] text-white/75 backdrop-blur transition-colors hover:border-nl-purple/70 hover:text-white"
                >
                  {c}
                </button>
              ))}
            </div>

            <StarBorder
              as="button"
              onClick={() => quiz.open()}
              className="mt-10 !rounded-full !px-8 !py-4 font-display text-[16px] font-semibold"
              radius={999}
              color="#ffffff"
              backgroundColor="var(--nl-purple)"
              textColor="#0b0618"
              borderColor="color-mix(in srgb, var(--nl-purple) 60%, white)"
              glow={0.9}
              duration={3.2}
              sparkle
              data-cursor="Start"
            >
              {q.cta}
            </StarBorder>
            <p className="label-mono mt-4 !text-white/40">About 30 seconds · No sign-up</p>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
