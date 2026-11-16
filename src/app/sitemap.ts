import type { MetadataRoute } from "next";
import { getPublicContent } from "@/server/content";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { site, pages } = await getPublicContent();
  const now = new Date();
  const out: MetadataRoute.Sitemap = [{ url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 }];
  for (const p of pages) out.push({ url: `${site.url}/${p.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const b of site.ebooks) out.push({ url: `${site.url}/ebooks/${b.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  return out;
}
