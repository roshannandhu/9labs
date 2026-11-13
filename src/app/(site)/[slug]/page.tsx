import type { Metadata } from "next";
import { defaultPages } from "@/content/defaults";
import { PageView } from "@/components/pages/PageView";

type Props = { params: Promise<{ slug: string }> };

/** Only the default pages get a clean file at build time; a page the admin adds later is reached at /p/?s=slug. */
export function generateStaticParams() {
  return defaultPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = defaultPages.find((p) => p.slug === slug);
  if (!page) return { title: "Page not found" };
  const title = page.seo.title || page.title;
  const description = page.seo.description || page.intro || undefined;
  return { title, description, alternates: { canonical: `/${slug}` }, openGraph: { title, description, url: `/${slug}` } };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  return <PageView slug={slug} />;
}
