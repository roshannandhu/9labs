"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { navOffset, registerAnchorPrefix } from "@/lib/scroll";
import type { Service } from "@/content/site";
import { particleBus, heroTarget, picTarget, allNineTarget } from "@/components/particles/bus";

const N = 9; // the nine cards are reorderable (The 9 cards), but there are always exactly nine
const AUTOPLAY_MS = 5000;
const HOLD_MS = 6000; // autoplay waits this long after a swipe, tap or click
const PEEK_OPACITY = 0.45; // a card one step away from centre
const PEEK_SCALE = 0.06;

/** Laptop/tablet: OrbitGear sits left of the horizontal card row; phone keeps OrbitArc below.
 * Same query as the orbit `@media` block in globals.css — keep the two in step. */
export const ORBIT_MQ = "(min-width: 768px) and (min-height: 560px)";
/** one notch of the OrbitGear icon wheel */
export const NOTCH = (2 * Math.PI) / N;
/** shortest signed distance round the ring of nine, in [-4.5, 4.5) */
export const ringOffset = (d: number) => ((((d % N) + N + N / 2) % N) - N / 2);

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
export function useServiceTrack(scrollerRef: RefObject<HTMLElement | null>, services: Service[]) {
  const { reduced } = useDemo();
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);
  const activeRef = useRef(0);
  const posRef = useRef(0); // continuous across 0..8 and across 8 <-> 9 / 0 <-> -1 wrap glides for OrbitGear
  const syncRef = useRef<(() => void) | null>(null);
  const cancelLoopRef = useRef<(() => void) | null>(null);
  const loopStateRef = useRef({ p: 0 });
  const loopMetaRef = useRef<{ anchor: number; d: number; prevSnap: string } | null>(null);
  const isLoopingRef = useRef(false);
  const wideRef = useRef(false);

  const goTo = useCallback(
    (i: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const target = ((i % N) + N) % N;
      const step = cardStep(el);

      // Cancel any in-flight loop or scroll tween cleanly and commit any mid-wrap card first
      gsap.killTweensOf(loopStateRef.current);
      gsap.killTweensOf(el);
      cancelLoopRef.current?.();

      const current = activeRef.current;
      const d = ringOffset(target - current);
      const crossesSeam = Math.abs(d) > 0.001 && (current + d < 0 || current + d >= N);

      // Crossing the 9 <-> 1 seam (forward or backward): glide cards a true full card step around
      // the circular ring while driving continuous OrbitGear posRef and adjacent-card particles
      if (crossesSeam) {
        const anchorIdx = current;
        const dir = d > 0 ? 1 : -1;
        const totalSteps = Math.abs(d);
        const prevSnap = el.style.scrollSnapType;
        el.style.scrollSnapType = "none";
        el.scrollTo({ left: anchorIdx * step, behavior: "instant" });

        setActive(target);
        activeRef.current = target;
        isLoopingRef.current = true;
        loopMetaRef.current = { anchor: anchorIdx, d, prevSnap };
        loopStateRef.current.p = 0;

        const cards = cardsOf(el);
        const phone = window.innerWidth < 640;
        const maxArc = phone ? 12 : 18;
        const maxScale = phone ? 0.05 : PEEK_SCALE;
        const peekOpacity = phone ? 0.52 : PEEK_OPACITY;
        const duration = Math.min(0.85, Math.max(0.62, 0.62 + (totalSteps - 1) * 0.08));

        gsap.to(loopStateRef.current, {
          p: 1,
          duration,
          ease: "power2.out",
          onUpdate: () => {
            const p = loopStateRef.current.p;
            const visPos = anchorIdx + d * p;
            posRef.current = visPos;

            // Fly particle swarm continuously across the currently active 1-step icon pair
            const traveled = p * totalSteps;
            const segIdx = Math.min(Math.floor(traveled), Math.ceil(totalSteps) - 1);
            const rawU = traveled - segIdx;
            const segFrom = (((anchorIdx + dir * segIdx) % N) + N) % N;
            const segTo = (((anchorIdx + dir * (segIdx + 1)) % N) + N) % N;
            particleBus.from = picTarget(services[segFrom].icon);
            particleBus.to = picTarget(services[segTo].icon);
            particleBus.dir = dir;
            particleBus.u = Math.max(0, Math.min(1, rawU));

            const edgeIn = Math.min(1, p / 0.2);
            const edgeOut = p > 0.65 ? Math.max(0, 1 - (p - 0.65) / 0.35) : 1;

            cards.forEach((c, idx) => {
              const offset = ringOffset(idx - visPos);
              const absOffset = Math.abs(offset);
              if (absOffset > 2.2) {
                if (c.style.opacity !== "0") {
                  c.style.opacity = "0";
                  c.style.pointerEvents = "none";
                }
                if (c.style.transform !== "") c.style.transform = "";
                if (c.getAttribute("data-active") !== "false") c.setAttribute("data-active", "false");
                return;
              }
              if (c.style.pointerEvents !== "") c.style.pointerEvents = "";
              const clampedAbs = Math.min(1.2, absOffset);
              const yArc = clampedAbs * maxArc;
              const scale = 1 - clampedAbs * maxScale;
              let opacity = Math.max(0.18, 1 - clampedAbs * (1 - peekOpacity));

              // Smooth alpha for cards whose circular ring slot differs from their linear DOM slot at start/end
              const wrappedStart = Math.abs((idx - anchorIdx) - ringOffset(idx - anchorIdx)) > 0.1;
              const wrappedEnd = Math.abs((idx - target) - ringOffset(idx - target)) > 0.1;
              if (wrappedStart) opacity *= edgeIn;
              if (wrappedEnd) opacity *= edgeOut;

              const dx = (offset - (idx - anchorIdx)) * step;
              c.style.transform = `translate3d(${dx.toFixed(1)}px, ${yArc.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
              c.style.opacity = opacity.toFixed(2);
              const isActive = absOffset < 0.28;
              if (c.getAttribute("data-active") !== (isActive ? "true" : "false")) {
                c.setAttribute("data-active", isActive ? "true" : "false");
              }
            });
          },
          onComplete: () => {
            isLoopingRef.current = false;
            loopMetaRef.current = null;
            cards.forEach((c) => {
              c.style.transform = "";
              c.style.opacity = "";
              c.style.pointerEvents = "";
            });
            el.scrollTo({ left: target * step, behavior: "instant" });
            el.style.scrollSnapType = prevSnap || "";
            posRef.current = target;
            const toIcon = services[target].icon;
            particleBus.from = picTarget(toIcon);
            particleBus.to = picTarget(toIcon);
            particleBus.u = 0;
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
    [scrollerRef, services],
  );

  useGSAP(() => {
    if (reduced) return;
    const el = scrollerRef.current;
    if (!el) return;
    const cards = cardsOf(el);

    // `offsetLeft` forces layout same as getBoundingClientRect; cards never move relative to the
    // scroller, so this is read once instead of on every scroll event during a swipe
    let step = cardStep(el);
    const mq = window.matchMedia(ORBIT_MQ);
    let wide = mq.matches;
    wideRef.current = wide;

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
      posRef.current = pos;
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
          if (c.style.transform !== "") c.style.transform = "";
          if (c.getAttribute("data-active") !== "false") c.setAttribute("data-active", "false");
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

    const cancelActiveLoop = () => {
      if (!isLoopingRef.current) return;
      gsap.killTweensOf(loopStateRef.current);
      isLoopingRef.current = false;
      cards.forEach((c) => {
        c.style.transform = "";
        c.style.opacity = "";
        c.style.pointerEvents = "";
      });
      const meta = loopMetaRef.current;
      loopMetaRef.current = null;
      if (meta) {
        const s = cardStep(el);
        const commitIdx = ((Math.round(meta.anchor + meta.d * loopStateRef.current.p) % N) + N) % N;
        el.scrollTo({ left: commitIdx * s, behavior: "instant" });
        el.style.scrollSnapType = meta.prevSnap || "";
        posRef.current = commitIdx;
      }
      sync();
    };
    cancelLoopRef.current = cancelActiveLoop;

    const onResize = () => {
      step = cardStep(el);
      sync();
    };
    window.addEventListener("resize", onResize);

    // crossing the breakpoint (window resize, tablet rotation) updates edge-wrap eligibility & step width
    const onMode = () => {
      wide = mq.matches;
      wideRef.current = wide;
      cancelActiveLoop();
      step = cardStep(el);
      sync();
    };
    mq.addEventListener("change", onMode);

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
    let wheelPush = 0; // orbit: how hard a swipe pushes past the first/last card (loops round)
    let dragAnchorIdx = 0;
    let lastMoveX = 0;

    // Pushing on past the last card wraps smoothly to the first (and back again) across all devices
    const loopFromEdge = (anchor: number, push: number, threshold: number) => {
      const cur = posOf(el, step);
      if ((anchor >= N - 1 || cur >= N - 1.05) && push > threshold && cur > N - 1.15) {
        goTo(0);
        return true;
      }
      if ((anchor <= 0 || cur <= 0.05) && push < -threshold && cur < 0.15) {
        goTo(N - 1);
        return true;
      }
      return false;
    };

    const settleWheel = () => {
      wheelTimer = undefined;
      if (isMouseDown || isLoopingRef.current) return;
      if (loopFromEdge(wheelAnchorIdx, wheelPush, 60)) return;
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
      // Block browser back/forward history swipe when pushing outward at either edge so 01 <-> 09 wraps safely
      const atLeftEdge = el.scrollLeft <= 1 && e.deltaX < 0;
      const atRightEdge = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1 && e.deltaX > 0;
      if (wide && (atLeftEdge || atRightEdge)) {
        e.preventDefault();
      }
      if (wheelTimer === undefined) {
        wheelAnchorIdx = Math.round(el.scrollLeft / step);
        wheelPush = 0;
      }
      wheelPush += e.deltaX;
      gsap.killTweensOf(el);
      cancelActiveLoop();
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(settleWheel, 160);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("button") || target?.closest("a") || target?.closest("input")) return;

      gsap.killTweensOf(el);
      cancelActiveLoop();
      isMouseDown = true;
      hasDragged = false;
      startX = e.clientX;
      lastMoveX = e.clientX;
      startScrollLeft = el.scrollLeft;
      dragAnchorIdx = Math.round(el.scrollLeft / step);
      lastDragX = e.clientX;
      lastDragTime = performance.now();
      dragVelocity = 0;
      window.clearTimeout(wheelTimer);
      wheelTimer = undefined;
      el.style.scrollSnapType = "none";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      lastMoveX = e.clientX;
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
      // dragging left is moving forward, so the "push" is the opposite sign of the drag
      if (hasDragged) {
        el.style.scrollSnapType = ""; // first, so goTo saves (and later restores) the clean value
        if (loopFromEdge(dragAnchorIdx, startX - lastMoveX, 50)) return;
      }
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

    el.addEventListener("wheel", onTrackpadWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Touch edge wrap across all devices (phones & tablets)
    let touching = false;
    let touchX = 0;
    let touchY = 0;
    let touchAnchor = 0;
    const onTouchStart = (e: TouchEvent) => {
      cancelActiveLoop();
      const t = e.touches?.[0];
      if (!t) return;
      touching = true;
      touchX = t.clientX;
      touchY = t.clientY;
      touchAnchor = Math.round(posOf(el, step));
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touching) return;
      touching = false;
      const t = e.changedTouches?.[0] || e.touches?.[0];
      if (!t) return;
      const dx = t.clientX - touchX;
      const dy = t.clientY - touchY;
      const sideways = Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.15;
      if (sideways) loopFromEdge(touchAnchor, -dx, 30);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    // every card shares the carousel's place on the page: land there, and slide to the card
    const unregisterAnchor = registerAnchorPrefix("service-", (id) => {
      const i = services.findIndex((s) => `service-${s.slug}` === id);
      if (i < 0) return null;
      goTo(i);
      return Math.max(0, el.getBoundingClientRect().top + window.scrollY - navOffset() + 1);
    });

    return () => {
      syncRef.current = null;
      cancelLoopRef.current = null;
      isLoopingRef.current = false;
      gsap.killTweensOf(loopStateRef.current);
      gsap.killTweensOf(el);
      gsap.ticker.remove(onTick);
      leadIn.kill();
      fin.kill();
      window.clearTimeout(wheelTimer);
      mq.removeEventListener("change", onMode);
      el.removeEventListener("scroll", markDirty);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("wheel", onTrackpadWheel);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", onResize);
      unregisterAnchor();
    };
  }, [reduced, services]);

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
      cancelLoopRef.current?.();
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

  const running = !reduced && !held && inView;
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

  return { active, goTo, running, inView, posRef };
}
