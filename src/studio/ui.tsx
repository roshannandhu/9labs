"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { Icon, type IconName } from "./Icon";
import { SPRING } from "./motion";

/* ------------------------------------------------------------------ layout */

/** A panel: an optional mono micro-label, an optional bigger title, help text, a right slot and a footer. */
export function Panel({
  label,
  title,
  help,
  right,
  footer,
  interactive,
  children,
  className = "",
}: {
  label?: string;
  title?: string;
  help?: string;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`st-panel p-4 transition-shadow sm:p-5 ${interactive ? "hover:shadow-[var(--st-glow)]" : ""} ${className}`}>
      {(label || title || right) && (
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            {label && <p className="st-micro">{label}</p>}
            {title && <h3 className={`font-display text-[15px] font-semibold text-st-ink ${label ? "mt-1" : ""}`}>{title}</h3>}
            {help && <p className="st-help mt-1">{help}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="grid gap-3.5">{children}</div>
      {footer && <div className="mt-4 border-t border-st-border pt-3.5">{footer}</div>}
    </section>
  );
}

/** Kept so older code (the Quiz room) that still imports `Box` keeps compiling: `title` becomes `Panel`'s micro-label. */
export function Box({ title, help, children, right, className = "" }: { title?: string; help?: string; children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <Panel label={title} help={help} right={right} className={className}>
      {children}
    </Panel>
  );
}

export function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${Math.max(140, 320 / cols)}px, 1fr))` }}>{children}</div>;
}

/** Every room opens with this: a title, one plain sentence of what it's for, and optional actions. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-st-ink sm:text-[24px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[62ch] text-[13.5px] text-st-sub">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** An underline tab bar whose indicator slides between tabs. `layoutId` must be unique per tab group on screen. */
export function Tabs<T extends string>({ tabs, active, onChange, layoutId }: { tabs: { id: T; label: string; count?: number; dot?: string }[]; active: T; onChange: (id: T) => void; layoutId: string }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-x-5 gap-y-1 border-b border-st-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap pb-3 text-[13.5px] font-medium transition-colors ${active === t.id ? "text-st-ink" : "text-st-dim hover:text-st-sub"}`}
        >
          {t.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.dot }} aria-hidden="true" />}
          {t.label}
          {t.count !== undefined && <span className="st-num text-[11px] text-st-dim">{t.count}</span>}
          {active === t.id && <motion.span layoutId={layoutId} transition={SPRING} className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-st-grad" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

/** A pill-track switch between a few options, with a sliding thumb. `layoutId` must be unique per group on screen. */
export function Segmented<T extends string>({ options, value, onChange, layoutId, size = "md" }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; layoutId: string; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-7" : "h-9";
  return (
    <div className={`inline-flex w-fit items-center gap-0.5 rounded-full border border-st-border-strong bg-st-panel-2 p-0.5`}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={`relative isolate ${h} rounded-full px-3 text-[12.5px] font-medium transition-colors ${value === o.value ? "text-white" : "text-st-sub hover:text-st-ink"}`}>
          {value === o.value && <motion.span layoutId={layoutId} transition={SPRING} className="absolute inset-0 -z-10 rounded-full bg-st-grad" aria-hidden="true" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ buttons */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "danger" | "ghost"; icon?: React.ReactNode };
export function Button({ variant = "default", icon, className = "", children, ...rest }: BtnProps) {
  const v = variant === "primary" ? "st-btn-primary" : variant === "danger" ? "st-btn-danger" : variant === "ghost" ? "st-btn-ghost" : "";
  return (
    <button type="button" className={`st-btn ${v} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-transparent text-st-sub transition-colors hover:border-st-border-strong hover:bg-st-panel-2 hover:text-st-ink ${className}`} {...rest}>
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

/** The original 5-tone pill — kept with its exact signature so existing callers (the Quiz room) keep compiling. */
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

/** The newer badge: more tones (including a colour per lead type), an optional dot and icon. */
export function Badge({ tone = "default", icon, dot, children }: { tone?: "default" | "good" | "warn" | "danger" | "brand" | "enquiry" | "ebook" | "quiz"; icon?: React.ReactNode; dot?: boolean; children: React.ReactNode }) {
  const styles: Record<string, { bg: string; fg: string }> = {
    default: { bg: "var(--st-panel-3)", fg: "var(--st-sub)" },
    good: { bg: "var(--st-good-bg)", fg: "var(--st-good)" },
    warn: { bg: "var(--st-warn-bg)", fg: "var(--st-warn)" },
    danger: { bg: "var(--st-danger-bg)", fg: "var(--st-danger)" },
    brand: { bg: "var(--st-grad)", fg: "#fff" },
    enquiry: { bg: "color-mix(in oklab, var(--st-series-enquiry) 16%, var(--st-panel-2))", fg: "var(--st-series-enquiry)" },
    ebook: { bg: "color-mix(in oklab, var(--st-series-ebook) 16%, var(--st-panel-2))", fg: "var(--st-series-ebook)" },
    quiz: { bg: "color-mix(in oklab, var(--st-series-quiz) 16%, var(--st-panel-2))", fg: "var(--st-series-quiz)" },
  };
  const s = styles[tone];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: s.bg, color: s.fg }}>
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.fg }} aria-hidden="true" />}
      {icon}
      {children}
    </span>
  );
}

export function DragHandle(props: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center text-st-dim active:cursor-grabbing" {...props}>
      <Icon name="grip" size={14} />
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
          <Icon name="close" size={12} />
        </IconButton>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ small display pieces */

export function LiveDot({ tone = "good" }: { tone?: "good" | "warn" | "danger" | "brand" }) {
  const color = tone === "good" ? "var(--st-good)" : tone === "warn" ? "var(--st-warn)" : tone === "danger" ? "var(--st-danger)" : "var(--st-purple)";
  return <span className="st-pulse inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color, color }} aria-hidden="true" />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-st-border-strong bg-st-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-st-dim">{children}</kbd>;
}

export function Avatar({ letter, size = 32 }: { letter: string; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: "var(--st-grad)" }}>
      {(letter || "?")[0]?.toUpperCase()}
    </span>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: IconName; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      {icon && (
        <span className="grid h-11 w-11 place-items-center rounded-full bg-st-panel-2 text-st-dim">
          <Icon name={icon} size={20} />
        </span>
      )}
      <p className="text-[13.5px] font-medium text-st-ink">{title}</p>
      {text && <p className="max-w-[36ch] text-[12.5px] text-st-dim">{text}</p>}
      {action}
    </div>
  );
}

/** One line of "is this part of the admin OK": an icon, a label, a detail, and an action link/button. */
export function StatusRow({ icon, tone = "good", label, detail, action }: { icon?: IconName; tone?: "good" | "warn" | "danger"; label: string; detail?: string; action?: { label: string; href?: string; onClick?: () => void } }) {
  const color = tone === "good" ? "var(--st-good)" : tone === "warn" ? "var(--st-warn)" : "var(--st-danger)";
  const bg = tone === "good" ? "var(--st-good-bg)" : tone === "warn" ? "var(--st-warn-bg)" : "var(--st-danger-bg)";
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: bg, color }}>
        <Icon name={icon ?? (tone === "good" ? "check" : "alert")} size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-st-ink">{label}</p>
        {detail && <p className="truncate text-[12px] text-st-dim">{detail}</p>}
      </div>
      {action &&
        (action.href ? (
          <Link href={action.href} className="shrink-0 text-[12px] font-medium text-st-purple hover:underline">
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className="shrink-0 text-[12px] font-medium text-st-purple hover:underline">
            {action.label}
          </button>
        ))}
    </div>
  );
}

/** A hover/keyboard-focus tooltip — CSS only, no portal (fine for short labels that fit near their trigger). */
export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-st-panel-3 px-2 py-1 font-mono text-[10.5px] text-st-ink opacity-0 shadow-[var(--st-shadow)] transition-opacity group-hover/tt:opacity-100 group-focus-within/tt:opacity-100">
        {label}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ drawer */

/** A right-hand panel on desktop, a bottom sheet on phone — for lead detail, item editors, anything that needs room to breathe. */
export function Drawer({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  const desktop = useMediaQuery("(min-width: 640px)", true);
  // Escape closes it, unless a dialog opened on top (a confirm) handles Escape first
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`absolute bottom-0 right-0 flex max-h-[92dvh] w-full flex-col overflow-clip rounded-t-[22px] bg-st-bg shadow-2xl sm:top-0 sm:max-h-none sm:rounded-none sm:rounded-l-[22px] sm:border-l sm:border-st-border ${wide ? "sm:w-[720px]" : "sm:w-[480px]"}`}
            initial={desktop ? { x: "100%" } : { y: "100%" }}
            animate={desktop ? { x: 0 } : { y: 0 }}
            exit={desktop ? { x: "100%" } : { y: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {!desktop && <span className="mx-auto mt-2.5 block h-1 w-10 shrink-0 rounded-full bg-st-border-strong" aria-hidden="true" />}
            <div className="flex shrink-0 items-center justify-between border-b border-st-border px-5 py-4">
              <h2 className="font-display text-[16px] font-semibold text-st-ink">{title}</h2>
              <IconButton label="Close" onClick={onClose}>
                <Icon name="close" size={14} />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="shrink-0 border-t border-st-border bg-st-panel px-5 py-4">{footer}</div>}
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
      {typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4">
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  className="pointer-events-auto flex items-center gap-2 rounded-xl border-l-[3px] bg-st-panel px-4 py-2.5 text-[13.5px] font-medium text-st-ink shadow-[var(--st-shadow)]"
                  style={{ borderLeftColor: t.kind === "ok" ? "var(--st-purple)" : "var(--st-danger)" }}
                >
                  {t.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ------------------------------------------------------------------ confirm dialog (replaces window.confirm) */

type ConfirmOpts = { title: string; body: string; confirmLabel?: string; danger?: boolean; typeToConfirm?: string };
type ConfirmState = ConfirmOpts & { resolve: (v: boolean) => void };
const ConfirmCtx = createContext<(opts: ConfirmOpts) => Promise<boolean>>(async () => false);

/** Renders the confirm dialog and provides `useConfirm()` — an async, Promise-based replacement for `window.confirm`. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [typed, setTyped] = useState("");
  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => { setTyped(""); setState({ ...opts, resolve }); }), []);
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  const blocked = !!state?.typeToConfirm && typed !== state.typeToConfirm;
  // Escape = Cancel. Capture phase + preventDefault, so a drawer under this dialog stays open.
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      state.resolve(false);
      setState(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [state]);
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {state && (
              <motion.div className="fixed inset-0 z-[180] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => close(false)} aria-hidden="true" />
                <motion.div
                  role="alertdialog"
                  aria-modal="true"
                  aria-label={state.title}
                  className="st-panel relative w-full max-w-[400px] p-5"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                >
                  <h2 className="font-display text-[16px] font-semibold text-st-ink">{state.title}</h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-st-sub">{state.body}</p>
                  {state.typeToConfirm && (
                    <input
                      autoFocus
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      placeholder={`Type ${state.typeToConfirm} to confirm`}
                      className="st-field mt-3.5 font-mono"
                    />
                  )}
                  <div className="mt-5 flex justify-end gap-2">
                    <Button onClick={() => close(false)}>Cancel</Button>
                    <Button variant={state.danger ? "danger" : "primary"} disabled={blocked} onClick={() => close(true)}>
                      {state.confirmLabel ?? "Confirm"}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </ConfirmCtx.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmCtx);

/** A quiet block when the signed-in role isn't allowed here — Owner/Admin/Editor, per the plan in SignIn. */
export function RoleNote({ what }: { what: string }) {
  return (
    <div className="st-card p-6 text-center">
      <p className="text-[13.5px] text-st-sub">{what}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ small helpers */

/** Kept, unused: every destructive action now goes through `useConfirm()` instead of `window.confirm`. */
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
