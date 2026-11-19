import { test } from "node:test";
import assert from "node:assert/strict";
import { fingerprint, seal, unseal } from "./seal.ts";

const SECRET = "a-test-app-secret-that-is-long-enough-0123";
const KEY = "gsk_TESTkey1234567890abcdefXYZ";

test("seal: round-trips, never stores the key in clear, and differs every time", async () => {
  const a = await seal(KEY, SECRET);
  const b = await seal(KEY, SECRET);
  assert.equal(await unseal(a, SECRET), KEY);
  assert.notEqual(a, b, "a fresh IV per value");
  assert.ok(!a.includes(KEY) && !atob(a).includes(KEY));
});

test("seal: a different APP_SECRET or a tampered value can't be opened", async () => {
  const a = await seal(KEY, SECRET);
  await assert.rejects(unseal(a, `${SECRET}-other`));
  const bytes = Uint8Array.from(atob(a), (c) => c.charCodeAt(0));
  bytes[bytes.length - 1] ^= 1;
  await assert.rejects(unseal(btoa(String.fromCharCode(...bytes)), SECRET));
});

test("fingerprint: stable, one-way, distinct per key", async () => {
  assert.equal(await fingerprint(KEY), await fingerprint(KEY));
  assert.notEqual(await fingerprint(KEY), await fingerprint(`${KEY}x`));
  assert.match(await fingerprint(KEY), /^[0-9a-f]{64}$/);
});
