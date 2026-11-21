import "server-only";
import { after } from "next/server";
import { env } from "./env";

/**
 * Empties Cloudflare's edge cache for the public site (custom-worker.js keeps rendered pages there),
 * so a publish, restore or reset shows at once. Never throws: a failed purge only means visitors see
 * the previous version until the day-long edge copy expires; it must not fail the publish itself.
 * Resolves false when the purge couldn't be done, so the admin can be told.
 */
export async function purgeSiteCache(): Promise<boolean> {
  const { CF_ZONE_ID, CF_PURGE_TOKEN } = env();
  if (!CF_ZONE_ID || !CF_PURGE_TOKEN) {
    // local development has no edge cache to empty; on the live site this is a missing setting
    const live = process.env.NODE_ENV === "production";
    if (live) console.error("[purge] CF_ZONE_ID / CF_PURGE_TOKEN not set: visitors keep old pages for up to a day");
    return !live;
  }
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`, {
      method: "POST",
      headers: { authorization: `Bearer ${CF_PURGE_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ purge_everything: true }),
    });
    if (!res.ok) console.error("[purge] Cloudflare answered", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[purge] failed", err);
    return false;
  }
}

/** Longer than a Worker instance may keep its copy of the published site (content.ts `MEMO_MS`). */
const SECOND_PURGE_MS = 25_000;

/**
 * After a publish, restore or reset: purge now, and once more after every other Worker instance's
 * in-memory copy of the old site has expired. A page rendered from such a copy in between would
 * otherwise sit in the edge cache for a day.
 */
export async function purgeAfterContentChange(): Promise<boolean> {
  const ok = await purgeSiteCache();
  after(async () => {
    await new Promise((r) => setTimeout(r, SECOND_PURGE_MS));
    await purgeSiteCache();
  });
  return ok;
}
