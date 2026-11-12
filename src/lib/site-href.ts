/**
 * Internal addresses for plain <a> tags. The static demo lives under a sub-folder (/9labs), so a
 * root address needs that folder in front; Next's own <Link> and router add it by themselves.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** "/about" → "/9labs/about" on the demo, unchanged elsewhere. Anything else is returned as it is. */
export const siteHref = (href: string) => (href.startsWith("/") && !href.startsWith("//") ? `${BASE_PATH}${href}` : href);
