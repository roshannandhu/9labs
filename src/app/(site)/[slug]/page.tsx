import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageView } from "@/components/pages/PageView";
import { getPublicContent } from "@/server/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { pages } = await getPublicContent();
  const page = pages.find((p) => p.slug === slug);
  if (!page) return { title: "Page not found" };
  const title = page.seo.title || page.title;
  const description = page.seo.description || page.intro || undefined;
  return { title, description, alternates: { canonical: `/${slug}` }, openGraph: { title, description, url: `/${slug}` } };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const { pages } = await getPublicContent();
  if (!pages.some((p) => p.slug === slug)) notFound();
  return <PageView slug={slug} />;
}
