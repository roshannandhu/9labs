import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const open = site.seo.index && process.env.NEXT_PUBLIC_NOINDEX !== "1";
  return {
    rules: [open ? { userAgent: "*", allow: "/", disallow: ["/admin", "/download"] } : { userAgent: "*", disallow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
