"use client";

import { mediaUrl } from "@/lib/fileRefs";

/**
 * A content field's value, resolved to something an `<img>` can use: a plain URL passes straight
 * through, a stored-file ref becomes its `/media/...` URL. `mediaUrl` is a pure string transform
 * (no lookup, no network round trip to resolve it — the browser's own `<img>` fetches the URL),
 * so unlike the old IndexedDB version this never needs to be async.
 */
export function useFileUrl(ref: string | undefined): { url: string | undefined; loading: boolean } {
  return { url: mediaUrl(ref) ?? ref, loading: false };
}
