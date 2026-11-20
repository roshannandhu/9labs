import { getObject } from "@/server/r2";

export const dynamic = "force-dynamic";

const ALLOWED = /^(images\/[a-z0-9-]+|ebooks\/[a-z0-9-]+\/(?:cover|logo)-[a-z0-9]+)\.(png|jpe?g|webp|gif|avif|svg)$/i;
const CONTENT_TYPE: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif", svg: "image/svg+xml" };

/** Only images are ever served this way — a PDF only ever goes out via a signed download link. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.join("/");
  if (!ALLOWED.test(key)) return new Response(null, { status: 404 });

  const res = await getObject(key);
  if (res.status !== 200 || !res.body) return new Response(null, { status: 404 });

  const ext = key.split(".").pop()!.toLowerCase();
  const headers: Record<string, string> = {
    "Content-Type": CONTENT_TYPE[ext] ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  if (ext === "svg") headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

  return new Response(res.body, { status: 200, headers });
}
