import { aiHealth } from "@/server/ai/run";
import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  await requireAdmin(req);
  return json(await aiHealth());
});
