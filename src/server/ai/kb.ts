import "server-only";
import type { SiteData } from "@/content/site";
import { db } from "../db";
import { aiConfigured } from "../env";
import { embedTexts } from "./providers";
import type { KbEntry, KbHit, KbInput, KbKind } from "./types";

type KbRow = { id: string; kind: KbKind; title: string; body: string; tags: string[] | null; service_slug: string | null; allow_prices: boolean; enabled: boolean; has_embedding?: boolean; embedding?: unknown; updated_at: string; updated_by: string };

const mapRow = (r: KbRow): KbEntry => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  body: r.body,
  tags: r.tags ?? [],
  serviceSlug: r.service_slug,
  allowPrices: r.allow_prices,
  enabled: r.enabled,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by || "System",
  hasEmbedding: Boolean(r.embedding),
});

/** The text that gets embedded for an entry — title and tags carry as much meaning as the body. */
export const embedText = (e: Pick<KbEntry, "title" | "body" | "tags">) => `${e.title}\n${e.tags.join(", ")}\n${e.body}`;

/** Starter entries: one per service from the published site, plus an "About" note. */
export function seedEntries(site: SiteData): KbEntry[] {
  const now = new Date().toISOString();
  const services: KbEntry[] = site.services.map((s) => ({
    id: `kb-service-${s.slug}`,
    kind: "service",
    title: s.title,
    body: [`${s.title}: ${s.short}.`, s.description, s.needs.length ? `Typical needs: ${s.needs.join(", ")}.` : ""].filter(Boolean).join("\n"),
    tags: [...s.tags],
    serviceSlug: s.slug,
    allowPrices: false,
    enabled: true,
    updatedAt: now,
    updatedBy: "Seed",
  }));
  const about: KbEntry = {
    id: "kb-note-about",
    kind: "note",
    title: `About ${site.name}`,
    body: `${site.name} offers: ${site.services.map((s) => s.title).join(", ")}.`,
    tags: ["about", "overview"],
    serviceSlug: null,
    allowPrices: false,
    enabled: true,
    updatedAt: now,
    updatedBy: "Seed",
  };
  return [about, ...services];
}

const COLUMNS = "id, kind, title, body, tags, service_slug, allow_prices, enabled, embedding, updated_at, updated_by";

export async function listKbEntries(): Promise<KbEntry[]> {
  const { data, error } = await db().from("kb_entries").select(COLUMNS).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as KbRow[]).map(mapRow);
}

/** Embeds when a Gemini key exists; a failed embed still saves the entry (it then shows "not indexed"). */
async function embedOrNull(texts: string[]): Promise<(number[] | null)[]> {
  if (!aiConfigured().gemini || !texts.length) return texts.map(() => null);
  try {
    return await embedTexts(texts, "RETRIEVAL_DOCUMENT");
  } catch (err) {
    console.warn("kb embed failed:", err instanceof Error ? err.message : err);
    return texts.map(() => null);
  }
}

export async function upsertKbEntries(entries: (KbInput | KbEntry)[], author: string): Promise<KbEntry[]> {
  const now = new Date().toISOString();
  const vectors = await embedOrNull(entries.map((e) => embedText({ title: e.title, body: e.body, tags: e.tags })));
  const rows = entries.map((e, i) => ({
    id: e.id,
    kind: e.kind,
    title: e.title,
    body: e.body,
    tags: e.tags,
    service_slug: e.serviceSlug ?? null,
    allow_prices: e.allowPrices,
    enabled: e.enabled,
    embedding: vectors[i],
    updated_at: now,
    updated_by: author,
  }));
  const { data, error } = await db().from("kb_entries").upsert(rows).select(COLUMNS);
  if (error) throw error;
  return (data as KbRow[]).map(mapRow);
}

export async function deleteKbEntry(id: string): Promise<void> {
  const { error } = await db().from("kb_entries").delete().eq("id", id);
  if (error) throw error;
}

/** Re-embeds every entry (after a model change, or entries saved before a key was set). */
export async function reindexKb(): Promise<{ total: number; indexed: number }> {
  const { data, error } = await db().from("kb_entries").select("id, title, body, tags");
  if (error) throw error;
  const rows = data as { id: string; title: string; body: string; tags: string[] | null }[];
  let indexed = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const vectors = await embedTexts(
      chunk.map((r) => embedText({ title: r.title, body: r.body, tags: r.tags ?? [] })),
      "RETRIEVAL_DOCUMENT",
    );
    for (let j = 0; j < chunk.length; j++) {
      const { error: e } = await db().from("kb_entries").update({ embedding: vectors[j] }).eq("id", chunk[j].id);
      if (e) throw e;
      indexed++;
    }
  }
  return { total: rows.length, indexed };
}

/**
 * RETRIEVE (docs/AI_RAG_SYSTEM.md §3 step 3): embed the query → pgvector top-k. When embedding is
 * unavailable, fails, or finds nothing, every enabled entry goes in instead — the KB is small enough
 * to fit in one prompt, so the AI is never left without context.
 */
export async function retrieveKb(query: string, k = 6): Promise<{ hits: KbHit[]; mode: "vector" | "all" }> {
  if (aiConfigured().gemini) {
    try {
      const [vec] = await embedTexts([query], "RETRIEVAL_QUERY");
      const { data, error } = await db().rpc("match_kb", { query_embedding: vec, match_count: k });
      if (error) throw error;
      const hits = (data as { id: string; kind: KbKind; title: string; body: string; service_slug: string | null; allow_prices: boolean; similarity: number }[]).map((r) => ({ id: r.id, kind: r.kind, title: r.title, body: r.body, serviceSlug: r.service_slug, allowPrices: r.allow_prices, similarity: r.similarity }));
      if (hits.length) return { hits, mode: "vector" };
    } catch (err) {
      console.warn("kb vector retrieval failed, sending all entries:", err instanceof Error ? err.message : err);
    }
  }
  const { data, error } = await db().from("kb_entries").select("id, kind, title, body, service_slug, allow_prices").eq("enabled", true).limit(40);
  if (error) throw error;
  return { hits: (data as KbRow[]).map((r) => ({ id: r.id, kind: r.kind, title: r.title, body: r.body, serviceSlug: r.service_slug, allowPrices: r.allow_prices, similarity: null })), mode: "all" };
}
