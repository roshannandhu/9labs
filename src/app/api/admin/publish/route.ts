import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { publishDraft } from "@/server/content";
import { retryPendingDeliveries } from "@/server/ebooks";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

const schema = z.object({ rev: z.number().int(), summary: z.array(z.string()).max(40) });

export const POST = route(async (req: Request) => {
  const session = await requireAdmin(req);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Please check the request and try again.");

  const { published } = await publishDraft(parsed.data.summary, parsed.data.rev, session.email);
  after(() => retryPendingDeliveries(8, true)); // a newly published PDF sends its waiting requests now
  return json({ published });
});
