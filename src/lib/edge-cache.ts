// Which requests custom-worker.js may answer from Cloudflare's edge cache. Only full public pages on the
// public site: the HTML is the same for every visitor (content comes from the published workspace,
// sign-in lives in the admin), so rendering it on every visit only cost time. Publishing purges the
// zone (src/server/purge.ts) and every deploy starts a fresh cache (the key carries the version id).
import { SITE } from "./host-route";

const NEVER = /^\/(api|_next|download)(\/|$)/;

export function edgeCacheKey(req: Request, version: string): string | null {
  if (req.method !== "GET") return null;
  const url = new URL(req.url);
  if (url.hostname !== SITE || NEVER.test(url.pathname)) return null;
  // in-app navigation fetches an RSC payload for the same URL: different body, never cached here
  if (req.headers.has("rsc") || req.headers.has("next-router-prefetch") || url.searchParams.has("_rsc")) return null;
  if (req.headers.has("authorization")) return null;
  url.searchParams.set("__v", version || "0");
  return url.toString();
}

/** A response worth keeping: a normal 200 page that sets no cookie. */
export const edgeCacheable = (res: Response) => res.status === 200 && !res.headers.has("set-cookie") && /text\/(html|plain)|xml/.test(res.headers.get("content-type") ?? "");
