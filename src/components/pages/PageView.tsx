"use client";

import Link from "next/link";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { FaqList } from "@/components/faq/FaqList";
import { PageCta } from "@/components/pages/PageCta";
import { PageHeader, PageShell } from "@/components/pages/PageShell";
import { useFaqs, usePage, useSite } from "@/components/providers/SiteProvider";
import { JsonLd } from "@/components/layout/JsonLd";
import { textToHtml } from "@/lib/richtext";
import { siteHref } from "@/lib/site-href";
import type { FaqItem } from "@/content/types";

/** Questions grouped the way the admin grouped them (questions with no group come first). */
function groupFaqs(items: FaqItem[]) {
  const out: { name: string; items: FaqItem[] }[] = [];
  for (const f of items) {
    const name = f.category ?? "";
    const g = out.find((x) => x.name === name);
    if (g) g.items.push(f);
    else out.push({ name, items: [f] });
  }
  return out.sort((a, b) => Number(Boolean(a.name)) - Number(Boolean(b.name)));
}

/**
 * A page written in the admin (Content → Pages): About (/about), FAQ (/faq), Privacy and any
 * other. The FAQ page also lists every enabled question from Content → FAQ.
 */
export function PageView({ slug }: { slug: string }) {
  const site = useSite();
  const page = usePage(slug);
  const allFaqs = useFaqs();
  const faqs = slug === "faq" ? allFaqs : [];

  if (!page) {
    return (
      <PageShell>
        <PageHeader eyebrow="404" title="This page does not exist." intro="The link may be old, or the page may have moved." />
        <div className="container-x mt-8 max-w-[920px]">
          <Link href={siteHref("/")} className="btn btn-primary">
            Back to the homepage
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {faqs.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answerText } })) }} />
      )}
      <PageHeader eyebrow={page.eyebrow} title={page.title} intro={page.intro} />

      {page.body.trim() && <div className="container-x mt-10 max-w-[920px]"><div className="rich max-w-[68ch] text-[16.5px] leading-relaxed text-nl-ink" dangerouslySetInnerHTML={{ __html: textToHtml(page.body) }} /></div>}

      {faqs.length > 0 && (
        <div className="container-x mt-12 max-w-[920px] space-y-10">
          {groupFaqs(faqs).map((g) => (
            <section key={g.name || "general"} aria-label={g.name || "Questions"}>
              {g.name && <h2 className="label-mono mb-4">{g.name}</h2>}
              <FaqList items={g.items} />
            </section>
          ))}
        </div>
      )}

      {page.showStats && site.about.stats.length > 0 && (
        <div className="container-x mt-16 max-w-[920px]">
          <dl className="grid divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] sm:grid-flow-col sm:auto-cols-fr sm:divide-x">
            {site.about.stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center px-3 py-7 text-center">
                <dt className="label-mono order-2 mt-2">{s.label}</dt>
                <dd className="order-1 font-display text-[48px] font-semibold leading-none tracking-[-0.04em] text-white">{String(s.value).padStart(2, "0")}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {page.showSteps && (
        <section className="container-x mt-16 max-w-[920px]" aria-labelledby="page-steps">
          <h2 id="page-steps" className="font-display text-[clamp(1.6rem,3.2vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
            {site.about.story.heading} {site.about.story.accent && <span className="font-accent text-gradient">{site.about.story.accent}</span>}
          </h2>
          <ol className="mt-7 grid gap-4 sm:grid-cols-3">
            {site.about.steps.map((s) => (
              <li key={s.n} className="rounded-3xl border border-white/10 bg-[linear-gradient(160deg,var(--surface-1),var(--surface-2))] p-6">
                <span className="font-digits text-sm font-black text-nl-purple">{s.n}</span>
                <p className="mt-2 font-display text-lg font-semibold text-white">{s.title}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-nl-ink">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {page.showValues && site.values.length > 0 && (
        <section className="container-x mt-16 max-w-[920px]" aria-labelledby="page-values">
          <h2 id="page-values" className="font-display text-[clamp(1.6rem,3.2vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
            {site.about.valuesHeading}
          </h2>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2">
            {site.values.map((v, i) => (
              <li key={`${v.key}-${i}`} className="rounded-3xl border border-white/10 bg-[linear-gradient(160deg,var(--surface-1),var(--surface-2))] p-6">
                <span className="label-mono !text-[11px]">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-1.5 font-display text-xl font-semibold text-white">{v.title}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-nl-ink">{v.line}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {page.showServices && (
        <section className="container-x mt-16 max-w-[920px]" aria-labelledby="page-services">
          <h2 id="page-services" className="font-display text-[clamp(1.6rem,3.2vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
            {site.servicesSection.heading} {site.servicesSection.accent && <span className="font-accent text-gradient">{site.servicesSection.accent}</span>}
          </h2>
          <ul className="mt-7 grid gap-3 sm:grid-cols-3">
            {site.services.map((s) => (
              <li key={s.slug}>
                <a href={siteHref(`/#service-${s.slug}`)} className="flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-nl-blue-soft transition-colors hover:border-nl-purple/50">
                  <ActivityIcon icon={s.icon} size={26} play={false} />
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-semibold leading-tight text-white">{s.title}</span>
                    <span className="mt-1 block text-[13px] leading-snug text-nl-ink">{s.description}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {page.showCta && <PageCta />}
    </PageShell>
  );
}
