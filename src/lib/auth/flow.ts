import type { Payload } from "payload";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_HOURS, cookieOptions, deviceLabel } from "./tokens";
import { issueSession } from "./strategy";

type AdminUser = { id: number | string; email: string; name?: string | null; active?: boolean | null; sessionVersion?: number | null };

/** The admin's own address (https://admin.example.com), from the setting or the request. */
export function adminOrigin(req: Request): string {
  if (process.env.NEXT_PUBLIC_ADMIN_URL) return process.env.NEXT_PUBLIC_ADMIN_URL.replace(/\/$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? new URL(req.url).host;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
export const redirectTo = (req: Request, path: string) => NextResponse.redirect(new URL(path, adminOrigin(req)), 303);

/**
 * The visitor's network address, for the sign-in log and the forms' per-visitor limits.
 * A proxy in front of the app appends the address it saw to X-Forwarded-For, so the entry to
 * trust is counted from the right: 1 = one proxy (the usual case), 2 = a CDN in front of the
 * host's own proxy, and so on (TRUSTED_PROXY_HOPS). Entries further left can be made up by the
 * visitor and are ignored.
 */
export function clientIp(req: Request): string {
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS) || 1);
  const chain = (req.headers.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return chain[chain.length - hops] ?? chain[0] ?? req.headers.get("x-real-ip") ?? "";
}

type LoginResult = "ok" | "denied" | "google-error";

export async function logEvent(payload: Payload, req: Request, email: string, result: LoginResult) {
  try {
    await payload.create({
      collection: "login-events",
      overrideAccess: true,
      data: { email, result, device: deviceLabel(req.headers.get("user-agent")), ip: clientIp(req) },
    });
  } catch (err) {
    payload.logger.error({ err }, "Could not write the sign-in log");
  }
}

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** The admin for a Google e-mail, if it is allowed in: listed and active (or one of the first owners). */
export async function findAdmin(payload: Payload, rawEmail: string, name?: string): Promise<AdminUser | null> {
  const email = rawEmail.trim().toLowerCase();
  const found = await payload.find({ collection: "users", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true });
  let user = found.docs[0] as AdminUser | undefined;
  if (!user && adminEmails().includes(email)) {
    user = (await payload.create({ collection: "users", data: { email, name, role: "owner", active: true }, overrideAccess: true })) as AdminUser;
  }
  if (!user || user.active === false) return null;
  return user;
}

/**
 * Called once Google (or, in development, the dev sign-in) has told us who this is.
 * A listed, active admin gets a session; anyone else is turned away. Every attempt is logged.
 */
export async function afterIdentity(payload: Payload, req: Request, email: string, name?: string) {
  const user = await findAdmin(payload, email, name);
  if (!user) {
    await logEvent(payload, req, email, "denied");
    return redirectTo(req, "/admin/login?error=denied");
  }
  await payload.update({
    collection: "users",
    id: user.id,
    data: { lastLoginAt: new Date().toISOString(), ...(name && !user.name ? { name } : {}) },
    overrideAccess: true,
  });
  await logEvent(payload, req, user.email, "ok");
  const res = redirectTo(req, "/admin");
  res.cookies.set(SESSION_COOKIE, await issueSession(user), cookieOptions({ maxAge: SESSION_HOURS * 3600 }));
  return res;
}

/** Dev sign-in exists only on a developer's machine, while no Google keys are configured. */
export const devLoginAllowed = () => process.env.NODE_ENV !== "production" && !process.env.GOOGLE_CLIENT_ID;
export const googleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/**
 * Demo sign-in: for a live demo server that has no Google keys yet. Switched on only by
 * DEMO_MODE=1 with a DEMO_ADMIN_KEY of at least 16 characters, and never while Google keys are set.
 * It signs in as the first ADMIN_EMAILS owner, after the shared key is checked.
 */
export const demoKey = () => (process.env.DEMO_ADMIN_KEY ?? "").trim();
export const demoLoginAllowed = () => process.env.DEMO_MODE === "1" && !googleConfigured() && demoKey().length >= 16;
export const isDemo = () => process.env.DEMO_MODE === "1";
