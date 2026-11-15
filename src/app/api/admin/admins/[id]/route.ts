import { z } from "zod";
import { deleteAdmin, updateAdmin } from "@/server/admins";
import { requireAdmin } from "@/server/auth";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

const schema = z.object({ role: z.enum(["owner", "admin", "editor"]).optional(), active: z.boolean().optional() });

export const PATCH = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAdmin(req, ["owner"]);
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Please check the request and try again.");
  return json({ admin: await updateAdmin(id, session.id, parsed.data) });
});

export const DELETE = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAdmin(req, ["owner"]);
  const { id } = await params;
  await deleteAdmin(id, session.id);
  return json({ ok: true });
});
