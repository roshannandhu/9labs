// Host-level redirects, run by custom-worker.js before Next sees the request.
// ninelabsolutions.ae is the one public site; admin.ninelabsolutions.ae is the admin.
// www.* and the .com twins all land on those two. Unknown hosts (workers.dev, localhost) pass through.
export const SITE = "ninelabsolutions.ae";
export const ADMIN = `admin.${SITE}`;

const ADMIN_PATH = /^\/admin(\/|$)/;
// Paths the admin page itself needs from its own host: its routes, the API, build assets, public files.
const ADMIN_PASS = /^\/(admin|api|_next)(\/|$)|\.[a-z0-9]+$/i;

/** Where to 308 this URL, or null to serve it as is. */
export function hostRedirect(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const rest = url.pathname + url.search;
  const to = (h: string, path = rest) => (h === url.hostname && path === rest ? null : `https://${h}${path}`);

  if (host === ADMIN || host === "admin.ninelabsolutions.com") {
    return to(ADMIN, ADMIN_PASS.test(url.pathname) ? rest : `/admin${url.pathname}${url.search}`);
  }
  if (host === SITE || host === "ninelabsolutions.com") {
    return to(ADMIN_PATH.test(url.pathname) ? ADMIN : SITE);
  }
  return null;
}
