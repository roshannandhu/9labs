/**
 * AES-GCM for secrets kept in the database (AI keys, ./keys.ts): the AES key is derived from
 * APP_SECRET, every value gets its own random IV, and the stored form is base64(iv ‖ ciphertext).
 * Pure Web Crypto — runs in Workers and in node tests (./seal.test.ts).
 */
const enc = new TextEncoder();
const hex = (b: ArrayBuffer) =>
  [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const fingerprint = async (value: string) =>
  hex(await crypto.subtle.digest("SHA-256", enc.encode(value)));

const keys = new Map<string, Promise<CryptoKey>>();
const aesKey = (secret: string) => {
  let k = keys.get(secret);
  if (!k)
    keys.set(
      secret,
      (k = crypto.subtle
        .digest("SHA-256", enc.encode(`ai-keys:${secret}`))
        .then((raw) =>
          crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
            "encrypt",
            "decrypt",
          ]),
        )),
    );
  return k;
};

export async function seal(plain: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await aesKey(secret),
      enc.encode(plain),
    ),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return toB64(out);
}

/** Throws when the secret differs or the value was tampered with (AES-GCM authenticates). */
export async function unseal(sealed: string, secret: string): Promise<string> {
  const buf = fromB64(sealed);
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: buf.slice(0, 12) },
      await aesKey(secret),
      buf.slice(12),
    ),
  );
}
