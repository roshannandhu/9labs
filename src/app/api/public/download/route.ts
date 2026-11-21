import { checkDownload, consumeDownload } from "@/server/ebooks";
import { clientIp, overLimit } from "@/server/guard";
import { HttpError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  if (await overLimit("download-check", clientIp(req), 60, 3600)) throw new HttpError(429, "Too many requests — please try again later.");
  const token = new URL(req.url).searchParams.get("t") ?? "";
  return json(await checkDownload(token));
});

/** Same-origin only (a form POST, not a link a scanner could follow) — a link preview can't use up a download. */
export const POST = route(async (req: Request) => {
  const origin = req.headers.get("origin");
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin) && new URL(origin!).origin === new URL(req.url).origin;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) throw new HttpError(403, "Not allowed.");

  const form = await req.formData();
  const token = String(form.get("t") ?? "");
  const used = await consumeDownload(token);
  if (!used.ok) return Response.redirect(new URL(`/download/?t=${encodeURIComponent(token)}`, req.url), 303);

  return new Response(used.file.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${used.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
});
