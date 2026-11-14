/**
 * The admin's own light/dark choice — a separate `localStorage` key from the public site
 * (`src/lib/theme.ts`), so switching one never changes the other. Dark by default: this is a
 * desk tool. Set pre-paint (`adminThemeBootScript`) so there's no flash.
 */
export type AdminTheme = "light" | "dark";
const KEY = "nl-admin-theme";

export const adminThemeBootScript = () => `try{var t=localStorage.getItem("${KEY}");document.documentElement.dataset.theme=(t==="light"?"light":"dark")}catch(e){document.documentElement.dataset.theme="dark"}`;

export function currentAdminTheme(): AdminTheme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setAdminTheme(t: AdminTheme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode: the choice lasts until reload */
  }
}
