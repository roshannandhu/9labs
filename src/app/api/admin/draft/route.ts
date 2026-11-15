import type { Workspace } from "@/content/types";
import { requireAdmin } from "@/server/auth";
import { saveDraft } from "@/server/content";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

export const PUT = route(async (req: Request) => {
  const session = await requireAdmin(req);

  const raw = await req.text();
  if (raw.length > MAX_BYTES) throw new HttpError(413, "Too much data.");
  let body: { draft?: unknown; rev?: number };
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Could not read the request.");
  }
  if (typeof body.rev !== "number" || !body.draft || typeof body.draft !== "object") throw new HttpError(422, "Please check the request and try again.");

  const { rev } = await saveDraft(body.draft as Workspace, body.rev, session.role, session.email);
  return json({ rev });
});
