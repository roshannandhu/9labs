import "server-only";
import { env, geminiKeys, groqKeys } from "../env";
import { AiError, type AiFailReason, type ProviderReply } from "./types";

export { AiError };

export const EMBED_DIMS = 768; // matches vector(768) in supabase/migrations/0003_ai_kb.sql

async function timedFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } catch (err) {
    if (ctl.signal.aborted) throw new AiError("slow", `timed out after ${timeoutMs} ms`);
    throw new AiError("down", err instanceof Error ? err.message : "network error");
  } finally {
    clearTimeout(timer);
  }
}

/** Gemini reports a wrong key as 400 "API key not valid" — that's a key problem, not a bad request. */
const reasonFor = (status: number, body = ""): AiFailReason =>
  status === 429 ? "limit" : status === 401 || status === 403 || /API[_ ]KEY[_ ]INVALID|API key not valid|invalid api key/i.test(body) ? "key" : status === 400 ? "bad" : "down";

async function fail(name: string, res: Response): Promise<never> {
  const body = (await res.text()).slice(0, 300);
  throw new AiError(reasonFor(res.status, body), `${name} ${res.status}: ${body.replace(/\s+/g, " ").slice(0, 160)}`);
}

/** Tries each key in turn; only "limit"/"key" failures move on to the next key, anything else stops. */
async function withKeys<T>(keys: string[], name: string, call: (key: string) => Promise<T>): Promise<T> {
  if (!keys.length) throw new AiError("off", `${name}: no API key set`);
  let last: unknown;
  for (const key of keys) {
    try {
      return await call(key);
    } catch (err) {
      last = err;
      if (!(err instanceof AiError) || (err.reason !== "limit" && err.reason !== "key")) throw err;
    }
  }
  throw last;
}

/** Groq's reset headers look like "2m59.56s", "7.66s" or "1h2m3s". */
export function parseGroqReset(v: string | null, now = Date.now()): string | null {
  if (!v) return null;
  const m = /^(?:(\d+)h)?(?:(\d+)m(?!s))?(?:([\d.]+)s)?(?:([\d.]+)ms)?$/.exec(v.trim());
  if (!m || !m[0]) return null;
  const secs = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) + Number(m[4] ?? 0) / 1000;
  return new Date(now + secs * 1000).toISOString();
}

const num = (v: string | null) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

export async function callGroq(system: string, user: string, timeoutMs = 8000): Promise<ProviderReply> {
  return withKeys(groqKeys(), "groq", async (key) => {
    const res = await timedFetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env().GROQ_MODEL,
          // gpt-oss models think before answering; a short think keeps us well inside the timeout
          ...(env().GROQ_MODEL.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
          temperature: 0.3,
          max_tokens: 1200,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      },
      timeoutMs,
    );
    if (!res.ok) await fail("groq", res);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new AiError("bad", "groq: empty reply");
    return {
      text,
      tokensIn: data.usage?.prompt_tokens ?? 0,
      tokensOut: data.usage?.completion_tokens ?? 0,
      rate: { remainingRequests: num(res.headers.get("x-ratelimit-remaining-requests")), remainingTokens: num(res.headers.get("x-ratelimit-remaining-tokens")), resetAt: parseGroqReset(res.headers.get("x-ratelimit-reset-requests")) },
    };
  });
}

const GEMINI = "https://generativelanguage.googleapis.com/v1beta/models";

export async function callGemini(system: string, user: string, timeoutMs = 10000): Promise<ProviderReply> {
  return withKeys(geminiKeys(), "gemini", async (key) => {
    const res = await timedFetch(
      `${GEMINI}/${encodeURIComponent(env().GEMINI_MODEL)}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1500, responseMimeType: "application/json" },
        }),
      },
      timeoutMs,
    );
    if (!res.ok) await fail("gemini", res);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string }; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
    if (data.promptFeedback?.blockReason) throw new AiError("blocked", `gemini blocked: ${data.promptFeedback.blockReason}`);
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) throw new AiError(data.candidates?.[0]?.finishReason === "SAFETY" ? "blocked" : "bad", "gemini: empty reply");
    return { text, tokensIn: data.usageMetadata?.promptTokenCount ?? 0, tokensOut: data.usageMetadata?.candidatesTokenCount ?? 0, rate: null };
  });
}

/** Gemini embeddings, `EMBED_DIMS` wide; batched (the API takes up to 100 per call). */
export async function embedTexts(texts: string[], taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT", timeoutMs = 8000): Promise<number[][]> {
  const model = env().GEMINI_EMBED_MODEL;
  return withKeys(geminiKeys(), "gemini-embed", async (key) => {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += 100) {
      const res = await timedFetch(
        `${GEMINI}/${encodeURIComponent(model)}:batchEmbedContents`,
        {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({ requests: texts.slice(i, i + 100).map((text) => ({ model: `models/${model}`, content: { parts: [{ text }] }, taskType, outputDimensionality: EMBED_DIMS })) }),
        },
        timeoutMs,
      );
      if (!res.ok) await fail("gemini-embed", res);
      const data = (await res.json()) as { embeddings?: { values?: number[] }[] };
      for (const e of data.embeddings ?? []) {
        if (!e.values || e.values.length !== EMBED_DIMS) throw new AiError("bad", `gemini-embed: expected ${EMBED_DIMS} dims`);
        out.push(e.values);
      }
    }
    if (out.length !== texts.length) throw new AiError("bad", "gemini-embed: count mismatch");
    return out;
  });
}
