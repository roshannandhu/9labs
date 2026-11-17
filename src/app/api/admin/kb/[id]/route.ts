import { requireAdmin } from "@/server/auth";
import { deleteKbEntry, upsertKbEntries } from "@/server/ai/kb";
import { kbInput } from "@/server/ai/types";
import { readForm } from "@/server/guard";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route(async (req: Request, ctx: Ctx) => {
  const session = await requireAdmin(req);
  const { id } = await ctx.params;
  const body = await readForm(req, kbInput);
  const [entry] = await upsertKbEntries([{ ...body, id }], session.email);
  return json({ entry });
});

export const DELETE = route(async (req: Request, ctx: Ctx) => {
  await requireAdmin(req, ["owner", "admin"]);
  const { id } = await ctx.params;
  await deleteKbEntry(id);
  return json({ ok: true });
});
