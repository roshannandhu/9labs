import "server-only";
import type { AdminRole } from "@/content/types";
import { adminEmails } from "./env";
import { db } from "./db";
import { HttpError } from "./http";

export type AdminSession = { id: string; email: string; name: string; role: AdminRole };

type AdminRow = { id: string; email: string; name: string; role: AdminRole; active: boolean };

/**
 * `getClaims` verifies the token itself when the project signs with an asymmetric key; for this
 * project's legacy shared secret it falls back to a real call to Supabase's Auth server
 * (`getUser`) automatically — either way the email coming back here is already verified.
 */
export async function requireAdmin(req: Request, roles?: AdminRole[]): Promise<AdminSession> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw new HttpError(401, "Sign in to continue.");

  const { data, error } = await db().auth.getClaims(token);
  const email = typeof data?.claims.email === "string" ? data.claims.email.toLowerCase() : undefined;
  if (error || !email) throw new HttpError(401, "Your session has expired — sign in again.");

  let admin = await findAdminByEmail(email);

  if (!admin) {
    const { count } = await db().from("admins").select("id", { count: "exact", head: true });
    if ((count ?? 0) === 0 && adminEmails().includes(email)) {
      const { data: created, error: createErr } = await db()
        .from("admins")
        .insert({ email, name: email.split("@")[0], role: "owner", active: true, last_login_at: new Date().toISOString() })
        .select()
        .single();
      if (createErr) throw createErr;
      admin = created as AdminRow;
    }
  }

  if (!admin) throw new HttpError(403, "This e-mail isn't on the team. Ask the owner to add you in Settings → Team.");
  if (!admin.active) throw new HttpError(403, "Your access has been turned off. Ask the owner.");
  if (roles && !roles.includes(admin.role)) throw new HttpError(403, "You don't have access to this.");

  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

export async function findAdminByEmail(email: string): Promise<AdminRow | null> {
  const { data, error } = await db().from("admins").select("id, email, name, role, active").ilike("email", email).maybeSingle();
  if (error) throw error;
  return data as AdminRow | null;
}
