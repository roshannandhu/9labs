"use client";

import { useEffect, type RefObject } from "react";
import { getLenis } from "@/lib/scroll";

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
    const lenis = getLenis();
    lenis?.stop();
    const html = document.documentElement;
    const prev = { body: document.body.style.overflow, html: html.style.overscrollBehavior };
    document.body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

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
      document.body.style.overflow = prev.body;
      html.style.overscrollBehavior = prev.html;
      lenis?.start();
      last?.focus?.({ preventScroll: true });
    };
  }, [open, panel, onClose, focusFirst, delay]);
}
