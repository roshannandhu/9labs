"use client";

import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/hero/Hero";
import { Services } from "@/components/services/Services";
import { About } from "@/components/about/About";
import { QuizBlock } from "@/components/quiz/QuizBlock";
import { Ebooks } from "@/components/ebooks/Ebooks";
import { ClosingCta } from "@/components/cta/ClosingCta";
import { FaqPreview } from "@/components/faq/FaqPreview";
import { ParticleStage } from "@/components/particles/ParticleStage";
import { JsonLd } from "@/components/layout/JsonLd";
import { buildJsonLd } from "@/lib/seo/jsonld";
import { useSite } from "@/components/providers/SiteProvider";
import type { SectionKey } from "@/content/types";

const SECTIONS: Record<SectionKey, React.ReactNode> = {
  services: <Services key="services" />,
  about: <About key="about" />,
  quiz: <QuizBlock key="quiz" />,
  ebooks: <Ebooks key="ebooks" />,
  faq: <FaqPreview key="faq" />,
  contact: <ClosingCta key="contact" />,
};

/** The homepage's section order follows Website → Sections in the admin (`site.sections`). */
export default function Home() {
  const site = useSite();
  const sections = site.sections.filter((s, i, all) => s in SECTIONS && all.indexOf(s) === i);
  return (
    <>
      <JsonLd data={buildJsonLd(site)} />
      <Nav />
      <main id="main" className="relative z-10 overflow-x-clip">
        <ParticleStage />
        <Hero />
        {sections.map((s) => SECTIONS[s])}
      </main>
      <Footer />
    </>
  );
}
