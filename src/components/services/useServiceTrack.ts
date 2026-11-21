"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useDemo } from "@/components/providers/DemoSettings";
import { navOffset, registerAnchorPrefix } from "@/lib/scroll";
import type { Service } from "@/content/site";
import { particleBus, heroTarget, picTarget, allNineTarget } from "@/components/particles/bus";

const N = 9; // the nine cards are reorderable (The 9 cards), but there are always exactly nine
const AUTOPLAY_MS = 3500;
const HOLD_MS = 4500; // autoplay waits this long after a swipe, tap or click
const PEEK_OPACITY = 0.45; // a card one step away from centre
const PEEK_SCALE = 0.08;

/** Laptop/tablet: OrbitGear sits left of the horizontal card row; phone keeps OrbitArc below.
 * Same query as the orbit `@media` block in globals.css — keep the two in step. */
export const ORBIT_MQ = "(min-width: 768px) and (min-height: 560px)";
/** one notch of the OrbitGear icon wheel */
export const NOTCH = (2 * Math.PI) / N;
/** shortest signed distance round the ring of nine, in [-4.5, 4.5) */
export const ringOffset = (d: number) => ((((d % N) + N + N / 2) % N) - N / 2);
const mod = (i: number) => ((i % N) + N) % N;

// measured across the whole row so per-card pixel rounding can't add up
const cardsOf = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>(":scope > .scene-card"));
const cardStep = (el: HTMLElement) => {
  const c = cardsOf(el);
  const first = c[0];
  const last = c[c.length - 1];
  return first && last && c.length > 1 ? (last.offsetLeft - first.offsetLeft) / (c.length - 1) : el.clientWidth;
};
// The row has one empty, card-wide slot (`.svc-buffer`) before card 1 and after card 9, so the
// scroll position runs -1..9: card 9 can be scrolled to on the left of card 1 and card 1 on the
// right of card 9. Every card is drawn at its place round the ring of nine, so the picture at pos p
// and p ± 9 is identical — once the scroll comes to rest in a spare slot it is moved by nine cards,
// invisibly, and the loop never ends (`normalize`).
const posOf = (el: HTMLElement, step: number) => el.scrollLeft / step - 1;
const scrollFor = (pos: number, step: number) => Math.round((pos + 1) * step);

/**
 * The services carousel: a native sideways scroller (CSS snap on touch, free swipe on trackpads,
 * no scroll lock — the page itself scrolls straight past it), endless in both directions. Its
 * scroll position `pos` is read continuously, and one `sync()` decides what the particle swarm is doing:
 *   - **lead-in** (page scrolling the carousel into view): hero 9 → the current card's object
 *   - **carousel**: object → object, following the swipe frame by frame, reversible
 *   - **finale** (page scrolling on past it): the current object → the "all nine" 9
 * It also dims and shrinks the cards either side of the one in focus (the peek), auto-advances
 * every few seconds (pausable, holds while the visitor is interacting), and resolves
 * `#service-<slug>` links to the right card.
 */
export function useServiceTrack(scrollerRef: RefObject<HTMLElement | null>, services: Service[]) {
  const { reduced } = useDemo();
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);
  const activeRef = useRef(0);
  const posRef = useRef(0); // continuous; OrbitArc reads it round the ring, so any value works
  const goToRef = useRef<((i: number) => void) | null>(null);
  const cancelLoopRef = useRef<(() => void) | null>(null);

  const goTo = useCallback((i: number) => goToRef.current?.(i), []);

  useGSAP(() => {
    if (reduced) return;
    const el = scrollerRef.current;
    if (!el) return;
    const cards = cardsOf(el);

    // `offsetLeft` forces layout same as getBoundingClientRect; cards never move relative to the
    // scroller, so this is read once instead of on every scroll event during a swipe
    let step = cardStep(el);
    let width = el.clientWidth;
    const mq = window.matchMedia(ORBIT_MQ);
    const freeMq = window.matchMedia("(min-width: 640px) and (pointer: fine)"); // CSS snap is off here
    let wide = mq.matches;
    let snapFree = freeMq.matches;

    let leadP = 0;
    let finP = 0;
    let lastPos = 0;
    let dirty = false;
    let looping = false;
    const loop = { p: 0, sp: 0, from: 0, to: 0, prevSnap: "" };

    // input state (declared up front: `normalize` shifts the anchors when it moves the row)
    let isMouseDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasDragged = false;
    let lastDragX = 0;
    let dragVelocity = 0;
    let lastDragTime = 0;
    let wheelTimer: number | undefined;
    let wheelAnchorIdx = 0;
    let idleTimer: number | undefined;
    let touching = false;
    let lastInput: "touch" | "mouse" | "wheel" | "" = "";

    /** draws every card at its place round the ring for visual position `vis`, with the row scrolled to `sp` */
    const paint = (vis: number, sp: number) => {
      const phone = window.innerWidth < 640;
      const maxArc = phone ? 12 : 20;
      const maxScale = phone ? 0.05 : PEEK_SCALE;
      const peekOpacity = phone ? 0.52 : PEEK_OPACITY;

      cards.forEach((c, i) => {
        const offset = ringOffset(i - vis);
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

        // Orbital arc: slight vertical dip + smooth scale + subtle 3D rotateY on desktop
        const yArc = clampedAbs * maxArc;
        const scale = 1 - clampedAbs * maxScale;
        const opacity = Math.max(0.18, 1 - clampedAbs * (1 - peekOpacity));
        const rotY = phone ? 0 : Math.max(-14, Math.min(14, -offset * 12));
        // shift from the card's own slot in the row to its slot round the ring (0 unless it wraps)
        const dx = (offset - (i - sp)) * step;

        const transformStr = phone
          ? `translate3d(${dx.toFixed(1)}px, ${yArc.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`
          : `translate3d(${dx.toFixed(1)}px, ${yArc.toFixed(1)}px, 0) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        const opacityStr = opacity.toFixed(2);

        if (c.style.transform !== transformStr) c.style.transform = transformStr;
        if (c.style.opacity !== opacityStr) c.style.opacity = opacityStr;
        const isActive = absOffset < 0.28;
        if (c.getAttribute("data-active") !== (isActive ? "true" : "false")) {
          c.setAttribute("data-active", isActive ? "true" : "false");
        }
      });
    };

    const writeTrack = (pos: number) => {
      const dir = ringOffset(pos - lastPos) >= 0 ? 1 : -1;
      lastPos = pos;
      const index = Math.floor(pos);
      const frac = pos - index;
      if (frac <= 0.002 || frac >= 0.998) {
        const at = picTarget(services[mod(frac >= 0.998 ? index + 1 : index)].icon);
        particleBus.from = at;
        particleBus.to = at;
        particleBus.u = 0;
      } else {
        particleBus.from = picTarget(services[mod(index)].icon);
        particleBus.to = picTarget(services[mod(index + 1)].icon);
        particleBus.dir = dir;
        // Continuous linear normalization between rest deadbands to eliminate pop
        particleBus.u = (frac - 0.002) / (0.998 - 0.002);
      }
    };
    const writeParticles = (pos: number) => {
      const idx = mod(Math.round(pos));
      if (leadP < 1) {
        particleBus.dir = 1;
        particleBus.from = heroTarget;
        particleBus.to = picTarget(services[idx].icon);
        particleBus.u = leadP;
      } else if (finP > 0) {
        particleBus.dir = 1;
        particleBus.from = picTarget(services[idx].icon);
        particleBus.to = allNineTarget;
        particleBus.u = finP;
      } else writeTrack(pos);
    };

    const sync = () => {
      dirty = false;
      if (looping) return;
      const pos = posOf(el, step);
      posRef.current = pos;
      paint(pos, pos);
      writeParticles(pos);
      const idx = mod(Math.round(pos));
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
    };

    /** at rest in (or swiped into) a spare slot: move the row nine cards, which looks exactly the same */
    const normalize = () => {
      const pos = posOf(el, step);
      const shift = pos > N - 0.5 ? -N : pos < -0.5 ? N : 0;
      if (shift) {
        el.scrollTo({ left: el.scrollLeft + shift * step, behavior: "instant" });
        wheelAnchorIdx += shift;
        startScrollLeft += shift * step;
      }
      return shift;
    };

    const tweenTo = (dest: number, duration: number, restoreSnap?: string) =>
      gsap.to(el, {
        scrollLeft: scrollFor(Math.max(-1, Math.min(N, dest)), step),
        duration,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: sync,
        onComplete: () => {
          if (restoreSnap !== undefined) el.style.scrollSnapType = restoreSnap;
          normalize();
          sync();
        },
      });

    const finishLoop = (commit: number) => {
      looping = false;
      el.scrollTo({ left: scrollFor(commit, step), behavior: "instant" });
      el.style.scrollSnapType = loop.prevSnap || "";
      sync();
    };
    const cancelActiveLoop = () => {
      if (!looping) return;
      gsap.killTweensOf(loop);
      finishLoop(mod(Math.round(posRef.current)));
    };
    cancelLoopRef.current = cancelActiveLoop;

    // a jump of several cards across the 9 | 1 seam that the spare slots can't hold (e.g. 7 → 2):
    // the row stays put and the cards glide round the ring instead
    const glide = (sp: number, from: number, to: number) => {
      const target = mod(to);
      loop.prevSnap = el.style.scrollSnapType;
      el.style.scrollSnapType = "none";
      loop.sp = sp;
      loop.from = sp;
      loop.to = to;
      loop.p = 0;
      looping = true;
      activeRef.current = target;
      setActive(target);
      const duration = Math.min(0.85, Math.max(0.62, 0.62 + (Math.abs(to - from) - 1) * 0.08));
      gsap.to(loop, {
        p: 1,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          const vis = loop.from + (loop.to - loop.from) * loop.p;
          posRef.current = vis;
          paint(vis, loop.sp);
          writeParticles(vis);
        },
        onComplete: () => finishLoop(target),
      });
    };

    goToRef.current = (i: number) => {
      const target = mod(i);
      gsap.killTweensOf(el);
      cancelActiveLoop();
      let sp = posOf(el, step);
      let from = Math.round(sp);
      let dest = from + ringOffset(target - mod(from)); // the short way round
      // the same view, nine cards along, may leave room for the trip — move there first
      const alt = dest > N ? -N : dest < -1 ? N : 0;
      if (alt && from + alt >= -1 && from + alt <= N) {
        el.scrollTo({ left: el.scrollLeft + alt * step, behavior: "instant" });
        sp += alt;
        from += alt;
        dest += alt;
      }
      if (dest < -1 || dest > N) {
        glide(sp, from, dest);
        return;
      }
      // Temporarily disable CSS snap to eliminate browser engine collision/stutter
      const prevSnap = el.style.scrollSnapType;
      el.style.scrollSnapType = "none";
      tweenTo(dest, Math.min(0.85, Math.max(0.62, 0.62 + (Math.abs(dest - sp) - 1) * 0.08)), prevSnap || "");
    };

    // scroll has stopped: tidy up — a free-scrolling row (no CSS snap) settles on a card, and a
    // row resting in a spare slot is moved round to the real card
    const idle = () => {
      idleTimer = undefined;
      if (touching || isMouseDown || wheelTimer !== undefined || looping || gsap.isTweening(el)) return;
      const pos = posOf(el, step);
      const near = Math.round(pos);
      if (snapFree && Math.abs(pos - near) > 0.01) {
        tweenTo(near, 0.48);
        return;
      }
      normalize();
      sync();
    };
    const onScroll = () => {
      // wheel / drag on a snap-free row: loop the moment it passes halfway into a spare slot, so a
      // long fling just keeps going round (never mid-touch: moving the row would kill the fling)
      if (lastInput !== "touch" && (snapFree || isMouseDown) && !looping && !gsap.isTweening(el)) normalize();
      dirty = true;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(idle, 140);
    };
    const onTick = () => {
      if (dirty) sync();
    };
    // Prioritized so manual scroll state commits before ParticleStage.frame() on the same VSync tick
    gsap.ticker.add(onTick, false, true);

    const reanchor = () => {
      cancelActiveLoop();
      gsap.killTweensOf(el);
      step = cardStep(el);
      el.scrollTo({ left: scrollFor(activeRef.current, step), behavior: "instant" });
      sync();
    };
    el.scrollTo({ left: scrollFor(activeRef.current, step), behavior: "instant" });

    const onResize = () => {
      if (el.clientWidth === width) return; // phone URL bar showing/hiding: nothing moved sideways
      width = el.clientWidth;
      reanchor();
    };
    window.addEventListener("resize", onResize);
    // crossing a breakpoint (window resize, tablet rotation) changes card width and snap behaviour
    const onMode = () => {
      wide = mq.matches;
      snapFree = freeMq.matches;
      width = el.clientWidth;
      reanchor();
    };
    mq.addEventListener("change", onMode);
    freeMq.addEventListener("change", onMode);

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
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", idle);
    sync();

    // gentle trackpad settle on fine-pointer desktop/laptop
    const settleWheel = () => {
      wheelTimer = undefined;
      if (isMouseDown || looping) return;
      const curPos = posOf(el, step);
      const diff = curPos - wheelAnchorIdx;
      const targetIdx =
        Math.abs(diff) >= 0.12 && Math.abs(diff) < 0.55 ? wheelAnchorIdx + (diff > 0 ? 1 : -1) : Math.round(curPos);
      if (Math.abs(el.scrollLeft - scrollFor(targetIdx, step)) < 2) {
        normalize();
        sync();
        return;
      }
      tweenTo(targetIdx, 0.48);
    };

    const onTrackpadWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      if (!snapFree) return;
      lastInput = "wheel";
      // Block browser back/forward history swipe when pushing outward at either edge
      const atLeftEdge = el.scrollLeft <= 1 && e.deltaX < 0;
      const atRightEdge = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1 && e.deltaX > 0;
      if (wide && (atLeftEdge || atRightEdge)) e.preventDefault();
      if (wheelTimer === undefined) wheelAnchorIdx = Math.round(posOf(el, step));
      gsap.killTweensOf(el);
      cancelActiveLoop();
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(settleWheel, 160);
    };

    // Mouse drag support
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("button") || target?.closest("a") || target?.closest("input")) return;

      gsap.killTweensOf(el);
      cancelActiveLoop();
      lastInput = "mouse";
      isMouseDown = true;
      hasDragged = false;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      lastDragX = e.clientX;
      lastDragTime = performance.now();
      dragVelocity = 0;
      window.clearTimeout(wheelTimer);
      wheelTimer = undefined;
      el.style.scrollSnapType = "none";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - startX;
      if (!hasDragged && Math.abs(dx) > 6) hasDragged = true;
      if (hasDragged) {
        el.scrollLeft = startScrollLeft - dx;
        normalize(); // dragged into a spare slot: carry on round (moves startScrollLeft with it)
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
      if (!hasDragged) {
        el.style.scrollSnapType = "";
        return;
      }
      const currentPos = posOf(el, step);
      const targetIdx =
        dragVelocity < -0.35 ? Math.ceil(currentPos) : dragVelocity > 0.35 ? Math.floor(currentPos) : Math.round(currentPos);
      tweenTo(targetIdx, 0.55, "");
    };

    el.addEventListener("wheel", onTrackpadWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // touch: the browser swipes and snaps natively (into the spare slots too); `idle` loops it round
    const onTouchStart = () => {
      cancelActiveLoop();
      lastInput = "touch";
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(idle, 140);
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
      goToRef.current = null;
      cancelLoopRef.current = null;
      looping = false;
      gsap.killTweensOf(loop);
      gsap.killTweensOf(el);
      gsap.ticker.remove(onTick);
      leadIn.kill();
      fin.kill();
      window.clearTimeout(wheelTimer);
      window.clearTimeout(idleTimer);
      mq.removeEventListener("change", onMode);
      freeMq.removeEventListener("change", onMode);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", idle);
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
    const t = window.setTimeout(() => goTo(activeRef.current + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [running, active, goTo]);

  return { active, goTo, running, inView, posRef };
}
