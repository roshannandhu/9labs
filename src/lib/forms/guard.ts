import type { Payload } from "payload";
import type { ZodType } from "zod";
import { hmac } from "../auth/tokens";
import { clientIp } from "../auth/flow";
import { sameOrigin } from "../auth/origin";

/** Shared protection for the public forms (e-book request, quiz, enquiry). */

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const MAX_BODY = 24_000; // bytes: far more than any of the forms needs

/**
 * Read and check a form post: it must come from our own pages, be small, be JSON, and match the
 * form's schema. Returns the clean data, or the error response to send back.
 */
export async function readForm<T>(req: Request, schema: ZodType<T>): Promise<{ data: T; error?: undefined } | { data?: undefined; error: Response }> {
  if (!sameOrigin(req)) return { error: json({ error: "Not allowed." }, 403) };
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { error: json({ error: "Could not read the request." }, 400) };
  }
  if (raw.length > MAX_BODY) return { error: json({ error: "Too much data." }, 413) };
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { error: json({ error: "Could not read the request." }, 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { error: json({ error: "Please check the form and try again." }, 422) };
  return { data: parsed.data };
}

/**
 * Per-visitor limit, counted in the database (so it also works when the app runs as several
 * instances). The visitor is identified by a keyed hash of their network address — the address
 * itself is never stored. Returns true when this request is over the limit.
 */
export async function overLimit(payload: Payload, req: Request, name: string, max: number, windowSeconds: number): Promise<boolean> {
  const who = clientIp(req) || "unknown";
  const key = `${name}:${hmac(`ip:${who}`).slice(0, 32)}`;
  const now = Date.now();
  const since = new Date(now - windowSeconds * 1000).toISOString();
  try {
    const found = await payload.find({
      collection: "rate-hits",
      where: { and: [{ key: { equals: key } }, { windowStart: { greater_than: since } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const hit = found.docs[0];
    if (!hit) {
      await payload.create({ collection: "rate-hits", data: { key, windowStart: new Date(now).toISOString(), count: 1 }, overrideAccess: true });
      // now and then, clear counters nobody needs any more
      if (Math.random() < 0.03) {
        await payload.delete({ collection: "rate-hits", where: { windowStart: { less_than: new Date(now - 86_400_000).toISOString() } }, overrideAccess: true });
      }
      return false;
    }
    const count = (hit.count ?? 0) + 1;
    await payload.update({ collection: "rate-hits", id: hit.id, data: { count }, overrideAccess: true });
    return count > max;
  } catch (err) {
    // a counting problem must never take the forms down
    payload.logger.error({ err }, "Rate limit check failed");
    return false;
  }
}

/** Looks like a robot: it filled the hidden field, or sent the form faster than a person can type. */
export const looksAutomated = (trap: string | undefined, elapsedMs: number | undefined, minMs = 1500) => Boolean(trap && trap.trim()) || (typeof elapsedMs === "number" && elapsedMs > 0 && elapsedMs < minMs);

/** One CSV cell: quoted, and never starting with a character a spreadsheet would run as a formula. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join("; ") : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
export const csv = (header: string[], rows: unknown[][]) => [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
export const csvResponse = (name: string, body: string) =>
  new Response(`﻿${body}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
