# Cache

Provider-neutral cache interface — `BrainCacheStore`.

## Operations

| Method | Purpose |
|--------|---------|
| `get(key, options?)` | Retrieve entry; optional stale-while-revalidate |
| `set(key, value, hash, ttlMs?)` | Store with content hash |
| `invalidate(key)` | Drop single entry |
| `invalidateByPrefix(prefix)` | Org-scoped bulk invalidation |

## Key strategy

```
buildCacheKey(organizationId, capabilityId, contextHash)
```

Context hashes from `hashContextSlices()` — avoids resending full website/brand/business every run.

## Implementation

`InMemoryBrainCacheStore` for Sprint 1 tests. Production backing store in future sprints.

Freshness aligns with capability `freshnessPolicy`: `always_fresh`, `ttl`, `stale_ok`, `immutable`.
