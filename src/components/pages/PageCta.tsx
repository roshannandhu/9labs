"use client";

import { useQuiz } from "@/components/providers/QuizProvider";
import { useSite, useWhatsApp } from "@/components/providers/SiteProvider";
import { SocialIcon } from "@/components/icons/SocialIcon";

/** The closing call-to-action under a page: start the quiz, or chat on WhatsApp. */
export function PageCta() {
  const quiz = useQuiz();
  const site = useSite();
  const wa = useWhatsApp();
  const t = site.closing;
  return (
    <section className="container-x mt-20 max-w-[920px] sm:mt-24">
      <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,var(--surface-1),var(--surface-2))] px-6 py-10 text-center sm:px-10 sm:py-14">
        <h2 className="font-display text-[clamp(1.7rem,3.6vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
          {t.heading} {t.accent && <span className="font-accent text-gradient">{t.accent}</span>}
        </h2>
        {t.text && <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-relaxed text-nl-ink">{t.text}</p>}
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <button type="button" className="btn btn-primary" onClick={() => quiz.open()}>
            {t.cta}
          </button>
          <a href={wa()} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            <SocialIcon name="whatsapp" size={18} /> {site.contact.chatLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
