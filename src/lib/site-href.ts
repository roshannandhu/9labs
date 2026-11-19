/**
 * Internal addresses for plain <a> tags. The static demo lives under a sub-folder (/9labs), so a
 * root address needs that folder in front; Next's own <Link> and router add it by themselves.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** "/about" → "/9labs/about" on the demo, unchanged elsewhere. Anything else is returned as it is. */
export const siteHref = (href: string) => (href.startsWith("/") && !href.startsWith("//") ? `${BASE_PATH}${href}` : href);

/** Homepage sections that also have a full page of their own: off the homepage, the menu opens that page. */
const fullPage: Record<string, string> = { "#about": "/about" };

/**
 * A menu link: on the homepage About scrolls to its section; on inner pages it opens /about, and other "#x" go back to "/#x".
 * Saved content may hold either "#about" or "/about" (older defaults), so both are treated the same.
 */
export const navHref = (href: string, home: boolean) => {
  const section = Object.keys(fullPage).find((k) => fullPage[k] === href) ?? href;
  return siteHref(home ? section : (fullPage[section] ?? (section.startsWith("#") ? `/${section}` : section)));
};

/** A public-site page linked from the admin, which lives on its own host (admin.…). */
export const publicHref = (href: string) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${siteHref(href)}`;
