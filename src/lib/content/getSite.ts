import "server-only";
import { site as defaults } from "@/content/site";
import type { SiteData } from "@/content/types";
import { cachedSite } from "./db";

/**
 * Everything the public site shows, as one object. Cached until an admin saves something
 * (every Payload afterChange hook clears the `site` tag). If the database cannot be read, the
 * built-in content is shown instead of an error page.
 *
 * The static GitHub Pages demo build replaces this file with one that reads a snapshot
 * (scripts/demo/getSite.ts); see scripts/build-demo.mjs.
 */
export async function getSite(): Promise<SiteData> {
  try {
    return await cachedSite();
  } catch (err) {
    console.error("[site] could not read content from the database — showing the built-in content.", err);
    return defaults;
  }
}
