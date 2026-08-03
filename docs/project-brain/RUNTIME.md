# Brain Runtime

Sprint 4 introduces the **BrainRuntime** — the provider-neutral orchestrator for every capability execution.

## Principle

- **Capabilities** describe work
- **Providers** perform work
- **Runtime** orchestrates work

No capability executes itself. Everything goes through `BrainRuntime`.

## Flow

```
BrainRunRequest
  → Environment resolution
  → Capability lookup
  → CompanyContextAssembler
  → Readiness validation
  → Budget validation
  → Policy evaluation
  → Provider selection
  → Context projection
  → Cache lookup
  → Capability execution
  → Output validation
  → Audit
  → Customer presentation
```

## API

| Method | Purpose |
|--------|---------|
| `submitRun()` | Accept request, idempotency check |
| `executeRun()` | Full async pipeline |
| `executeRunSync()` | Sync path for deterministic demo providers |
| `resumeRun()` | Continue waiting runs |
| `cancelRun()` | Cancel non-terminal runs |
| `lookupRun()` | Organization-scoped run lookup |

## Package location

```
lib/brain/runtime/
  brain-runtime.ts
  run-request.ts
  run-result.ts
  state-machine.ts
  context-projection.ts
  readiness-gate.ts
  budget-validator.ts
  output-validator.ts
  provider-selector.ts
  audit-builder.ts
  repositories/
```

## Factory

```typescript
import { createBrainRuntimeWithAssembly, executeBrainForWorkflowStepSync } from "@/lib/brain";

const runtime = createBrainRuntimeWithAssembly((request) =>
  resolveCompanyIntelligence({ ... })
);
```

See also: [RUN_LIFECYCLE.md](./RUN_LIFECYCLE.md), [CAPABILITY_EXECUTION.md](./CAPABILITY_EXECUTION.md).
