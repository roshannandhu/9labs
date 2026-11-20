import { z } from "zod";
import { makeRef } from "@/lib/fileRefs";
import { requireAdmin } from "@/server/auth";
import { HttpError, json, route } from "@/server/http";
import { presignPut } from "@/server/r2";

export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["image", "pdf"]),
  name: z.string().min(1).max(200),
  size: z.number().int().positive(),
  type: z.string().min(1).max(100),
  /** A book's files go in their own folder: ebooks/<book>/<role>-<id>.<ext>. */
  book: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
  role: z.enum(["cover", "logo", "pdf"]).optional(),
});

const IMAGE_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "image/svg+xml": "svg" };
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_PDF = 50 * 1024 * 1024;

/** Any signed-in team member may request an upload URL — role limits on what the upload is used for are enforced where it's saved (the draft), not here. */
export const POST = route(async (req: Request) => {
  await requireAdmin(req);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(422, "Please check the request and try again.");
  const body = parsed.data;

  const folder = body.book && body.role && (body.role === "pdf") === (body.kind === "pdf") ? `ebooks/${body.book}/${body.role}-${crypto.randomUUID().slice(0, 8)}` : undefined;
  let key: string;
  if (body.kind === "image") {
    const ext = IMAGE_EXT[body.type];
    if (!ext) throw new HttpError(422, "That image format isn't supported.");
    if (body.size > MAX_IMAGE) throw new HttpError(413, "That image is too large (8 MB max).");
    key = `${folder ?? `images/${crypto.randomUUID()}`}.${ext}`;
  } else {
    if (body.type !== "application/pdf") throw new HttpError(422, "That isn't a PDF.");
    if (body.size > MAX_PDF) throw new HttpError(413, "That PDF is too large (50 MB max).");
    key = `${folder ?? `pdfs/${crypto.randomUUID()}`}.pdf`;
  }

  return json({ url: await presignPut(key), ref: makeRef(key) });
});
