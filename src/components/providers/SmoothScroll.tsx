"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollToId, setLenis } from "@/lib/scroll";
import { useDemo } from "./DemoSettings";

/**
 * Lenis smooth scrolling synced to GSAP's ticker so ScrollTrigger animations stay locked
 * to the scroll position. Disabled for reduced motion; touch devices keep native scrolling.
 * Also intercepts in-page anchor clicks (`href="#id"`) so they glide and respect the nav.
 */
export function SmoothScroll() {
  const { reduced } = useDemo();

  useEffect(() => {
    if (reduced) {
      setLenis(null);
      return;
    }
    const lenis = new Lenis({
      // lerp is the scroll catch-up rate: lower = floatier (felt "laggy / not in flow"), higher =
      // more connected/direct. Nudged up from 0.09 for a tighter feel. Tune 0.09–0.14 to taste.
      lerp: 0.11,
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, [reduced]);

  // Blocks of the page that are out of view get `data-offscreen`, which pauses their looping CSS
  // animations (globals.css). Off-screen SVG loops still cost a style + layout pass every frame —
  // most of the idle CPU on phones — and nobody can see them. Back in view, the original rules apply.
  const pathname = usePathname();
  useEffect(() => {
    // finer pieces too (sections, activity icons, the bridge): tall blocks are partly in view for long stretches.
    // The bridge root, not its SVGs: phones swap those for the phone drawing right after hydration.
    const blocks = document.querySelectorAll("#main > *, #main section, #main .ai-icon, #main .bridge-story, footer");
    if (!blocks.length || !("IntersectionObserver" in window)) return;
    // a paused loop is still a frame of itself, so it can resume exactly as it scrolls in
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.toggleAttribute("data-offscreen", !e.isIntersecting)));
    blocks.forEach((b) => io.observe(b));
    return () => {
      io.disconnect();
      blocks.forEach((b) => b.removeAttribute("data-offscreen"));
    };
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      if (!id) return;
      if (scrollToId(id)) e.preventDefault();
    };
    document.addEventListener("click", onClick);

    // Honour a hash on first load once layout (and pinning) has settled — only when the link was
    // opened. On a refresh or back/forward the browser has already put the visitor back where they
    // were, and the hash is just left over from an earlier anchor tap (#ebooks after "Download our
    // free e-books"), so jumping there would yank them away from where they were reading.
    const hash = window.location.hash.slice(1);
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const opened = !nav || nav.type === "navigate";
    let t: number | undefined;
    if (hash && opened) t = window.setTimeout(() => scrollToId(hash, { immediate: true }), 600);
    return () => {
      document.removeEventListener("click", onClick);
      if (t) window.clearTimeout(t);
    };
  }, []);

  return null;
}
