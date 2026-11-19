"use client";

import { useEffect, useState } from "react";
import type { AiHealth } from "@/server/ai/run";
import { ApiError, api } from "./api";
import { AiKeysManager, AiQuota } from "./AiKeys";
import { BarList } from "./charts";
import { relativeTime } from "./ui";

export const OUTCOME_LABEL = { ok: "AI answered", failover: "Rescued by the second AI", backup: "Scoring (AI stepped aside)", none: "Last resort" } as const;
const REASON_LABEL: Record<string, string> = { limit: "Limit reached", slow: "Too slow", bad: "Bad answer", key: "Key invalid", down: "Service down", blocked: "Blocked content" };

function KeyChip({ name, set }: { name: string; set: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${set ? "bg-[var(--st-good-bg)] text-st-good" : "bg-st-danger-bg text-st-danger"}`}>{`${name} key ${set ? "set ✓" : "missing"}`}</span>;
}

/** One line on top: is the AI actually answering visitors right now? */
function verdict(h: AiHealth, enabled: boolean): { tone: string; text: string } {
  if (!enabled) return { tone: "text-st-warn", text: "Scoring only — every visitor gets the scoring result. Switch to “AI + scoring” in Quiz → AI." };
  if (!h.keys.groq && !h.keys.gemini) return { tone: "text-st-danger", text: "No AI key in use — every visitor gets the scoring result. Add a Groq or Gemini key under Quiz → Insights → AI keys." };
  const t = h.today;
  if (t.total === 0) return { tone: "text-st-sub", text: "AI ready — no quiz results yet today." };
  const aiShare = Math.round(((t.ok + t.failover) / t.total) * 100);
  if (aiShare >= 90) return { tone: "text-st-good", text: `AI working — ${aiShare}% of today's results came from the AI.` };
  return { tone: "text-st-warn", text: `AI struggling — only ${aiShare}% of today's results came from the AI; the rest automatically got the scoring result. See the reasons below.` };
}

/**
 * Live AI health from GET /api/admin/ai/health (the ai_calls log, last 7 days): key status, outcome
 * mix, speed, quota left, failure reasons. Shared by the Dashboard and Quiz → AI.
 */
export function AiHealthView({ enabled, geminiLimit, manageKeys = false }: { enabled: boolean; geminiLimit: number; manageKeys?: boolean }) {
  const [health, setHealth] = useState<AiHealth | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let alive = true;
    const load = () =>
      api<AiHealth>("/api/admin/ai/health")
        .then((h) => {
          if (!alive) return;
          setHealth(h);
          setErr("");
        })
        .catch((e) => alive && setErr(e instanceof ApiError ? e.message : "Couldn't load AI health."));
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  if (err) return <p className="text-[13px] text-st-danger">{err}</p>;
  if (!health) return <p className="text-[13px] text-st-sub">Loading…</p>;

  const w = health.week;
  const v = verdict(health, enabled);
  const reasons = Object.entries(health.reasons).filter(([r]) => r !== "off");

  return (
    <div className="grid gap-3">
      <p className={`text-[13px] font-medium ${v.tone}`} role="status">
        {v.text}
      </p>
      <p className="flex flex-wrap gap-1.5">
        <KeyChip name="Groq" set={health.keys.groq} />
        <KeyChip name="Gemini" set={health.keys.gemini} />
      </p>
      {w.total > 0 ? (
        <BarList
          ranked={false}
          color="var(--st-series-quiz)"
          items={[
            { key: "ok", label: OUTCOME_LABEL.ok, value: w.ok },
            { key: "failover", label: OUTCOME_LABEL.failover, value: w.failover },
            { key: "backup", label: OUTCOME_LABEL.backup, value: w.backup },
            { key: "none", label: OUTCOME_LABEL.none, value: w.none },
          ]}
        />
      ) : (
        <p className="text-[12.5px] text-st-sub">No quiz results in the last 7 days.</p>
      )}
      <dl className="grid grid-cols-2 gap-2 text-[12px]">
        <div>
          <dt className="text-st-dim">Today</dt>
          <dd className="text-st-ink">
            {health.today.total} results · {health.today.tokensIn + health.today.tokensOut} tokens
          </dd>
        </div>
        <div>
          <dt className="text-st-dim">Speed (typical / slowest)</dt>
          <dd className="text-st-ink">
            {(health.latency.median / 1000).toFixed(1)} s / {(health.latency.p95 / 1000).toFixed(1)} s
          </dd>
        </div>
      </dl>
      <div className="border-t border-st-border pt-3">
        <p className="st-micro mb-2">{manageKeys ? "AI keys & quota" : "AI quota"}</p>
        {manageKeys ? <AiKeysManager geminiUsed={health.today.geminiCalls} geminiLimit={geminiLimit} /> : <AiQuota geminiUsed={health.today.geminiCalls} geminiLimit={geminiLimit} />}
      </div>
      {reasons.length > 0 && (
        <p className="flex flex-wrap gap-1.5">
          {reasons.map(([r, n]) => (
            <span key={r} className="rounded-full border border-st-border-strong px-2 py-0.5 text-[11px] text-st-sub">
              {REASON_LABEL[r] ?? r} · {n}
            </span>
          ))}
        </p>
      )}
      {health.recentFailures.length > 0 && (
        <ul className="grid gap-1 text-[11.5px] text-st-dim">
          {health.recentFailures.map((f, i) => (
            <li key={i}>
              {relativeTime(f.at)} · {f.provider} · {REASON_LABEL[f.reason] ?? f.reason}
              {f.detail ? ` — ${f.detail}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
