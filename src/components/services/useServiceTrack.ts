"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
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

// measured across the whole row so per-card pixel rounding can't add up
const cardsOf = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>(":scope > .scene-card"));
const cardStep = (el: HTMLElement) => {
  const c = cardsOf(el);
  const first = c[0];
  const last = c[c.length - 1];
  return first && last && c.length > 1 ? (last.offsetLeft - first.offsetLeft) / (c.length - 1) : el.clientWidth;
};
// the carousel's position 0..8, continuously interpolated for silky smooth particle coordination
const posOf = (el: HTMLElement, step: number) => {
  return Math.min(N - 1, Math.max(0, el.scrollLeft / step));
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
  const syncRef = useRef<(() => void) | null>(null);
  const loopStateRef = useRef({ p: 0 });
  const isLoopingRef = useRef(false);

  const goTo = useCallback(
    (i: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const target = ((i % N) + N) % N;
      const step = cardStep(el);
      const current = activeRef.current;

      // Cancel any in-flight loop or scroll tween cleanly
      gsap.killTweensOf(loopStateRef.current);
      gsap.killTweensOf(el);
      isLoopingRef.current = false;

      // When looping across boundaries (8 -> 0 or 0 -> 8),
      // perform an orbital horizontal glide synced on GSAP ticker with animated particle flight:
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
        isLoopingRef.current = true;
        loopStateRef.current.p = 0;
        let jumped = false;

        gsap.to(loopStateRef.current, {
          p: 1,
          duration: 0.62,
          ease: "sine.inOut",
          onUpdate: () => {
            const ease = loopStateRef.current.p;
            particleBus.from = picTarget(fromIcon);
            particleBus.to = picTarget(toIcon);
            particleBus.dir = dir;
            particleBus.u = ease;

            if (ease < 0.48) {
              if (outCard) {
                const outP = ease / 0.48;
                const yArc = outP * 16;
                const scale = 1 - outP * 0.06;
                const opacity = 1 - outP * 0.52;
                outCard.style.transform = `translate3d(${(-dir * outP * 42).toFixed(1)}px, ${yArc.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
                outCard.style.opacity = opacity.toFixed(2);
              }
            } else {
              if (!jumped) {
                jumped = true;
                el.scrollTo({ left: target * step, behavior: "instant" });
              }
              if (inCard) {
                const inRemaining = (1 - ease) / 0.52;
                const yArc = inRemaining * 16;
                const scale = 1 - inRemaining * 0.06;
                const opacity = 1 - inRemaining * 0.52;
                inCard.style.transform = `translate3d(${(dir * inRemaining * 42).toFixed(1)}px, ${yArc.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
                inCard.style.opacity = opacity.toFixed(2);
              }
            }
          },
          onComplete: () => {
            isLoopingRef.current = false;
            particleBus.from = picTarget(toIcon);
            particleBus.to = picTarget(toIcon);
            particleBus.u = 0;
            if (outCard) {
              outCard.style.transform = "";
              outCard.style.opacity = "";
            }
            if (inCard) {
              inCard.style.transform = "";
              inCard.style.opacity = "";
            }
            syncRef.current?.();
          },
        });
        return;
      }

      // For standard card-to-card navigation (0->1, 1->2, 2->3, etc., or backward):
      // Temporarily disable CSS snap to eliminate browser engine collision/stutter,
      // and animate scrollLeft smoothly using GSAP:
      const prevSnap = el.style.scrollSnapType;
      el.style.scrollSnapType = "none";
      const targetScroll = Math.round(target * step);
      const currentScroll = el.scrollLeft;
      const dist = Math.abs(targetScroll - currentScroll);
      const duration = Math.min(0.85, Math.max(0.62, 0.62 + (dist / step - 1) * 0.08));

      gsap.to(el, {
        scrollLeft: targetScroll,
        duration,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => {
          syncRef.current?.();
        },
        onComplete: () => {
          el.style.scrollSnapType = prevSnap || "";
          syncRef.current?.();
        },
      });
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
    let dirty = false;

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
      if (frac <= 0.002 || frac >= 0.998) {
        const at = picTarget(services[frac >= 0.998 ? toIndex : index].icon);
        particleBus.from = at;
        particleBus.to = at;
        particleBus.u = 0;
      } else {
        particleBus.from = picTarget(services[index].icon);
        particleBus.to = picTarget(services[toIndex].icon);
        particleBus.dir = dir;
        // Continuous linear normalization between rest deadbands to eliminate pop
        particleBus.u = (frac - 0.002) / (0.998 - 0.002);
      }
    };
    const writeFinale = (p: number, idx: number) => {
      particleBus.dir = 1;
      particleBus.from = picTarget(services[idx].icon);
      particleBus.to = allNineTarget;
      particleBus.u = p;
    };

    const sync = () => {
      dirty = false;
      if (isLoopingRef.current) return;
      const pos = posOf(el, step);
      const phone = window.innerWidth < 640;
      const maxArc = phone ? 12 : 18;
      const maxScale = phone ? 0.05 : PEEK_SCALE;
      const peekOpacity = phone ? 0.52 : PEEK_OPACITY;

      cards.forEach((c, i) => {
        const offset = i - pos;
        const absOffset = Math.abs(offset);
        if (absOffset > 2.2) {
          if (c.style.opacity !== "0") {
            c.style.opacity = "0";
            c.style.pointerEvents = "none";
          }
          return;
        }
        if (c.style.pointerEvents !== "") c.style.pointerEvents = "";
        const clampedAbs = Math.min(1.2, absOffset);

        // Flat Apple orbital arc without 3D perspective skew or stacking-context churn
        const yArc = clampedAbs * maxArc;
        const scale = 1 - clampedAbs * maxScale;
        const opacity = Math.max(0.18, 1 - clampedAbs * (1 - peekOpacity));

        const transformStr = `translate3d(0, ${yArc.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        const opacityStr = opacity.toFixed(2);

        if (c.style.transform !== transformStr) c.style.transform = transformStr;
        if (c.style.opacity !== opacityStr) c.style.opacity = opacityStr;
        const isActive = absOffset < 0.28;
        if (c.getAttribute("data-active") !== (isActive ? "true" : "false")) {
          c.setAttribute("data-active", isActive ? "true" : "false");
        }
        // the card one step away reads its own number + name at the edge that's actually
        // peeking into view (the visible sliver is the near edge, not the card's own centre)
        const peekSide = absOffset > 0.5 && absOffset < 1.65 ? (offset < 0 ? "left" : "right") : "";
        if ((c.getAttribute("data-peek") || "") !== peekSide) {
          if (peekSide) c.setAttribute("data-peek", peekSide);
          else c.removeAttribute("data-peek");
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
    syncRef.current = sync;

    const markDirty = () => {
      dirty = true;
    };
    const onTick = () => {
      if (dirty) sync();
    };
    // Prioritized so manual scroll state commits before ParticleStage.frame() on the same VSync tick
    gsap.ticker.add(onTick, false, true);

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
    el.addEventListener("scroll", markDirty, { passive: true });
    sync();

    // Mouse drag support + gentle trackpad settle on fine-pointer desktop/laptop
    let isMouseDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasDragged = false;
    let lastDragX = 0;
    let dragVelocity = 0;
    let lastDragTime = 0;
    let wheelTimer: number | undefined;
    let wheelAnchorIdx = 0;

    const settleWheel = () => {
      wheelTimer = undefined;
      if (isMouseDown || isLoopingRef.current) return;
      const curPos = posOf(el, step);
      const diff = curPos - wheelAnchorIdx;
      let targetIdx: number;
      if (Math.abs(diff) >= 0.12 && Math.abs(diff) < 0.55) {
        targetIdx = wheelAnchorIdx + (diff > 0 ? 1 : -1);
      } else {
        targetIdx = Math.round(curPos);
      }
      targetIdx = Math.max(0, Math.min(N - 1, targetIdx));
      const targetLeft = Math.round(targetIdx * step);
      if (Math.abs(el.scrollLeft - targetLeft) < 2) {
        sync();
        return;
      }
      gsap.to(el, {
        scrollLeft: targetLeft,
        duration: 0.48,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => sync(),
        onComplete: () => sync(),
      });
    };

    const onTrackpadWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      if (!window.matchMedia("(min-width: 640px) and (pointer: fine)").matches) return;
      if (wheelTimer === undefined) {
        wheelAnchorIdx = Math.round(el.scrollLeft / step);
      }
      gsap.killTweensOf(loopStateRef.current);
      gsap.killTweensOf(el);
      isLoopingRef.current = false;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(settleWheel, 160);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("button") || target?.closest("a") || target?.closest("input")) return;

      isMouseDown = true;
      hasDragged = false;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      lastDragX = e.clientX;
      lastDragTime = performance.now();
      dragVelocity = 0;
      window.clearTimeout(wheelTimer);
      wheelTimer = undefined;
      gsap.killTweensOf(loopStateRef.current);
      gsap.killTweensOf(el);
      isLoopingRef.current = false;
      el.style.scrollSnapType = "none";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - startX;
      if (!hasDragged && Math.abs(dx) > 6) {
        hasDragged = true;
      }
      if (hasDragged) {
        el.scrollLeft = startScrollLeft - dx;
        const now = performance.now();
        const dt = now - lastDragTime;
        if (dt > 10) {
          dragVelocity = (e.clientX - lastDragX) / dt;
          lastDragX = e.clientX;
          lastDragTime = now;
        }
        sync();
      }
    };

    const onMouseUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      if (hasDragged) {
        const currentPos = el.scrollLeft / step;
        let targetIdx: number;
        if (dragVelocity < -0.35) {
          targetIdx = Math.ceil(currentPos);
        } else if (dragVelocity > 0.35) {
          targetIdx = Math.floor(currentPos);
        } else {
          targetIdx = Math.round(currentPos);
        }
        targetIdx = Math.max(0, Math.min(N - 1, targetIdx));

        gsap.to(el, {
          scrollLeft: Math.round(targetIdx * step),
          duration: 0.55,
          ease: "power2.out",
          overwrite: "auto",
          onUpdate: () => sync(),
          onComplete: () => {
            el.style.scrollSnapType = "";
            sync();
          },
        });
      } else {
        el.style.scrollSnapType = "";
      }
    };

    el.addEventListener("wheel", onTrackpadWheel, { passive: true });
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // every card shares the carousel's place on the page: land there, and slide to the card
    const unregisterAnchor = registerAnchorPrefix("service-", (id) => {
      const i = services.findIndex((s) => `service-${s.slug}` === id);
      if (i < 0) return null;
      goTo(i);
      return Math.max(0, el.getBoundingClientRect().top + window.scrollY - navOffset() + 1);
    });

    return () => {
      syncRef.current = null;
      isLoopingRef.current = false;
      gsap.killTweensOf(loopStateRef.current);
      gsap.killTweensOf(el);
      gsap.ticker.remove(onTick);
      leadIn.kill();
      fin.kill();
      window.clearTimeout(wheelTimer);
      el.removeEventListener("scroll", markDirty);
      el.removeEventListener("wheel", onTrackpadWheel);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
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
      gsap.killTweensOf(el);
      el.style.scrollSnapType = "";
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
