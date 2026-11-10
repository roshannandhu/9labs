import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/hero/Hero";
import { Services } from "@/components/services/Services";
import { About } from "@/components/about/About";
import { QuizBlock } from "@/components/quiz/QuizBlock";
import { Ebooks } from "@/components/ebooks/Ebooks";
import { ClosingCta } from "@/components/cta/ClosingCta";
import { ParticleStage } from "@/components/particles/ParticleStage";
import { buildJsonLd } from "@/lib/seo/jsonld";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, trusted JSON-LD built from our own content.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()).replace(/</g, "\\u003c") }}
      />
      <Nav />
      <main id="main" className="relative z-10 overflow-x-clip">
        <ParticleStage />
        <Hero />
        <Services />
        <About />
        <QuizBlock />
        <Ebooks />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
