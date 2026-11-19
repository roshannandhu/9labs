import "server-only";
import { cache } from "react";
import { checkWorkspace } from "@/lib/checks";
import { autoLabel, diffDeep } from "@/lib/diff";
import { resolveSiteFiles } from "@/lib/resolveFiles";
import { normalizeWorkspace } from "@/lib/workspace";
import { defaultWorkspace } from "@/content/defaults";
import { toSite } from "@/content/toSite";
import type { AdminRole, Workspace } from "@/content/types";
import { db } from "./db";
import { purgeSiteCache } from "./purge";
import { HttpError } from "./http";
import { firstForbiddenChange } from "@/lib/permissions";

type WorkspaceRow = "draft" | "published";

export async function readWorkspace(id: WorkspaceRow): Promise<{ data: Workspace; rev: number } | null> {
  const { data, error } = await db().from("workspace").select("data, rev").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { data: normalizeWorkspace(data.data), rev: data.rev };
}

let publishedMemo: { ws: Workspace; at: number } | null = null;
const MEMO_MS = 60_000;

/** The live site's content, memoized per Worker instance for up to a minute. */
export async function getPublished(): Promise<Workspace> {
  if (publishedMemo && Date.now() - publishedMemo.at < MEMO_MS) return publishedMemo.ws;
  const row = await readWorkspace("published");
  const ws = row?.data ?? defaultWorkspace();
  publishedMemo = { ws, at: Date.now() };
  return ws;
}

export function setPublishedMemo(ws: Workspace): void {
  publishedMemo = { ws, at: Date.now() };
}

/** De-duplicated within a single request (React `cache`) — every component asking for the site gets the same read. */
export const getPublicContent = cache(async () => {
  const ws = await getPublished();
  return { site: resolveSiteFiles(toSite(ws)), pages: ws.pages, faqs: ws.faqs };
});

/**
 * Compare-and-swap on `rev` so two admins saving at once can't silently clobber one another.
 * `expectedRev` of 0 means "there is no draft row yet — create it."
 */
export async function saveDraft(next: Workspace, expectedRev: number, role: AdminRole, updatedBy: string): Promise<{ rev: number }> {
  const normalized = normalizeWorkspace(next);

  if (expectedRev === 0) {
    const { data, error } = await db().from("workspace").insert({ id: "draft", data: normalized, rev: 1, updated_by: updatedBy }).select("rev").single();
    if (error) {
      if (error.code === "23505") throw new HttpError(409, "The draft already exists — reload.");
      throw error;
    }
    return { rev: data.rev as number };
  }

  const current = await readWorkspace("draft");
  if (!current) throw new HttpError(409, "The draft has changed — reload.");

  if (role === "editor") {
    const forbidden = firstForbiddenChange(role, diffDeep(current.data, normalized));
    if (forbidden) throw new HttpError(403, `You can't change this: ${autoLabel(forbidden.path)}.`);
  }

  const { data, error } = await db()
    .from("workspace")
    .update({ data: normalized, rev: expectedRev + 1, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq("id", "draft")
    .eq("rev", expectedRev)
    .select("rev")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(409, "Someone else changed the draft — reload.");
  return { rev: data.rev as number };
}

const MAX_VERSIONS = 30;

/** Publishing only ever copies the already-saved draft over — it never trusts a request body's content. */
export async function publishDraft(summary: string[], expectedRev: number, updatedBy: string): Promise<{ published: Workspace }> {
  const current = await readWorkspace("draft");
  if (!current || current.rev !== expectedRev) throw new HttpError(409, "The draft has changed — reload.");

  const issues = checkWorkspace(current.data);
  if (issues.some((i) => i.level === "error")) throw new HttpError(422, "This can't be published yet.", { issues });

  const { error: upsertErr } = await db().from("workspace").upsert({ id: "published", data: current.data, rev: current.rev, updated_by: updatedBy, updated_at: new Date().toISOString() });
  if (upsertErr) throw upsertErr;

  const { error: versionErr } = await db()
    .from("versions")
    .insert({ created_by: updatedBy, summary: summary.slice(0, 40), data: current.data });
  if (versionErr) throw versionErr;

  const { data: old } = await db().from("versions").select("id").order("created_at", { ascending: false }).range(MAX_VERSIONS, 10_000);
  if (old?.length) await db().from("versions").delete().in("id", old.map((v) => v.id as string));

  setPublishedMemo(current.data);
  await purgeSiteCache();
  return { published: current.data };
}
