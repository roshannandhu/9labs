import { z } from "zod";
import { addAiKey, checkAllKeys, listAiKeys } from "@/server/ai/keys";
import { requireAdmin } from "@/server/auth";
import { readForm } from "@/server/guard";
import { json, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** The AI key list (last 4 characters only). `?check=1` also tests every key live — each Groq key costs 1 request. */
export const GET = route(async (req: Request) => {
  await requireAdmin(req, ["owner", "admin"]);
  const list = await listAiKeys();
  const checks =
    new URL(req.url).searchParams.get("check") === "1"
      ? await checkAllKeys()
      : [];
  return json({ ...list, checks });
});

const addSchema = z.object({
  provider: z.enum(["groq", "gemini"]),
  key: z.string().trim().min(20).max(300),
  label: z.string().max(60).default(""),
});

/** Adds a key once the provider confirms it works. */
export const POST = route(async (req: Request) => {
  const session = await requireAdmin(req, ["owner", "admin"]);
  const body = await readForm(req, addSchema);
  return json({
    key: await addAiKey(body.provider, body.key, body.label, session.email),
  });
});
