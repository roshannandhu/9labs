import { test } from "node:test";
import assert from "node:assert/strict";
import { keyedHash, signToken, verifyToken } from "./tokens.ts";

const future = () => Math.floor(Date.now() / 1000) + 3600;

test("signToken/verifyToken round-trip with the right secret", () => {
  const token = signToken({ id: "req_1", v: 2, exp: future() }, "secret-a");
  const claims = verifyToken<{ id: string; v: number; exp: number }>(token, "secret-a");
  assert.equal(claims?.id, "req_1");
  assert.equal(claims?.v, 2);
});

test("verifyToken rejects the wrong secret, a tampered body, and garbage", () => {
  const token = signToken({ id: "req_1", exp: future() }, "secret-a");
  assert.equal(verifyToken(token, "secret-b"), null);

  const [body, sig] = token.split(".");
  const tamperedBody = Buffer.from(JSON.stringify({ id: "req_2", exp: future() })).toString("base64url");
  assert.equal(verifyToken(`${tamperedBody}.${sig}`, "secret-a"), null);

  assert.equal(verifyToken("not-a-token", "secret-a"), null);
  assert.equal(verifyToken(`${body}.`, "secret-a"), null);
});

test("verifyToken rejects an expired token even with a correct signature", () => {
  const token = signToken({ id: "req_1", exp: Math.floor(Date.now() / 1000) - 1 }, "secret-a");
  assert.equal(verifyToken(token, "secret-a"), null);
});

test("verifyToken with allowExpired still checks the signature, just not the expiry", () => {
  const token = signToken({ id: "req_1", exp: Math.floor(Date.now() / 1000) - 1 }, "secret-a");
  assert.equal(verifyToken<{ id: string; exp: number }>(token, "secret-a", { allowExpired: true })?.id, "req_1");
  assert.equal(verifyToken(token, "secret-b", { allowExpired: true }), null);
});

test("keyedHash is deterministic per secret, and different secrets never collide", () => {
  assert.equal(keyedHash("1.2.3.4", "secret-a"), keyedHash("1.2.3.4", "secret-a"));
  assert.notEqual(keyedHash("1.2.3.4", "secret-a"), keyedHash("1.2.3.4", "secret-b"));
  assert.doesNotMatch(keyedHash("1.2.3.4", "secret-a"), /1\.2\.3\.4/);
});
