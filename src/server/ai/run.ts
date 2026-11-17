import "server-only";
import type { SiteData } from "@/content/site";
import type { QuizAnswers, QuizOther } from "@/lib/quiz/types";
import { db } from "../db";
import { aiConfigured } from "../env";
import { newId } from "../leads";
import { runChain, type ChainOutcome } from "./chain";
import { retrieveKb } from "./kb";
import { callGemini, callGroq } from "./providers";

/** The chain with its real dependencies, plus one telemetry row per run — never any client text. */
export async function runQuizAi(site: SiteData, answers: QuizAnswers, other: QuizOther, ref: string): Promise<ChainOutcome> {
  const outcome = await runChain(site, answers, other, { retrieve: retrieveKb, groq: callGroq, gemini: callGemini, configured: aiConfigured() });
  await logAiCall(outcome, ref).catch((err) => console.warn("ai_calls insert failed:", err instanceof Error ? err.message : err));
  return outcome;
}

async function logAiCall(o: ChainOutcome, ref: string): Promise<void> {
  const last = o.attempts.at(-1);
  const groq = o.attempts.find((a) => a.provider === "groq" && a.rate);
  const failed = o.attempts.find((a) => !a.ok);
  const { error } = await db()
    .from("ai_calls")
    .insert({
      id: newId("ai"),
      provider: o.source === "groq" || o.source === "gemini" ? o.source : (last?.provider ?? "backup"),
      outcome: o.outcome,
      reason: failed?.reason ?? (o.attempts.length ? "" : "off"),
      detail: failed?.detail?.slice(0, 200) ?? "",
      latency_ms: o.latencyMs,
      tokens_in: o.attempts.reduce((n, a) => n + a.tokensIn, 0),
      tokens_out: o.attempts.reduce((n, a) => n + a.tokensOut, 0),
      rl_remaining_requests: groq?.rate?.remainingRequests ?? null,
      rl_remaining_tokens: groq?.rate?.remainingTokens ?? null,
      rl_reset_at: groq?.rate?.resetAt ?? null,
      retrieval: o.retrieved.mode,
      tried: o.attempts.map((a) => a.provider),
      ref,
    });
  if (error) throw error;
}

export type AiHealth = {
  keys: { groq: boolean; gemini: boolean };
  today: { total: number; ok: number; failover: number; backup: number; none: number; groqCalls: number; geminiCalls: number; tokensIn: number; tokensOut: number };
  week: { total: number; ok: number; failover: number; backup: number; none: number };
  reasons: Record<string, number>;
  latency: { median: number; p95: number };
  groqRate: { remainingRequests: number | null; remainingTokens: number | null; resetAt: string | null; at: string } | null;
  recentFailures: { at: string; provider: string; outcome: string; reason: string; detail: string; ref: string }[];
};

type CallRow = { tried: string[] | null; at: string; provider: string; outcome: "ok" | "failover" | "backup" | "none"; reason: string; detail: string; latency_ms: number; tokens_in: number; tokens_out: number; rl_remaining_requests: number | null; rl_remaining_tokens: number | null; rl_reset_at: string | null; ref: string };

export async function aiHealth(): Promise<AiHealth> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await db().from("ai_calls").select("tried, at, provider, outcome, reason, detail, latency_ms, tokens_in, tokens_out, rl_remaining_requests, rl_remaining_tokens, rl_reset_at, ref").gte("at", since).order("at", { ascending: false }).limit(5000);
  if (error) throw error;
  const rows = data as CallRow[];
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const today = rows.filter((r) => r.at >= dayStart.toISOString());
  const count = (rs: CallRow[]) => ({ total: rs.length, ok: rs.filter((r) => r.outcome === "ok").length, failover: rs.filter((r) => r.outcome === "failover").length, backup: rs.filter((r) => r.outcome === "backup").length, none: rs.filter((r) => r.outcome === "none").length });
  const reasons: Record<string, number> = {};
  for (const r of rows) if (r.reason) reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
  const lat = rows.map((r) => r.latency_ms).sort((a, b) => a - b);
  const pick = (q: number) => (lat.length ? lat[Math.min(lat.length - 1, Math.floor(q * lat.length))] : 0);
  const rate = rows.find((r) => r.rl_remaining_requests != null);
  return {
    keys: aiConfigured(),
    today: { ...count(today), groqCalls: today.filter((r) => r.tried?.includes("groq")).length, geminiCalls: today.filter((r) => r.tried?.includes("gemini")).length, tokensIn: today.reduce((n, r) => n + r.tokens_in, 0), tokensOut: today.reduce((n, r) => n + r.tokens_out, 0) },
    week: count(rows),
    reasons,
    latency: { median: pick(0.5), p95: pick(0.95) },
    groqRate: rate ? { remainingRequests: rate.rl_remaining_requests, remainingTokens: rate.rl_remaining_tokens, resetAt: rate.rl_reset_at, at: rate.at } : null,
    recentFailures: rows.filter((r) => r.reason && r.reason !== "off").slice(0, 10).map((r) => ({ at: r.at, provider: r.provider, outcome: r.outcome, reason: r.reason, detail: r.detail, ref: r.ref })),
  };
}
