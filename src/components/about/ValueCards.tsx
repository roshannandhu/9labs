"use client";

import type { Value } from "@/content/site";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { useDemo } from "@/components/providers/DemoSettings";

const VALUE_ICONS: Record<string, React.ReactNode> = {
  partnership: (
    <>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" stroke="var(--nl-purple)" />
    </>
  ),
  ownership: (
    <>
      <path d="M12 3l7 3v5.5c0 4.4-3 7.9-7 9.5-4-1.6-7-5.1-7-9.5V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" stroke="var(--nl-purple)" />
    </>
  ),
  trust: (
    <>
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15.5" r="1.6" fill="var(--nl-purple)" stroke="none" />
    </>
  ),
  quality: (
    <>
      <path d="M6 4h12l3 5-9 11L3 9z" />
      <path d="M3 9h18M9 4l3 16 3-16" stroke="var(--nl-purple)" strokeOpacity=".9" />
    </>
  ),
  loyalty: (
    <path d="M7.5 9c-3 0-4.5 1.5-4.5 3s1.5 3 4.5 3c3.5 0 5.5-6 9-6 3 0 4.5 1.5 4.5 3s-1.5 3-4.5 3c-3.5 0-5.5-6-9-6z" />
  ),
};

// the values grid follows however many value cards the admin keeps
const VALUE_COLS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-3" };

/** The value cards grid — shared by the homepage About section and the full /about page. */
export function ValueCards({ values }: { values: Value[] }) {
  const { settings } = useDemo();
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${VALUE_COLS[values.length] ?? "lg:grid-cols-4"}`}>
      {values.map((v, i) => (
        <AnimatedContent
          key={`${v.key}-${i}`}
          distance={50}
          duration={0.9}
          delay={i * 0.07}
          ease="expo.out"
          className={`relative hover:z-10 focus-within:z-10 ${i === values.length - 1 && values.length % 2 ? "sm:col-span-2 lg:col-span-1" : ""}`}
        >
          <SpotlightCard
            className="h-full !rounded-3xl !p-6 will-change-transform"
            spotlightColor={settings.purple}
            intensity={0.22}
            spotlightSize={260}
            popScale={1.038}
            style={{ ["--spotlight-card-surface" as string]: "linear-gradient(160deg,var(--surface-1),var(--surface-2))" }}
          >
            <div className="relative flex h-full flex-col">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-nl-blue-soft">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {VALUE_ICONS[v.key] ?? VALUE_ICONS.partnership}
                </svg>
              </span>
              <span className="label-mono mt-6 !text-[11px]">0{i + 1}</span>
              <h3 className="mt-1.5 text-xl font-semibold">{v.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-nl-ink">{v.line}</p>
            </div>
          </SpotlightCard>
        </AnimatedContent>
      ))}
    </div>
  );
}
