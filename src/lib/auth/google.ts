import { createHash } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomToken } from "./tokens";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type OAuthState = { state: string; nonce: string; verifier: string };

/** A new sign-in attempt: values we remember (in a signed cookie) and the Google address to send the admin to. */
export function begin(redirectUri: string): { remember: OAuthState; url: string } {
  const remember = { state: randomToken(24), nonce: randomToken(24), verifier: randomToken(48) };
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: remember.state,
    nonce: remember.nonce,
    code_challenge: createHash("sha256").update(remember.verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return { remember, url: `${AUTH_URL}?${q}` };
}

/** Swap Google's one-time code for the signed identity token and check every part of it. */
export async function finish(code: string, redirectUri: string, remembered: OAuthState): Promise<{ email: string; name?: string }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: remembered.verifier,
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status})`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google did not return an identity token");

  const { payload } = await jwtVerify(id_token, JWKS, { issuer: ["https://accounts.google.com", "accounts.google.com"], audience: process.env.GOOGLE_CLIENT_ID });
  if (payload.nonce !== remembered.nonce) throw new Error("Sign-in attempt does not match (nonce)");
  if (payload.email_verified !== true || typeof payload.email !== "string") throw new Error("Google has not verified this e-mail address");
  return { email: payload.email, name: typeof payload.name === "string" ? payload.name : undefined };
}
