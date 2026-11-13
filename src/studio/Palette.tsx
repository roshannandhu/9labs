"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ROOMS } from "./rooms";
import { useBookRequests, useEnquiries, useQuizResults } from "./state";

type Hit = { key: string; label: string; sub?: string; go: () => void };

/** Ctrl/⌘ K: jump to any room, or find a lead by name, company, e-mail or reference code. */
export function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const enquiries = useEnquiries();
  const bookRequests = useBookRequests();
  const quizResults = useQuizResults();

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the search box fresh each time the palette opens
      setQ("");
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const query = q.trim().toLowerCase();
    const go = (path: string) => () => {
      router.push(path);
      onClose();
    };
    const rooms: Hit[] = ROOMS.filter((r) => !query || r.title.toLowerCase().includes(query)).map((r) => ({ key: r.id, label: r.title, sub: `Room ${r.n}`, go: go(r.path) }));
    if (!query) return rooms.slice(0, 9);

    const leads: Hit[] = [
      ...enquiries
        .filter((e) => [e.name, e.company, e.serviceTitle, e.ref].some((v) => v.toLowerCase().includes(query)))
        .map((e): Hit => ({ key: `e_${e.id}`, label: `${e.name} — ${e.serviceTitle}`, sub: `Enquiry · ${e.ref || "no ref"}`, go: go(`/admin/inbox?q=${encodeURIComponent(e.name)}`) })),
      ...bookRequests
        .filter((r) => [r.name, r.email, r.company, r.bookSlug].some((v) => v.toLowerCase().includes(query)))
        .map((r): Hit => ({ key: `b_${r.id}`, label: `${r.name} — ${r.bookSlug}`, sub: `Book request · ${r.email}`, go: go(`/admin/inbox?q=${encodeURIComponent(r.email)}`) })),
      ...quizResults
        .filter((r) => [r.top, r.email, r.ref].some((v) => v.toLowerCase().includes(query)))
        .map((r): Hit => ({ key: `q_${r.id}`, label: `Quiz — ${r.top}`, sub: r.email || r.ref, go: go(`/admin/inbox?q=${encodeURIComponent(r.email || r.ref)}`) })),
    ].slice(0, 8);

    return [...rooms, ...leads].slice(0, 12);
  }, [q, enquiries, bookRequests, quizResults, router, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[14vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <motion.div role="dialog" aria-modal="true" aria-label="Search" className="st-card relative w-full max-w-[480px] overflow-hidden" initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
                if (e.key === "Enter" && hits[0]) hits[0].go();
              }}
              placeholder="Jump to a room, or find a lead…"
              className="w-full border-0 border-b border-st-border bg-transparent px-4 py-3.5 text-[15px] text-st-ink outline-none placeholder:text-st-dim"
            />
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {hits.length === 0 && <p className="st-help px-3 py-4">Nothing found.</p>}
              {hits.map((h) => (
                <button key={h.key} type="button" onClick={h.go} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-st-panel-2">
                  <span className="truncate text-[13.5px] text-st-ink">{h.label}</span>
                  {h.sub && <span className="shrink-0 text-[11.5px] text-st-dim">{h.sub}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
