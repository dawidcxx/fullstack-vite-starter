import { describe, expect, it } from "bun:test";
import { Cache } from "../Cache";

describe("Cache", () => {
  it("should store and retrieve values", () => {
    const cache = new Cache(3);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    expect(cache.get("key1")).toBe("value1");
    expect(cache.get("key2")).toBe("value2");
  });

  it("should evict least recently used when capacity exceeded", () => {
    const cache = new Cache(2);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3"); // should evict key1
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBe("value2");
    expect(cache.get("key3")).toBe("value3");
  });

  it("should update LRU order on get", () => {
    const cache = new Cache(2);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.get("key1"); // key1 now most recent
    cache.set("key3", "value3"); // should evict key2
    expect(cache.get("key2")).toBeUndefined();
    expect(cache.get("key1")).toBe("value1");
  });

  it("should handle TTL expiration", async () => {
    const cache = new Cache(3);
    cache.set("key1", "value1", 100); // 100ms TTL
    expect(cache.get("key1")).toBe("value1");
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(cache.get("key1")).toBeUndefined();
  });

  it("should handle infinite TTL", () => {
    const cache = new Cache(3);
    cache.set("key1", "value1"); // no TTL
    expect(cache.get("key1")).toBe("value1");
  });

  it("should delete entries", () => {
    const cache = new Cache(3);
    cache.set("key1", "value1");
    expect(cache.delete("key1")).toBe(true);
    expect(cache.get("key1")).toBeUndefined();
    expect(cache.delete("key1")).toBe(false);
  });

  it("should clear all entries", () => {
    const cache = new Cache(3);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get("key1")).toBeUndefined();
  });

  it("should return correct size", () => {
    const cache = new Cache(3);
    expect(cache.size()).toBe(0);
    cache.set("key1", "value1");
    expect(cache.size()).toBe(1);
    cache.set("key2", "value2");
    expect(cache.size()).toBe(2);
  });

  it("should memoize function results", () => {
    const cache = new Cache(3);
    let callCount = 0;
    const expensiveFn = () => {
      callCount++;
      return 42;
    };
    const result1 = cache.memo("key1", expensiveFn);
    expect(result1).toBe(42);
    expect(callCount).toBe(1);
    const result2 = cache.memo("key1", expensiveFn);
    expect(result2).toBe(42);
    expect(callCount).toBe(1); // should not call again
  });
});
