"use client";

import { site } from "@/content/site";
import { useDemo } from "@/components/providers/DemoSettings";
import { useQuiz } from "@/components/providers/QuizProvider";
import { StaticDigit } from "@/components/particles/StaticDigit";

function splitWords(text: string, startDelay: number, step = 0.045) {
  return text.split(" ").map((w, i) => (
    <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <span className="rise-in inline-block" style={{ animationDelay: `${startDelay + i * step}s` }}>
        {w}&nbsp;
      </span>
    </span>
  ));
}

/**
 * Cover — "we provide 9". Content on the left; on the right an empty slot where the particle
 * swarm (ParticleStage) assembles a full 9 in the logo's typeface once the landing animation has
 * finished. Scrolling, that 9 splits and re-forms 1 → 9 in the services stage.
 * Phones: content first, the 9 underneath. Reduced motion: a still 9.
 */
export function Hero() {
  const { reduced } = useDemo();
  const quiz = useQuiz();

  return (
    <section id="home" aria-labelledby="hero-title" className="relative flex min-h-[100svh] items-center pt-[var(--nav-h)]">
      <div className="container-x grid w-full items-center gap-6 py-10 sm:gap-10 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lsp:grid-cols-2 lsp:py-6">
        <div className="text-center lg:text-left lsp:text-left">
          <p className="label-mono rise-in mb-4 inline-flex items-center gap-2.5" style={{ animationDelay: "0.1s" }}>
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-nl-purple shadow-[0_0_10px_var(--nl-purple)]" />
            <span>
              Marketing · Events · Technology<span className="hidden sm:inline"> — Dubai South</span>
            </span>
          </p>
          <h1
            id="hero-title"
            className="text-[clamp(2rem,8vw,2.7rem)] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[clamp(2.6rem,5.6vw,3.4rem)] lg:text-[clamp(2.8rem,4vw,4.1rem)] lsp:text-[1.9rem]"
          >
            {splitWords("Marketing, events and technology,", 0.18)}
            <span className="block">
              <span className="rise-in font-accent text-gradient inline-block pb-[0.08em]" style={{ animationDelay: "0.42s" }}>
                built to deliver results.
              </span>
            </span>
          </h1>
          <p
            className="rise-in mx-auto mt-4 max-w-[52ch] text-[15px] leading-relaxed text-nl-ink sm:text-[17px] lg:mx-0 lsp:mx-0 lsp:text-sm"
            style={{ animationDelay: "0.6s" }}
          >
            {site.hero.sub}
          </p>
          <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start lsp:mt-4 lsp:flex-row lsp:justify-start">
            <button type="button" className="btn btn-primary rise-in" style={{ animationDelay: "0.75s" }} onClick={() => quiz.open()} data-cursor="Start">
              {site.hero.primaryCta}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <a href="#ebooks" className="btn btn-outline rise-in" style={{ animationDelay: "0.85s" }} data-cursor="Read">
              {site.hero.secondaryCta}
            </a>
          </div>
        </div>

        {/* The particle 9 is drawn here by ParticleStage (a fixed canvas behind the page). */}
        <div className="relative mx-auto w-full max-w-[560px]">
          <div
            data-particle-slot="hero"
            className="relative h-[clamp(230px,36svh,360px)] w-full sm:h-[clamp(300px,44svh,460px)] lg:h-[min(66svh,600px)] lsp:h-[64svh]"
            aria-hidden="true"
          >
            {reduced && <StaticDigit ch="9" />}
          </div>
          <p className="label-mono rise-in mt-3 text-center" style={{ animationDelay: "1.1s" }}>
            9 services · one team
          </p>
        </div>
      </div>
    </section>
  );
}
