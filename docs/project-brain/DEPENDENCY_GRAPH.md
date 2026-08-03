# Dependency Graph & Invalidation

Sprint 3 implements **dependency tracking only** — no automatic re-execution when context changes.

## Cascade example

```
Website changes
  ↓
website_snapshot invalid
  ↓
company_snapshot invalid
  ↓
brain_snapshot invalid
  ↓
company_understanding invalid
  ↓
strategy invalid
  ↓
campaign_suggestions stale
```

## Invalidation nodes

Defined in `INVALIDATION_DEPENDENCIES` (`lib/brain/invalidation/dependency-graph.ts`):

- `website_snapshot`
- `company_profile`
- `company_snapshot`
- `brain_snapshot`
- Brain capabilities (`company_understanding`, `website_understanding`, `strategy`, …)
- `campaign_suggestions`

Use `resolveInvalidationCascade(trigger)` to walk the graph.

## Customer corrections

Each correction can declare `invalidates` or use `defaultInvalidationsForField()`:

| Field | Typical cascade |
|-------|-----------------|
| `website` | website_snapshot → company_snapshot → strategy |
| `industry` | company_snapshot → company_understanding |
| `targetAudiences` | company_snapshot → strategy |
| `tone` | company_snapshot → brand_understanding → creative_generation |

`invalidationForCorrection(fieldKey)` returns the full affected node set.

## Context hash slices

Cache invalidation keys on these slices (`CONTEXT_HASH_SLICES`):

- `website`
- `corrections`
- `business`
- `brand`
- `company_profile`

When any slice changes, `contextHash` on snapshot version metadata changes and downstream cache entries should invalidate.

## Events

`createInvalidationEvent()` produces audit-ready events with `trigger`, `affected`, and `reason`. Admin read models (`InvalidationQueueReadModel`) prepare for future queue processing — no UI in Sprint 3.

## Freshness states

`FreshnessState`: `fresh | stale | expired | invalid | unknown`

`resolveContextFreshness()` in `lib/brain/context/freshness-resolver.ts` extends domain freshness with `invalid` for explicitly invalidated snapshots.
