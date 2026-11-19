import { requireAdmin } from "@/server/auth";
import { reindexKb } from "@/server/ai/kb";
import { aiReady } from "@/server/ai/keys";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Re-embeds every entry — needs the Gemini key (embeddings come from Gemini). */
export const POST = route(async (req: Request) => {
  await requireAdmin(req, ["owner", "admin"]);
  if (!(await aiReady()).gemini) throw new HttpError(422, "Add a Gemini key first (Quiz → Insights → AI keys) — embeddings come from Gemini.");
  return json(await reindexKb());
});
