"use client";

import { createContext, useCallback, useContext } from "react";
import { site as defaults, waLink } from "@/content/site";
import type { SectionKey, SiteData } from "@/content/types";

const Ctx = createContext<SiteData>(defaults);

/** The website's content (admin values over the built-in defaults), read on the server and handed to every component. */
export function SiteProvider({ value, children }: { value: SiteData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSite = () => useContext(Ctx);

/** `wa()` → the general WhatsApp chat link; `wa(text, number)` → a chat with that message (and number). */
export function useWhatsApp() {
  const { contact } = useSite();
  return useCallback((text?: string, number?: string) => waLink(number || contact.whatsappNumber, text ?? contact.whatsappText), [contact.whatsappNumber, contact.whatsappText]);
}

/**
 * The running number in front of a section label ("02 — About us"), following the admin's
 * section order. About owns two numbers: the section itself and its values block.
 */
export function sectionNo(site: SiteData, key: SectionKey | "values"): string {
  let n = 0;
  for (const s of site.sections) {
    n += 1;
    if (s === key) break;
    if (s === "about") {
      n += 1;
      if (key === "values") break;
    }
  }
  return String(n).padStart(2, "0");
}
