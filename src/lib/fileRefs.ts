/**
 * A stored file is referenced as `r2:images/<uuid>.<ext>` or `r2:pdfs/<uuid>.pdf` — the prefix
 * marks it as a reference (vs. a literal URL) without saying anything about where it's actually
 * stored, so swapping the storage backend later never touches saved content.
 */
const PREFIX = "r2:";

export const makeRef = (key: string): string => `${PREFIX}${key}`;

export function refKey(ref: string | undefined): string | undefined {
  return ref?.startsWith(PREFIX) ? ref.slice(PREFIX.length) : undefined;
}

/** A book's files sit together: `ebooks/<book-slug>/cover-<id>.jpg`, `logo-<id>.png`, `pdf-<id>.pdf`. Everything else is `images/` or `pdfs/`. */
export const isImageRef = (ref: string | undefined): boolean => {
  const key = refKey(ref);
  return Boolean(key && (key.startsWith("images/") || (key.startsWith("ebooks/") && !key.endsWith(".pdf"))));
};
export const isPdfRef = (ref: string | undefined): boolean => {
  const key = refKey(ref);
  return Boolean(key && (key.startsWith("pdfs/") || (key.startsWith("ebooks/") && key.endsWith(".pdf"))));
};

/** Only images are ever served directly (`/media/…`) — a PDF only ever goes out via a signed link. */
export function mediaUrl(ref: string | undefined): string | undefined {
  const key = refKey(ref);
  if (!key || !isImageRef(ref)) return undefined;
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/media/${key}`;
}
