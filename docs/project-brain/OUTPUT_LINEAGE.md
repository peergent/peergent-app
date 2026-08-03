# Project Brain — Output Lineage (Sprint 6)

Capability outputs are persisted separately from runs and form an immutable lineage graph.

## PersistedBrainOutputRecord

- organization-scoped
- capability ID + version
- provider class (not customer-visible)
- context/snapshot version references
- content hash
- freshness: `fresh` | `stale` | `superseded`
- `supersededBy` pointer

## Upstream resolution

`UpstreamOutputResolver` resolves required upstream outputs:

1. Explicit output reference (if supplied)
2. Latest compatible fresh output for organization/campaign
3. Rejects stale, incompatible, or version-mismatched outputs with explicit reason

No hidden fallback to arbitrary previous campaign outputs.

## Example chain

```
strategy → channel_planning → creative_generation
```

Each downstream capability references upstream output IDs rather than regenerating upstream work when valid fresh outputs exist.

Admin lineage: `getPersistentOutputLineage()` in `lib/brain/admin/persistence-read-models.ts`.
