import { requireAdmin } from "@/server/auth";
import { resetAll } from "@/server/backup";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  await requireAdmin(req, ["owner"]);
  await resetAll();
  return json({ ok: true });
});
