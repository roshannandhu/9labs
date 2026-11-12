/**
 * True when a form post really comes from our own pages: the browser's Origin header must name
 * the host that received the request. (Cookies are SameSite=Lax as well; this is the second lock.)
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
