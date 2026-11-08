"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo } from "@/components/providers/DemoSettings";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Desktop-only neon cursor: a dot plus a lagging ring that grows over interactive
 * elements and shows a context label from `data-cursor` ("Explore", "Open", "Drag"…).
 * Off on touch devices, for reduced motion, or when disabled in the Concept Lab.
 */
export function CustomCursor() {
  const { settings, reduced } = useDemo();
  const fine = useMediaQuery("(pointer: fine) and (hover: hover)");
  const enabled = settings.cursor && fine && !reduced;
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");
    const pos = { x: -100, y: -100, rx: -100, ry: -100 };
    let raf = 0;
    let visible = false;
    let state = "";

    const loop = () => {
      raf = requestAnimationFrame(loop);
      pos.rx += (pos.x - pos.rx) * 0.2;
      pos.ry += (pos.y - pos.ry) * 0.2;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${pos.rx.toFixed(1)}px, ${pos.ry.toFixed(1)}px, 0)`;
    };
    raf = requestAnimationFrame(loop);

    const setState = (s: string, l: string) => {
      if (s === state && ring.current?.dataset.label === l) return;
      state = s;
      if (ring.current) {
        ring.current.dataset.state = s;
        ring.current.dataset.label = l;
      }
      setLabel(l);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!visible) {
        visible = true;
        pos.rx = pos.x;
        pos.ry = pos.y;
        dot.current?.classList.add("is-visible");
        ring.current?.classList.add("is-visible");
      }
      const t = e.target as HTMLElement | null;
      if (!t?.closest) return;
      if (t.closest("input, textarea, select")) return setState("text", "");
      const interactive = t.closest("a, button, [role='button'], label, summary");
      const labelled = t.closest<HTMLElement>("[data-cursor]");
      const l = labelled?.dataset.cursor ?? "";
      if (l && (interactive || l === "Drag")) return setState("label", l);
      setState(interactive ? "hover" : "", "");
    };
    const onLeave = () => {
      visible = false;
      dot.current?.classList.remove("is-visible");
      ring.current?.classList.remove("is-visible");
    };
    const onDown = () => ring.current?.classList.add("is-down");
    const onUp = () => ring.current?.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true">
        <span className="cursor-label">{label}</span>
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
