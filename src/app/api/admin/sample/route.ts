import { requireAdmin } from "@/server/auth";
import { loadSampleData } from "@/server/backup";
import { sampleSeedAllowed } from "@/server/env";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  await requireAdmin(req, ["owner"]);
  if (!sampleSeedAllowed()) throw new HttpError(403, "Sample data isn't enabled here.");
  await loadSampleData();
  return json({ ok: true });
});
