# Project Brain — Persistence (Sprint 6)

Sprint 6 introduces organization-scoped persistent storage for Brain runs, outputs, audit events, snapshots, corrections, memory candidates, idempotency records, dependency states, cache metadata, and approvals.

## Entity model

| Entity | Table | Notes |
|--------|-------|-------|
| BrainRun | `brain_runs` | Lifecycle, budget, policy metadata |
| BrainOutput | `brain_outputs` | Immutable capability payloads |
| BrainAuditEvent | `brain_audit_events` | Append-only operational trace |
| BrainSnapshot | `brain_snapshots` | Versioned company/website/brain snapshots |
| CustomerCorrection | `brain_customer_corrections` | Organization-wide overrides |
| MemoryCandidate | `brain_memory_candidates` | Review queue — never auto-promoted |
| IdempotencyKey | `brain_idempotency_keys` | Same key + different payload rejected |
| DependencyState | `brain_dependency_states` | Freshness / stale tracking |
| InvalidationQueue | `brain_invalidation_queue` | Worker-ready contract |
| CacheEntry | `brain_cache_entries` | Metadata; payload via output reference |
| Approval | `brain_approvals` | Proposal approval state |

Migration: `supabase/migrations/20250803100000_brain_persistence.sql`

## Repository adapters

- **Demo:** volatile in-memory (`storageMode: in_memory`)
- **Test:** module-scoped persistent in-memory (`persistent_in_memory`)
- **Live:** Supabase when client provided; otherwise persistent in-memory for local dev

Factory: `lib/brain/persistence/repository-factory.ts`

Interfaces remain provider-neutral in `lib/brain/persistence/contracts.ts`.

## Demo / live separation

- Live never silently falls back to demo storage.
- Demo never writes to live tables.
- Environment resolved via `resolveBrainEnvironment()` — not route string heuristics.

## Runtime wiring

`BrainRuntime.executeRun()` uses `asyncRepositories` when present:

1. Idempotent run create/reuse
2. Lifecycle transitions with optimistic version
3. Structured output persistence with content hash
4. Audit append
5. Cache metadata upsert

`executeRunSync()` continues using sync in-memory repos for deterministic demo/workflow evidence.

## Known limitations

- Supabase snapshot/correction/queue repos still delegate to in-memory adapters until full SQL adapters land.
- `database.types.ts` not regenerated — Supabase repos use manual row types.
- No background worker for invalidation queue (synchronous execution in Sprint 6).
- No destructive retention cleanup.

See also: [LIVE_INTEGRATION.md](./LIVE_INTEGRATION.md), [SNAPSHOT_VERSIONING.md](./SNAPSHOT_VERSIONING.md), [SECURITY.md](./SECURITY.md).
