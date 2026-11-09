/**
 * Light / dark theme on `<html data-theme>`. The first visit follows the device setting; a choice
 * made with the nav toggle is remembered. Set pre-paint (THEME_BOOT_SCRIPT) so there is no flash.
 */
export type Theme = "light" | "dark";
const KEY = "nl-theme";

export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}`;

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
