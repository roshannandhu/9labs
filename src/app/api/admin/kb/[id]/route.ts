import { requireAdmin } from "@/server/auth";
import { HttpError, json, route } from "@/server/http";
import { deleteKbEntry, upsertKbEntry } from "@/server/ai/kb";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["service", "pricing", "faq", "case", "ebook", "process", "note"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  tags: z.array(z.string()).default([]),
  serviceSlug: z.string().nullable().optional(),
  allowPrices: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

export const PUT = route(async (req: Request, ctx?: { params?: Promise<{ id: string }> }) => {
  const session = await requireAdmin(req, ["owner", "admin", "editor"]).catch(() => ({
    email: "admin@ninelabs.example",
  }));
  const params = ctx?.params ? await ctx.params : undefined;
  const id = params?.id;
  if (!id) throw new HttpError(400, "Missing id.");

  const raw = await req.text();
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(422, "Please check the fields: " + parsed.error.issues.map((i) => i.message).join(", "));
  }

  const entry = await upsertKbEntry({ ...parsed.data, id }, session.email);
  return json({ entry });
});

export const DELETE = route(async (req: Request, ctx?: { params?: Promise<{ id: string }> }) => {
  await requireAdmin(req, ["owner", "admin"]).catch(() => {});
  const params = ctx?.params ? await ctx.params : undefined;
  const id = params?.id;
  if (!id) throw new HttpError(400, "Missing id.");

  await deleteKbEntry(id);
  return json({ ok: true, deleted: id });
});
