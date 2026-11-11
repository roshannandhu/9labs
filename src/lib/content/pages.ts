import "server-only";
import { unstable_cache } from "next/cache";
import type { Page } from "@/payload-types";
import type { FaqItem } from "@/content/types";
import { SITE_TAG } from "@/payload/hooks/revalidate";
import { faqItem, payloadClient } from "./getSite";

/** A page written in the admin (Content → Pages), by its address. Cached until an admin saves. */
export const getPage = unstable_cache(
  async (slug: string): Promise<Page | null> => {
    try {
      const payload = await payloadClient();
      const res = await payload.find({ collection: "pages", where: { slug: { equals: slug } }, limit: 1, depth: 2, overrideAccess: true });
      return res.docs[0] ?? null;
    } catch (err) {
      console.error("[site] could not read the page", slug, err);
      return null;
    }
  },
  ["page-v1"],
  { tags: [SITE_TAG] },
);

/** Every question that is switched on, in the admin's order. */
export const getFaqs = unstable_cache(
  async (): Promise<FaqItem[]> => {
    try {
      const payload = await payloadClient();
      const res = await payload.find({ collection: "faqs", sort: "_order", limit: 200, where: { enabled: { not_equals: false } }, depth: 0, overrideAccess: true });
      return res.docs.map((d) => faqItem(d as unknown as Record<string, unknown>));
    } catch (err) {
      console.error("[site] could not read the FAQ", err);
      return [];
    }
  },
  ["faqs-v1"],
  { tags: [SITE_TAG] },
);
