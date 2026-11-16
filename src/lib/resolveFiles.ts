import type { SiteData } from "@/content/types";
import { mediaUrl } from "./fileRefs";

const resolve = (ref?: string): string | undefined => (ref ? (mediaUrl(ref) ?? ref) : ref);

/** Swaps every stored-file reference (logo, favicon, OG image, book covers) for a servable URL. */
export function resolveSiteFiles(site: SiteData): SiteData {
  const ebooks = site.ebooks.map((b) => ({ ...b, cover: resolve(b.cover), coverLogo: resolve(b.coverLogo) }));
  return { ...site, logo: resolve(site.logo), favicon: resolve(site.favicon), seo: { ...site.seo, ogImage: resolve(site.seo.ogImage) }, ebooks };
}
