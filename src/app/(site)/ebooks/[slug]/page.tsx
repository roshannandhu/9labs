import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { BookPageView } from "@/components/ebooks/BookPageView";
import { getPublicContent } from "@/server/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params;
  const { site } = await getPublicContent();
  const book = site.ebooks.find((b) => b.slug === slug);
  if (!book) return { title: "Book not found" };
  const description = book.oneLiner || book.subtitle;
  const { openGraph, twitter } = await parent; // the image, site name and locale from the layout
  return { title: `${book.title} — free e-book`, description, alternates: { canonical: `/ebooks/${slug}` }, openGraph: { ...openGraph, title: book.title, description, url: `/ebooks/${slug}` }, twitter: { ...twitter, title: book.title, description } };
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const { site } = await getPublicContent();
  if (!site.ebooks.some((b) => b.slug === slug)) notFound();
  return <BookPageView slug={slug} />;
}
