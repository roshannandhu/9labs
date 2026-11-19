// Wraps the OpenNext worker so the Cloudflare cron trigger (wrangler.jsonc "triggers") can run
// /api/cron/tick: retries pending e-book deliveries and prunes old rate-limit rows.
// The request goes straight into the handler — no network hop, same Bearer check as an outside caller.
// .open-next/worker.js only exists after `opennextjs-cloudflare build`.
import handler from "./.open-next/worker.js";
import { hostRedirect } from "./src/lib/host-route.ts";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

const worker = {
  fetch(req, env, ctx) {
    const to = hostRedirect(new URL(req.url));
    return to ? Response.redirect(to, 308) : handler.fetch(req, env, ctx);
  },
  async scheduled(_event, env, ctx) {
    const req = new Request(`${env.NEXT_PUBLIC_SITE_URL || "https://localhost"}/api/cron/tick/`, { method: "POST", headers: { authorization: `Bearer ${env.CRON_SECRET}` } });
    ctx.waitUntil(handler.fetch(req, env, ctx));
  },
};

export default worker;
