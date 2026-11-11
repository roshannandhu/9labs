import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/content/getSite";
import { PageShell } from "@/components/pages/PageShell";
import { BookLanding } from "@/components/ebooks/BookLanding";
import { JsonLd } from "@/components/layout/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = (await getSite()).ebooks.find((b) => b.slug === slug);
  if (!book) return { title: "Book not found" };
  const description = book.oneLiner || book.subtitle;
  return {
    title: `${book.title} — free e-book`,
    description,
    alternates: { canonical: `/ebooks/${slug}` },
    openGraph: { title: book.title, description, url: `/ebooks/${slug}`, ...(book.cover ? { images: [{ url: book.cover }] } : {}) },
  };
}

/** A shareable page for one e-book: details and the request form. Books come from the admin (Books → Books). */
export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const site = await getSite();
  const book = site.ebooks.find((b) => b.slug === slug);
  if (!book) notFound();
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
