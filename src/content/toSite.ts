import type { SiteData, Workspace } from "./types";

/**
 * What the public site shows, derived from a workspace: only enabled books, and the FAQ preview
 * filled from the authoritative FAQ list when "faq" is one of the shown sections.
 */
export function toSite(ws: Workspace): SiteData {
  const count = Math.max(1, Math.min(10, ws.site.faqPreview.count || 4));
  const shown = ws.faqs.filter((f) => f.enabled);
  // questions marked "Show on the homepage" first; older saved data with none marked keeps the old behaviour
  const marked = shown.filter((f) => f.home);
  const items = (marked.length > 0 ? marked : shown).slice(0, count);
  return {
    ...ws.site,
    ebooks: ws.site.ebooks.filter((b) => b.enabled),
    faqPreview: { ...ws.site.faqPreview, enabled: ws.site.sections.includes("faq") && items.length > 0, items },
  };
}
