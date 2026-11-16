import { requireAdmin } from "@/server/auth";
import { HttpError, json, route } from "@/server/http";
import { deleteLead } from "@/server/leads";

export const dynamic = "force-dynamic";

export const DELETE = route(async (req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) => {
  await requireAdmin(req, ["owner", "admin"]);
  const { kind, id } = await params;
  if (kind !== "enquiry" && kind !== "book" && kind !== "quiz") throw new HttpError(404, "Not found.");
  await deleteLead(kind, id);
  return json({ ok: true });
});
