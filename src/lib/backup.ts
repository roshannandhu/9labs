"use client";

import { clearAllFiles, listFiles, putFile, type StoredFile } from "./files";
import { getState, replaceState, type StoreState } from "./store";

const BACKUP_VERSION = 1;
type Backup = { version: number; exportedAt: string; state: StoreState; files: (Omit<StoredFile, "blob"> & { data: string })[] };

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Everything: the whole store plus every uploaded file, as one downloadable JSON file. */
export async function exportBackup(): Promise<void> {
  const files = await listFiles();
  const backup: Backup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state: getState(),
    files: await Promise.all(files.map(async ({ blob, ...rest }) => ({ ...rest, data: await blobToBase64(blob) }))),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `nine-labs-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  let backup: Backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    return { ok: false, error: "That file isn't a valid backup." };
  }
  if (!backup.state || !Array.isArray(backup.files)) return { ok: false, error: "That file isn't a valid backup." };

  await clearAllFiles();
  for (const f of backup.files) await putFile({ ...f, blob: base64ToBlob(f.data, f.type) });
  replaceState(backup.state);
  return { ok: true };
}
