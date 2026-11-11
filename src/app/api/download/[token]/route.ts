import fs from "fs";
import { Readable } from "stream";
import { getPayload } from "payload";
import config from "@payload-config";
import { checkLink } from "@/lib/ebooks/send";

/**
 * The file behind a personal download link. Nothing here trusts the address: the token is
 * verified, the request must be the lead's current, unexpired link with downloads left, and the
 * PDF is read from the private folder by its stored name — its real location is never exposed.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await getPayload({ config });
  const link = await checkLink(payload, token);
  if (!link.ok) return Response.redirect(new URL(`/download/${encodeURIComponent(token)}`, req.url), 303);

  const { lead, book, file } = link;
  await payload.update({ collection: "leads", id: lead.id, data: { downloads: (lead.downloads ?? 0) + 1, linkDownloads: (lead.linkDownloads ?? 0) + 1 }, overrideAccess: true });
  await payload.update({ collection: "ebooks", id: book.id, data: { downloads: (book.downloads ?? 0) + 1 }, overrideAccess: true });

  const { size } = fs.statSync(file);
  const name = `${(book.slug || "e-book").replace(/[^a-z0-9-]/gi, "")}.pdf`;
  return new Response(Readable.toWeb(fs.createReadStream(file)) as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
