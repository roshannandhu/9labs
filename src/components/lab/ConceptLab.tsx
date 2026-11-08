"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DEFAULT_SETTINGS, useDemo, type Concept, type MotionPref } from "@/components/providers/DemoSettings";

const CONCEPTS: { id: Concept; code: string; name: string; note: string }[] = [
  { id: "cinematic", code: "C", name: "Cinematic 3D · recommended", note: "Chrome & neon 9 on a blueprint floor, flowing light, orbit tracks; camera flies as you scroll." },
  { id: "neon", code: "A", name: "Neon Line", note: "SVG neon tube drawn on a blueprint. Lightest & fastest." },
  { id: "particles", code: "B", name: "Particle Grid", note: "Glowing particles assemble from the grid; react to the cursor." },
];
const BLUES = ["#3b82ff", "#2f6bff", "#4f9bff", "#1e7bff"];
const PURPLES = ["#b98cff", "#c084fc", "#a78bfa", "#d6a6ff"];

/**
 * Demo-only control panel so the client can compare hero concepts and try brand colours
 * live (the brief asks for 2–3 concepts; exact colour codes are still to be supplied).
 * The same kinds of settings move into the Payload admin later.
 */
export function ConceptLab() {
  const { settings, set, reset } = useDemo();
  const [open, setOpen] = useState(false);
  if (process.env.NEXT_PUBLIC_DEMO_LAB === "false") return null;

  return (
    <div className="fixed bottom-5 left-5 z-[75] sm:bottom-6 sm:left-6">
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
            className="absolute bottom-[calc(100%+12px)] left-0 max-h-[min(78svh,640px)] w-[min(92vw,360px)] origin-bottom-left overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0b10]/95 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)] backdrop-blur-2xl"
            data-lenis-prevent
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="label-mono !text-nl-purple">Concept Lab</p>
                <p className="mt-1 text-[13px] leading-snug text-nl-ink">Compare hero concepts and try brand colours live. In production these live in the admin panel.</p>
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
              <legend className="label-mono mb-2">Hero concept</legend>
              <div className="flex flex-col gap-2">
                {CONCEPTS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set({ concept: c.id })}
                    aria-pressed={settings.concept === c.id}
                    className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                      settings.concept === c.id ? "border-nl-purple/70 bg-nl-purple/10" : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-xs ${
                        settings.concept === c.id ? "bg-nl-purple text-[#0b0618]" : "bg-white/5 text-white/70"
                      }`}
                    >
                      {c.code}
                    </span>
                    <span>
                      <span className="block font-display text-sm font-semibold text-white">{c.name}</span>
                      <span className="block text-xs leading-snug text-nl-dim">{c.note}</span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mb-5">
              <legend className="label-mono mb-2">The 9 typeface</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["grotesk", "Space Grotesk", "Matches headlines"],
                    ["outfit", "Outfit Black", "Heavier, geometric"],
                  ] as const
                ).map(([id, name, note]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => set({ glyph: id })}
                    aria-pressed={settings.glyph === id}
                    className={`rounded-2xl border p-3 text-left transition-colors ${
                      settings.glyph === id ? "border-nl-purple/70 bg-nl-purple/10" : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <span className="block font-display text-sm font-semibold text-white">{name}</span>
                    <span className="block text-xs text-nl-dim">{note}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mb-5">
              <legend className="label-mono mb-2">Brand colours</legend>
              <Swatches label="Electric blue" value={settings.blue} options={BLUES} onChange={(v) => set({ blue: v })} />
              <Swatches label="Neon purple" value={settings.purple} options={PURPLES} onChange={(v) => set({ purple: v })} />
            </fieldset>

            <fieldset className="mb-5 space-y-3">
              <legend className="label-mono mb-2">Tuning</legend>
              <Range label="Grid intensity" min={0.02} max={0.12} step={0.005} value={settings.grid} onChange={(v) => set({ grid: v })} format={(v) => `${Math.round(v * 100)}%`} />
              <Range label="Orbit speed" min={0.4} max={2} step={0.1} value={settings.orbitSpeed} onChange={(v) => set({ orbitSpeed: v })} format={(v) => `${v.toFixed(1)}×`} />
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
              <Toggle label="Custom cursor (desktop)" checked={settings.cursor} onChange={(v) => set({ cursor: v })} />
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
        className="group flex items-center gap-2 rounded-full border border-white/12 bg-[#0b0d12]/85 p-1.5 sm:py-2 sm:pl-2 sm:pr-4 text-[13px] font-medium text-white shadow-[0_18px_50px_-18px_rgba(0,0,0,.9)] backdrop-blur-xl transition-colors hover:border-nl-purple/60"
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
          Concept Lab <span className="font-mono text-[11px] text-white/45">· {CONCEPTS.find((c) => c.id === settings.concept)?.code}</span>
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
