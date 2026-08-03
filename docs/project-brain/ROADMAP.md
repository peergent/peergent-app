# Roadmap

## Sprint 1–5 (complete)

Foundation, company/website intelligence, context assembly, Brain Runtime, seven deterministic marketing capabilities.

## Sprint 6 (complete)

- Persistent Brain runs, outputs, audit, snapshots, corrections, memory candidates
- Organization-scoped repository factory (demo / test / live separation)
- Supabase migration with RLS (`20250803100000_brain_persistence.sql`)
- Invalidation execution and upstream output lineage
- Live context assembly without demo fixture fallback
- Admin persistence read services
- Run recovery classification
- Comprehensive tests (`persistence-sprint6.test.ts`)

## Sprint 7 (recommended)

1. **LLM provider adapter** — implement real `BrainCapabilityProvider` for strategy, brand, competitor (OpenAI/Anthropic when approved)
2. **Full Supabase adapters** — snapshot, correction, queue repos currently delegate to in-memory
3. **Regenerate `database.types.ts`** after migration applied locally
4. **Background invalidation worker** — process `brain_invalidation_queue` asynchronously
5. **Memory review workflow UI** — approve/reject memory candidates
6. **Real website crawling** — replace demo website provider for live orgs
7. **Performance slice population** — wire real metrics into `BrainSnapshot.performance`
8. **Admin API routes** — expose persistence read models behind admin auth
9. **RLS integration tests** — Supabase test harness for negative cross-org cases

## Principles (unchanged)

- One Brain runtime for all Peers
- Customers see outcomes, not infrastructure
- Upstream systems stay authoritative
- Vision v13 wins for customer UI
