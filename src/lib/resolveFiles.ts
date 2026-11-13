"use client";

import type { SiteData } from "@/content/types";
import { fileUrl } from "./files";

/** A stored file lives under `idb:<fileId>` in a content field until it's resolved to a real URL. */
export const idbRef = (fileId: string) => `idb:${fileId}`;
export const isIdbRef = (v: string | undefined): v is string => !!v && v.startsWith("idb:");

async function resolve(v?: string): Promise<string | undefined> {
  if (!isIdbRef(v)) return v;
  return fileUrl(v.slice(4));
}

/** Swaps every `idb:` reference (logo, favicon, OG image, book covers) for a usable object URL. */
export async function resolveSiteFiles(site: SiteData): Promise<SiteData> {
  const [logo, favicon, ogImage] = await Promise.all([resolve(site.logo), resolve(site.favicon), resolve(site.seo.ogImage)]);
  const ebooks = await Promise.all(site.ebooks.map(async (b) => ({ ...b, cover: await resolve(b.cover) })));
  return { ...site, logo, favicon, seo: { ...site.seo, ogImage }, ebooks };
}
