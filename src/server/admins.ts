import "server-only";
import type { AdminRole } from "@/content/types";
import { db } from "./db";
import { HttpError } from "./http";

export type Admin = { id: string; email: string; name: string; role: AdminRole; active: boolean; lastLoginAt: string | null };
type AdminRow = { id: string; email: string; name: string; role: AdminRole; active: boolean; last_login_at: string | null };

const fromRow = (r: AdminRow): Admin => ({ id: r.id, email: r.email, name: r.name, role: r.role, active: r.active, lastLoginAt: r.last_login_at });

export async function listAdmins(): Promise<Admin[]> {
  const { data, error } = await db().from("admins").select("id, email, name, role, active, last_login_at").order("created_at", { ascending: true });
  if (error) throw error;
  return (data as AdminRow[]).map(fromRow);
}

export async function touchLastLogin(id: string): Promise<void> {
  await db().from("admins").update({ last_login_at: new Date().toISOString() }).eq("id", id);
}

export async function createAdmin(email: string, name: string, role: AdminRole): Promise<Admin> {
  const { data, error } = await db().from("admins").insert({ email: email.toLowerCase(), name, role, active: true }).select("id, email, name, role, active, last_login_at").single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "That e-mail is already on the team.");
    throw error;
  }
  return fromRow(data as AdminRow);
}

async function activeOwnersExcept(id: string): Promise<number> {
  const { count, error } = await db().from("admins").select("id", { count: "exact", head: true }).eq("role", "owner").eq("active", true).neq("id", id);
  if (error) throw error;
  return count ?? 0;
}

export async function updateAdmin(id: string, selfId: string, patch: Partial<{ role: AdminRole; active: boolean }>): Promise<Admin> {
  if (id === selfId) throw new HttpError(403, "You can't change your own access.");

  const { data: existing, error: readErr } = await db().from("admins").select("role, active").eq("id", id).single();
  if (readErr) throw readErr;

  const staysActiveOwner = (patch.role ?? existing.role) === "owner" && (patch.active ?? existing.active);
  if (!staysActiveOwner && (await activeOwnersExcept(id)) === 0) throw new HttpError(409, "There has to be at least one active owner.");

  const { data, error } = await db().from("admins").update(patch).eq("id", id).select("id, email, name, role, active, last_login_at").single();
  if (error) throw error;
  return fromRow(data as AdminRow);
}

export async function deleteAdmin(id: string, selfId: string): Promise<void> {
  if (id === selfId) throw new HttpError(403, "You can't remove your own access.");
  if ((await activeOwnersExcept(id)) === 0) throw new HttpError(409, "There has to be at least one active owner.");
  const { error } = await db().from("admins").delete().eq("id", id);
  if (error) throw error;
}
