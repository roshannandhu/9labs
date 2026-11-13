"use client";

/**
 * Uploaded files (book PDFs, cover images, logo/favicon) live in IndexedDB — localStorage is
 * text-only and far too small for binaries. Each file is one row keyed by a random id; the rest
 * of the app only ever stores that id (e.g. `Ebook.pdfFileId`).
 */
const DB_NAME = "nl-studio-files";
const STORE = "files";

export type StoredFile = { id: string; name: string; type: string; size: number; blob: Blob; createdAt: string };

let dbPromise: Promise<IDBDatabase> | null = null;
function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const newId = () => `f_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export async function saveFile(blob: Blob, name: string): Promise<string> {
  const id = newId();
  const record: StoredFile = { id, name, type: blob.type, size: blob.size, blob, createdAt: new Date().toISOString() };
  await tx("readwrite", (s) => s.put(record));
  return id;
}

/** Restores a file at its original id (a backup import) — so `idb:<id>` references already in the restored content keep working. */
export async function putFile(record: StoredFile): Promise<void> {
  await tx("readwrite", (s) => s.put(record));
}

export async function getFile(id: string): Promise<StoredFile | undefined> {
  return tx("readonly", (s) => s.get(id));
}

export async function deleteFile(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export async function listFiles(): Promise<StoredFile[]> {
  return tx("readonly", (s) => s.getAll());
}

/** Shrinks an image to fit `maxSide` and re-encodes as JPEG, so a phone photo doesn't bloat storage. */
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

const urlCache = new Map<string, string>();

/** A cached object URL for a stored file; the same id always returns the same URL (revoked only on `clearFileUrlCache`). */
export async function fileUrl(id: string): Promise<string | undefined> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const rec = await getFile(id);
  if (!rec) return undefined;
  const url = URL.createObjectURL(rec.blob);
  urlCache.set(id, url);
  return url;
}

export function clearFileUrlCache() {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}

export async function clearAllFiles(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).clear();
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  clearFileUrlCache();
}
