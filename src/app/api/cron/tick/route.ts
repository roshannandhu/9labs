import { after } from "next/server";
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
  });

  return json({ started: true });
});
