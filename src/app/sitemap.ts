import type { MetadataRoute } from "next";
import { getSite, payloadClient } from "@/lib/content/getSite";

export const dynamic = "force-dynamic";

/** The homepage, every published page (About, FAQ, Privacy…) and every book page. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const now = new Date();
  const out: MetadataRoute.Sitemap = [{ url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 }];
  try {
    const payload = await payloadClient();
    const pages = await payload.find({ collection: "pages", limit: 200, depth: 0, overrideAccess: true });
    for (const p of pages.docs) out.push({ url: `${site.url}/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "monthly", priority: 0.6 });
  } catch {
    /* database not reachable: the homepage alone */
  }
  for (const b of site.ebooks) out.push({ url: `${site.url}/ebooks/${b.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  return out;
}
