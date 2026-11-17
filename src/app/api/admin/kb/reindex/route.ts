import { requireAdmin } from "@/server/auth";
import { reindexKb } from "@/server/ai/kb";
import { aiConfigured } from "@/server/env";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Re-embeds every entry — needs the Gemini key (embeddings come from Gemini). */
export const POST = route(async (req: Request) => {
  await requireAdmin(req, ["owner", "admin"]);
  if (!aiConfigured().gemini) throw new HttpError(422, "Set GEMINI_API_KEY first — embeddings come from Gemini.");
  return json(await reindexKb());
});
