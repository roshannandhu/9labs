import { after } from "next/server";
import { isArchiveSlot } from "@/lib/archive";
import { runArchive } from "@/server/archive";
import { isBackupSlot, runDailyBackup } from "@/server/dailyBackup";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { retryPendingDeliveries } from "@/server/ebooks";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  if (req.headers.get("authorization") !== `Bearer ${env().CRON_SECRET}`) throw new HttpError(401, "Not authorized.");

  const at = new Date(); // decide the slots once, at the tick — not after the slower jobs have run
  // each job on its own: one failing (DB or R2 hiccup) must not skip the others, least of all the nightly backup
  const job = async (name: string, fn: () => Promise<unknown>) => {
    try {
      const out = await fn();
      if (out !== undefined) console.log(`[${name}]`, typeof out === "string" ? out : JSON.stringify(out));
    } catch (err) {
      console.error(`[${name}] failed:`, err instanceof Error ? err.message : err);
    }
  };
  after(async () => {
    await job("ebooks", () => retryPendingDeliveries(8));
    await job("prune", async () => {
      await db().from("rate_hits").delete().lt("window_start", new Date(Date.now() - 2 * 86_400_000).toISOString());
      await db().from("ai_calls").delete().lt("at", new Date(Date.now() - 30 * 86_400_000).toISOString());
    });
    if (isBackupSlot(at)) await job("backup", runDailyBackup);
    if (isArchiveSlot(at)) await job("archive", runArchive);
  });

  return json({ started: true });
});
