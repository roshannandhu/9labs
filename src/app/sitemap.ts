import type { MetadataRoute } from "next";
import { getSite } from "@/lib/content/getSite";
import { listPageSlugs } from "@/lib/content/pages";

export const dynamic = "force-dynamic";

/** The homepage, every published page (About, FAQ, Privacy…) and every book page. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const now = new Date();
  const out: MetadataRoute.Sitemap = [{ url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 }];
  for (const slug of await listPageSlugs()) out.push({ url: `${site.url}/${slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const b of site.ebooks) out.push({ url: `${site.url}/ebooks/${b.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  return out;
}
