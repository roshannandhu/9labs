// Which host serves what (run by src/proxy.ts on every request).
// ninelabsolutions.ae is the public site; admin.ninelabsolutions.ae IS the admin, at its root
// (admin.…/inbox/ shows the page built at /admin/inbox/). www.* and the .com twins land on those two.
// Locally the same split is localhost:3002 and admin.localhost:3002. Other hosts (workers.dev) pass through.
export const SITE = "ninelabsolutions.ae";
export const ADMIN = `admin.${SITE}`;

const CANONICAL: Record<string, string> = {
  [SITE]: SITE,
  "ninelabsolutions.com": SITE,
  [ADMIN]: ADMIN,
  "admin.ninelabsolutions.com": ADMIN,
  localhost: "localhost",
  "admin.localhost": "admin.localhost",
};

const ADMIN_PREFIX = /^\/admin(?=\/|$)/;
// Served as they are on the admin host: the API, build assets, public files.
const PASS = /^\/(api|_next)(\/|$)|\.[a-z0-9]+$/i;

export type HostRoute = { redirect: string } | { rewrite: string } | null;

export function hostRoute(url: URL): HostRoute {
  // ponytail: the workers.dev address doubles as a second admin host for testing; drop `testAdmin` to retire it.
  const testAdmin = url.hostname.endsWith(".workers.dev");
  const host = testAdmin ? url.hostname : CANONICAL[url.hostname.toLowerCase().replace(/^www\./, "")];
  if (!host) return null;
  const origin = (h: string) => `${url.protocol}//${h}${url.port ? `:${url.port}` : ""}`;
  const adminHost = testAdmin || host.startsWith("admin.") ? host : `admin.${host}`;
  const search = url.search;

  // /admin/... anywhere → the same page at the admin host's root
  if (ADMIN_PREFIX.test(url.pathname)) return { redirect: `${origin(adminHost)}${url.pathname.replace(ADMIN_PREFIX, "") || "/"}${search}` };
  if (host !== url.hostname.toLowerCase()) return { redirect: `${origin(host)}${url.pathname}${search}` };
  if (host === adminHost && !PASS.test(url.pathname)) return { rewrite: `/admin${url.pathname}${search}` };
  return null;
}
