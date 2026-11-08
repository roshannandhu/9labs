import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${site.url}/`, lastModified: new Date("2026-11-08"), changeFrequency: "weekly", priority: 1 }];
}
