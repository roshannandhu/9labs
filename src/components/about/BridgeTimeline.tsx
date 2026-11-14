"use client";

import AnimatedContent from "@/components/reactbits/AnimatedContent";

/**
 * The About page's steps ("How we work") as a bridge: a gradient deck line with a numbered pier
 * under each step — horizontal on tablet/laptop, vertical on phones (no JS breakpoint switch, just
 * responsive classes). The admin can add or remove steps; the line and columns follow however many
 * there are. Fades and rises in as the block scrolls into view (AnimatedContent already respects
 * prefers-reduced-motion).
 */
export function BridgeTimeline({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <AnimatedContent distance={30} duration={0.8} stagger={0.1} ease="expo.out" className="relative">
      <div
        aria-hidden="true"
        className="absolute left-[21px] top-0 bottom-0 w-px bg-gradient-to-b from-nl-blue via-nl-purple to-nl-purple/15 sm:bottom-auto sm:left-10 sm:right-10 sm:top-[21px] sm:h-px sm:w-auto sm:bg-gradient-to-r"
      />
      <ol className="relative flex flex-col gap-8 sm:flex-row sm:gap-4">
        {steps.map((s, i) => (
          <li key={i} className="relative flex gap-4 sm:flex-1 sm:flex-col sm:items-center sm:gap-0 sm:text-center">
            <span className="font-digits grid h-11 w-11 shrink-0 place-items-center rounded-full border border-nl-purple/50 bg-[var(--nl-bg)] text-[15px] font-bold text-white">{i + 1}</span>
            <div className="sm:mt-5">
              <h3 className="font-display text-[16px] font-semibold text-white">{s.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-nl-ink sm:mx-auto sm:max-w-[22ch]">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </AnimatedContent>
  );
}
