import "server-only";
import { env } from "./env";

/**
 * Empties Cloudflare's edge cache for the public site (custom-worker.js keeps rendered pages there),
 * so a publish, restore or reset shows at once. Never throws: a failed purge only means visitors see
 * the previous version until the day-long edge copy expires; it must not fail the publish itself.
 */
export async function purgeSiteCache(): Promise<void> {
  const { CF_ZONE_ID, CF_PURGE_TOKEN } = env();
  if (!CF_ZONE_ID || !CF_PURGE_TOKEN) return;
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`, {
      method: "POST",
      headers: { authorization: `Bearer ${CF_PURGE_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ purge_everything: true }),
    });
    if (!res.ok) console.error("[purge] Cloudflare answered", res.status, await res.text());
  } catch (err) {
    console.error("[purge] failed", err);
  }
}
