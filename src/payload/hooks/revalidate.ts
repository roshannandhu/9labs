import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";
import { revalidateTag } from "next/cache";

/** The public site caches its content under this tag; any saved edit clears it. */
export const SITE_TAG = "site";

export function revalidateSite() {
  try {
    revalidateTag(SITE_TAG, { expire: 0 });
  } catch {
    /* outside a Next request (seed script, CLI): nothing is cached there */
  }
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc }) => {
  revalidateSite();
  return doc;
};
export const revalidateCollection: CollectionAfterChangeHook = ({ doc }) => {
  revalidateSite();
  return doc;
};
export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateSite();
  return doc;
};
