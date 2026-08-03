# Project Brain — Admin Read Services (Sprint 6)

Organization-safe read services for future admin UI. Customer-facing services must not expose these models.

## Services

| Function | Purpose |
|----------|---------|
| `getBrainRunDetail` | Run + recovery classification + audit count |
| `listBrainRuns` | Filtered run list |
| `getBrainRuntimeHealth` | Active/failed/waiting counts |
| `getCapabilityHealth` | Output freshness + stale dependencies |
| `getCompanyReadiness` | From assembly result |
| `getWebsiteFreshness` | Latest snapshot freshness |
| `listInvalidations` | Pending invalidation queue |
| `listMemoryCandidates` | Review queue |
| `getPersistentOutputLineage` | Output supersession chain |

All require `{ isAdmin: true }` except customer-safe helpers like `toCustomerSafeRunSummary()`.

Location: `lib/brain/admin/persistence-read-models.ts`

No admin UI in Sprint 6.
