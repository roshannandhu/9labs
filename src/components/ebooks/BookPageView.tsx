"use client";

import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { JsonLd } from "@/components/layout/JsonLd";
import { PageHeader, PageShell } from "@/components/pages/PageShell";
import { siteHref } from "@/lib/site-href";
import { BookLanding } from "./BookLanding";

export function BookPageView({ slug }: { slug: string }) {
  const site = useSite();
  const book = site.ebooks.find((b) => b.slug === slug);
  if (!book) {
    return (
      <PageShell>
        <PageHeader eyebrow="404" title="This book is not available right now." intro="It may have been renamed, or taken off the shelf." />
        <div className="container-x mt-8 max-w-[920px]">
          <Link href={siteHref("/#ebooks")} className="btn btn-primary">
            See the free e-books
          </Link>
        </div>
      </PageShell>
    );
  }
  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: book.title,
          alternativeHeadline: book.subtitle,
          description: book.oneLiner,
          bookFormat: "https://schema.org/EBook",
          numberOfPages: book.pages || undefined,
          isAccessibleForFree: true,
          url: `${site.url}/ebooks/${book.slug}`,
          publisher: { "@type": "Organization", name: site.name, url: site.url },
        }}
      />
      <BookLanding book={book} />
    </PageShell>
  );
}
