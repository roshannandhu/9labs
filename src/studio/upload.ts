"use client";
import { api } from "./api";

/** Moved from the old src/lib/files.ts — still runs entirely in the browser, it just no longer stores locally. */
export async function resizeImage(file: File, maxSide = 1400, quality = 0.86): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return blob ?? file;
}

export type UploadKind = "image" | "pdf";

/** Gets a signed URL from the server, PUTs the file straight to it, and returns the saved ref. */
export async function uploadFile(blob: Blob, name: string, kind: UploadKind): Promise<string> {
  const { url, ref } = await api<{ url: string; ref: string }>("/api/admin/uploads", { json: { kind, name, size: blob.size, type: blob.type } });
  const put = await fetch(url, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob });
  if (!put.ok) throw new Error("The upload failed. Try again.");
  return ref;
}
