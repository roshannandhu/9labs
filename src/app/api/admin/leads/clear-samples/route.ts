import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { clearSampleLeads } from "@/server/leads";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  await requireAdmin(req, ["owner"]);
  await clearSampleLeads();
  return json({ ok: true });
});
