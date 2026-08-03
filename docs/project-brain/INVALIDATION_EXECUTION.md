# Project Brain — Invalidation Execution (Sprint 6)

Sprint 3 defined the dependency graph. Sprint 6 executes invalidation.

## Service

`BrainInvalidationService` in `lib/brain/persistence/invalidation-service.ts`

### Input events

- website snapshot changed
- company profile changed
- brand/business facts changed
- customer correction changed
- capability version changed (future)

### Behavior

1. Resolve cascade via `resolveInvalidationCascade(trigger)`
2. Mark affected capability outputs stale in `brain_dependency_states`
3. Invalidate matching cache metadata by context hash
4. Enqueue invalidation record (status `completed` synchronously in Sprint 6)
5. **Never delete** historical outputs

## Queue contract

States: `pending`, `processing`, `completed`, `failed`, `cancelled`

Each item includes organization, source event, affected capabilities, reason, correlation ID, attempts, and error.

Suitable for a future background worker — no worker required in Sprint 6.
