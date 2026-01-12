type CacheEntry<T> = { value: T; expiresAt: number };

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxEntries: number;
  private defaultTtlMs: number;

  constructor(options: { maxEntries: number; defaultTtlMs: number }) {
    this.maxEntries = options.maxEntries;
    this.defaultTtlMs = options.defaultTtlMs;
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
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number) {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });

    if (this.store.size > this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }
  }
}

export const centralCache = new TtlCache<unknown>({ maxEntries: 500, defaultTtlMs: 5 * 60 * 1000 });
export const statsCache = new TtlCache<unknown>({ maxEntries: 500, defaultTtlMs: 15 * 60 * 1000 });