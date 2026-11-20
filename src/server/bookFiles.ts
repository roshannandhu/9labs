import "server-only";
import { refKey } from "@/lib/fileRefs";
import type { Workspace } from "@/content/types";
import { deleteObject, listObjects } from "./r2";

const GRACE_MS = 24 * 3_600_000; // a fresh upload isn't judged unused for a day (a draft may not reference it yet)

const bookRefs = (ws: Workspace | null | undefined): string[] =>
  (ws?.site.ebooks ?? []).flatMap((b) => [b.cover, b.coverLogo, b.pdfFileId]).filter((r): r is string => Boolean(r));

/**
 * After a publish: removes from storage every file of a deleted book, and every cover / logo / PDF that was
 * replaced — the ones the old published site used that neither the new published site nor the draft does.
 * Then sweeps `ebooks/` for leftovers (e.g. a logo uploaded twice before publishing) older than a day.
 * Never throws: a storage hiccup must not undo a publish.
 */
export async function removeUnusedBookFiles(before: Workspace | null, published: Workspace, draft: Workspace): Promise<string[]> {
  const removed: string[] = [];
  try {
    const inUse = new Set([...bookRefs(published), ...bookRefs(draft)].map(refKey).filter((k): k is string => Boolean(k)));
    const gone = bookRefs(before).map(refKey).filter((k): k is string => Boolean(k) && !inUse.has(k as string));
    for (const key of new Set(gone)) {
      await deleteObject(key);
      removed.push(key);
    }
    for (const o of await listObjects("ebooks/")) {
      if (inUse.has(o.key) || removed.includes(o.key)) continue;
      if (Date.now() - Date.parse(o.at) < GRACE_MS) continue;
      await deleteObject(o.key);
      removed.push(o.key);
    }
  } catch (err) {
    console.error("[book files]", err);
  }
  return removed;
}
