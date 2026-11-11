import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

/** The frame of every inner page (About, FAQ, Privacy, a book's page): menu, content, footer. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main" className="relative z-10 overflow-x-clip pb-24 pt-[calc(var(--nav-h)+56px)] sm:pb-32 sm:pt-[calc(var(--nav-h)+88px)]">
        {children}
      </main>
      <Footer />
    </>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string | null; title: string; intro?: string | null }) {
  return (
    <header className="container-x max-w-[920px]">
      {eyebrow && (
        <p className="label-mono flex items-center gap-3">
          <span className="relative h-px w-10 bg-gradient-to-r from-nl-purple/80 to-white/10" />
          <span>{eyebrow}</span>
        </p>
      )}
      <h1 className="mt-4 font-display text-[clamp(2.2rem,5.4vw,4.2rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-white">{title}</h1>
      {intro && <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-nl-ink sm:text-lg">{intro}</p>}
    </header>
  );
}
