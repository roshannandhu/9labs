"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiKeyInfo, KeyCheck, QuotaMeter } from "@/server/ai/keys";
import { ApiError, api } from "./api";
import {
  Button,
  Pill,
  Switch,
  confirmDestroy,
  relativeTime,
  useToast,
} from "./ui";

/**
 * AI keys & quota (GET/POST /api/admin/ai/keys, PATCH/DELETE/GET …/keys/[id]). The quota comes from
 * a live check of each key — Groq answers with its exact limits (1 request per Groq key per check),
 * Gemini reports none, so its line counts today's calls against the admin's daily estimate. Checks
 * run when the panel opens and on "Check again", never on a timer.
 */
type KeysReply = {
  keys: AiKeyInfo[];
  tableMissing: boolean;
  checks: KeyCheck[];
};
/** About what one AI quiz result uses (prompt + reply), for the "results left" estimate. */
const TOKENS_PER_RESULT = 2700;

const fmt = (n: number) => n.toLocaleString("en-US");
const at = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

function useAiKeys() {
  const [data, setData] = useState<KeysReply | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fetchKeys = (check: boolean) =>
    api<KeysReply>(`/api/admin/ai/keys${check ? "?check=1" : ""}`);
  const fail = (e: unknown) =>
    setErr(e instanceof ApiError ? e.message : "Couldn't load the AI keys.");
  // first load: checks every key once when the panel opens
  useEffect(() => {
    let alive = true;
    fetchKeys(true).then(
      (r) => alive && (setData(r), setErr("")),
      (e) => alive && fail(e),
    );
    return () => {
      alive = false;
    };
  }, []);
  /** Reload; `check` re-tests every key (each Groq key costs 1 request), otherwise keeps the last results. */
  const load = useCallback(async (check = true) => {
    setBusy(true);
    try {
      const r = await fetchKeys(check);
      setData((d) => (check || !d ? r : { ...r, checks: d.checks }));
      setErr("");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }, []);
  /** One key's fresh check, merged in without re-testing the others. */
  const setCheck = useCallback(
    (c: KeyCheck) =>
      setData((d) =>
        d ? { ...d, checks: [...d.checks.filter((x) => x.id !== c.id), c] } : d,
      ),
    [],
  );
  return { data, err, busy, load, setCheck };
}

function Meter({
  label,
  m,
  foot,
}: {
  label: string;
  m: QuotaMeter;
  foot: string;
}) {
  const pct =
    m.limit > 0
      ? Math.max(0, Math.min(100, Math.round((m.left / m.limit) * 100)))
      : 0;
  const color =
    pct < 15
      ? "var(--st-danger)"
      : pct < 40
        ? "var(--st-warn)"
        : "var(--st-good)";
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[12.5px]">
        <span className="text-st-ink">{label}</span>
        <span className="font-medium text-st-ink">
          {fmt(m.left)}{" "}
          <span className="font-normal text-st-dim">
            of {fmt(m.limit)} left
          </span>
        </span>
      </div>
      <span
        className="mt-1.5 block h-[10px] overflow-hidden rounded-full bg-st-panel-2"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={m.limit}
        aria-valuenow={m.left}
      >
        <span
          className="block h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
      <p className="mt-1 text-[11.5px] text-st-dim">{foot}</p>
    </div>
  );
}

const sum = (ms: QuotaMeter[]): QuotaMeter => ({
  limit: ms.reduce((n, m) => n + m.limit, 0),
  left: ms.reduce((n, m) => n + m.left, 0),
  resetAt:
    ms
      .map((m) => m.resetAt)
      .filter(Boolean)
      .sort()[0] ?? null,
});

/** The quota summary: Groq today + this minute, Gemini today, and how many AI results that leaves. */
function QuotaSummary({
  data,
  geminiUsed,
  geminiEmbeds,
  geminiLimit,
  busy,
  onCheck,
}: {
  data: KeysReply;
  geminiUsed: number;
  geminiEmbeds: number;
  geminiLimit: number;
  busy: boolean;
  onCheck: () => void;
}) {
  const on = (provider: "groq" | "gemini") =>
    data.keys.filter((k) => k.provider === provider && k.enabled);
  const groqChecks = on("groq")
    .map((k) => data.checks.find((c) => c.id === k.id))
    .filter((c): c is KeyCheck => !!c?.requests);
  const req = sum(groqChecks.map((c) => c.requests!));
  const tok = sum(groqChecks.map((c) => c.tokens!));
  const gemKeys = on("gemini").length;
  // real Gemini usage = text replies + the embedding each quiz run spends on retrieval
  const gemUsed = geminiUsed + geminiEmbeds;
  const gem: QuotaMeter = {
    limit: geminiLimit * gemKeys,
    left: Math.max(0, geminiLimit * gemKeys - gemUsed),
    resetAt: null,
  };
  const left = req.left + gem.left;
  const perMinute = Math.floor(tok.limit / TOKENS_PER_RESULT);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-st-ink">
          {groqChecks.length || gemKeys ? (
            <>
              About <strong>{fmt(left)}</strong> more AI quiz results today
              {perMinute > 0 && (
                <span className="text-st-sub">
                  {" "}
                  · up to ~{perMinute} a minute on Groq
                </span>
              )}
            </>
          ) : (
            <span className="text-st-sub">
              No working AI key — every visitor gets an instant matched result.
            </span>
          )}
        </p>
        <Button
          variant="ghost"
          className="!h-8 !px-3 !text-[12px]"
          onClick={onCheck}
          disabled={busy}
        >
          {busy ? "Checking…" : "Check again"}
        </Button>
      </div>
      {groqChecks.length > 0 && (
        <>
          <Meter
            label={`Groq — requests today${groqChecks.length > 1 ? ` (${groqChecks.length} keys)` : ""}`}
            m={req}
            foot={
              req.resetAt
                ? `Refills gradually; full again by about ${at(req.resetAt)}.`
                : "Refills daily."
            }
          />
          <Meter
            label="Groq — tokens this minute"
            m={tok}
            foot={`Refills every minute. One AI result uses about ${fmt(TOKENS_PER_RESULT)}.`}
          />
        </>
      )}
      {gemKeys > 0 && (
        <Meter
          label={`Gemini — today (estimate${gemKeys > 1 ? `, ${gemKeys} keys` : ""})`}
          m={gem}
          foot={`Today: ${fmt(geminiUsed)} replies + ${fmt(geminiEmbeds)} search embeddings, against ${fmt(geminiLimit)} a day per key. Gemini doesn't report its real quota (set the estimate in Quiz → Result page → How the AI writes → More options).`}
        />
      )}
    </div>
  );
}

/** For the Dashboard / AI health: the quota summary alone. */
export function AiQuota({
  geminiUsed,
  geminiEmbeds,
  geminiLimit,
}: {
  geminiUsed: number;
  geminiEmbeds: number;
  geminiLimit: number;
}) {
  const { data, err, busy, load } = useAiKeys();
  if (err) return <p className="text-[12.5px] text-st-danger">{err}</p>;
  if (!data)
    return <p className="text-[12.5px] text-st-sub">Checking quota…</p>;
  return (
    <QuotaSummary
      data={data}
      geminiUsed={geminiUsed}
      geminiEmbeds={geminiEmbeds}
      geminiLimit={geminiLimit}
      busy={busy}
      onCheck={() => void load()}
    />
  );
}

const STATUS: Record<
  KeyCheck["status"],
  { tone: "good" | "warn" | "bad"; text: string }
> = {
  ok: { tone: "good", text: "Working" },
  limit: { tone: "warn", text: "Limit reached" },
  invalid: { tone: "bad", text: "Not valid" },
  down: { tone: "warn", text: "Can't reach" },
};

function KeyRow({
  k,
  check,
  onChanged,
  onCheck,
}: {
  k: AiKeyInfo;
  check?: KeyCheck;
  onChanged: () => void;
  onCheck: (c: KeyCheck) => void;
}) {
  const toast = useToast();
  const [label, setLabel] = useState(k.label);
  const [busy, setBusy] = useState(false);
  const run = async (what: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await what();
      toast("ok", ok);
      onChanged();
    } catch (e) {
      toast("bad", e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  const path = `/api/admin/ai/keys/${k.id}`;
  const s = !k.enabled
    ? { tone: "default" as const, text: "Off" }
    : check
      ? STATUS[check.status]
      : null;

  return (
    <li className="grid gap-2 rounded-xl border border-st-border bg-st-panel-2/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-st-panel-3 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase text-st-sub">
          {k.provider}
        </span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() =>
            label.trim() &&
            label !== k.label &&
            run(
              () => api(path, { method: "PATCH", json: { label } }),
              "Renamed.",
            )
          }
          maxLength={60}
          aria-label="Key name"
          className="st-field !h-8 min-w-0 flex-1 basis-40 !text-[13px]"
        />
        <span
          className="font-mono text-[12px] text-st-dim"
          title="Only the last 4 characters are ever shown"
        >
          ••••{k.last4}
        </span>
        {s && <Pill tone={s.tone}>{s.text}</Pill>}
      </div>
      {k.enabled && check?.requests && (
        <p className="text-[12px] text-st-sub">
          {fmt(check.requests.left)} of {fmt(check.requests.limit)} requests
          left today · {fmt(check.tokens?.left ?? 0)} of{" "}
          {fmt(check.tokens?.limit ?? 0)} tokens this minute
        </p>
      )}
      {k.enabled && check && !check.ok && check.detail && (
        <p className="break-words text-[11.5px] text-st-dim">{check.detail}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Switch
          checked={k.enabled}
          onChange={(on) =>
            run(
              () => api(path, { method: "PATCH", json: { enabled: on } }),
              on
                ? "Key switched on."
                : "Key switched off — the AI won't use it.",
            )
          }
          label={k.enabled ? "In use" : "Not used"}
        />
        <span className="flex-1" />
        <Button
          variant="ghost"
          className="!h-8 !px-3 !text-[12px]"
          disabled={busy}
          onClick={() =>
            void (async () => {
              setBusy(true);
              try {
                const { check: c } = await api<{ check: KeyCheck }>(path);
                onCheck(c);
                toast(
                  c.ok ? "ok" : "bad",
                  c.ok
                    ? "This key works."
                    : `${STATUS[c.status].text}${c.detail ? ` — ${c.detail}` : ""}`,
                );
              } catch (e) {
                toast(
                  "bad",
                  e instanceof ApiError ? e.message : "Couldn't test the key.",
                );
              } finally {
                setBusy(false);
              }
            })()
          }
        >
          Test
        </Button>
        {k.source === "admin" ? (
          <Button
            variant="danger"
            className="!h-8 !px-3 !text-[12px]"
            disabled={busy}
            onClick={() =>
              confirmDestroy(
                `Remove the ${k.provider} key "${k.label}" (••••${k.last4})? The AI stops using it at once.`,
              ) && run(() => api(path, { method: "DELETE" }), "Key removed.")
            }
          >
            Remove
          </Button>
        ) : (
          <span className="text-[11.5px] text-st-dim">
            Worker secret — remove it in Cloudflare
          </span>
        )}
      </div>
      {k.createdAt && (
        <p className="text-[11px] text-st-dim">
          Added {relativeTime(k.createdAt)}
        </p>
      )}
    </li>
  );
}

function AddKey({
  disabled,
  onAdded,
}: {
  disabled: boolean;
  onAdded: () => void;
}) {
  const toast = useToast();
  const [provider, setProvider] = useState<"groq" | "gemini">("groq");
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try {
      await api("/api/admin/ai/keys", { json: { provider, key, label } });
      toast("ok", "Key tested and added — the AI uses it from now on.");
      setKey("");
      setLabel("");
      onAdded();
    } catch (e) {
      toast("bad", e instanceof ApiError ? e.message : "Couldn't add the key.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="grid gap-2 rounded-xl border border-dashed border-st-border-strong p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (key.trim().length >= 20) void add();
      }}
    >
      <p className="text-[13px] font-medium text-st-ink">Add a key</p>
      <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,12rem)]">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as "groq" | "gemini")}
          className="st-field !text-[13px]"
          aria-label="Provider"
          disabled={disabled}
        >
          <option value="groq">Groq</option>
          <option value="gemini">Gemini</option>
        </select>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={provider === "groq" ? "gsk_…" : "AIza…"}
          aria-label="API key"
          className="st-field font-mono !text-[13px]"
          disabled={disabled}
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Name (optional)"
          maxLength={60}
          aria-label="Key name"
          className="st-field !text-[13px]"
          disabled={disabled}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11.5px] text-st-dim">
          Free keys:{" "}
          <a
            className="text-st-purple hover:underline"
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
          >
            console.groq.com/keys
          </a>{" "}
          ·{" "}
          <a
            className="text-st-purple hover:underline"
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
          >
            aistudio.google.com/apikey
          </a>
          . The key is tested, then stored encrypted.
        </p>
        <Button
          type="submit"
          variant="primary"
          className="!h-8 !px-3 !text-[12px]"
          disabled={disabled || busy || key.trim().length < 20}
        >
          {busy ? "Testing…" : "Test & add"}
        </Button>
      </div>
    </form>
  );
}

/** Quiz → Insights: quota summary, every key with its status and own quota, and adding a key. */
export function AiKeysManager({
  geminiUsed,
  geminiEmbeds,
  geminiLimit,
}: {
  geminiUsed: number;
  geminiEmbeds: number;
  geminiLimit: number;
}) {
  const { data, err, busy, load, setCheck } = useAiKeys();
  if (err) return <p className="text-[13px] text-st-danger">{err}</p>;
  if (!data) return <p className="text-[13px] text-st-sub">Checking keys…</p>;
  return (
    <div className="grid gap-4">
      <QuotaSummary
        data={data}
        geminiUsed={geminiUsed}
        geminiEmbeds={geminiEmbeds}
        geminiLimit={geminiLimit}
        busy={busy}
        onCheck={() => void load()}
      />
      {data.tableMissing && (
        <p className="rounded-xl bg-[var(--st-warn-bg)] px-3 py-2 text-[12.5px] text-st-warn">
          To add keys or switch keys off, run{" "}
          <code>supabase/migrations/0005_ai_keys.sql</code> in Supabase once.
          Your Worker-secret keys keep working meanwhile.
        </p>
      )}
      {data.keys.length > 0 ? (
        <ul className="grid gap-2">
          {data.keys.map((k) => (
            <KeyRow
              key={`${k.id}-${k.label}-${k.enabled}`}
              k={k}
              check={data.checks.find((c) => c.id === k.id)}
              onChanged={() => void load(false)}
              onCheck={setCheck}
            />
          ))}
        </ul>
      ) : (
        <p className="text-[12.5px] text-st-sub">
          No AI keys yet — add one below.
        </p>
      )}
      <AddKey disabled={data.tableMissing} onAdded={() => void load()} />
      <p className="text-[11.5px] text-st-dim">
        More keys = more quota: when one key reaches its limit, the AI moves on
        to the next. Checking costs 1 Groq request per Groq key.
      </p>
    </div>
  );
}
