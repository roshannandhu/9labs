"use client";
import { supabase } from "./supabase";

export class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;
  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Every call carries the signed-in admin's bearer token; a trailing slash avoids an extra redirect round-trip (next.config.ts's trailingSlash). */
export async function api<T>(path: string, opts: { method?: string; json?: unknown; body?: BodyInit } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;

  let body = opts.body;
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }

  // routes end in "/" (trailingSlash) — before any "?query", not after it
  const [p, q] = path.split("?");
  const url = `${basePath}${p}${p.endsWith("/") ? "" : "/"}${q !== undefined ? `?${q}` : ""}`;
  const res = await fetch(url, { method: opts.method ?? (opts.json !== undefined ? "POST" : "GET"), headers, body });
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : undefined;
  if (!res.ok) throw new ApiError(res.status, (parsed?.error as string | undefined) ?? "Something went wrong.", parsed);
  return parsed as T;
}
