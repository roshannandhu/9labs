import { NextResponse, type NextRequest } from "next/server";

/**
 * One app, two addresses.
 *   - ADMIN_HOST (e.g. admin.example.com): only the admin and its API answer there; anything
 *     else is sent to /admin.
 *   - every other hostname (the public website): /admin and the admin's sign-in routes do not exist.
 * Without ADMIN_HOST (a developer's machine) nothing is changed: the admin is at /admin.
 */
const ADMIN_HOST = (process.env.ADMIN_HOST ?? "").trim().toLowerCase();

export function proxy(req: NextRequest) {
  if (!ADMIN_HOST) return NextResponse.next();
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = req.nextUrl;
  const adminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (host === ADMIN_HOST) {
    if (adminPath || pathname.startsWith("/api/")) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }
  // the public website: the admin is not here
  if (adminPath || pathname.startsWith("/api/auth/") || pathname.startsWith("/api/nl/")) return new NextResponse("Not found", { status: 404 });
  return NextResponse.next();
}

export const config = {
  // every page and API route, but not Next's own files or the icon
  matcher: ["/((?!_next/static|_next/image|favicon.ico|admin-icon.svg).*)"],
};
