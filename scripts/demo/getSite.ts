// Static GitHub Pages demo only: copied over src/lib/content/getSite.ts by scripts/build-demo.mjs.
// Reads the snapshot taken from the seeded database (scripts/demo-snapshot.ts). No database, no server.
import snapshot from "@/content/snapshot.json";
import type { SiteData } from "@/content/types";

export async function getSite(): Promise<SiteData> {
  return snapshot.site as unknown as SiteData;
}
