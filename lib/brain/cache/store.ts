export type BrainCacheEntry<T> = {
  key: string;
  value: T;
  hash: string;
  createdAt: string;
  expiresAt?: string;
  staleAt?: string;
};

export type BrainCacheGetOptions = {
  allowStale?: boolean;
};

export interface BrainCacheStore {
  get<T>(key: string, options?: BrainCacheGetOptions): BrainCacheEntry<T> | null;
  set<T>(key: string, value: T, hash: string, ttlMs?: number): void;
  invalidate(key: string): void;
  invalidateByPrefix(prefix: string): void;
}

export class InMemoryBrainCacheStore implements BrainCacheStore {
  private store = new Map<string, BrainCacheEntry<unknown>>();

  get<T>(key: string, options: BrainCacheGetOptions = {}): BrainCacheEntry<T> | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (entry.expiresAt && now > Date.parse(entry.expiresAt)) {
      if (!options.allowStale || !entry.staleAt || now > Date.parse(entry.staleAt)) {
        return null;
      }
    }

    return entry as BrainCacheEntry<T>;
  }

  set<T>(key: string, value: T, hash: string, ttlMs?: number): void {
    const createdAt = new Date().toISOString();
    const expiresAt = ttlMs ? new Date(Date.now() + ttlMs).toISOString() : undefined;
    const staleAt = ttlMs ? new Date(Date.now() + ttlMs * 2).toISOString() : undefined;
    this.store.set(key, { key, value, hash, createdAt, expiresAt, staleAt });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

export function buildCacheKey(organizationId: string, capabilityId: string, contextHash: string): string {
  return `${organizationId}:${capabilityId}:${contextHash}`;
}
