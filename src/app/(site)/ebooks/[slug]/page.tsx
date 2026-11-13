import type { Metadata } from "next";
import { site } from "@/content/site";
import { BookPageView } from "@/components/ebooks/BookPageView";

type Props = { params: Promise<{ slug: string }> };

/** Only the built-in books get a clean file at build time; the shelf itself needs none of this. */
export function generateStaticParams() {
  return site.ebooks.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = site.ebooks.find((b) => b.slug === slug);
  if (!book) return { title: "Book not found" };
  const description = book.oneLiner || book.subtitle;
  return { title: `${book.title} — free e-book`, description, alternates: { canonical: `/ebooks/${slug}` }, openGraph: { title: book.title, description, url: `/ebooks/${slug}` } };
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  return <BookPageView slug={slug} />;
}
