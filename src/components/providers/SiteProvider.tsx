"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { waLink } from "@/content/site";
import { navInPageOrder } from "@/lib/site-href";
import type { FaqItem, Page, SectionKey, SiteData } from "@/content/types";

/** The site's real content, read once on the server (getPublicContent) and passed down as props — no client fetch, no hydration gap. */
const Ctx = createContext<SiteData | null>(null);
const PagesCtx = createContext<Page[]>([]);
const FaqsCtx = createContext<FaqItem[]>([]);

export function SiteProvider({ site: raw, pages, faqs, children }: { site: SiteData; pages: Page[]; faqs: FaqItem[]; children: React.ReactNode }) {
  const site = useMemo(() => ({ ...raw, nav: navInPageOrder(raw.nav, raw.sections) }), [raw]);
  return (
    <Ctx.Provider value={site}>
      <PagesCtx.Provider value={pages}>
        <FaqsCtx.Provider value={faqs}>{children}</FaqsCtx.Provider>
      </PagesCtx.Provider>
    </Ctx.Provider>
  );
}

export function useSite(): SiteData {
  const site = useContext(Ctx);
  if (!site) throw new Error("useSite must be used inside <SiteProvider>");
  return site;
}
export const usePages = () => useContext(PagesCtx);
export const usePage = (slug: string) => useContext(PagesCtx).find((p) => p.slug === slug);
export const useFaqs = () => useContext(FaqsCtx).filter((f) => f.enabled);

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
