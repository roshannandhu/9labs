"use client";

import { useEffect, type RefObject } from "react";
import { getLenis } from "@/lib/scroll";

let locks = 0;
let saved = { body: "", html: "" };

/**
 * Locks page scroll (and Lenis) until the returned function is called. Counted, so two windows open at
 * once (the e-book dialog, then the quiz on top) unlock only when the last one closes — each restoring
 * its own "before" value used to leave the page stuck on `overflow: hidden`.
 */
export function lockScroll(): () => void {
  const html = document.documentElement;
  if (locks++ === 0) {
    saved = { body: document.body.style.overflow, html: html.style.overscrollBehavior };
    document.body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    getLenis()?.stop();
  }
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (--locks > 0) return;
    document.body.style.overflow = saved.body;
    html.style.overscrollBehavior = saved.html;
    getLenis()?.start();
  };
}

const FOCUSABLE = "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * Everything a modal window needs while it's open: page scroll (and Lenis) locked, Escape closes,
 * Tab stays inside `panel`, and focus goes back to where it was on close. `focusFirst` focuses
 * the first field after `delay` ms (off by default: on phones that pops the keyboard unasked).
 */
export function useModalLock(
  open: boolean,
  panel: RefObject<HTMLElement | null>,
  onClose: () => void,
  { focusFirst = false, delay = 300 }: { focusFirst?: boolean; delay?: number } = {},
) {
  useEffect(() => {
    if (!open) return;
    const last = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();

    const t = window.setTimeout(() => {
      const el = panel.current;
      if (!el) return;
      const target = focusFirst ? el.querySelector<HTMLElement>("input, textarea, select") : null;
      (target ?? el).focus({ preventScroll: true });
    }, delay);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (n) => n.offsetParent !== null && !n.closest("[inert], [aria-hidden='true']"),
      );
      if (!f.length) return;
      const first = f[0];
      const lastEl = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      unlock();
      last?.focus?.({ preventScroll: true });
    };
  }, [open, panel, onClose, focusFirst, delay]);
}
