# Runtime Security

## Organization isolation

- All repositories are organization-scoped
- `lookupRun()` validates organization match
- Cross-tenant access throws `BrainRunIsolationError`

## Environment isolation

| Environment | Provider |
|-------------|----------|
| `demo` | Demo provider only |
| `test` | Demo provider only |
| `live` | Live providers (not implemented in Sprint 4) |

- `assertDemoEnvironmentOnly()` — demo provider guard
- `assertEnvironmentAllowsLiveAccess()` — live provider guard

## Cache isolation

Cache keys prefix with `organizationId`. No cross-tenant cache entries.

## Audit

Audit records store facts only — no chain of thought:
- lifecycle status
- provider id
- readiness state
- policy decision
- context/snapshot version
- token usage (zero for demo)
- duration

## Idempotency

`BrainIdempotencyRepository` is organization-scoped. Same key + org returns same run id.
