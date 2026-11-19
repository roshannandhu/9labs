import "server-only";
import { exportBackup } from "./backup";
import { r2Configured } from "./env";
import { deleteObject, listObjects, putObject } from "./r2";

const PREFIX = "backups/";
const KEEP_DAYS = 30;

export const isBackupSlot = (now: Date) => now.getUTCHours() === 1 && now.getUTCMinutes() < 15;

/** Nightly copy of the content + leads (same file as Settings → Download a backup) into R2. Keeps 30 days, plus the 1st of every month. */
export async function runDailyBackup(): Promise<string> {
  if (!r2Configured()) return "R2 isn't set up, skipped.";
  const now = new Date();
  const key = `${PREFIX}nine-labs-backup-${now.toISOString().slice(0, 10)}.json`;
  await putObject(key, JSON.stringify(await exportBackup()), "application/json");

  const cutoff = now.getTime() - KEEP_DAYS * 86_400_000;
  for (const o of await listObjects(PREFIX)) {
    const day = o.key.match(/(\d{4}-\d{2}-\d{2})\.json$/)?.[1];
    if (day && !day.endsWith("-01") && Date.parse(day) < cutoff) await deleteObject(o.key);
  }
  return key;
}
