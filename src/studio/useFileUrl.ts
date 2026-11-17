"use client";

import { mediaUrl } from "@/lib/fileRefs";

/** Files uploaded in this tab, by ref: shown from the admin's own copy (a blob: URL), so a fresh upload
 *  appears at once instead of going blank while `/media/...` is fetched back from storage. */
const local = new Map<string, string>();
export const rememberUpload = (ref: string, file: Blob) => void local.set(ref, URL.createObjectURL(file));

/**
 * A content field's value, resolved to something an `<img>` can use: a fresh upload's local copy, a
 * stored-file ref's `/media/...` URL, or a plain URL as-is.
 */
export function useFileUrl(ref: string | undefined): { url: string | undefined; loading: boolean } {
  return { url: (ref && local.get(ref)) || mediaUrl(ref) || ref, loading: false };
}
