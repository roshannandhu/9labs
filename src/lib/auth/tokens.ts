import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/** Cookie names. Both are httpOnly; the browser's JavaScript never sees them. */
export const SESSION_COOKIE = "nl_session";
export const OAUTH_COOKIE = "nl_oauth";

export const SESSION_HOURS = 12;

export function appSecret(): string {
  const s = process.env.PAYLOAD_SECRET;
  if (!s || s.length < 24) {
    if (process.env.NODE_ENV === "production") throw new Error("PAYLOAD_SECRET must be set (at least 24 characters).");
    return "dev-only-secret-change-me-0123456789";
  }
  return s;
}
const key = () => new TextEncoder().encode(appSecret());

/** Signed, expiring token (HS256). `aud` keeps a session token from being used as, say, a download token. */
export async function sign(claims: JWTPayload, aud: string, seconds: number) {
  return new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setAudience(aud).setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1000) + seconds).sign(key());
}
export async function verify<T extends JWTPayload>(token: string | undefined | null, aud: string): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { audience: aud, algorithms: ["HS256"] });
    return payload as T;
  } catch {
    return null;
  }
}

/** Keyed hash (used to sign download links and to store visitor limits without keeping addresses). */
export const hmac = (value: string) => createHmac("sha256", appSecret()).update(value).digest("hex");
export const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

export type CookieOpts = { maxAge: number; path?: string };
export function cookieOptions({ maxAge, path = "/" }: CookieOpts) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path, maxAge };
}
export function serializeCookie(name: string, value: string, o: CookieOpts) {
  const c = cookieOptions(o);
  return `${name}=${encodeURIComponent(value)}; Path=${c.path}; Max-Age=${c.maxAge}; HttpOnly; SameSite=Lax${c.secure ? "; Secure" : ""}`;
}

/** A short, human name for a device from its user-agent ("Chrome on Android"), for the sign-in log. */
export function deviceLabel(ua: string | null | undefined): string {
  const s = ua ?? "";
  const browser = /Edg\//.test(s) ? "Edge" : /OPR\//.test(s) ? "Opera" : /Firefox\//.test(s) ? "Firefox" : /Chrome\//.test(s) ? "Chrome" : /Safari\//.test(s) ? "Safari" : "Browser";
  const os = /iPhone/.test(s) ? "iPhone" : /iPad/.test(s) ? "iPad" : /Android/.test(s) ? "Android" : /Mac OS X/.test(s) ? "Mac" : /Windows/.test(s) ? "Windows" : /Linux/.test(s) ? "Linux" : "unknown device";
  return `${browser} on ${os}`;
}
