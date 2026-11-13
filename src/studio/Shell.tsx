"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/LogoMark";
import { useTheme } from "@/components/layout/ThemeToggle";
import { setTheme } from "@/lib/theme";
import { canRedo, canUndo, redo, signOut, undo } from "@/lib/store";
import { ROOMS, roomByPath } from "./rooms";
import { SignIn } from "./SignIn";
import { useSession, useStoreState } from "./state";
import { PublishBar } from "./PublishBar";
import { Palette } from "./Palette";
import { IconButton, ToastProvider } from "./ui";

function Rail({ pathname }: { pathname: string }) {
  const active = roomByPath(pathname)?.id;
  return (
    <nav className="hidden w-[64px] shrink-0 flex-col items-center gap-1 border-r border-st-border bg-st-panel py-3 sm:flex" aria-label="Rooms">
      {ROOMS.map((r) => (
        <Link
          key={r.id}
          href={r.path}
          title={r.title}
          className={`flex w-12 flex-col items-center gap-0.5 rounded-xl py-2 text-[10.5px] font-semibold transition-colors ${active === r.id ? "bg-st-panel-2 text-st-purple" : "text-st-dim hover:text-st-ink"}`}
        >
          <span className="font-digits text-[13px]">{r.n}</span>
          <span>{r.short}</span>
        </Link>
      ))}
    </nav>
  );
}

function BottomTabs({ pathname }: { pathname: string }) {
  const active = roomByPath(pathname)?.id;
  return (
    <nav className="st-scrollbox flex shrink-0 items-center gap-1 overflow-x-auto border-t border-st-border bg-st-panel px-2 py-1.5 sm:hidden" aria-label="Rooms">
      {ROOMS.map((r) => (
        <Link key={r.id} href={r.path} className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold ${active === r.id ? "bg-st-panel-2 text-st-purple" : "text-st-dim"}`}>
          <span className="font-digits text-[12px]">{r.n}</span>
          <span>{r.short}</span>
        </Link>
      ))}
    </nav>
  );
}

function ThemeSwitch() {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <IconButton label={`Switch to ${next} mode`} onClick={() => setTheme(next)}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        {theme === "dark" ? <circle cx="12" cy="12" r="4.2" /> : <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />}
        {theme === "dark" && <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />}
      </svg>
    </IconButton>
  );
}

function TopBar() {
  const session = useSession();
  const [paletteOpen, setPaletteOpen] = useState(false);
  useStoreState(); // re-render on every store change so the undo buttons stay in sync

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-st-border bg-st-panel px-3.5 sm:px-5">
      <Link href="/admin" className="flex shrink-0 items-center gap-2">
        <LogoMark className="h-5" />
        <span className="hidden font-display text-[13px] font-semibold text-st-sub md:inline">The Bridge</span>
      </Link>

      <button type="button" onClick={() => setPaletteOpen(true)} className="st-field hidden !h-9 max-w-[280px] items-center gap-2 text-left text-st-dim md:flex">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        Search…
        <kbd className="ml-auto rounded border border-st-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <div className="flex-1" />

      <div className="hidden items-center gap-1 sm:flex">
        <IconButton label="Undo" onClick={() => undo()} disabled={!canUndo()}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h7a3 3 0 0 1 0 6H8M3 7l3-3M3 7l3 3" /></svg>
        </IconButton>
        <IconButton label="Redo" onClick={() => redo()} disabled={!canRedo()}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M13 7H6a3 3 0 0 0 0 6h2M13 7l-3-3M13 7l-3 3" /></svg>
        </IconButton>
      </div>

      <IconButton label="Search" onClick={() => setPaletteOpen(true)} className="md:hidden">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </IconButton>

      <ThemeSwitch />

      <PublishBar />

      {session && (
        <div className="hidden items-center gap-2 border-l border-st-border pl-3 sm:flex">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-st-panel-2 text-[12px] font-semibold capitalize text-st-ink">{session.email[0]?.toUpperCase()}</span>
          <div className="leading-tight">
            <p className="text-[12.5px] font-semibold capitalize text-st-ink">{session.role}</p>
          </div>
          <IconButton label="Sign out" onClick={() => signOut()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" /></svg>
          </IconButton>
        </div>
      )}

      <Palette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();

  if (!session) return <SignIn />;

  return (
    <ToastProvider>
      <div className="flex h-dvh flex-col bg-st-bg">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <Rail pathname={pathname} />
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-7 sm:py-7">{children}</div>
          </main>
        </div>
        <BottomTabs pathname={pathname} />
      </div>
    </ToastProvider>
  );
}
