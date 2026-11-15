import type { MetadataRoute } from "next";
import { getPublicContent } from "@/server/content";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site } = await getPublicContent();
  const open = site.seo.index && process.env.NEXT_PUBLIC_NOINDEX !== "1";
  return {
    rules: [open ? { userAgent: "*", allow: "/", disallow: ["/admin", "/download"] } : { userAgent: "*", disallow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
