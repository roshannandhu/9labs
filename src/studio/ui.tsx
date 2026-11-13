"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/* ------------------------------------------------------------------ layout */

export function Box({ title, help, children, right, className = "" }: { title?: string; help?: string; children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <section className={`st-card p-4 sm:p-5 ${className}`}>
      {(title || right) && (
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="font-display text-[15px] font-semibold text-st-ink">{title}</h3>}
            {help && <p className="st-help mt-1">{help}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="grid gap-3.5">{children}</div>
    </section>
  );
}

export function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${Math.max(140, 320 / cols)}px, 1fr))` }}>{children}</div>;
}

/* ------------------------------------------------------------------ buttons */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "danger"; icon?: React.ReactNode };
export function Button({ variant = "default", icon, className = "", children, ...rest }: BtnProps) {
  const v = variant === "primary" ? "st-btn-primary" : variant === "danger" ? "st-btn-danger" : "";
  return (
    <button type="button" className={`st-btn ${v} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ label, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-st-border text-st-sub transition-colors hover:border-st-purple/60 hover:text-st-ink" {...rest}>
      {children}
    </button>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <span className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors" style={{ background: checked ? "var(--st-grad)" : "var(--st-border-strong)" }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="absolute inset-0 cursor-pointer opacity-0" />
        <span className="pointer-events-none ml-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }} />
      </span>
      {label && <span className="text-[13.5px] text-st-ink">{label}</span>}
    </label>
  );
}

export function Pill({ tone = "default", children }: { tone?: "default" | "good" | "warn" | "bad" | "brand"; children: React.ReactNode }) {
  const styles = {
    default: { background: "var(--st-panel-2)", color: "var(--st-sub)" },
    good: { background: "var(--st-good-bg)", color: "var(--st-good)" },
    warn: { background: "var(--st-warn-bg)", color: "var(--st-warn)" },
    bad: { background: "var(--st-danger-bg)", color: "var(--st-danger)" },
    brand: { background: "var(--st-grad)", color: "#fff" },
  }[tone];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold" style={styles}>
      {children}
    </span>
  );
}

export function DragHandle(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center text-st-dim active:cursor-grabbing" {...props}>
      <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
        <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" /><circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
      </svg>
    </span>
  );
}

/** ↑/↓ reordering that works without a mouse (keyboard, touch) — pairs with drag, never replaces it. */
export function MoveButtons({ index, length, onMove, onRemove }: { index: number; length: number; onMove: (to: number) => void; onRemove?: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 10V2M2 6l4-4 4 4" /></svg>
      </IconButton>
      <IconButton label="Move down" disabled={index === length - 1} onClick={() => onMove(index + 1)}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 2v8M2 6l4 4 4-4" /></svg>
      </IconButton>
      {onRemove && (
        <IconButton label="Remove" onClick={onRemove}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 2l8 8M10 2l-8 8" /></svg>
        </IconButton>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ drawer */

/** A right-hand panel on desktop, a bottom sheet on phone — for lead detail, item editors, anything that needs room to breathe. */
export function Drawer({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const desktop = useMediaQuery("(min-width: 640px)", true);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`absolute bottom-0 right-0 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[22px] bg-st-bg shadow-2xl sm:top-0 sm:max-h-none sm:rounded-none sm:rounded-l-[22px] ${wide ? "sm:w-[640px]" : "sm:w-[440px]"}`}
            initial={desktop ? { x: "100%" } : { y: "100%" }}
            animate={desktop ? { x: 0 } : { y: 0 }}
            exit={desktop ? { x: "100%" } : { y: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-st-border px-5 py-4">
              <h2 className="font-display text-[16px] font-semibold text-st-ink">{title}</h2>
              <IconButton label="Close" onClick={onClose}>
                <svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ------------------------------------------------------------------ toasts */

type Toast = { id: number; kind: "ok" | "bad"; text: string };
const ToastCtx = createContext<(kind: "ok" | "bad", text: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: "ok" | "bad", text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-xl px-4 py-2.5 text-[13.5px] font-medium text-white shadow-lg" style={{ background: t.kind === "ok" ? "var(--st-indigo)" : "var(--st-danger)" }}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/** A quiet block when the signed-in role isn't allowed here — Owner/Admin/Editor, per the plan in SignIn. */
export function RoleNote({ what }: { what: string }) {
  return (
    <div className="st-card p-6 text-center">
      <p className="text-[13.5px] text-st-sub">{what}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ small helpers */

export const confirmDestroy = (message: string) => (typeof window === "undefined" ? false : window.confirm(message));

export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** "Now", captured once at mount — reading `Date.now()` straight in a render body is impure and flagged by the linter. */
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
