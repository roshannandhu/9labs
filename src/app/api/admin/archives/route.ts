import { listArchives, runArchive } from "@/server/archive";
import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** The archive files in R2, newest range first. Owner only — they hold visitors' personal details. */
export const GET = route(async (req: Request) => {
  await requireAdmin(req, ["owner"]);
  return json({ archives: await listArchives() });
});

/** "Archive now": the same job the nightly cron runs, with the same safety checks. */
export const POST = route(async (req: Request) => {
  await requireAdmin(req, ["owner"]);
  return json(await runArchive({ force: true }));
});
