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

  after(async () => {
    await retryPendingDeliveries(8);
    await db().from("rate_hits").delete().lt("window_start", new Date(Date.now() - 2 * 86_400_000).toISOString());
    await db().from("ai_calls").delete().lt("at", new Date(Date.now() - 30 * 86_400_000).toISOString());
    if (isBackupSlot(new Date())) console.log("[backup]", await runDailyBackup().catch((err: unknown) => `failed: ${err instanceof Error ? err.message : String(err)}`));
    if (isArchiveSlot(new Date())) {
      const run = await runArchive().catch((err: unknown) => ({ skipped: err instanceof Error ? err.message : String(err) }));
      console.log("[archive]", JSON.stringify(run));
    }
  });

  return json({ started: true });
});
