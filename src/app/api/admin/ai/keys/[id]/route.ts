import { z } from "zod";
import { checkOneKey, removeAiKey, updateAiKey } from "@/server/ai/keys";
import { requireAdmin } from "@/server/auth";
import { readForm } from "@/server/guard";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const idOk = (id: string) => /^[\w-]{1,80}$/.test(id);

/** Tests one key live (a Groq key costs 1 request). */
export const GET = route(async (req: Request, ctx: Ctx) => {
  await requireAdmin(req, ["owner", "admin"]);
  const { id } = await ctx.params;
  return json(
    idOk(id) ? { check: await checkOneKey(id) } : { check: null },
    idOk(id) ? 200 : 404,
  );
});

const patchSchema = z.object({
  label: z.string().max(60).optional(),
  enabled: z.boolean().optional(),
});

/** Rename, or switch on/off (works for Worker-secret keys too). */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  await requireAdmin(req, ["owner", "admin"]);
  const { id } = await ctx.params;
  await updateAiKey(id, await readForm(req, patchSchema));
  return json({ ok: true });
});

/** Removes a key added in the admin. */
export const DELETE = route(async (req: Request, ctx: Ctx) => {
  await requireAdmin(req, ["owner", "admin"]);
  const { id } = await ctx.params;
  await removeAiKey(id);
  return json({ ok: true });
});
