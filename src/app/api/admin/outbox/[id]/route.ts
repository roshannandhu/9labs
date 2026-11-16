import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { findOutboxHtml } from "@/server/leads";

export const dynamic = "force-dynamic";

/** The drawer's "the e-mail they received" preview — html is left out of the list endpoints (it can be large). */
export const GET = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin(req, ["owner", "admin"]);
  const { id } = await params;
  return json({ html: await findOutboxHtml(id) });
});
