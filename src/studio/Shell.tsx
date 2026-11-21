"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/LogoMark";
import { useTheme } from "@/components/layout/ThemeToggle";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { publicHref } from "@/lib/site-href";
import { checkWorkspace } from "@/lib/checks";
import { hasUnsavedEdits, refreshLeads, signOut, startAuth } from "@/studio/store";
import { setAdminTheme } from "./theme";
import { CommandPalette } from "./CommandPalette";
import { Icon } from "./Icon";
import { ROOMS, roomByPath, type Room, type RoomGroup } from "./rooms";
import { SignIn } from "./SignIn";
import { useAccess, useBookRequests, useDeniedEmail, useDraft, useEnquiries, useQuizResults, useSession, useSync } from "./state";
import { PublishBar } from "./PublishBar";
import { Avatar, ConfirmProvider, IconButton, Kbd, ToastProvider } from "./ui";

const RAIL_KEY = "nl-admin-rail";
const GROUPS: RoomGroup[] = ["Overview", "Content", "System"];

function todayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Small live counters/dots the sidebar shows next to a room — computed once here, read by both the full sidebar and the rail. */
function useRoomBadges() {
  const draft = useDraft();
  const enquiries = useEnquiries();
  const bookRequests = useBookRequests();
  const quizResults = useQuizResults();

  return useMemo(() => {
    const since = todayStart();
    const today = (iso: string) => new Date(iso).getTime() >= since;
    const inboxToday = enquiries.filter((e) => today(e.createdAt)).length + bookRequests.filter((r) => today(r.createdAt)).length + quizResults.filter((r) => today(r.createdAt)).length;
    const missingPdf = draft.site.ebooks.some((b) => b.enabled && !b.pdfFileId);
    const quizErrors = checkWorkspace(draft).some((i) => i.level === "error" && i.path[0] === "site" && i.path[1] === "quiz");
    return { inboxToday, missingPdf, quizErrors };
  }, [draft, enquiries, bookRequests, quizResults]);
}

function NavItem({ room, active, rail, badge, onNavigate }: { room: Room; active: boolean; rail: boolean; badge?: React.ReactNode; onNavigate: () => void }) {
  const link = (
    <Link
      href={room.path}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${rail ? "justify-center px-0" : ""} ${active ? "bg-st-panel-3 text-st-purple" : "text-st-sub hover:bg-st-panel-2 hover:text-st-ink"}`}
    >
      {active && <motion.span layoutId="nav-active" transition={{ type: "spring", stiffness: 500, damping: 40 }} className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-st-grad" aria-hidden="true" />}
      <span className="relative shrink-0">
        <Icon name={room.icon} />
        {badge && rail && <span className="absolute -right-1 -top-1">{badge}</span>}
      </span>
      {!rail && <span className="min-w-0 flex-1 truncate">{room.title}</span>}
      {!rail && badge}
    </Link>
  );
  if (!rail) return link;
  return (
    <span className="group/tip relative">
      {link}
      <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-st-panel-3 px-2 py-1 font-mono text-[10.5px] text-st-ink opacity-0 shadow-[var(--st-shadow)] transition-opacity group-hover/tip:opacity-100">
        {room.title}
      </span>
    </span>
  );
}

function SidebarBody({ pathname, rail, onToggleRail, onNavigate }: { pathname: string; rail: boolean; onToggleRail?: () => void; onNavigate: () => void }) {
  const session = useSession();
  const theme = useTheme();
  const badges = useRoomBadges();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = roomByPath(pathname)?.id;

  const badgeFor = (id: Room["id"]) => {
    if (id === "inbox" && badges.inboxToday > 0) return <span className="st-micro rounded-full bg-st-panel-3 px-1.5 py-0.5 text-[10px] text-st-purple">{badges.inboxToday}</span>;
    if (id === "books" && badges.missingPdf) return <span className="h-2 w-2 shrink-0 rounded-full bg-st-warn" aria-hidden="true" />;
    if (id === "quiz" && badges.quizErrors) return <span className="h-2 w-2 shrink-0 rounded-full bg-st-danger" aria-hidden="true" />;
    return undefined;
  };

  return (
    <div className={`flex h-full shrink-0 flex-col bg-st-panel ${rail ? "w-[68px]" : "w-[248px]"}`}>
      <Link href="/" onClick={onNavigate} className={`flex items-center gap-2.5 px-5 pb-4 pt-5 ${rail ? "justify-center px-0" : ""}`}>
        <LogoMark className="h-6" />
        {!rail && <span className="font-display text-[13px] font-semibold text-st-sub">Nine Labs</span>}
      </Link>

      {!rail && (
        <div className="px-3 pb-2">
          <span className="st-micro mb-1.5 block px-1">Admin</span>
        </div>
      )}

      <nav className="st-scrollbox flex-1 space-y-4 px-3" aria-label="Rooms">
        {GROUPS.map((g) => {
          const rooms = ROOMS.filter((r) => r.group === g);
          return (
            <div key={g}>
              {!rail && <p className="st-micro px-3 pb-1.5">{g}</p>}
              <div className="space-y-0.5">
                {rooms.map((r) => (
                  <NavItem key={r.id} room={r} active={active === r.id} rail={rail} badge={badgeFor(r.id)} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-st-border p-3">
        {onToggleRail && (
          <button type="button" onClick={onToggleRail} className={`mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-medium text-st-dim hover:bg-st-panel-2 hover:text-st-ink ${rail ? "justify-center px-0" : ""}`}>
            <Icon name="chevron" size={14} />
            {!rail && <span>Collapse</span>}
          </button>
        )}
        <a href={publicHref("/")} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-st-sub hover:bg-st-panel-2 hover:text-st-ink ${rail ? "justify-center px-0" : ""}`}>
          <Icon name="external" size={16} />
          {!rail && <span>View website</span>}
        </a>
        {session && (
          <div className="relative mt-1">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-st-panel-2 ${rail ? "justify-center px-0" : ""}`}>
              <Avatar letter={session.email} size={30} />
              {!rail && (
                <>
                  <span className="min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold capitalize text-st-ink">{session.role}</span>
                  <Icon name="chevron" size={12} />
                </>
              )}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute bottom-full left-0 z-20 mb-2 w-[220px] rounded-xl border border-st-border bg-st-panel p-1.5 shadow-[var(--st-shadow)]">
                  <p className="truncate px-2.5 py-1.5 text-[12px] text-st-dim">{session.email}</p>
                  <div className="my-1 flex items-center justify-between rounded-lg px-2.5 py-1.5">
                    <span className="text-[12.5px] text-st-ink">Theme</span>
                    <div className="flex gap-0.5 rounded-full bg-st-panel-2 p-0.5">
                      <button type="button" onClick={() => setAdminTheme("dark")} className={`rounded-full px-2 py-1 text-[11px] font-medium ${theme === "dark" ? "bg-st-grad text-white" : "text-st-dim"}`}>
                        Dark
                      </button>
                      <button type="button" onClick={() => setAdminTheme("light")} className={`rounded-full px-2 py-1 text-[11px] font-medium ${theme === "light" ? "bg-st-grad text-white" : "text-st-dim"}`}>
                        Light
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => signOut()} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-st-sub hover:bg-st-panel-2 hover:text-st-ink">
                    <Icon name="logout" size={14} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileDrawer({ open, pathname, onClose }: { open: boolean; pathname: string; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[150] sm:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden="true" />
          <motion.div role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 shadow-2xl" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
            <SidebarBody pathname={pathname} rail={false} onNavigate={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  const session = useSession();
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <>
      <header className="st-glass flex h-14 shrink-0 items-center gap-3 border-b border-st-border px-4 sm:hidden">
        <IconButton label="Open menu" onClick={onMenu}>
          <Icon name="menu" size={18} />
        </IconButton>
        <LogoMark className="h-5" />
        <span className="flex-1" />
        <IconButton label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={() => setAdminTheme(theme === "dark" ? "light" : "dark")}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
        </IconButton>
        {session && (
          <button type="button" onClick={() => setSheetOpen(true)} aria-label="Account">
            <Avatar letter={session.email} size={30} />
          </button>
        )}
      </header>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {sheetOpen && session && (
              <motion.div className="fixed inset-0 z-[150] sm:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="absolute inset-0 bg-black/45" onClick={() => setSheetOpen(false)} aria-hidden="true" />
                <motion.div role="dialog" aria-modal="true" className="absolute inset-x-0 bottom-0 rounded-t-[22px] bg-st-panel p-5 pb-[max(20px,env(safe-area-inset-bottom))]" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                  <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-st-border-strong" aria-hidden="true" />
                  <div className="flex items-center gap-3">
                    <Avatar letter={session.email} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-st-ink">{session.email}</p>
                      <p className="text-[12px] capitalize text-st-dim">{session.role}</p>
                    </div>
                  </div>
                  <a href={publicHref("/")} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2.5 rounded-xl px-1 py-2.5 text-[13.5px] font-medium text-st-sub">
                    <Icon name="external" size={16} /> View website
                  </a>
                  <button type="button" onClick={() => signOut()} className="flex w-full items-center gap-2.5 rounded-xl px-1 py-2.5 text-left text-[13.5px] font-medium text-st-danger">
                    <Icon name="logout" size={16} /> Sign out
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

const SYNC_LABEL: Record<"saved" | "saving" | "offline" | "conflict", string> = { saved: "Saved", saving: "Saving…", offline: "Offline — retrying", conflict: "Changed elsewhere — reload" };

function SyncStatus() {
  const sync = useSync();
  if (sync === "saved") return null;
  const tone = sync === "conflict" ? "text-st-danger" : sync === "offline" ? "text-st-warn" : "text-st-dim";
  return (
    <span className={`st-micro flex items-center gap-1.5 ${tone}`}>
      {sync === "conflict" ? (
        <button type="button" onClick={() => window.location.reload()} className="underline underline-offset-2">
          {SYNC_LABEL[sync]}
        </button>
      ) : (
        SYNC_LABEL[sync]
      )}
    </span>
  );
}

function TopBar({ pathname }: { pathname: string }) {
  const theme = useTheme();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const room = roomByPath(pathname);
  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <header className="st-glass hidden h-14 shrink-0 items-center gap-3 border-b border-st-border px-6 sm:flex">
      <p className="st-micro flex items-center gap-1.5">
        {crumbs.map((c, i) => (
          <span key={i} className={i === crumbs.length - 1 ? "text-st-ink" : ""}>
            {i > 0 && <span className="mx-1 text-st-dim">/</span>}
            {c}
          </span>
        ))}
        {!room && crumbs.length <= 1 && <span className="text-st-ink">dashboard</span>}
      </p>
      <span className="flex-1" />
      <SyncStatus />
      <span className="st-num text-[12.5px] text-st-dim">{now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
      <IconButton label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={() => setAdminTheme(theme === "dark" ? "light" : "dark")}>
        <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
      </IconButton>
      <a href={publicHref("/")} target="_blank" rel="noopener noreferrer" title="View website" aria-label="View website" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-st-sub transition-colors hover:bg-st-panel-2 hover:text-st-ink">
        <Icon name="external" size={15} />
      </a>
    </header>
  );
}

function BottomTabs({ pathname }: { pathname: string }) {
  const active = roomByPath(pathname)?.id;
  const badges = useRoomBadges();
  return (
    <nav className="st-glass st-scrollbox relative z-50 flex shrink-0 items-center justify-around border-t border-st-border px-1 pb-[env(safe-area-inset-bottom)] sm:hidden" aria-label="Rooms">
      {ROOMS.map((r) => {
        const on = active === r.id;
        const dot = (r.id === "inbox" && badges.inboxToday > 0) || (r.id === "books" && badges.missingPdf) || (r.id === "quiz" && badges.quizErrors);
        return (
          <Link key={r.id} href={r.path} className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium">
            {on && <motion.span layoutId="bottom-active" transition={{ type: "spring", stiffness: 500, damping: 40 }} className="absolute inset-x-5 top-0 h-[2.5px] rounded-full bg-st-grad" aria-hidden="true" />}
            <span className={`relative ${on ? "text-st-purple" : "text-st-dim"}`}>
              <Icon name={r.icon} size={19} />
              {dot && <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-st-warn" aria-hidden="true" />}
            </span>
            <span className={on ? "text-st-ink" : "text-st-dim"}>{r.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function LoadingScreen() {
  return (
    <div className="st-canvas grid h-dvh place-items-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-st-border-strong border-t-st-purple" aria-label="Loading" role="status" />
    </div>
  );
}

function DeniedScreen({ email }: { email: string }) {
  return (
    <div className="st-canvas grid h-dvh place-items-center px-6">
      <div className="st-panel max-w-[420px] p-7 text-center">
        <p className="text-[14px] text-st-ink">
          <span className="font-mono text-st-purple">{email || "This account"}</span> isn&apos;t on the team. Ask the owner to add you in Settings → Team.
        </p>
        <button type="button" onClick={() => void signOut()} className="st-btn st-btn-ghost mt-5">
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const access = useAccess();
  const session = useSession();
  const sync = useSync();
  const deniedEmail = useDeniedEmail();
  // Prerendered at /admin/..., shown at /... on the admin host: drop the prefix so both agree.
  const pathname = usePathname().replace(/^\/admin(?=\/|$)/, "") || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railPref, setRailPref] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const isTabletUp = useMediaQuery("(min-width: 640px)", true);

  useEffect(() => {
    startAuth();
  }, []);

  useEffect(() => {
    if (access !== "ok" || session?.role === "editor") return;
    const tick = () => {
      if (document.visibilityState === "visible") void refreshLeads();
    };
    const interval = window.setInterval(tick, 60_000);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", tick);
    };
  }, [access, session?.role]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedEdits()) return; // also covers an edit still in the 0.8 s save delay
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [sync]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the mobile drawer on every navigation, not a derived render value
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors a browser-only preference (localStorage), read once after mount
      setRailPref(window.localStorage.getItem(RAIL_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleRail = () => {
    setRailPref((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(RAIL_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (access === "loading") return <LoadingScreen />;
  if (access === "signed-out") return <SignIn />;
  if (access === "denied") return <DeniedScreen email={deniedEmail} />;

  const rail = !isDesktop || railPref;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="st-canvas flex h-dvh">
          {isTabletUp && (
            <div className="border-r border-st-border">
              <SidebarBody pathname={pathname} rail={rail} onToggleRail={isDesktop ? toggleRail : undefined} onNavigate={() => {}} />
            </div>
          )}
          <MobileDrawer open={mobileOpen} pathname={pathname} onClose={() => setMobileOpen(false)} />

          <div className="flex min-h-0 flex-1 flex-col">
            <TopBar pathname={pathname} />
            <MobileTopBar onMenu={() => setMobileOpen(true)} />

            <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
              <PublishBar />
              <div className="mx-auto min-w-0 max-w-[1360px] px-4 pb-36 pt-5 sm:px-6 sm:pb-28 sm:pt-6 lg:px-8">
                <AnimatePresence mode="wait">
                  <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

            <BottomTabs pathname={pathname} />
          </div>

          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

          {/* a small, out-of-the-way hint that ⌘K exists; the search affordance itself lives on the Dashboard */}
          <div className="sr-only">
            Press <Kbd>⌘K</Kbd> to search
          </div>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
