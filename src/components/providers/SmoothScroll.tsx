"use client";

import { useEffect } from "react";
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
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.95,
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

    // Honour a hash on first load once layout (and pinning) has settled.
    const hash = window.location.hash.slice(1);
    let t: number | undefined;
    if (hash) t = window.setTimeout(() => scrollToId(hash, { immediate: true }), 600);
    return () => {
      document.removeEventListener("click", onClick);
      if (t) window.clearTimeout(t);
    };
  }, []);

  return null;
}
