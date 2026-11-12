import "server-only";
import type { Page } from "@/payload-types";
import type { FaqItem } from "@/content/types";
import { getFaqsFromDb, getPageFromDb, listPageSlugsFromDb } from "./db";

/** A page written in the admin (Content → Pages), by its address. Cached until an admin saves. */
export async function getPage(slug: string): Promise<Page | null> {
  try {
    return await getPageFromDb(slug);
  } catch (err) {
    console.error("[site] could not read the page", slug, err);
    return null;
  }
}

/** Every question that is switched on, in the admin's order. */
export async function getFaqs(): Promise<FaqItem[]> {
  try {
    return await getFaqsFromDb();
  } catch (err) {
    console.error("[site] could not read the FAQ", err);
    return [];
  }
}

/** Addresses of all pages (for the sitemap and the static demo). */
export async function listPageSlugs(): Promise<string[]> {
  try {
    return await listPageSlugsFromDb();
  } catch {
    return [];
  }
}
