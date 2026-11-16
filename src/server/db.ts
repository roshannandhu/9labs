import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | undefined;

/** One Supabase client per Worker instance, using the secret key — full access, server only. */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env().SUPABASE_URL, env().SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
