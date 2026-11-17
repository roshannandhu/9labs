import "server-only";
import { defaultWorkspace } from "@/content/defaults";
import { db } from "../db";
import type { KbEntry, KbKind } from "./types";

type KbRow = {
  id: string;
  kind: KbKind;
  title: string;
  body: string;
  tags: string[];
  service_slug: string | null;
  allow_prices: boolean;
  enabled: boolean;
  embedding: unknown;
  updated_at: string;
  updated_by: string;
};

const mapRow = (r: KbRow): KbEntry => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  body: r.body,
  tags: Array.isArray(r.tags) ? r.tags : [],
  serviceSlug: r.service_slug,
  allowPrices: Boolean(r.allow_prices),
  enabled: Boolean(r.enabled),
  updatedAt: r.updated_at,
  updatedBy: r.updated_by || "System",
  hasEmbedding: Boolean(r.embedding),
});

/** Starter entries seeded from site defaults if the database table is empty. */
export function defaultKbEntries(): KbEntry[] {
  const ws = defaultWorkspace();
  const now = new Date().toISOString();

  const serviceEntries: KbEntry[] = ws.site.services.map((s) => ({
    id: `kb-service-${s.slug}`,
    kind: "service",
    title: s.title,
    body: `${s.title}: ${s.short}.\n${s.description}\nKey needs addressed: ${s.needs.join(", ")}.`,
    tags: [...s.tags],
    serviceSlug: s.slug,
    allowPrices: false,
    enabled: true,
    updatedAt: now,
    updatedBy: "System Seed",
    hasEmbedding: false,
  }));

  const aboutEntry: KbEntry = {
    id: "kb-note-about",
    kind: "note",
    title: "About Nine Labs Solutions",
    body: "Nine Labs Solutions is a premier marketing, technology, and live-experience agency based in Dubai South, UAE. We specialize in cross-disciplinary growth: AI consultancy, custom software & web development, social & performance marketing, video production, and high-impact corporate trade shows and events.",
    tags: ["about", "overview", "dubai", "services", "capabilities"],
    serviceSlug: null,
    allowPrices: false,
    enabled: true,
    updatedAt: now,
    updatedBy: "System Seed",
    hasEmbedding: false,
  };

  return [aboutEntry, ...serviceEntries];
}

/** In-memory fallback cache for development or when Supabase table is not yet migrated */
let memoryCache: KbEntry[] | null = null;

export async function listKbEntries(): Promise<KbEntry[]> {
  try {
    const { data, error } = await db()
      .from("kb_entries")
      .select("id, kind, title, body, tags, service_slug, allow_prices, enabled, embedding, updated_at, updated_by")
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("Supabase kb_entries query fallback:", error.message);
      if (!memoryCache) memoryCache = defaultKbEntries();
      return memoryCache;
    }

    if (!data || data.length === 0) {
      // Seed default entries if table is completely empty
      const seeded = defaultKbEntries();
      await seedKbEntries(seeded).catch(() => {});
      return seeded;
    }

    return (data as KbRow[]).map(mapRow);
  } catch (err) {
    console.warn("listKbEntries network/table fallback:", err);
    if (!memoryCache) memoryCache = defaultKbEntries();
    return memoryCache;
  }
}

export async function upsertKbEntry(
  entry: Omit<KbEntry, "updatedAt" | "hasEmbedding" | "updatedBy"> & { updatedBy?: string },
  authorEmail: string
): Promise<KbEntry> {
  const now = new Date().toISOString();
  const record: KbEntry = {
    ...entry,
    updatedAt: now,
    updatedBy: authorEmail || "Admin",
    hasEmbedding: false,
  };

  try {
    const { error } = await db()
      .from("kb_entries")
      .upsert({
        id: record.id,
        kind: record.kind,
        title: record.title,
        body: record.body,
        tags: record.tags,
        service_slug: record.serviceSlug ?? null,
        allow_prices: record.allowPrices,
        enabled: record.enabled,
        updated_at: now,
        updated_by: record.updatedBy,
      });

    if (error) {
      console.warn("upsertKbEntry DB fallback:", error.message);
      // Update memory cache
      if (!memoryCache) memoryCache = defaultKbEntries();
      const idx = memoryCache.findIndex((e) => e.id === record.id);
      if (idx >= 0) memoryCache[idx] = record;
      else memoryCache.unshift(record);
      return record;
    }

    return record;
  } catch (err) {
    console.warn("upsertKbEntry exception:", err);
    if (!memoryCache) memoryCache = defaultKbEntries();
    const idx = memoryCache.findIndex((e) => e.id === record.id);
    if (idx >= 0) memoryCache[idx] = record;
    else memoryCache.unshift(record);
    return record;
  }
}

export async function deleteKbEntry(id: string): Promise<void> {
  try {
    await db().from("kb_entries").delete().eq("id", id);
  } catch (err) {
    console.warn("deleteKbEntry fallback:", err);
  }
  if (memoryCache) {
    memoryCache = memoryCache.filter((e) => e.id !== id);
  }
}

export async function seedKbEntries(entries: KbEntry[]): Promise<void> {
  try {
    const rows = entries.map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      body: e.body,
      tags: e.tags,
      service_slug: e.serviceSlug ?? null,
      allow_prices: e.allowPrices,
      enabled: e.enabled,
      updated_at: e.updatedAt,
      updated_by: e.updatedBy,
    }));
    await db().from("kb_entries").upsert(rows);
  } catch (err) {
    console.warn("seedKbEntries error:", err);
  }
}
