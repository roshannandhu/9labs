import { test } from "node:test";
import assert from "node:assert/strict";
import { getIn, insertIntoArray, moveInArray, removeFromArray, setIn } from "./path.ts";

test("getIn reads nested values", () => {
  const o = { a: { b: [{ c: 1 }, { c: 2 }] } };
  assert.equal(getIn(o, ["a", "b", 1, "c"]), 2);
  assert.equal(getIn(o, ["a", "x", "y"]), undefined);
});

test("setIn clones only the path, keeps other references", () => {
  const sibling = { keep: true };
  const o = { a: { b: 1, sibling }, other: [1, 2] };
  const next = setIn(o, ["a", "b"], 99);
  assert.equal(next.a.b, 99);
  assert.equal(next.a.sibling, sibling); // untouched branch, same reference
  assert.equal(next.other, o.other); // untouched top-level branch
  assert.notEqual(next, o);
  assert.notEqual(next.a, o.a);
});

test("setIn writes into arrays by index", () => {
  const o = { list: [{ v: 1 }, { v: 2 }] };
  const next = setIn(o, ["list", 1, "v"], 42);
  assert.equal(next.list[1].v, 42);
  assert.equal(next.list[0], o.list[0]);
});

test("array helpers are immutable", () => {
  const arr = [1, 2, 3];
  assert.deepEqual(moveInArray(arr, 0, 2), [2, 3, 1]);
  assert.deepEqual(arr, [1, 2, 3]);
  assert.deepEqual(removeFromArray(arr, 1), [1, 3]);
  assert.deepEqual(insertIntoArray(arr, 1, 9), [1, 9, 2, 3]);
});
