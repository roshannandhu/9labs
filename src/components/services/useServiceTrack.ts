"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { navOffset, registerAnchorPrefix } from "@/lib/scroll";
import { site } from "@/content/site";
import { particleBus, heroTarget, digitTarget, picTarget, allNineTarget } from "@/components/particles/bus";

const services = site.services;
const N = services.length; // 9
const AUTOPLAY_MS = 5000;
const HOLD_MS = 6000; // autoplay waits this long after a swipe, tap or click
const PEEK_OPACITY = 0.45; // a card one step away from centre
const PEEK_SCALE = 0.06;

const cardStep = (el: HTMLElement) => {
  const [a, b] = el.children as unknown as HTMLElement[];
  return a && b ? b.offsetLeft - a.offsetLeft : el.clientWidth;
};

/**
 * The services carousel: a native sideways scroller (CSS snap, free swipe on phones and trackpads,
 * no scroll lock — the page itself scrolls straight past it). Its scroll position `pos` (0..8) is
 * read continuously, and one `sync()` decides what the particle swarm is doing:
 *   - **lead-in** (page scrolling the carousel into view): hero 9 → the current card's digit → its object
 *   - **carousel**: object → object, following the swipe frame by frame, reversible
 *   - **finale** (page scrolling on past it): the current object → the "all nine" 9
 * It also dims and shrinks the cards either side of the one in focus (the peek), auto-advances
 * every few seconds (pausable, holds while the visitor is interacting, fades back to the first card
 * after the last), and resolves `#service-<slug>` links to the right card.
 */
export function useServiceTrack(scrollerRef: RefObject<HTMLElement | null>) {
  const { reduced } = useDemo();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);
  const activeRef = useRef(0);

  const goTo = useCallback(
    (i: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({ left: Math.max(0, Math.min(N - 1, i)) * cardStep(el), behavior: "smooth" });
    },
    [scrollerRef],
  );

  useGSAP(() => {
    if (reduced) return;
    const el = scrollerRef.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];

    let leadP = 0;
    let finP = 0;
    let lastPos = 0;

    const writeLeadIn = (p: number, idx: number) => {
      particleBus.dir = 1;
      if (p < 0.5) {
        particleBus.from = heroTarget;
        particleBus.to = digitTarget(idx + 1);
        particleBus.u = p / 0.5;
      } else {
        particleBus.from = digitTarget(idx + 1);
        particleBus.to = picTarget(services[idx].icon);
        particleBus.u = (p - 0.5) / 0.5;
      }
    };
    const writeTrack = (pos: number) => {
      const dir = pos >= lastPos ? 1 : -1;
      lastPos = pos;
      const index = Math.min(N - 1, Math.floor(pos));
      const frac = pos - index;
      const toIndex = Math.min(N - 1, index + 1);
      if (frac <= 0.001 || frac >= 0.999) {
        const at = picTarget(services[frac >= 0.999 ? toIndex : index].icon);
        particleBus.from = at;
        particleBus.to = at;
        particleBus.u = 0;
      } else {
        particleBus.from = picTarget(services[index].icon);
        particleBus.to = picTarget(services[toIndex].icon);
        particleBus.dir = dir;
        particleBus.u = frac;
      }
    };
    const writeFinale = (p: number, idx: number) => {
      particleBus.dir = 1;
      particleBus.from = picTarget(services[idx].icon);
      particleBus.to = allNineTarget;
      particleBus.u = p;
    };

    const sync = () => {
      const pos = Math.min(N - 1, Math.max(0, el.scrollLeft / cardStep(el)));
      cards.forEach((c, i) => {
        const d = Math.min(1, Math.abs(i - pos));
        c.style.opacity = String(1 - d * (1 - PEEK_OPACITY));
        c.style.transform = `scale(${1 - d * PEEK_SCALE})`;
      });
      const idx = Math.round(pos);
      if (leadP < 1) writeLeadIn(leadP, idx);
      else if (finP > 0) writeFinale(finP, idx);
      else writeTrack(pos);
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
    };

    const leadIn = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "top 25%",
      scrub: true,
      onUpdate: (s) => {
        leadP = s.progress;
        sync();
      },
      onRefresh: (s) => {
        leadP = s.progress;
        sync();
      },
    });
    // the finale sits right under the carousel, so its flight waits until the card itself starts
    // leaving the screen, and lands as the finale "9" comes up into view
    const fin = ScrollTrigger.create({
      trigger: el,
      start: "center 35%",
      end: "bottom 15%",
      scrub: true,
      onUpdate: (s) => {
        finP = s.progress;
        sync();
      },
      onRefresh: (s) => {
        finP = s.progress;
        sync();
      },
    });
    el.addEventListener("scroll", sync, { passive: true });
    sync();

    // every card shares the carousel's place on the page: land there, and slide to the card
    const unregisterAnchor = registerAnchorPrefix("service-", (id) => {
      const i = services.findIndex((s) => `service-${s.slug}` === id);
      if (i < 0) return null;
      goTo(i);
      return Math.max(0, el.getBoundingClientRect().top + window.scrollY - navOffset() + 1);
    });

    return () => {
      leadIn.kill();
      fin.kill();
      el.removeEventListener("scroll", sync);
      unregisterAnchor();
    };
  }, [reduced]);

  // autoplay only while the carousel is mostly on screen and the tab is showing; it holds while
  // keyboard focus is inside, and for a few seconds after any swipe, tap or click on it
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || reduced) return;
    let onScreen = false;
    let focused = false;
    let touchedUntil = 0;
    let release: number | undefined;
    const updateView = () => setInView(onScreen && !document.hidden);
    const updateHold = () => setHeld(focused || Date.now() < touchedUntil);
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        updateView();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    const onTouch = () => {
      touchedUntil = Date.now() + HOLD_MS;
      updateHold();
      window.clearTimeout(release);
      release = window.setTimeout(updateHold, HOLD_MS + 50);
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) onTouch();
    };
    const onFocusIn = (e: FocusEvent) => {
      focused = (e.target as Element).matches?.(":focus-visible") ?? false;
      updateHold();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (el.contains(e.relatedTarget as Node | null)) return;
      focused = false;
      updateHold();
    };
    document.addEventListener("visibilitychange", updateView);
    el.addEventListener("pointerdown", onTouch, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      io.disconnect();
      window.clearTimeout(release);
      document.removeEventListener("visibilitychange", updateView);
      el.removeEventListener("pointerdown", onTouch);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, [scrollerRef, reduced]);

  const running = !reduced && playing && !held && inView;
  useEffect(() => {
    if (!running) return;
    const el = scrollerRef.current;
    if (!el) return;
    let back: number | undefined;
    const t = window.setTimeout(() => {
      const next = activeRef.current + 1;
      if (next < N) return goTo(next);
      // past the last card: a quick fade back to the first, rather than sweeping past all nine
      el.style.transition = "opacity 0.3s ease";
      el.style.opacity = "0";
      back = window.setTimeout(() => {
        el.scrollTo({ left: 0, behavior: "instant" });
        el.style.opacity = "";
      }, 320);
    }, AUTOPLAY_MS);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(back);
      el.style.opacity = ""; // never left faded out if interrupted mid-fade
    };
  }, [running, active, goTo, scrollerRef]);

  const togglePlay = useCallback(() => setPlaying((p) => !p), []);
  return { active, goTo, playing, running, togglePlay };
}
