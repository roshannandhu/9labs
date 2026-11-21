import { defaultWorkspace, WORKSPACE_SCHEMA } from "@/content/defaults";
import type { Workspace } from "@/content/types";
import { migrateQuizOptionsInPlace } from "@/lib/quiz/migrate";

/** Lays a freshly loaded workspace over today's defaults, so an older save never crashes a newer build. */
export function normalizeWorkspace(saved: unknown): Workspace {
  migrateQuizOptionsInPlace(saved); // backfill own-words + default "what we say" lines, before anything reads site.quiz
  const d = defaultWorkspace();
  if (!saved || typeof saved !== "object") return d;
  const s = saved as Partial<Workspace>;
  const site = deepMerge(d.site, s.site);
  // The address belongs to the deployment, not the content: a save made on localhost must never leak into
  // the live canonical / og:image / sitemap / JSON-LD.
  site.url = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  return {
    schema: WORKSPACE_SCHEMA,
    site,
    pages: Array.isArray(s.pages) && s.pages.length ? (s.pages as Workspace["pages"]) : d.pages,
    faqs: Array.isArray(s.faqs) ? (s.faqs as Workspace["faqs"]) : d.faqs,
    delivery: { ...d.delivery, ...(s.delivery ?? {}) },
    email: { ...d.email, ...(s.email ?? {}) },
    retention: { ...d.retention, ...(s.retention ?? {}) },
  };
}

export function deepMerge<T>(def: T, saved: unknown): T {
  if (saved === undefined || saved === null) return def;
  if (Array.isArray(def)) return (Array.isArray(saved) ? saved : def) as T;
  if (def !== null && typeof def === "object") {
    if (typeof saved !== "object" || saved === null) return def;
    const out: Record<string, unknown> = { ...(def as Record<string, unknown>) };
    const savedObj = saved as Record<string, unknown>;
    for (const k of new Set([...Object.keys(out), ...Object.keys(savedObj)])) out[k] = deepMerge(out[k], savedObj[k]);
    return out as T;
  }
  return (saved as T) ?? def;
}
