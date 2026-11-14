"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaqList } from "@/components/faq/FaqList";
import { PageCta } from "@/components/pages/PageCta";
import { PageHeader, PageShell } from "@/components/pages/PageShell";
import { MissionVision, WhatWeDo, Commitments, FindUs } from "@/components/pages/AboutBlocks";
import { BridgeTimeline } from "@/components/about/BridgeTimeline";
import { ValueCards } from "@/components/about/ValueCards";
import { useFaqs, usePage, useSite } from "@/components/providers/SiteProvider";
import { JsonLd } from "@/components/layout/JsonLd";
import { textToHtml } from "@/lib/richtext";
import { siteHref } from "@/lib/site-href";
import type { FaqItem } from "@/content/types";

const H2 = "font-display text-[clamp(1.6rem,3.2vw,2.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white";

const groupSlug = (name: string) => (name ? `faq-group-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` : "faq-group-general");

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
  const groups = groupFaqs(faqs);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // A shared link (or the admin's "Copy link") can open straight to one answer, e.g. /faq/#faq-bridge.
  // SmoothScroll (same delay) already scrolls there once this question's <li id> exists; this just
  // opens it — a non-matching hash harmlessly opens nothing.
  useEffect(() => {
    if (slug !== "faq") return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const t = window.setTimeout(() => setOpenFaqId(hash), 600);
    return () => window.clearTimeout(t);
  }, [slug]);

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

      {page.showMission && (site.aboutPage.mission || site.aboutPage.vision) && (
        <section className="container-x mt-16 max-w-[920px]" aria-labelledby="page-mission">
          <h2 id="page-mission" className="sr-only">
            Mission and vision
          </h2>
          <MissionVision a={site.aboutPage} />
        </section>
      )}

      {page.showServices && (
        <section className="container-x mt-16 max-w-[920px]" aria-labelledby="page-services">
          <h2 id="page-services" className={H2}>
            {site.aboutPage.servicesHeading}
          </h2>
          <WhatWeDo a={site.aboutPage} services={site.services} />
        </section>
      )}

      {page.showSteps && site.aboutPage.steps.length > 0 && (
        <section className="container-x mt-16 max-w-[920px]" aria-labelledby="page-steps">
          <p className="label-mono">{site.aboutPage.stepsLabel}</p>
          <h2 id="page-steps" className={`${H2} mt-2`}>
            {site.aboutPage.stepsHeading} {site.aboutPage.stepsAccent && <span className="font-accent text-gradient">{site.aboutPage.stepsAccent}</span>}
          </h2>
          {site.aboutPage.stepsIntro && <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-nl-ink">{site.aboutPage.stepsIntro}</p>}
          <div className="mt-10">
            <BridgeTimeline steps={site.aboutPage.steps} />
          </div>
        </section>
      )}

      {page.showValues && site.values.length > 0 && (
        <section className="container-x mt-16 max-w-[920px]" aria-labelledby="page-values">
          <h2 id="page-values" className={H2}>
            {site.about.valuesHeading}
          </h2>
          <div className="mt-7">
            <ValueCards values={site.values} />
          </div>
        </section>
      )}

      {page.showCommitments && (
        <section className="container-x mt-16 max-w-[920px]" aria-labelledby="page-commitments">
          <h2 id="page-commitments" className={H2}>
            {site.aboutPage.commitmentsHeading}
          </h2>
          <Commitments items={site.aboutPage.commitments} />
        </section>
      )}

      {page.showContact && (
        <section className="container-x mt-16 max-w-[920px]" aria-labelledby="page-findus">
          <h2 id="page-findus" className={H2}>
            {site.aboutPage.findUsHeading}
          </h2>
          <FindUs />
        </section>
      )}

      {faqs.length > 0 && (
        <div className="container-x mt-12 max-w-[920px]">
          <nav aria-label="Question groups" className="sticky top-[calc(var(--nav-h)+8px)] z-20 -mx-4 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 rounded-full border border-white/10 bg-[var(--nl-bg)]/90 p-1.5 backdrop-blur-sm sm:w-fit">
              {groups.map((g) => (
                <a
                  key={g.name || "general"}
                  href={`#${groupSlug(g.name)}`}
                  className="shrink-0 whitespace-nowrap rounded-full px-4 py-3 text-[13px] font-medium text-nl-ink transition-colors hover:text-white"
                >
                  {g.name || "Questions"}
                </a>
              ))}
            </div>
          </nav>
          <div className="mt-6 space-y-10">
            {groups.map((g) => (
              <section key={g.name || "general"} id={groupSlug(g.name)} className="scroll-mt-[calc(var(--nav-h)+56px)]" aria-label={g.name || "Questions"}>
                {g.name && <h2 className="label-mono mb-4">{g.name}</h2>}
                <FaqList items={g.items} open={openFaqId} onToggle={setOpenFaqId} />
              </section>
            ))}
          </div>
        </div>
      )}

      {page.showCta && <PageCta />}
    </PageShell>
  );
}
