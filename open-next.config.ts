import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * The admin is the only prerendered (static) part of this app, and it never needs revalidating —
 * so the read-only static-assets cache is enough. No R2/D1/Queue wiring: public pages are fully
 * dynamic (`export const dynamic = "force-dynamic"` in `src/app/(site)/layout.tsx`) and read
 * straight from Supabase on every request, so they never go through this cache at all.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
