import "server-only";
import { db } from "../db";
import { env, geminiKeys, groqKeys } from "../env";
import { HttpError } from "../http";
import { fingerprint, seal, unseal } from "./seal";

/**
 * AI provider keys: the Worker secrets (GROQ_API_KEY / GEMINI_API_KEY, comma-separated) plus keys
 * added in the admin (table ai_keys, migration 0005, encrypted with a key derived from APP_SECRET).
 * The admin sees only the last 4 characters. Secret keys can be renamed, tested and switched off
 * here, not removed — they live in Cloudflare. Every AI call uses `aiKeys()`: enabled keys, secrets
 * first; the providers move to the next key when one hits its limit.
 */
export type AiProvider = "groq" | "gemini";
export type AiKeyInfo = {
  id: string;
  provider: AiProvider;
  source: "admin" | "secret";
  label: string;
  last4: string;
  enabled: boolean;
  createdAt: string | null;
};
export type QuotaMeter = {
  limit: number;
  left: number;
  resetAt: string | null;
};
export type KeyCheck = {
  id: string;
  ok: boolean;
  status: "ok" | "limit" | "invalid" | "down";
  detail?: string;
  requests?: QuotaMeter;
  tokens?: QuotaMeter;
};

type Row = {
  id: string;
  provider: AiProvider;
  source: "admin" | "secret";
  fingerprint: string;
  last4: string;
  label: string;
  key_enc: string | null;
  enabled: boolean;
  created_at: string;
};

const sealKey = (plain: string) => seal(plain, env().APP_SECRET);
const openKey = (sealed: string) => unseal(sealed, env().APP_SECRET);

const missingTable = (code?: string) => code === "PGRST205" || code === "42P01";

// ponytail: a 30 s per-isolate cache; another Worker isolate may use a removed key for up to 30 s.
let cache: { at: number; rows: Row[]; missing: boolean } | null = null;
async function rows(): Promise<{ rows: Row[]; missing: boolean }> {
  if (cache && Date.now() - cache.at < 30_000) return cache;
  const { data, error } = await db()
    .from("ai_keys")
    .select(
      "id, provider, source, fingerprint, last4, label, key_enc, enabled, created_at",
    )
    .order("created_at");
  if (error && !missingTable(error.code)) throw error;
  cache = { at: Date.now(), rows: (data ?? []) as Row[], missing: !!error };
  return cache;
}

/** The Worker-secret keys, with the admin's label/on-off settings applied. */
async function secretKeys(stored: Row[]) {
  const out: { provider: AiProvider; key: string; fp: string; row?: Row }[] =
    [];
  for (const [provider, list] of [
    ["groq", groqKeys()],
    ["gemini", geminiKeys()],
  ] as const) {
    for (const key of list) {
      const fp = await fingerprint(key);
      out.push({
        provider,
        key,
        fp,
        row: stored.find((r) => r.fingerprint === fp),
      });
    }
  }
  return out;
}

/** Every enabled key per provider — what the AI calls use. Unreadable rows (APP_SECRET changed) are skipped. */
export async function aiKeys(): Promise<Record<AiProvider, string[]>> {
  const { rows: stored } = await rows().catch(() => ({ rows: [] as Row[] }));
  const out: Record<AiProvider, string[]> = { groq: [], gemini: [] };
  for (const s of await secretKeys(stored))
    if (s.row?.enabled !== false) out[s.provider].push(s.key);
  for (const r of stored) {
    if (r.source !== "admin" || !r.enabled || !r.key_enc) continue;
    const key = await openKey(r.key_enc).catch(() => "");
    if (key && !out[r.provider].includes(key)) out[r.provider].push(key);
  }
  return out;
}

export async function aiReady(): Promise<Record<AiProvider, boolean>> {
  const k = await aiKeys();
  return { groq: k.groq.length > 0, gemini: k.gemini.length > 0 };
}

const secretId = (provider: AiProvider, fp: string) =>
  `secret-${provider}-${fp.slice(0, 16)}`;

/** The admin's list: no key ever leaves the server, only its last 4 characters. */
export async function listAiKeys(): Promise<{
  keys: AiKeyInfo[];
  tableMissing: boolean;
}> {
  const { rows: stored, missing } = await rows();
  const secrets = await secretKeys(stored);
  const keys: AiKeyInfo[] = secrets.map((s) => {
    const same = secrets.filter((x) => x.provider === s.provider);
    const n = same.length > 1 ? ` ${same.indexOf(s) + 1}` : "";
    return {
      id: secretId(s.provider, s.fp),
      provider: s.provider,
      source: "secret",
      label:
        s.row?.label ||
        `${s.provider === "groq" ? "Groq" : "Gemini"} key${n} (Worker secret)`,
      last4: s.key.slice(-4),
      enabled: s.row?.enabled !== false,
      createdAt: null,
    };
  });
  for (const r of stored)
    if (r.source === "admin")
      keys.push({
        id: r.id,
        provider: r.provider,
        source: "admin",
        label: r.label || "Added key",
        last4: r.last4,
        enabled: r.enabled,
        createdAt: r.created_at,
      });
  return { keys, tableMissing: missing };
}

/** The real key behind a list id (server-side only), plus its stored settings row if any. */
async function resolve(
  id: string,
): Promise<{
  provider: AiProvider;
  key: string;
  fp: string;
  row?: Row;
  source: "admin" | "secret";
}> {
  const { rows: stored } = await rows();
  const s = (await secretKeys(stored)).find(
    (x) => secretId(x.provider, x.fp) === id,
  );
  if (s) return { ...s, source: "secret" };
  const r = stored.find((x) => x.id === id && x.source === "admin");
  if (!r?.key_enc) throw new HttpError(404, "That key no longer exists.");
  const key = await openKey(r.key_enc).catch(() => {
    throw new HttpError(
      422,
      "This key can't be read any more (APP_SECRET changed) — remove it and add it again.",
    );
  });
  return {
    provider: r.provider,
    key,
    fp: r.fingerprint,
    row: r,
    source: "admin",
  };
}

/**
 * Asks the provider whether a key works. Groq: a 1-token reply (1 request, ~75 tokens), whose headers
 * carry the key's exact limits. Gemini: the models list (free); Gemini reports no quota.
 */
export async function checkKey(
  provider: AiProvider,
  key: string,
): Promise<Omit<KeyCheck, "id">> {
  try {
    const res =
      provider === "groq"
        ? await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: env().GROQ_MODEL,
              max_tokens: 1,
              messages: [{ role: "user", content: "hi" }],
            }),
            signal: AbortSignal.timeout(8000),
          })
        : await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
            {
              headers: { "x-goog-api-key": key },
              signal: AbortSignal.timeout(8000),
            },
          );
    const body = res.ok
      ? ""
      : (await res.text()).replace(/\s+/g, " ").slice(0, 160);
    const status: KeyCheck["status"] = res.ok
      ? "ok"
      : res.status === 429
        ? "limit"
        : res.status === 401 ||
            res.status === 403 ||
            /api key not valid|invalid api key/i.test(body)
          ? "invalid"
          : "down";
    const out: Omit<KeyCheck, "id"> = {
      ok: res.ok,
      status,
      ...(body ? { detail: body } : {}),
    };
    if (provider === "groq" && (res.ok || res.status === 429)) {
      const num = (n: string) => Number(res.headers.get(n) ?? "") || 0;
      const reset = (n: string) => {
        const m =
          /^(?:(\d+)h)?(?:(\d+)m(?!s))?(?:([\d.]+)s)?(?:([\d.]+)ms)?$/.exec(
            (res.headers.get(n) ?? "").trim(),
          );
        return m && m[0]
          ? new Date(
              Date.now() +
                (Number(m[1] ?? 0) * 3600 +
                  Number(m[2] ?? 0) * 60 +
                  Number(m[3] ?? 0) +
                  Number(m[4] ?? 0) / 1000) *
                  1000,
            ).toISOString()
          : null;
      };
      out.requests = {
        limit: num("x-ratelimit-limit-requests"),
        left: num("x-ratelimit-remaining-requests"),
        resetAt: reset("x-ratelimit-reset-requests"),
      };
      out.tokens = {
        limit: num("x-ratelimit-limit-tokens"),
        left: num("x-ratelimit-remaining-tokens"),
        resetAt: reset("x-ratelimit-reset-tokens"),
      };
    }
    return out;
  } catch (err) {
    return {
      ok: false,
      status: "down",
      detail:
        err instanceof Error ? err.message.slice(0, 160) : "network error",
    };
  }
}

/** Live check of every listed key (enabled or not), for the admin's status + quota view. */
export async function checkAllKeys(): Promise<KeyCheck[]> {
  const { keys } = await listAiKeys();
  return Promise.all(
    keys.map(async (k) => {
      const r = await resolve(k.id).catch(() => null);
      return r
        ? { id: k.id, ...(await checkKey(r.provider, r.key)) }
        : {
            id: k.id,
            ok: false,
            status: "invalid" as const,
            detail: "can't be read",
          };
    }),
  );
}

export async function checkOneKey(id: string): Promise<KeyCheck> {
  const r = await resolve(id);
  return { id, ...(await checkKey(r.provider, r.key)) };
}

function needTable(missing: boolean) {
  if (missing)
    throw new HttpError(
      503,
      "Key storage missing — run supabase/migrations/0005_ai_keys.sql in Supabase first.",
    );
}

/** Adds a key after the provider confirms it works. Duplicates (of a secret or an added key) are refused. */
export async function addAiKey(
  provider: AiProvider,
  rawKey: string,
  label: string,
  by: string,
): Promise<AiKeyInfo> {
  const key = rawKey.trim();
  if (!/^\S{20,300}$/.test(key))
    throw new HttpError(422, "That doesn't look like an API key.");
  needTable((await rows()).missing);
  const fp = await fingerprint(key);
  const { rows: stored } = await rows();
  if (
    stored.some((r) => r.fingerprint === fp) ||
    (await secretKeys(stored)).some((s) => s.fp === fp)
  )
    throw new HttpError(409, "This key is already in the list.");
  const check = await checkKey(provider, key);
  if (check.status === "invalid")
    throw new HttpError(
      422,
      `${provider === "groq" ? "Groq" : "Gemini"} says this key isn't valid.`,
    );
  if (check.status === "down")
    throw new HttpError(
      502,
      `Couldn't reach ${provider === "groq" ? "Groq" : "Gemini"} to test the key — try again.`,
    );
  const { data, error } = await db()
    .from("ai_keys")
    .insert({
      provider,
      source: "admin",
      fingerprint: fp,
      last4: key.slice(-4),
      label: label.trim().slice(0, 60),
      key_enc: await sealKey(key),
      enabled: true,
      created_by: by,
    })
    .select("id, created_at")
    .single();
  if (error) throw error;
  cache = null;
  return {
    id: data.id,
    provider,
    source: "admin",
    label: label.trim().slice(0, 60) || "Added key",
    last4: key.slice(-4),
    enabled: true,
    createdAt: data.created_at,
  };
}

/** Rename or switch a key on/off. For a secret key this stores a settings row (never the key). */
export async function updateAiKey(
  id: string,
  patch: { label?: string; enabled?: boolean },
): Promise<void> {
  needTable((await rows()).missing);
  const r = await resolve(id);
  const set = {
    ...(patch.label !== undefined
      ? { label: patch.label.trim().slice(0, 60) }
      : {}),
    ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
  };
  const { error } = r.row
    ? await db().from("ai_keys").update(set).eq("id", r.row.id)
    : await db()
        .from("ai_keys")
        .insert({
          provider: r.provider,
          source: "secret",
          fingerprint: r.fp,
          last4: r.key.slice(-4),
          label: "",
          key_enc: null,
          enabled: true,
          ...set,
        });
  if (error) throw error;
  cache = null;
}

/** Removes an added key. Secret keys can only be switched off here — they live in Cloudflare. */
export async function removeAiKey(id: string): Promise<void> {
  const r = await resolve(id);
  if (r.source === "secret")
    throw new HttpError(
      422,
      "This key is a Worker secret — switch it off here, or remove it in Cloudflare.",
    );
  const { error } = await db().from("ai_keys").delete().eq("id", r.row!.id);
  if (error) throw error;
  cache = null;
}
