# Durable Persistence (PX-48)

## 1. Existing persistence inventory

### Supabase infrastructure (pre-PX-48)

| Area | Status |
|------|--------|
| Client setup | `@supabase/ssr` — browser + server + middleware |
| Auth/org | `organizations`, `organization_members`, `profiles` |
| Legacy intelligence | `company_dna`, `business_brains`, `marketing_profiles`, `website_intelligence_assessments` |
| Brain runtime (Sprint 6) | 12 `brain_*` tables in `20250803100000_brain_persistence.sql` |
| Supabase adapters | runs, outputs, audit, idempotency only |
| Service role | Not used in app code — JWT + RLS only |

### In-memory repositories (pre-PX-48)

| Repository | Location | Durable before PX-48 |
|------------|----------|----------------------|
| CompanyRepository | `layers/company/company-repository.ts` | No |
| ResearchBrainRepository | `layers/research/research-brain-repository.ts` | No |
| ReasoningBrainRepository | `layers/reasoning/reasoning-brain-repository.ts` | No |
| MarketingIntelligenceBrainRepository | `layers/marketing-intelligence/` | No |
| StrategyBrainRepository | `layers/strategy/strategy-brain-repository.ts` | No |
| PlanningBrainRepository | `layers/planning/planning-brain-repository.ts` | No |
| CreativeRepository | `layers/creative/creative-repository.ts` | No |
| ValidationRepository | `layers/validation/validation-repository.ts` | No |
| MemoryRepository | `layers/memory/memory-repository.ts` | No |
| ExecutionRepository | `layers/execution/execution-repository.ts` | No |
| LearningBrainRepository | `layers/learning/learning-brain-repository.ts` | No |
| ProjectEpisodeRepository | `project-runtime/project-episode-repository.ts` | No |
| Async brain repos (7) | snapshots, corrections, queue, approvals, etc. | Persistent in-memory only |

## 2. Why PX-48 exists

PX-47 proved the autonomous Marketing Peer lifecycle works end-to-end in-memory. PX-48 makes that intelligence and lifecycle state survive process boundaries (server restart, Vercel cold start, deployment, instance migration).

## 3. Durable architecture

```
Brain / Runtime
  ↓
Repository Interface (unchanged)
  ↓
LayerRepositoryBundle (composition root)
  ↓
persistent_in_memory | supabase write-through
  ↓
Module-scoped stores | Supabase tables
```

Domain logic never imports Supabase directly.

## 4. Repository boundaries

Frozen. PX-48 adds adapters; it does not change Brain ownership or contracts.

## 5. Database schema (PX-48 migration)

`20250812100000_brain_layer_persistence.sql`:

| Table | Purpose |
|-------|---------|
| `brain_layer_documents` | Versioned immutable brain output snapshots (JSONB) |
| `brain_layer_latest` | Current/latest output ref pointers |
| `brain_org_memory_records` | Queryable organizational memory |
| `brain_project_episodes` | Full project runtime state |
| `brain_project_events` | Append-only event stream |
| `brain_project_approvals` | Approval decisions |
| `brain_performance_observations` | Canonical observations |
| `brain_execution_idempotency` | Execution idempotency index |

## 6. Relational vs JSONB decisions

| Category | Relational columns | JSONB payload |
|----------|-------------------|---------------|
| Brain snapshots | orgId, brainId, scopeKey, version, outputRef, status | Full graph/record |
| Memory records | orgId, memoryId, category, tags, confidence, importance | content, evidence, relations |
| Project episodes | orgId, projectId, episodeStatus, currentState, version | Full episode + artifacts + resolvedGraphs |
| Events | orgId, projectId, eventId, eventType, brainId | metadata |
| Execution idempotency | orgId, idempotencyKey, outputRef | Full execution record |

Relational columns enable org scoping, indexing, and future queries. JSONB preserves Brain graph fidelity without dozens of normalized tables.

## 7. Brain snapshot model

Every brain output is stored as an immutable document:

- `brainId`, `documentKind`, `documentId`, `outputRef`, `version`
- `payload` (full graph)
- `supersedesOutputRef` optional
- New run = new version; history preserved

## 8. Output references

Canonical format: `{brain}:{orgId}:{scope}:v{version}`

`outputRefIndex` in module stores enables resolution after repository instance recreation. Supabase `brain_layer_documents.output_ref` is the durable source.

## 9. Versioning

- Company: version integer on graph
- Project-scoped brains: per projectId scopeKey
- Latest pointer in `brain_layer_latest`
- Historical fetch via `getVersion` / document id

## 10. Project runtime persistence

`ProjectEpisodeRecord` persisted including:

- snapshot, artifacts, resolvedGraphs, cachedLearningProposals
- episodeStatus, approval/observation flags
- optimistic version on episode row

## 11. Approvals

`brain_project_approvals` + in-memory index. Idempotent on `approval_id`.

## 12. Performance observations

Deduplicated on `(organization_id, project_id, observation_id)`.

## 13. Events

Append-only with idempotent `event_id`. Powers future Live Activity.

## 14. Memory persistence

Dual write:

1. `brain_layer_documents` (memory_store)
2. `brain_org_memory_records` (denormalized for retrieval)

Project 2 retrieves via `getOrgMemories(organizationId)`.

## 15. Execution audit / idempotency

`brain_execution_idempotency` maps idempotency keys → execution records. Restart + retry returns prior receipt without re-executing provider.

## 16. Transactions

Write-through uses individual upserts. Documented gap: episode save + event append are not yet wrapped in a single DB transaction. PX-49 can add RPC for atomic episode+event writes.

## 17. Concurrency

Episode row includes `version` for optimistic concurrency. Project Engine retry/resume respects `executedBrainKeys` for idempotency.

## 18. Multi-tenancy

Every table includes `organization_id`. RLS via `is_org_member()`. Tests prove org A/B isolation.

## 19. RLS / security

Server-side only. No service role in customer paths. No client-side brain DB access.

## 20. Repository composition

`createLayerRepositories({ mode, supabase })` in `lib/brain/persistence/layer-repository-factory.ts`.

Modes:

- `in_memory` — volatile, isolated unit tests
- `persistent_in_memory` — module-scoped, survives instance recreation (default live fallback)
- `supabase` — write-through to Supabase tables

`getDefault*Repository()` delegates to `getLayerRepositories()`.

## 21. In-memory test adapters

Preserved. `configureLayerRepositories({ mode: 'in_memory' })` for isolated tests.

## 22. Restart recovery

Persistent stores survive repository instance recreation within process. Supabase mode survives cross-process via `hydrateLayerStoresFromSupabase()`.

## 23. Cross-session Memory

Org memory index persisted in module store + Supabase. Project 2 receives prior memories via `resolveBrainOutputs()`.

## 24. Legacy compatibility

Repositories return null/empty for missing history. No crash on partial brain lifecycle.

## 25. Future vector/semantic memory

`brain_org_memory_records` indexed by category, tags, campaign. Extension point for vector column or external index in later sprint.

## 26. What remains for PX-49

- Real context acquisition (website, business profile, budget)
- UI CTAs for context gaps
- Atomic transaction RPCs for critical writes
- Supabase adapters for remaining Sprint 6 async repos (snapshots, corrections, queue)
- Regenerate `database.types.ts` with brain tables
- RLS integration test harness with live Supabase
