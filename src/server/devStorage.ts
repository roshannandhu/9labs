import "server-only";
import { env } from "./env";

/**
 * ponytail: a local-disk stand-in for R2 so uploads can be tested on this laptop before the owner
 * shares R2 credentials. Only ever reached when `r2Configured()` is false (see r2.ts) — once R2 is
 * set up (here and in Cloudflare), r2.ts stops calling this file at all. Files live in `uploads/`
 * (already gitignored, same as the old Payload-era local setup).
 */
const safeKey = (key: string): string => {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes("..")) throw new Error("Invalid file key.");
  return key;
};

export const presignPut = (key: string): string => `${env().SITE_URL}/api/dev/storage/${safeKey(key)}`;

export async function writeFile(key: string, body: ReadableStream | ArrayBuffer | null): Promise<void> {
  const { writeFile: fsWrite, mkdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const file = path.join(process.cwd(), "uploads", safeKey(key));
  await mkdir(path.dirname(file), { recursive: true });
  const buf = body instanceof ReadableStream ? await new Response(body).arrayBuffer() : (body ?? new ArrayBuffer(0));
  await fsWrite(file, Buffer.from(buf));
}

export async function getObject(key: string): Promise<Response> {
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const file = path.join(process.cwd(), "uploads", safeKey(key));
  try {
    const buf = await readFile(file);
    return new Response(new Uint8Array(buf), { status: 200, headers: { "Content-Length": String(buf.byteLength) } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
