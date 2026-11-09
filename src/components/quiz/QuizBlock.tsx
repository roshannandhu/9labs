"use client";

import { site, type QuizQuestion } from "@/content/site";
import { useQuiz } from "@/components/providers/QuizProvider";
import { ShaderGradient } from "@/components/background/ShaderGradient";
import StarBorder from "@/components/reactbits/StarBorder";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { useTheme } from "@/components/layout/ThemeToggle";

export function QuizBlock() {
  const quiz = useQuiz();
  const q = site.quiz;
  const q1 = (q.questions as QuizQuestion[])[0];
  const dark = useTheme() === "dark";

  return (
    <section id="quiz" aria-labelledby="quiz-title" className="relative py-16 sm:py-24">
      <div className="container-x">
        {/* light: a white glass card with a slow aurora in the logo colours; dark: the shader card */}
        <div className="quiz-card relative isolate overflow-hidden rounded-[32px] border border-white/10 sm:rounded-[40px]">
          {dark ? (
            <>
              <ShaderGradient className="absolute inset-0 -z-10" />
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_70%_at_50%_45%,transparent_0%,rgba(5,5,7,.55)_70%,rgba(5,5,7,.85)_100%)]" />
            </>
          ) : (
            <div className="quiz-aurora absolute inset-0 -z-10" aria-hidden="true" />
          )}
          <div
            className="quiz-grid absolute inset-0 -z-10 opacity-40 [background-size:48px_48px] [mask-image:radial-gradient(70%_70%_at_50%_50%,#000,transparent)]"
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

            {/* question 1, right here: a tap starts the quiz with it answered */}
            <div className="quiz-q1 mt-9 w-full max-w-xl rounded-3xl border border-white/15 p-4 text-left backdrop-blur-xl sm:p-5">
              <p className="label-mono quiz-accent">Question 1 of 9</p>
              <p className="mt-1.5 font-display text-[18px] font-semibold text-white sm:text-xl">{q1.q}</p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {q1.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => quiz.open(o.id)}
                    className="rounded-full border border-white/15 bg-[var(--chip-bg)] px-3.5 py-2 text-[13.5px] text-white/85 transition-colors hover:border-[#8c53fe] hover:bg-[#8c53fe]/20 hover:text-white"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <StarBorder
              as="button"
              onClick={() => quiz.open()}
              className="mt-10 !rounded-full !px-8 !py-4 font-display text-[16px] font-semibold"
              radius={999}
              color="#ffffff"
              backgroundColor="var(--nl-purple)"
              textColor="#ffffff"
              borderColor="color-mix(in srgb, var(--nl-purple) 60%, white)"
              glow={0.9}
              duration={3.2}
              sparkle
              data-cursor="Start"
            >
              {q.cta}
            </StarBorder>
            <p className="label-mono mt-4 text-balance !text-white/40">9 questions · about a minute · no sign-up</p>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
