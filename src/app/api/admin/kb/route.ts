import { requireAdmin } from "@/server/auth";
import { listKbEntries, seedEntries, upsertKbEntries } from "@/server/ai/kb";
import { kbInput } from "@/server/ai/types";
import { getPublished } from "@/server/content";
import { readForm } from "@/server/guard";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** The knowledge base; an empty one is seeded once from the published services. */
export const GET = route(async (req: Request) => {
  const session = await requireAdmin(req);
  let entries = await listKbEntries();
  if (!entries.length) entries = await upsertKbEntries(seedEntries((await getPublished()).site), session.email);
  return json({ entries });
});

export const POST = route(async (req: Request) => {
  const session = await requireAdmin(req);
  const body = await readForm(req, kbInput);
  const [entry] = await upsertKbEntries([body], session.email);
  return json({ entry });
});
