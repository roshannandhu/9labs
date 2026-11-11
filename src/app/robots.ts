import type { MetadataRoute } from "next";
import { getSite } from "@/lib/content/getSite";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();
  const open = site.seo.index && process.env.NEXT_PUBLIC_NOINDEX !== "1";
  return {
    rules: [open ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/download"] } : { userAgent: "*", disallow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
