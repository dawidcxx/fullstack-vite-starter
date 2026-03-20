// Basic LRU Cache with TTL
interface CacheEntry {
  key: string;
  value: any;
  expiration: number | null; // timestamp in ms, null for infinite
  prev: CacheEntry | null;
  next: CacheEntry | null;
}

export class Cache {
  private capacity: number;
  private cache: Map<string, CacheEntry>;
  private head: CacheEntry | null = null;
  private tail: CacheEntry | null = null;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeNode(entry);
      return undefined;
    }
    // Move to front
    this.removeNode(entry);
    this.addToFront(entry);
    return entry.value;
  }

  set(key: string, value: any, ttlMs?: number): void {
    const existing = this.cache.get(key);
    if (existing) {
      existing.value = value;
      existing.expiration = ttlMs ? Date.now() + ttlMs : null;
      this.removeNode(existing);
      this.addToFront(existing);
      return;
    }

    const newEntry: CacheEntry = {
      key,
      value,
      expiration: ttlMs ? Date.now() + ttlMs : null,
      prev: null,
      next: null,
    };

    if (this.cache.size >= this.capacity) {
      this.evict();
    }

    this.cache.set(key, newEntry);
    this.addToFront(newEntry);
  }

  memo<T>(key: string, fn: () => T, ttlMs?: number): T {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached as T;
    }
    const value = fn();
    this.set(key, value, ttlMs);
    return value;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    this.cache.delete(key);
    this.removeNode(entry);
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  size(): number {
    return this.cache.size;
  }

  private removeNode(node: CacheEntry): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private addToFront(node: CacheEntry): void {
    node.next = this.head;
    node.prev = null;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
  }

  private evict(): void {
    if (this.tail) {
      this.cache.delete(this.tail.key);
      this.removeNode(this.tail);
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return entry.expiration !== null && Date.now() > entry.expiration;
  }
}