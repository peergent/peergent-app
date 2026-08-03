# Project Brain — Security (Sprint 6)

## Multi-tenancy

Every Brain row includes `organization_id`. RLS policies use `is_org_member()` on all customer-facing tables.

Child rows (outputs, audit, snapshots) must match parent run organization via helper functions `brain_run_org_id()` and `brain_snapshot_org_id()`.

## Not persisted

- Hidden chain-of-thought
- Raw provider prompts
- API keys, secrets, environment variables
- Unbounded raw HTML
- Duplicate full snapshot payloads when hashes suffice

## Access boundaries

- **Customer paths:** presentation adapters only — no provider, audit, token, or cache details
- **Admin paths:** explicit `isAdmin` check — no service-role in customer request paths
- **Demo/live isolation:** repository factory enforces storage mode by environment

## Idempotency safety

Same organization + capability + idempotency key with different request hash → explicit rejection.

## Cache isolation

Cache keys and metadata are organization-scoped — no cross-tenant cache hits.

## Tests

Organization isolation tested in `lib/brain/__tests__/persistence-sprint6.test.ts`.

RLS policies defined in migration — negative RLS tests require Supabase test harness (future).
