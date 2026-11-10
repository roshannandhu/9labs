"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { navOffset, registerAnchorPrefix } from "@/lib/scroll";
import { site } from "@/content/site";
import { particleBus, heroTarget, picTarget, allNineTarget } from "@/components/particles/bus";

const services = site.services;
const N = services.length; // 9
const AUTOPLAY_MS = 5000;
const HOLD_MS = 6000; // autoplay waits this long after a swipe, tap or click
const PEEK_OPACITY = 0.45; // a card one step away from centre
const PEEK_SCALE = 0.06;

// measured across the whole row so per-card pixel rounding can't add up: one neighbour pair reads
// 992 where the true step is 992.8, which left cards 3–8 "still flying" at rest (faint dust flicker)
// the cards only — the scroller also holds the particle swarm's own canvas
const cardsOf = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>(":scope > .scene-card"));
const cardStep = (el: HTMLElement) => {
  const c = cardsOf(el);
  const first = c[0];
  const last = c[c.length - 1];
  return first && last && c.length > 1 ? (last.offsetLeft - first.offsetLeft) / (c.length - 1) : el.clientWidth;
};
// the carousel's position 0..8, landing exactly on a card when it rests within 2px of it
const posOf = (el: HTMLElement, step: number) => {
  const pos = Math.min(N - 1, Math.max(0, el.scrollLeft / step));
  const near = Math.round(pos);
  return Math.abs(pos - near) * step < 2 ? near : pos;
};

/**
 * The services carousel: a native sideways scroller (CSS snap, free swipe on phones and trackpads,
 * no scroll lock — the page itself scrolls straight past it). Its scroll position `pos` (0..8) is
 * read continuously, and one `sync()` decides what the particle swarm is doing:
 *   - **lead-in** (page scrolling the carousel into view): hero 9 → the current card's object
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
      const target = ((i % N) + N) % N;
      const step = cardStep(el);
      const current = activeRef.current;

      // When looping across boundaries (8 -> 0 or 0 -> 8),
      // perform a graceful 3D depth-slide transition with animated particle flight:
      if (Math.abs(current - target) > 1 && (current === 0 || current === N - 1) && (target === 0 || target === N - 1)) {
        const isForward = target === 0 && current === N - 1;
        const dir = isForward ? 1 : -1;
        const fromIcon = services[current].icon;
        const toIcon = services[target].icon;
        const cards = cardsOf(el);
        const outCard = cards[current];
        const inCard = cards[target];

        setActive(target);
        activeRef.current = target;

        const DURATION = 620;
        const t0 = performance.now();
        let jumped = false;

        const tick = () => {
          const now = performance.now();
          const rawP = Math.min(1, (now - t0) / DURATION);
          // Smooth sine easeInOut
          const ease = 0.5 - 0.5 * Math.cos(rawP * Math.PI);

          particleBus.from = picTarget(fromIcon);
          particleBus.to = picTarget(toIcon);
          particleBus.dir = dir;
          particleBus.u = ease;

          if (rawP < 0.48) {
            if (outCard) {
              const outP = ease / 0.48;
              const rotY = dir * outP * 12;
              const transZ = -outP * 70;
              const scale = 1 - outP * 0.07;
              const opacity = 1 - outP * 0.55;
              outCard.style.transform = `perspective(1200px) translate3d(${-dir * outP * 36}px, 0, ${transZ.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
              outCard.style.opacity = opacity.toFixed(2);
              outCard.style.zIndex = "5";
            }
          } else {
            if (!jumped) {
              jumped = true;
              el.scrollTo({ left: target * step, behavior: "instant" });
            }
            if (inCard) {
              const inRemaining = (1 - ease) / 0.52;
              const rotY = -dir * inRemaining * 12;
              const transZ = -inRemaining * 70;
              const scale = 1 - inRemaining * 0.07;
              const opacity = 1 - inRemaining * 0.55;
              inCard.style.transform = `perspective(1200px) translate3d(${dir * inRemaining * 36}px, 0, ${transZ.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
              inCard.style.opacity = opacity.toFixed(2);
              inCard.style.zIndex = "6";
            }
          }

          if (rawP < 1) {
            requestAnimationFrame(tick);
          } else {
            particleBus.from = picTarget(toIcon);
            particleBus.to = picTarget(toIcon);
            particleBus.u = 0;
            if (outCard) {
              outCard.style.transform = "";
              outCard.style.opacity = "";
              outCard.style.zIndex = "";
            }
            if (inCard) {
              inCard.style.transform = "";
              inCard.style.opacity = "";
              inCard.style.zIndex = "";
            }
            el.dispatchEvent(new Event("scroll"));
          }
        };
        requestAnimationFrame(tick);
        return;
      }

      el.scrollTo({ left: target * step, behavior: "smooth" });
    },
    [scrollerRef],
  );

  useGSAP(() => {
    if (reduced) return;
    const el = scrollerRef.current;
    if (!el) return;
    const cards = cardsOf(el);

    // `offsetLeft` forces layout same as getBoundingClientRect; cards never move relative to the
    // scroller, so this is read once instead of on every scroll event during a swipe
    let step = cardStep(el);
    const onResize = () => {
      step = cardStep(el);
    };
    window.addEventListener("resize", onResize);

    let leadP = 0;
    let finP = 0;
    let lastPos = 0;

    const writeLeadIn = (p: number, idx: number) => {
      particleBus.dir = 1;
      particleBus.from = heroTarget;
      particleBus.to = picTarget(services[idx].icon);
      particleBus.u = p;
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
      const pos = posOf(el, step);
      const phone = window.innerWidth < 640;
      const maxRot = phone ? 8.5 : 13.5;
      const maxZ = phone ? 40 : 75;
      const maxScale = phone ? 0.05 : 0.075;
      const peekOpacity = phone ? 0.52 : 0.45;

      cards.forEach((c, i) => {
        const offset = i - pos;
        const absOffset = Math.abs(offset);
        if (absOffset > 2.2) {
          c.style.opacity = "0";
          c.style.pointerEvents = "none";
          return;
        }
        c.style.pointerEvents = "";
        const clampedOffset = Math.max(-1.5, Math.min(1.5, offset));

        // 3D Orbital curve coordinates:
        // Center card (offset ~ 0): rotY 0, transZ 0, scale 1.0, opacity 1.0
        // Left cards (offset < 0): tilt toward center (+rotY), push back in Z
        // Right cards (offset > 0): tilt toward center (-rotY), push back in Z
        const rotY = -clampedOffset * maxRot;
        const transZ = -Math.min(1.2, absOffset) * maxZ;
        const scale = 1 - Math.min(1.2, absOffset) * maxScale;
        const opacity = Math.max(0.12, 1 - Math.min(1.2, absOffset) * (1 - peekOpacity));
        const zIndex = Math.max(1, 6 - Math.round(absOffset * 2));

        c.style.transform = `perspective(1200px) translate3d(0, 0, ${transZ.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        c.style.opacity = opacity.toFixed(2);
        c.style.zIndex = String(zIndex);
        const isActive = absOffset < 0.28;
        if (c.getAttribute("data-active") !== (isActive ? "true" : "false")) {
          c.setAttribute("data-active", isActive ? "true" : "false");
        }
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
      end: "top 35%",
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
    // the finale sits right under the carousel: flight starts as the cards are genuinely
    // leaving the screen (bottom reaches 55%), landing on the finale "9" as the bottom leaves (10%)
    const fin = ScrollTrigger.create({
      trigger: el,
      start: "bottom 55%",
      end: "bottom 10%",
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
      window.removeEventListener("resize", onResize);
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
    const t = window.setTimeout(() => {
      const next = (activeRef.current + 1) % N;
      goTo(next);
    }, AUTOPLAY_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [running, active, goTo, scrollerRef]);

  const togglePlay = useCallback(() => setPlaying((p) => !p), []);
  return { active, goTo, playing, running, togglePlay };
}
