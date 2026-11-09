/**
 * "Has the landing animation finished?" — shared between the intro and the hero, so the hero
 * never starts underneath the intro (the owner's rule: they must not overlap).
 *
 * The layout's inline script sets `<html data-intro="playing">` before first paint when the intro
 * will play (first visit this session, motion allowed). Everything else just waits for it to go.
 */
const SEEN = "nl-intro-seen";
const EVENT = "nl:intro-done";

type W = Window & { __nlIntroDone?: boolean };

export function introPlaying() {
  return typeof document !== "undefined" && document.documentElement.dataset.intro === "playing";
}

export function markIntroDone() {
  const w = window as W;
  if (w.__nlIntroDone) return;
  w.__nlIntroDone = true;
  delete document.documentElement.dataset.intro;
  try {
    sessionStorage.setItem(SEEN, "1");
  } catch {
    /* private mode: the intro may play again next load — harmless */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Runs `cb` once the intro is done (immediately if it isn't playing). Returns an unsubscribe. */
export function onIntroDone(cb: () => void): () => void {
  if ((window as W).__nlIntroDone || !introPlaying()) {
    cb();
    return () => {};
  }
  window.addEventListener(EVENT, cb, { once: true });
  return () => window.removeEventListener(EVENT, cb);
}

/** Inline, pre-paint: decide whether the intro plays (kept tiny; runs before React). */
// `?intro` replays it on demand (for showing the client).
export const INTRO_BOOT_SCRIPT = `try{if((/[?&]intro\\b/.test(location.search)||!sessionStorage.getItem("${SEEN}"))&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!/[?&]motion=reduce/.test(location.search)){document.documentElement.dataset.intro="playing"}}catch(e){}`;
