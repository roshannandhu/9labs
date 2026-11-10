"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DEFAULT_SETTINGS, useDemo, type MotionPref } from "@/components/providers/DemoSettings";

// Logo indigo family first (the client's colour), then the brief's electric blue for comparison.
const BLUES = ["#5a48f5", "#3530d0", "#6d5dfc", "#3b82ff"];
const PURPLES = ["#6f55e8", "#7c4dff", "#8b5cf6", "#5b21b6"];

/**
 * Demo-only control panel so the client can try brand colours and motion live
 * (exact colour codes are still to be supplied).
 * The same kinds of settings move into the Payload admin later.
 */
export function ConceptLab() {
  const { settings, set, reset } = useDemo();
  const [open, setOpen] = useState(false);
  if (process.env.NEXT_PUBLIC_DEMO_LAB === "false") return null;

  return (
    // Demo-only control, hidden on phones so a visitor judging the real site never sees it
    // (and it cannot cover the full-width buttons/content down there).
    <div className="fixed bottom-5 left-5 z-[75] hidden sm:block sm:bottom-6 sm:left-6 lsp:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            id="concept-lab"
            role="dialog"
            aria-label="Concept Lab demo controls"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[calc(100%+12px)] left-0 max-h-[min(78svh,640px)] w-[min(92vw,360px)] origin-bottom-left overflow-y-auto glass rounded-3xl p-5 [--glass-tint:var(--glass-tint-strong)] shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)] backdrop-blur-2xl"
            data-lenis-prevent
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="label-mono !text-nl-purple">Concept Lab</p>
                <p className="mt-1 text-[13px] leading-snug text-nl-ink">Try the 9&rsquo;s typeface, brand colours and motion live. In production these live in the admin panel.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-white/70 hover:text-white"
                aria-label="Close Concept Lab"
              >
                ✕
              </button>
            </div>

            <fieldset className="mb-5">
              <legend className="label-mono mb-2">Brand colours</legend>
              <Swatches label="Brand indigo" value={settings.blue} options={BLUES} onChange={(v) => set({ blue: v })} />
              <Swatches label="Highlight violet" value={settings.purple} options={PURPLES} onChange={(v) => set({ purple: v })} />
            </fieldset>

            <fieldset className="mb-5 space-y-3">
              <legend className="label-mono mb-2">Tuning</legend>
              <Range label="Grid intensity" min={0.02} max={0.12} step={0.005} value={settings.grid} onChange={(v) => set({ grid: v })} format={(v) => `${Math.round(v * 100)}%`} />
            </fieldset>

            <fieldset className="mb-5">
              <legend className="label-mono mb-2">Motion</legend>
              <div className="grid grid-cols-3 gap-1 rounded-full border border-white/10 p-1">
                {(["system", "full", "reduce"] as MotionPref[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set({ motion: m })}
                    aria-pressed={settings.motion === m}
                    className={`rounded-full px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      settings.motion === m ? "bg-white text-black" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {m === "reduce" ? "Reduced" : m}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mb-5 space-y-2">
              <legend className="label-mono mb-2">Elements</legend>
              <Toggle label="Floating WhatsApp button" checked={settings.whatsapp} onChange={(v) => set({ whatsapp: v })} />
            </fieldset>

            <button
              type="button"
              onClick={reset}
              disabled={JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS)}
              className="w-full rounded-full border border-white/10 py-2 text-xs font-medium text-white/70 transition-colors hover:text-white disabled:opacity-40"
            >
              Reset to defaults
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="concept-lab"
        className="group flex items-center gap-2 rounded-full border border-white/12 bg-[var(--chip-bg)] p-1.5 sm:py-2 sm:pl-2 sm:pr-4 text-[13px] font-medium text-white shadow-[0_18px_50px_-18px_rgba(53,51,203,.35)] backdrop-blur-xl transition-colors hover:border-nl-purple/60"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-nl-purple/15 text-nl-purple">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M2 4h7M12 4h2M2 12h2M7 12h7M2 8h3M8 8h6" />
            <circle cx="10.5" cy="4" r="1.5" />
            <circle cx="5.5" cy="12" r="1.5" />
            <circle cx="6.5" cy="8" r="1.5" />
          </svg>
        </span>
        <span className="sr-only sm:not-sr-only">
          Concept Lab
        </span>
      </button>
    </div>
  );
}

function Swatches({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <span className="text-xs text-white/75">{label}</span>
      <span className="flex items-center gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-label={`${label} ${o}`}
            aria-pressed={value.toLowerCase() === o}
            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${value.toLowerCase() === o ? "border-white" : "border-transparent"}`}
            style={{ background: o, boxShadow: `0 0 12px ${o}88` }}
          />
        ))}
        <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-white/20" title="Custom colour">
          <span className="sr-only">Custom {label}</span>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute -inset-2 h-10 w-10 cursor-pointer opacity-0" />
          <span className="pointer-events-none absolute inset-0 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" />
        </label>
      </span>
    </div>
  );
}

function Range({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-xs text-white/75">
        <span>{label}</span>
        <span className="font-mono text-white/50">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--nl-purple)]"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-xs text-white/75"
    >
      <span>{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-nl-purple" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
