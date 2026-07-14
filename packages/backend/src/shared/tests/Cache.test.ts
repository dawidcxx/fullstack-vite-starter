import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Cache } from "../Cache";

describe("Cache", () => {
  it("should store and retrieve values", () => {
    const cache = new Cache(3);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    assert.deepStrictEqual(cache.get("key1"), "value1");
    assert.deepStrictEqual(cache.get("key2"), "value2");
  });

  it("should evict least recently used when capacity exceeded", () => {
    const cache = new Cache(2);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");
    assert.deepStrictEqual(cache.get("key1"), undefined);
    assert.deepStrictEqual(cache.get("key2"), "value2");
    assert.deepStrictEqual(cache.get("key3"), "value3");
  });

  it("should update LRU order on get", () => {
    const cache = new Cache(2);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.get("key1");
    cache.set("key3", "value3");
    assert.deepStrictEqual(cache.get("key2"), undefined);
    assert.deepStrictEqual(cache.get("key1"), "value1");
  });

  it("should handle TTL expiration", async () => {
    const cache = new Cache(3);
    cache.set("key1", "value1", 100);
    assert.deepStrictEqual(cache.get("key1"), "value1");
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.deepStrictEqual(cache.get("key1"), undefined);
  });

  it("should handle infinite TTL", () => {
    const cache = new Cache(3);
    cache.set("key1", "value1");
    assert.deepStrictEqual(cache.get("key1"), "value1");
  });

  it("should delete entries", () => {
    const cache = new Cache(3);
    cache.set("key1", "value1");
    assert.deepStrictEqual(cache.delete("key1"), true);
    assert.deepStrictEqual(cache.get("key1"), undefined);
    assert.deepStrictEqual(cache.delete("key1"), false);
  });

  it("should clear all entries", () => {
    const cache = new Cache(3);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.clear();
    assert.deepStrictEqual(cache.size(), 0);
    assert.deepStrictEqual(cache.get("key1"), undefined);
  });

  it("should return correct size", () => {
    const cache = new Cache(3);
    assert.deepStrictEqual(cache.size(), 0);
    cache.set("key1", "value1");
    assert.deepStrictEqual(cache.size(), 1);
    cache.set("key2", "value2");
    assert.deepStrictEqual(cache.size(), 2);
  });

  it("should memoize function results", () => {
    const cache = new Cache(3);
    let callCount = 0;
    const expensiveFn = () => {
      callCount++;
      return 42;
    };
    const result1 = cache.memo("key1", expensiveFn);
    assert.deepStrictEqual(result1, 42);
    assert.deepStrictEqual(callCount, 1);
    const result2 = cache.memo("key1", expensiveFn);
    assert.deepStrictEqual(result2, 42);
    assert.deepStrictEqual(callCount, 1);
  });
});