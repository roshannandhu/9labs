"use client";

import { useEffect, useState } from "react";
import { fileUrl } from "@/lib/files";
import { isIdbRef } from "@/lib/resolveFiles";

/**
 * Resolves a content field's value to something an `<img>`/preview can use: a plain URL (or
 * empty string) passes straight through; an `idb:<id>` reference is looked up in IndexedDB.
 * While a new ref is still resolving, `url` stays `undefined` rather than showing the *previous*
 * ref's URL — so switching quickly between items (e.g. books in a list) never flashes someone
 * else's cover. The lookup itself runs inside the resolved promise's callback, not the effect
 * body, so there's no synchronous `setState` for the `set-state-in-effect` rule to flag.
 */
export function useFileUrl(ref: string | undefined): { url: string | undefined; loading: boolean } {
  const [resolved, setResolved] = useState<{ ref: string | undefined; url: string | undefined }>({ ref: undefined, url: undefined });

  useEffect(() => {
    if (!isIdbRef(ref)) return;
    let cancelled = false;
    void fileUrl(ref.slice(4)).then((url) => {
      if (!cancelled) setResolved({ ref, url });
    });
    return () => {
      cancelled = true;
    };
  }, [ref]);

  if (!isIdbRef(ref)) return { url: ref, loading: false };
  return { url: resolved.ref === ref ? resolved.url : undefined, loading: resolved.ref !== ref };
}
