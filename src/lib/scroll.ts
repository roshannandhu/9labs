"use client";

import type Lenis from "lenis";

/**
 * Tiny scroll coordinator shared by the smooth-scroll provider, the nav, the hero orbit
 * and the pinned Services journey. Components can register a custom resolver for an
 * anchor id (e.g. a card inside a pinned horizontal track whose DOM offset is not where
 * the page must scroll to).
 */

let lenis: Lenis | null = null;
const resolvers = new Map<string, () => number | null>();
const prefixResolvers: Array<{ prefix: string; fn: (id: string) => number | null }> = [];

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

export function registerAnchor(id: string, fn: () => number | null) {
  resolvers.set(id, fn);
  return () => {
    if (resolvers.get(id) === fn) resolvers.delete(id);
  };
}

export function registerAnchorPrefix(prefix: string, fn: (id: string) => number | null) {
  const entry = { prefix, fn };
  prefixResolvers.push(entry);
  return () => {
    const i = prefixResolvers.indexOf(entry);
    if (i >= 0) prefixResolvers.splice(i, 1);
  };
}

function navOffset() {
  if (typeof window === "undefined") return 0;
  const v = getComputedStyle(document.documentElement).getPropertyValue("--nav-h");
  return parseFloat(v) || 72;
}

export function resolveAnchor(id: string): number | null {
  const direct = resolvers.get(id);
  if (direct) {
    const y = direct();
    if (y != null) return y;
  }
  for (const { prefix, fn } of prefixResolvers) {
    if (id.startsWith(prefix)) {
      const y = fn(id);
      if (y != null) return y;
    }
  }
  const el = document.getElementById(id);
  if (!el) return null;
  const offset = id === "home" ? 0 : navOffset() - 1;
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
}

export function scrollToId(id: string, opts: { immediate?: boolean } = {}) {
  const y = resolveAnchor(id);
  if (y == null) return false;
  const reduce = document.documentElement.dataset.motionResolved === "reduce";
  if (lenis && !reduce && !opts.immediate) {
    lenis.scrollTo(y, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
  } else {
    window.scrollTo({ top: y, behavior: reduce || opts.immediate ? "auto" : "smooth" });
  }
  if (history.replaceState) history.replaceState(null, "", `#${id}`);
  return true;
}
