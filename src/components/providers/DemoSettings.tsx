"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type MotionPref = "system" | "full" | "reduce";

export type DemoSettings = {
  /** UI accent (buttons, rail, logo gradient end) — the logo's indigo, brightened for black. */
  blue: string;
  /** Highlight violet (links, labels, glows). */
  purple: string;
  grid: number;
  motion: MotionPref;
  whatsapp: boolean;
};

export const DEFAULT_SETTINGS: DemoSettings = {
  blue: "#5a48f5",
  purple: "#6f55e8",
  grid: 0.06,
  motion: "system",
  whatsapp: true,
};

type Ctx = {
  settings: DemoSettings;
  set: (patch: Partial<DemoSettings>) => void;
  reset: () => void;
  /** Resolved reduced-motion state (system preference or forced from the lab). */
  reduced: boolean;
  /** True once client settings (storage / URL) have been applied. */
  ready: boolean;
};

const DemoContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "nl-demo-settings-v8"; // v8: light lavender theme (old saved colours would override it)


function readStored(): Partial<DemoSettings> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<DemoSettings>) : {};
  } catch {
    return {};
  }
}

export function DemoSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DemoSettings>(DEFAULT_SETTINGS);
  const [systemReduced, setSystemReduced] = useState(false);
  const [ready, setReady] = useState(false);

  // Load from storage + URL once on the client.
  useEffect(() => {
    const stored = readStored();
    const params = new URLSearchParams(window.location.search);
    const next: DemoSettings = { ...DEFAULT_SETTINGS, ...stored };
    if (params.get("motion") === "reduce") next.motion = "reduce";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate client-only settings after SSR
    setSettings(next);
    setReady(true);

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const reduced = settings.motion === "reduce" || (settings.motion === "system" && systemReduced);

  // Apply tokens to the document.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--nl-blue", settings.blue);
    root.style.setProperty("--nl-purple", settings.purple);
    root.style.setProperty("--grid-alpha", String(settings.grid));
    if (settings.motion === "system") delete root.dataset.motion;
    else root.dataset.motion = settings.motion;
    root.dataset.motionResolved = reduced ? "reduce" : "full";
  }, [settings, reduced]);

  // Persist (best effort).
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable — settings just won't persist */
    }
  }, [settings, ready]);

  const set = useCallback((patch: Partial<DemoSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const value = useMemo(() => ({ settings, set, reset, reduced, ready }), [settings, set, reset, reduced, ready]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoSettingsProvider>");
  return ctx;
}
