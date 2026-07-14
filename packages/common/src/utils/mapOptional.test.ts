import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapOptional } from "./mapOptional";

describe("mapOptional", () => {
  it("returns null for nullish input", () => {
    assert.strictEqual(
      mapOptional(null, (x: number) => x * 2),
      null,
    );
    assert.strictEqual(
      mapOptional(undefined, (x: number) => x * 2),
      null,
    );
  });

  it("applies mapping fn for non-nullish input", () => {
    assert.strictEqual(
      mapOptional(5, (x) => x * 2),
      10,
    );
  });

  it("handles string transformation", () => {
    assert.strictEqual(
      mapOptional("hello", (s) => s.toUpperCase()),
      "HELLO",
    );
  });

  it("handles falsy non-null values", () => {
    assert.strictEqual(
      mapOptional(0, (x) => x + 1),
      1,
    );
    assert.strictEqual(
      mapOptional("", (s) => s.length),
      0,
    );
    assert.strictEqual(
      mapOptional(false, (b) => !b),
      true,
    );
  });
});