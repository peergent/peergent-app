# Runtime Errors

Explicit runtime errors — no silent failures.

| Error | Code | When |
|-------|------|------|
| `BrainRuntimeError` | various | General runtime failure |
| `BrainRunTransitionError` | `invalid_transition` | Illegal status transition |
| `BrainRunNotFoundError` | `run_not_found` | Run id not found |
| `BrainRunBudgetExceededError` | `budget_exceeded` | Budget limits exceeded |
| `BrainRunReadinessError` | `readiness_insufficient` | Context not ready |
| `BrainOutputValidationError` | `output_validation_failed` | Invalid structured output |
| `BrainRunIsolationError` | `organization_isolation` | Cross-tenant access |
| `BrainEnvironmentIsolationError` | — | Demo/live isolation (existing) |

## Readiness outcomes

When readiness fails, the run transitions to:
- `waiting_for_input` — customer can supply missing information
- `blocked` — no context at all

Never invent missing context.

## Provider errors

| Code | When |
|------|------|
| `provider_not_found` | No provider for environment |
| `capability_not_allowed` | Capability blocked in environment |
| `sync_not_supported` | Sync execution without `executeSync` |
| `sync_assembly_required` | Async assembly in sync path |

See `lib/brain/runtime/errors.ts`.
