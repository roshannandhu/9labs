"use client";

import { sectionNo, useSite, useWhatsApp } from "@/components/providers/SiteProvider";
import { useQuiz } from "@/components/providers/QuizProvider";
import CurvedLoop from "@/components/reactbits/CurvedLoop";
import StarBorder from "@/components/reactbits/StarBorder";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { SocialIcon } from "@/components/icons/SocialIcon";

export function ClosingCta() {
  const quiz = useQuiz();
  const site = useSite();
  const wa = useWhatsApp();
  const c = site.contact;
  const t = site.closing;

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden pb-24 pt-10 sm:pb-32">
      {/* light behind the arc */}

      {/* the bridge arc with the closing line flowing along it */}
      <div className="relative text-nl-purple" aria-hidden="true">
        <CurvedLoop
          marqueeText={t.loop || " "}
          speed={1.1}
          curveAmount={260}
          shape="arc"
          fontSize={64}
          fontWeight={600}
          letterSpacing={2}
          color="var(--nl-purple)"
          edgeFade={0.14}
          className="font-display"
          interactive
        />
      </div>

      <div className="container-x relative mt-6 sm:mt-10">
        <AnimatedContent distance={50} duration={1} ease="expo.out" className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <SectionLabel index={sectionNo(site, "contact")} className="justify-center">
            {t.label}
          </SectionLabel>
          <SpringHeading
            id="contact-title"
            text={t.heading}
            accent={t.accent || undefined}
            className="mt-5 text-[clamp(2.4rem,7vw,5.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
          />
          {t.text && <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-nl-ink sm:text-lg">{t.text}</p>}
          <div className="mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <StarBorder
              as="button"
              onClick={() => quiz.open()}
              className="!rounded-full !px-8 !py-4 font-display text-[16px] font-semibold"
              radius={999}
              color="#ffffff"
              backgroundColor="var(--nl-purple)"
              textColor="#ffffff"
              borderColor="color-mix(in srgb, var(--nl-purple) 60%, white)"
              glow={0.9}
              duration={3.6}
              data-cursor="Start"
            >
              {t.cta}
            </StarBorder>
            <a href={wa()} target="_blank" rel="noopener noreferrer" className="btn btn-outline" data-cursor="Chat">
              <SocialIcon name="whatsapp" size={18} /> {c.chatLabel}
            </a>
          </div>
        </AnimatedContent>

        <div className="mx-auto mt-16 grid max-w-4xl gap-3 sm:grid-cols-3">
          {[
            { icon: "mail" as const, label: t.emailLabel, value: c.email, href: `mailto:${c.email}` },
            { icon: "phone" as const, label: t.phoneLabel, value: c.phone, href: wa() },
            { icon: "pin" as const, label: t.visitLabel, value: site.location, href: site.mapUrl || "#" },
          ].map((it, i) => (
            <AnimatedContent key={it.label} distance={30} duration={0.9} delay={i * 0.08} ease="expo.out">
              <a
                href={it.href}
                target={it.href.startsWith("http") ? "_blank" : undefined}
                rel={it.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex h-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition-colors hover:border-nl-purple/60"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 text-nl-blue-soft transition-colors group-hover:text-white">
                  <SocialIcon name={it.icon} size={19} />
                </span>
                <span className="min-w-0">
                  <span className="label-mono block !text-[11px]">{it.label}</span>
                  <span className="mt-1 block truncate text-[14.5px] text-white">{it.value}</span>
                </span>
              </a>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
