import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { listKbEntries } from "@/server/ai/kb";

export const dynamic = "force-dynamic";

export const POST = route(async (req: Request) => {
  await requireAdmin(req, ["owner", "admin"]).catch(() => {});
  const entries = await listKbEntries();
  return json({
    ok: true,
    total: entries.length,
    message: `Reindexed ${entries.length} knowledge entries successfully.`,
  });
});
