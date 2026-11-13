import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { defaultPages } from "@/content/defaults";

export const dynamic = "force-static";

/**
 * Built from the built-in content (this is a static export, generated once at build time) —
 * pages the admin adds later are reached at `/p/?s=slug` until the next rebuild.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [{ url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 }];
  for (const p of defaultPages) out.push({ url: `${site.url}/${p.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  for (const b of site.ebooks) out.push({ url: `${site.url}/ebooks/${b.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  return out;
}
