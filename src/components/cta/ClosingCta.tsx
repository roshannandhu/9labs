"use client";

import { site, whatsappHref } from "@/content/site";
import { useQuiz } from "@/components/providers/QuizProvider";
import CurvedLoop from "@/components/reactbits/CurvedLoop";
import StarBorder from "@/components/reactbits/StarBorder";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { SpringHeading } from "@/components/layout/SpringHeading";
import { SocialIcon } from "@/components/icons/SocialIcon";

export function ClosingCta() {
  const quiz = useQuiz();
  const c = site.contact;

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden pb-24 pt-10 sm:pb-32">
      {/* light behind the arc */}

      {/* the bridge arc with the closing line flowing along it */}
      <div className="relative text-nl-purple" aria-hidden="true">
        <CurvedLoop
          marqueeText={site.closing.loop}
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
          <SectionLabel index="06" className="justify-center">
            Contact
          </SectionLabel>
          <SpringHeading
            id="contact-title"
            text="Ready to cross"
            accent="the bridge?"
            className="mt-5 text-[clamp(2.4rem,7vw,5.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
          />
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-nl-ink sm:text-lg">
            Tell us where you want to go. Your goals reach us, our expertise reaches you — and together we get across.
          </p>
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
              {site.closing.cta}
            </StarBorder>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline" data-cursor="Chat">
              <SocialIcon name="whatsapp" size={18} /> Chat on WhatsApp
            </a>
          </div>
        </AnimatedContent>

        <div className="mx-auto mt-16 grid max-w-4xl gap-3 sm:grid-cols-3">
          {[
            { icon: "mail" as const, label: "Email", value: c.email, href: `mailto:${c.email}` },
            { icon: "phone" as const, label: "Phone / WhatsApp", value: c.phone, href: whatsappHref },
            { icon: "pin" as const, label: "Visit", value: site.location, href: "https://maps.google.com/?q=Dubai+South" },
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
