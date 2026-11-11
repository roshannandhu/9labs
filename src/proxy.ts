import { NextResponse, type NextRequest } from "next/server";

/**
 * One app, two addresses.
 *   - ADMIN_HOST (e.g. admin.example.com): only the admin and its API answer there; anything
 *     else is sent to /admin.
 *   - every other hostname (the public website): the admin does not exist there, and of the API
 *     only what visitors need is reachable — the forms, e-book downloads and uploaded images.
 * Without ADMIN_HOST (a developer's machine) nothing is changed: the admin is at /admin.
 */
const ADMIN_HOST = (process.env.ADMIN_HOST ?? "").trim().toLowerCase();
const PUBLIC_API = ["/api/public/", "/api/download/", "/api/media/"];

export function proxy(req: NextRequest) {
  if (!ADMIN_HOST) return NextResponse.next();
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = req.nextUrl;
  const adminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const api = pathname.startsWith("/api/");

  if (host === ADMIN_HOST) {
    if (adminPath || api) return NextResponse.next();
    // a relative redirect: correct whatever address the hosting proxy uses internally
    return new NextResponse(null, { status: 307, headers: { Location: "/admin" } });
  }
  if (adminPath || (api && !PUBLIC_API.some((p) => pathname.startsWith(p)))) return new NextResponse("Not found", { status: 404 });
  return NextResponse.next();
}

export const config = {
  // every page and API route, but not Next's own files or the icons
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|admin-icon.svg).*)"],
};
