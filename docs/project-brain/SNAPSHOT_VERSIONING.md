# Project Brain — Snapshot Versioning (Sprint 6)

Snapshots are **immutable versioned records**. Meaningful context changes create a new version; old snapshots are never mutated in place.

## Snapshot kinds

- `company` — assembled company profile + business/brand knowledge
- `website` — structured website snapshot (not raw HTML)
- `brain` — brain snapshot references for capability execution

## Fields

- `versionNumber` — monotonic per organization/kind
- `contextHash` — hash of contributing context slices
- `sourceHash` — hash of upstream sources
- `freshness` — operational freshness state
- `supersededBy` — pointer to replacement snapshot

## Query patterns

- Latest valid: `BrainSnapshotRepository.getLatest(org, kind)`
- By version: `getById(org, snapshotId)`
- Stale list: `listStale(org)`

## Invalidation

Website or profile changes trigger dependency invalidation via `BrainInvalidationService` — outputs marked stale, cache metadata invalidated, history preserved.

See [INVALIDATION_EXECUTION.md](./INVALIDATION_EXECUTION.md).
