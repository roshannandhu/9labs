"use client";

import { useSite } from "./SiteProvider";
import type { SiteData } from "@/content/types";

/** Brand colours set in the admin, written over the stylesheet's own (Website → Look, SEO & tracking). */
function themeCss({ colors: c }: SiteData["theme"]) {
  const light = [c.indigo && `--nl-indigo:${c.indigo}`, c.bg && `--nl-bg:${c.bg};--nl-lavender:${c.bg}`].filter(Boolean).join(";");
  const dark = [c.darkBg && `--nl-bg:${c.darkBg}`, c.logoFrom && `--logo-from:${c.logoFrom}`, c.logoTo && `--logo-to:${c.logoTo}`].filter(Boolean).join(";");
  const pair = [c.logoFrom && `--brand-a:${c.logoFrom}`, c.logoTo && `--brand-b:${c.logoTo}`].filter(Boolean).join(";");
  return `${light || pair ? `:root{${[light, pair].filter(Boolean).join(";")}}` : ""}${dark ? `html[data-theme="dark"]{${dark}}` : ""}`;
}

/**
 * Reactive twin of the inline `<style>` the old server render injected from the database. This
 * sits inside `SiteProvider`'s tree, so its content only ever changes on the client (first paint
 * always matches the built-in defaults — no hydration mismatch), after the published theme loads.
 */
export function ThemeColors() {
  const { theme } = useSite();
  const css = themeCss(theme);
  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
