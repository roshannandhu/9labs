// Static GitHub Pages demo only: copied over src/lib/content/pages.ts by scripts/build-demo.mjs.
import snapshot from "@/content/snapshot.json";
import type { Page } from "@/payload-types";
import type { FaqItem } from "@/content/types";

export async function getPage(slug: string): Promise<Page | null> {
  return ((snapshot.pages as unknown as Page[]).find((p) => p.slug === slug) ?? null) as Page | null;
}

export async function getFaqs(): Promise<FaqItem[]> {
  return snapshot.faqs as unknown as FaqItem[];
}

export async function listPageSlugs(): Promise<string[]> {
  return (snapshot.pages as unknown as Page[]).map((p) => p.slug);
}
