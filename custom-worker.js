// Wraps the OpenNext worker so the Cloudflare cron trigger (wrangler.jsonc "triggers") can run
// /api/cron/tick: retries pending e-book deliveries and prunes old rate-limit rows.
// The request goes straight into the handler — no network hop, same Bearer check as an outside caller.
// .open-next/worker.js only exists after `opennextjs-cloudflare build`.
import handler from "./.open-next/worker.js";
import { edgeCacheable, edgeCacheKey } from "./src/lib/edge-cache.ts";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

// Public pages from Cloudflare's edge cache (rules: src/lib/edge-cache.ts). Visitors' browsers still
// revalidate every time (the page's own no-store header is what they get), only the edge keeps a copy.
const EDGE_TTL = 86400; // a day; Publish purges sooner (src/server/purge.ts)

const worker = {
  async fetch(req, env, ctx) {
    const key = edgeCacheKey(req, env.CF_VERSION_METADATA?.id);
    if (!key) return handler.fetch(req, env, ctx);
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) {
      const out = new Response(hit.body, hit);
      out.headers.set("cache-control", "private, no-cache, no-store, max-age=0, must-revalidate");
      out.headers.set("x-edge-cache", "HIT");
      return out;
    }
    const res = await handler.fetch(req, env, ctx);
    if (edgeCacheable(res)) {
      const copy = new Response(res.clone().body, res);
      copy.headers.set("cache-control", `public, s-maxage=${EDGE_TTL}`);
      ctx.waitUntil(cache.put(key, copy));
    }
    return res;
  },
  async scheduled(_event, env, ctx) {
    const req = new Request(`${env.NEXT_PUBLIC_SITE_URL || "https://ninelabsolutions.ae"}/api/cron/tick/`, { method: "POST", headers: { authorization: `Bearer ${env.CRON_SECRET}` } });
    ctx.waitUntil(handler.fetch(req, env, ctx));
  },
};

export default worker;
