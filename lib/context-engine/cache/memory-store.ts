import { buildCacheKey } from "./keys";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class MemoryContextCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  buildKey(params: Parameters<typeof buildCacheKey>[0]) {
    return buildCacheKey(params);
  }

  clear() {
    this.store.clear();
  }
}

export const defaultContextCache = new MemoryContextCache();
