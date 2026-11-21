"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/layout/ThemeToggle";
import { useModalLock } from "@/lib/useModalLock";
import { checkWorkspace } from "@/lib/checks";
import { autoLabel, diffDeep, humanizeDiff } from "@/lib/diff";
import { publish } from "@/studio/store";
import { ApiError } from "./api";
import { setAdminTheme } from "./theme";
import { Icon, type IconName } from "./Icon";
import { KIND_LABEL, toFeed } from "./leads";
import { ROOMS } from "./rooms";
import { useBookRequests, useDraft, useEnquiries, usePendingChanges, usePublished, useQuizResults } from "./state";
import { useToast } from "./ui";

type Hit = { key: string; label: string; sub?: string; icon: IconName; go: () => void };

const SETTINGS_SECTIONS = [
  { id: "company", label: "Company details" },
  { id: "google", label: "Google & tracking" },
  { id: "brand", label: "Brand & theme" },
  { id: "team", label: "Team" },
  { id: "backup", label: "Backup & reset" },
] as const;

/** ⌘K / Ctrl+K: jump to any room or Settings section, find a lead, or run a quick action. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const theme = useTheme();
  const pending = usePendingChanges();
  const draft = useDraft();
  const published = usePublished();
  const enquiries = useEnquiries();
  const bookRequests = useBookRequests();
  const quizResults = useQuizResults();
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useModalLock(open, panelRef, onClose);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the search box and keyboard selection fresh each time the palette opens
      setQ("");
      setIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const go = (path: string) => () => {
      router.push(path);
      onClose();
    };

    const goTo: Hit[] = [
      ...ROOMS.filter((r) => !query || r.title.toLowerCase().includes(query)).map((r): Hit => ({ key: `room_${r.id}`, label: r.title, icon: r.icon, go: go(r.path) })),
      ...SETTINGS_SECTIONS.filter((s) => !query || s.label.toLowerCase().includes(query)).map((s): Hit => ({ key: `settings_${s.id}`, label: s.label, sub: "Settings", icon: "settings", go: go(`/settings?section=${s.id}`) })),
    ];

    const leads: Hit[] = query
      ? toFeed(enquiries, bookRequests, quizResults, draft.site.ebooks)
          .filter((f) => f.search.includes(query) || f.title.toLowerCase().includes(query))
          .slice(0, 8)
          .map((f): Hit => ({ key: `lead_${f.kind}_${f.id}`, label: f.title, sub: `${KIND_LABEL[f.kind]} · ${f.sub}`, icon: f.kind === "enquiry" ? "mail" : f.kind === "book" ? "books" : "quiz", go: go(f.href) }))
      : [];

    const actionList: Hit[] = [
      { key: "action_theme", label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme", icon: theme === "dark" ? "sun" : "moon", go: () => { setAdminTheme(theme === "dark" ? "light" : "dark"); onClose(); } },
      { key: "action_new_book", label: "New book", icon: "plus", go: go("/books?new=1") },
      { key: "action_export", label: "Export the inbox as CSV", icon: "download", go: go("/inbox?export=1") },
    ];
    const hasBlockingErrors = checkWorkspace(draft).some((i) => i.level === "error");
    if (pending > 0 && !hasBlockingErrors) {
      actionList.unshift({
        key: "action_publish",
        label: "Publish changes",
        icon: "check",
        go: () => {
          onClose();
          void (async () => {
            try {
              toast("ok", await publish(humanizeDiff(diffDeep(published, draft), autoLabel).slice(0, 40)));
            } catch (err) {
              if (err instanceof ApiError && err.status === 409) toast("bad", "Someone else changed the draft — reload.");
              else toast("bad", err instanceof Error ? err.message : "Could not publish.");
            }
          })();
        },
      });
    }
    const actions = actionList.filter((a) => !query || a.label.toLowerCase().includes(query));

    return [
      { label: "Go to", hits: goTo },
      { label: "Leads", hits: leads },
      { label: "Actions", hits: actions },
    ].filter((g) => g.hits.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `go`/`router`/`onClose` are stable enough for a palette's lifetime
  }, [q, enquiries, bookRequests, quizResults, draft, published, theme, pending]);

  const flat = useMemo(() => groups.flatMap((g) => g.hits), [groups]);

  return open && typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence>
          <motion.div className="fixed inset-0 z-[220] flex items-start justify-center p-0 sm:items-start sm:p-4 sm:pt-[14vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              className="st-panel relative flex h-dvh w-full flex-col overflow-hidden sm:h-auto sm:max-h-[70vh] sm:max-w-[560px] sm:rounded-2xl"
              initial={{ y: -8, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -8, opacity: 0, scale: 0.98 }}
            >
              <div className="flex shrink-0 items-center gap-2.5 border-b border-st-border px-4">
                <span className="text-st-dim">
                  <Icon name="search" size={16} />
                </span>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") onClose();
                    else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setIndex((i) => Math.min(flat.length - 1, i + 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setIndex((i) => Math.max(0, i - 1));
                    } else if (e.key === "Enter") {
                      flat[index]?.go();
                    }
                  }}
                  placeholder="Jump to a room, find a lead, or run an action…"
                  className="w-full border-0 bg-transparent py-3.5 text-[15px] text-st-ink outline-none placeholder:text-st-dim"
                />
                <kbd className="hidden shrink-0 rounded border border-st-border-strong px-1.5 py-0.5 font-mono text-[10px] text-st-dim sm:block">esc</kbd>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {flat.length === 0 && <p className="st-help px-3 py-6 text-center">Nothing found.</p>}
                {groups.map((g) => (
                  <div key={g.label} className="mb-1">
                    <p className="st-micro px-3 py-1.5">{g.label}</p>
                    {g.hits.map((h) => {
                      const i = flat.indexOf(h);
                      return (
                        <button
                          key={h.key}
                          type="button"
                          onMouseEnter={() => setIndex(i)}
                          onClick={h.go}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${i === index ? "bg-st-panel-3" : "hover:bg-st-panel-2"}`}
                        >
                          <span className="shrink-0 text-st-dim">
                            <Icon name={h.icon} size={16} />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13.5px] text-st-ink">{h.label}</span>
                          {h.sub && <span className="shrink-0 truncate text-[11.5px] text-st-dim">{h.sub}</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )
    : null;
}
