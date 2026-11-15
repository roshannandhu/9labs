import { requireAdmin } from "@/server/auth";
import { restoreBackup } from "@/server/backup";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

export const POST = route(async (req: Request) => {
  await requireAdmin(req, ["owner"]);
  const raw = await req.text();
  if (raw.length > MAX_BYTES) throw new HttpError(413, "That file is too large.");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "That doesn't look like a valid backup file.");
  }
  await restoreBackup(body);
  return json({ ok: true });
});
