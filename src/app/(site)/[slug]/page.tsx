import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { PageView } from "@/components/pages/PageView";
import { getPublicContent } from "@/server/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params;
  const { site, pages } = await getPublicContent();
  const page = pages.find((p) => p.slug === slug);
  if (!page) return { title: "Page not found" };
  const name = page.seo.title || page.title;
  // a title that already names the company is used as it is, so it doesn't end "… · Nine Labs Solutions · Nine Labs Solutions"
  const title = name.toLowerCase().includes(site.name.toLowerCase()) ? { absolute: name } : name;
  const description = page.seo.description || page.intro || undefined;
  const { openGraph, twitter } = await parent; // the image, site name and locale from the layout
  return { title, description, alternates: { canonical: `/${slug}` }, openGraph: { ...openGraph, title: name, description, url: `/${slug}` }, twitter: { ...twitter, title: name, description } };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const { pages } = await getPublicContent();
  if (!pages.some((p) => p.slug === slug)) notFound();
  return <PageView slug={slug} />;
}
