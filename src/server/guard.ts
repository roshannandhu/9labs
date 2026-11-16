import "server-only";
import type { ZodType } from "zod";
import { keyedHash } from "@/lib/tokens";
import { db } from "./db";
import { env } from "./env";
import { HttpError } from "./http";

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

/** Same-origin, a size cap, and the shape a form is supposed to have — rejects by throwing. */
export async function readForm<T>(req: Request, schema: ZodType<T>, maxBytes = 24_000): Promise<T> {
  if (!sameOrigin(req)) throw new HttpError(403, "Not allowed.");

  const raw = await req.text();
  if (raw.length > maxBytes) throw new HttpError(413, "Too much data.");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Could not read the request.");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError(422, "Please check the form and try again.");
  return parsed.data;
}

export function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/** A fixed-window counter per key, counted in the database so it works across Worker instances. */
export async function overLimit(name: string, who: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const key = `${name}:${keyedHash(who, env().APP_SECRET)}`;
    const { data, error } = await db().rpc("rate_hit", { p_key: key, p_window_seconds: windowSeconds });
    if (error) return false;
    return (data as number) > max;
  } catch {
    return false; // a counting problem must never take a form down
  }
}

/** Looks like a robot: it filled the hidden field, or sent the form faster than a person can type. */
export const looksAutomated = (trap: string | undefined, elapsedMs: number | undefined, minMs = 1500): boolean => Boolean(trap?.trim()) || (typeof elapsedMs === "number" && elapsedMs > 0 && elapsedMs < minMs);
