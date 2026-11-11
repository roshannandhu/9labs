import { NextResponse } from "next/server";
import { adminOrigin, googleConfigured, redirectTo } from "@/lib/auth/flow";
import { begin } from "@/lib/auth/google";
import { OAUTH_COOKIE, cookieOptions, sign } from "@/lib/auth/tokens";

/** "Continue with Google": remember this attempt in a short signed cookie and go to Google. */
export async function GET(req: Request) {
  if (!googleConfigured()) return redirectTo(req, "/admin/login?error=google-setup");
  const { remember, url } = begin(`${adminOrigin(req)}/api/auth/google/callback`);
  const res = NextResponse.redirect(url, 303);
  res.cookies.set(OAUTH_COOKIE, await sign(remember, "oauth", 600), cookieOptions({ maxAge: 600, path: "/api/auth" }));
  return res;
}
