# PX-48.1 — Production Persistence Activation

**Status:** Complete  
**Depends on:** PX-48 Durable Persistence, PX-47 Autonomous Marketing Peer v1  
**Does not include:** PX-49 Real Context Acquisition, UI changes, new Brains

---

## Purpose

Prove that Peergent's autonomous Marketing Peer can use **Supabase as the durable source of truth** across server/process restarts — without requiring an in-process singleton for correctness.

---

## Section 1 — PX-48 Audit Findings

| # | Finding |
|---|---------|
| 1 | `configureLayerRepositories()` was only called in tests before PX-48.1 |
| 2 | Live server paths did not configure `mode: "supabase"` |
| 3 | `getLayerRepositories()` defaulted to `persistent_in_memory` (process-local module cache) |
| 4 | Supabase write-through repos used fire-and-forget async upserts — not durable-before-success |
| 5 | `hydrateLayerStoresFromSupabase()` loaded episode + org memories only; full graph hydration added in PX-48.1 |
| 6 | Hydration was manual; now canonical via `ensureServerBrainRuntime()` |
| 7 | Runtime paths depended on module-level L1 cache in `stores.ts` |
| 8 | `resolveBrainOutputs()` read L1 cache only; `resolveBrainOutputRef()` now repository-backed |
| 9 | Memory survived module recreation (persistent_in_memory) but not true cold start without hydration |
| 10 | Approvals/events/observations/idempotency same — L1 only until durable port |
| 11 | Episode `version` column existed; optimistic locking not enforced until PX-48.1 RPC |
| 12 | Brain snapshots write-through but not awaited on critical path |

---

## Production Composition Root

```
Server boundary (API route, server action)
    ↓
ensureServerBrainRuntime({ supabase, organizationId, projectId })
    ↓
createServerBrainRuntime({ supabase, mode: "supabase" })
    ↓
configureLayerRepositories({ mode: "supabase", supabase })
createDurablePersistence({ mode: "supabase", supabase })
    ↓
DurablePersistencePort (awaited critical writes)
    ↓
ProjectEpisodeRunner / ExecutionLayer
```

**Canonical files:**

| File | Role |
|------|------|
| `lib/brain/persistence/server/create-server-brain-runtime.ts` | Initialize mode, L1 repos, durable port |
| `lib/brain/persistence/server/ensure-server-brain-runtime.ts` | Server entry + scoped hydration |
| `lib/brain/persistence/server/persistence-config.ts` | Mode resolution, fail-closed production |
| `lib/brain/persistence/layer/durable-persistence-port.ts` | Critical write/hydration interface |
| `lib/brain/persistence/layer/supabase-durable-persistence.ts` | Supabase implementation |
| `lib/brain/persistence/layer/simulated-durable-persistence.ts` | CI cold-start tests |
| `lib/brain/persistence/repository-factory-server.ts` | Wires `createServerBrainRuntime` when supabase provided |

**Dependency direction:** Brain layers never create Supabase clients. Server boundary injects infrastructure.

---

## How Supabase Mode Becomes Active

1. **Production:** `NODE_ENV=production` → `resolveBrainPersistenceMode()` returns `"supabase"` (or explicit `BRAIN_PERSISTENCE_MODE=supabase`). Non-supabase modes throw `PersistenceConfigurationError`.
2. **Server factory:** `createBrainRepositoriesForServer({ supabase, environment: "live" })` calls `createServerBrainRuntime({ supabase, mode: "supabase" })`.
3. **Project routes:** Call `ensureServerBrainRuntime({ supabase, organizationId, projectId })` before episode execution.

Local dev defaults to `persistent_in_memory` unless `BRAIN_PERSISTENCE_MODE=supabase`. Tests use `in_memory` via `VITEST=true` or explicit configuration.

---

## Repository Lifecycle

| Layer | Semantics |
|-------|-----------|
| **L1 cache** | `Persistent*Repository` — sync, module-scoped; Brains write here unchanged |
| **Durable port** | Awaited Supabase/simulated writes for critical state |
| **Write-through repos** | L1 + async Supabase (legacy PX-48); critical path uses durable port instead |

Critical episode transitions call `commitEpisodeCritical()` which: caches L1 → syncs brain documents → versioned episode upsert.

---

## Hydration Architecture

**Entry:** `DurablePersistencePort.hydrateProject({ organizationId, projectId })`

**Eager (on project hydrate):**

- Company documents (org-scoped)
- Project-scoped brain layer documents (research → execution)
- Project episode record + version
- Org memory records
- Approvals, events, observations (simulated store / future Supabase expansion)

**Lazy:**

- Individual historical brain versions (only latest loaded via documents)
- Non-critical telemetry events (loaded on demand where implemented)

**Org-only hydrate:** `hydrateOrganizationMemory()` — for Project 2 consuming Project 1 memory without full project docs.

---

## OutputRef Resolution

**Canonical:** `resolveBrainOutputRef({ organizationId, outputRef, projectId? })`

1. Query durable store (`brain_layer_documents` by `output_ref`)
2. Fall back to L1 cache (same process only)
3. Return structured `{ found, payload, source, brainId }`

Org isolation: foreign `organizationId` cannot resolve another org's artifact. Project scoping rejects cross-project refs when `projectId` provided.

---

## Critical vs Non-Critical Writes

| Critical (durable-before-return) | Non-critical (may async) |
|----------------------------------|--------------------------|
| Brain output documents via `syncBrainDocumentsFromCache` | Legacy write-through layer repos |
| Episode versioned upsert | Some telemetry event fan-out |
| Approval decision | |
| Execution idempotency reserve/confirm | |
| Org memory records | |
| Execution receipt document | |

---

## Transaction / Recovery Boundaries

| Boundary | Mechanism | Recovery |
|----------|-----------|----------|
| A. Brain + episode | Sequential awaited writes; episode version last | Reload episode; conflict → `PersistenceConflictError` |
| B. Approval + episode | `commitApprovalCritical` | Re-submit approval idempotently by approval id |
| C. Execution | Reserve → provider → confirm + receipt doc | Lookup idempotency; `succeeded` → return prior; `ambiguous` → fail closed |
| D. Learning → Memory | Brain doc sync + episode persist | Reload proposals from episode `cachedLearningProposals` |

Postgres RPC `upsert_brain_project_episode_versioned` provides optimistic concurrency for episode state.

---

## Execution Idempotency

States: `reserved` → `executing` → `succeeded` | `failed` | `ambiguous`

1. **Reserve** durable record before provider call
2. **Duplicate request** checks Supabase/simulated store first (before input validation when prior succeeded)
3. **Confirm** binds receipt + execution document on success
4. **Ambiguous** provider outcome → no blind retry; diagnostic `execution_outcome_ambiguous`

Limitation: exactly-once depends on provider lookup capability. Stub adapters support idempotent replay.

---

## Optimistic Concurrency

Episode updates use `expectedVersion` with RPC `WHERE version = expectedVersion`. Zero rows → `PersistenceConflictError` with expected/actual versions. Caller must reload and re-evaluate.

Field: `ProjectEpisodeRecord.durableVersion`

---

## RLS / Organization Isolation

Migration `20250812100000_brain_layer_persistence.sql` defines `is_org_member(organization_id)` policies on all brain tables.

**CI:** Unit tests prove org-scoped outputRef resolution.  
**Live Supabase integration:** Requires `SUPABASE_URL` + service role or test users — documented harness in test file comments; not faked in CI.

Run live RLS verification (when configured):

```bash
BRAIN_PERSISTENCE_MODE=supabase SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  npm test -- lib/brain/persistence/__tests__/supabase-rls.integration.test.ts
```

*(Harness stub — add when CI Supabase project available)*

---

## Observability

Structured JSON logs via `emitPersistenceDiagnostic()`:

- `persistence_initialized`
- `persistence_hydration_started` / `_completed` / `_failed`
- `persistence_write_failed`
- `persistence_conflict`
- `output_ref_missing`
- `execution_idempotency_conflict`
- `execution_outcome_ambiguous`

Disable: `BRAIN_PERSISTENCE_DIAGNOSTICS=0`

Never logs secrets, tokens, or raw provider credentials.

---

## Cold-Start Acceptance Test

`lib/brain/persistence/__tests__/production-persistence-activation.test.ts`

**Process A:** Run lifecycle with `SimulatedDurablePersistence` → persist  
**Process B:** Destroy L1 cache → hydrate → verify graphs + approval + execute  
**Process C:** Destroy L1 → hydrate → idempotency + learning + memory  
**Process D:** Project 2 hydrates org memory from Project 1

Simulated store is separate from L1 `stores.ts` — proves true empty-process recovery without live Supabase in CI.

---

## What Happens If a Vercel Instance Disappears?

| Lifecycle point | Behavior after restart |
|-----------------|------------------------|
| Mid-Brain (Company→Validation) | Hydrate project; episode `executedBrainKeys` prevents re-run; outputRefs resolve from durable docs |
| At approval gate | Episode `waiting_for_approval` restored; approvals list intact |
| After approval, before execution | `approvalGrantedForExecution` restored; execution proceeds |
| During execution (post-provider) | Idempotency `succeeded` → return prior receipt, no duplicate publish |
| During execution (pre-provider) | Idempotency `reserved` → conflict diagnostic; safe retry after timeout policy |
| Post-execution, pre-observation | Episode in `monitoring`; waits for observations |
| During Learning | Learning snapshot durable; Memory commit retried on resume |
| Post-Memory | Org memories hydrated for future projects |

---

## Known Limitations

1. Legacy write-through Supabase layer repos still fire-and-forget for non-critical paths
2. Live Supabase RLS integration tests require external CI project
3. Distributed transactions not used across all multi-write boundaries — sequential awaited writes + version RPC
4. `ambiguous` execution requires manual ops review
5. Full event/observation Supabase hydration on cold start partial — simulated store complete, Supabase path loads episode + docs + memories

---

## PX-49 Recommendation

PX-48.1 completes production persistence activation. **Proceed to PX-49 Real Context Acquisition** with:

1. Call `ensureServerBrainRuntime()` at campaign/project server entry points
2. Set `BRAIN_PERSISTENCE_MODE=supabase` in production Vercel env
3. Apply migrations `20250812100000` + `20250812110000` to production Supabase
4. PX-49 replaces fixture context with real acquisition — persistence layer requires no redesign

---

## Related Docs

- `docs/architecture/DURABLE_PERSISTENCE.md` — PX-48 infrastructure
- `docs/architecture/AUTONOMOUS_MARKETING_PEER_V1.md` — lifecycle
- `docs/architecture/BRAIN_ARCHITECTURE_BLUEPRINT.md` — layer architecture
