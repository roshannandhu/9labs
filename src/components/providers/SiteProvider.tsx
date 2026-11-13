"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { site as defaults, waLink } from "@/content/site";
import { toSite } from "@/content/toSite";
import type { FaqItem, Page, SectionKey, SiteData } from "@/content/types";
import { resolveSiteFiles } from "@/lib/resolveFiles";
import { getState, subscribe } from "@/lib/store";

/**
 * There is no server at request time (fully static export): the first render — on the build
 * server and on the client's first paint — always shows the built-in defaults, so there is
 * nothing to hydrate against. Once mounted, an effect swaps in whatever is published in the
 * browser's own storage, and re-applies on every save (`subscribe`), so an admin's changes and
 * uploaded files (logo, covers) appear live without a reload.
 */
const Ctx = createContext<SiteData>(defaults);
const PagesCtx = createContext<Page[]>([]);
const FaqsCtx = createContext<FaqItem[]>([]);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [site, setSite] = useState<SiteData>(defaults);
  const [pages, setPages] = useState<Page[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    let lastPublished: ReturnType<typeof getState>["published"] | null = null; // only re-resolve when a Publish actually changes this reference — not on every lead saved elsewhere
    const apply = async () => {
      const ws = getState().published;
      if (ws === lastPublished) return;
      lastPublished = ws;
      const resolved = await resolveSiteFiles(toSite(ws));
      if (cancelled) return;
      setSite(resolved);
      setPages(ws.pages);
      setFaqs(ws.faqs);
    };
    void apply();
    const unsubscribe = subscribe(() => void apply());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider value={site}>
      <PagesCtx.Provider value={pages}>
        <FaqsCtx.Provider value={faqs}>{children}</FaqsCtx.Provider>
      </PagesCtx.Provider>
    </Ctx.Provider>
  );
}

export const useSite = () => useContext(Ctx);
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
