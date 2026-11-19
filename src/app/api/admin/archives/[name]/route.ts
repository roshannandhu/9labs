import { readArchive } from "@/server/archive";
import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** One archive file's contents, for the admin's read-only viewer and its Download button. */
export const GET = route(async (req: Request, { params }: { params: Promise<{ name: string }> }) => {
  await requireAdmin(req, ["owner"]);
  const { name } = await params;
  return json(await readArchive(decodeURIComponent(name)));
});
