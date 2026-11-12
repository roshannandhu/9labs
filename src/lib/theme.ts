/**
 * Light / dark theme on `<html data-theme>`. Light by default; a choice made with the nav toggle
 * is remembered. Set pre-paint (THEME_BOOT_SCRIPT) so there is no flash.
 */
export type Theme = "light" | "dark";
const KEY = "nl-theme";

/**
 * Pre-paint script. `fallback` is the theme a new visitor sees (set in the admin); when the
 * toggle is switched off in the admin, a remembered choice is ignored.
 */
export const themeBootScript = (fallback: Theme = "light", allowChoice = true) =>
  allowChoice
    ? `try{var t=localStorage.getItem("${KEY}");if(t!=="dark"&&t!=="light"){t="${fallback}"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="${fallback}"}`
    : `document.documentElement.dataset.theme="${fallback}"`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode: the choice lasts until reload */
  }
}
