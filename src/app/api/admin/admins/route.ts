import { z } from "zod";
import { createAdmin } from "@/server/admins";
import { requireAdmin } from "@/server/auth";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email().max(254), name: z.string().min(1).max(100), role: z.enum(["owner", "admin", "editor"]) });

export const POST = route(async (req: Request) => {
  await requireAdmin(req, ["owner"]);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Please check the request and try again.");
  return json({ admin: await createAdmin(parsed.data.email, parsed.data.name, parsed.data.role) });
});
