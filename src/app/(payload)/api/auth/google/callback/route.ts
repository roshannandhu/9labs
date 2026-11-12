import { getPayload } from "payload";
import config from "@payload-config";
import { adminOrigin, afterIdentity, googleConfigured, logEvent, redirectTo } from "@/lib/auth/flow";
import { finish, type OAuthState } from "@/lib/auth/google";
import { OAUTH_COOKIE, readCookie, safeEqual, verify } from "@/lib/auth/tokens";

/** Google sends the admin back here. Check the answer, then continue with the device / e-mail-code step. */
export async function GET(req: Request) {
  if (!googleConfigured()) return redirectTo(req, "/admin/login?error=google-setup");
  const url = new URL(req.url);
  const payload = await getPayload({ config });
  const remembered = await verify<OAuthState>(readCookie(req.headers.get("cookie"), OAUTH_COOKIE), "oauth");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";

  if (!remembered?.state || !code || !safeEqual(remembered.state, state)) {
    const res = redirectTo(req, "/admin/login?error=google");
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
    return res;
  }
  try {
    const who = await finish(code, `${adminOrigin(req)}/api/auth/google/callback`, remembered);
    const res = await afterIdentity(payload, req, who.email, who.name);
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
    return res;
  } catch (err) {
    payload.logger.error({ err }, "Google sign-in failed");
    await logEvent(payload, req, "", "google-error");
    const res = redirectTo(req, "/admin/login?error=google");
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
    return res;
  }
}
