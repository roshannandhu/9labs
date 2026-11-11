import type { AuthStrategy } from "payload";
import { SESSION_COOKIE, SESSION_HOURS, readCookie, serializeCookie, sign, verify } from "./tokens";

type SessionClaims = { sub?: string; v?: number; iat?: number };

export const issueSession = (user: { id: number | string; sessionVersion?: number | null }) =>
  sign({ sub: String(user.id), v: user.sessionVersion ?? 1 }, "session", SESSION_HOURS * 3600);

/**
 * Payload auth strategy: the admin is signed in when the request carries a valid `nl_session`
 * cookie for an active admin. The cookie is only ever set by the Google + e-mail-code flow.
 */
export const sessionStrategy: AuthStrategy = {
  name: "nl-session",
  authenticate: async ({ payload, headers, canSetHeaders }) => {
    // A cookie is never honoured on a request another site made in the background.
    if (headers.get("sec-fetch-site") === "cross-site" && headers.get("sec-fetch-mode") !== "navigate") return { user: null };

    const claims = await verify<SessionClaims>(readCookie(headers.get("cookie"), SESSION_COOKIE), "session");
    if (!claims?.sub) return { user: null };

    const user = await payload.findByID({ collection: "users", id: claims.sub, depth: 0, overrideAccess: true, disableErrors: true });
    if (!user || user.active === false || (user.sessionVersion ?? 1) !== claims.v) return { user: null };

    // keep an active admin signed in: past the half-way point the cookie is renewed
    let responseHeaders: Headers | undefined;
    const age = Date.now() / 1000 - (claims.iat ?? 0);
    if (canSetHeaders && age > (SESSION_HOURS * 3600) / 2) {
      responseHeaders = new Headers();
      responseHeaders.append("Set-Cookie", serializeCookie(SESSION_COOKIE, await issueSession(user), { maxAge: SESSION_HOURS * 3600 }));
    }
    return { user: { ...user, collection: "users", _strategy: "nl-session" }, responseHeaders };
  },
};
