import { createHmac, timingSafeEqual } from "node:crypto";

const sign = (data: string, secret: string): string => createHmac("sha256", secret).update(data).digest("base64url");

/** `base64url(JSON)` + "." + `base64url(HMAC-SHA256)`. The payload must carry `exp` (seconds). */
export function signToken(payload: Record<string, unknown>, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

/** `allowExpired`: verify the signature but skip the expiry check — for callers that need to tell "expired" apart from "invalid". */
export function verifyToken<T extends { exp: number }>(token: string, secret: string, options?: { allowExpired?: boolean }): T | null {
  const i = token.indexOf(".");
  if (i < 0) return null;
  const body = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1));
  const expected = Buffer.from(sign(body, secret));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;

  let payload: T;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number") return null;
  if (!options?.allowExpired && payload.exp < Date.now() / 1000) return null;
  return payload;
}

/** A keyed hash (used to hash visitor IPs for rate limiting) — the input is never recoverable from it. */
export const keyedHash = (value: string, secret: string): string => createHmac("sha256", secret).update(value).digest("hex");
