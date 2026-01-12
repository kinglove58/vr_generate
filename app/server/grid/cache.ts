export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class LruTtlCache<T> {
  private maxEntries: number;
  private ttlMs: number;
  private store: Map<string, CacheEntry<T>>;

  constructor(options: { maxEntries: number; ttlMs: number }) {
    this.maxEntries = options.maxEntries;
    this.ttlMs = options.ttlMs;
    this.store = new Map();
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Refresh recency.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlOverrideMs?: number) {
    const ttlMs = ttlOverrideMs ?? this.ttlMs;
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };

    if (this.store.has(key)) {
      this.store.delete(key);
    }

    this.store.set(key, entry);

    if (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }
  }

  clear() {
    this.store.clear();
  }
}

export const gridCache = new LruTtlCache<unknown>({ maxEntries: 250, ttlMs: 5 * 60 * 1000 });