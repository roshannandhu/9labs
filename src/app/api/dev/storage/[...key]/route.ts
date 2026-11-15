import { r2Configured } from "@/server/env";
import { writeFile } from "@/server/devStorage";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** The PUT target `presignPut` hands out while R2 isn't configured — see devStorage.ts. */
export const PUT = route(async (req: Request, { params }: { params: Promise<{ key: string[] }> }) => {
  if (r2Configured()) throw new HttpError(404, "Not found.");
  const { key } = await params;
  await writeFile(key.join("/"), req.body);
  return json({ ok: true });
});
