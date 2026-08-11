# Execution Brain

**Status:** PX-39 — Architecture implemented  
**Authority:** [BRAIN_ARCHITECTURE_BLUEPRINT.md](./BRAIN_ARCHITECTURE_BLUEPRINT.md), [PROJECT_ENGINE.md](./PROJECT_ENGINE.md), [VALIDATION_BRAIN.md](./VALIDATION_BRAIN.md)

---

## Purpose

Execution Brain is the **operational actuator** of Peergent.

It executes validated, approved instructions through provider adapters. It is deliberately boring — input is a validated instruction, output is a deterministic execution result.

```text
CreativeGraph + ValidationGraph + Approval
                    ↓
             Execution Brain
                    ↓
     ExecutionHistory · Receipts · Audit · Events
                    ↓
        Memory Brain (future) · Learning Brain (future) · BOL (future)
```

**Never:** think, generate content, change strategy, validate, learn, write Memory.  
**Only:** perform operations and record truthful provider outcomes.

---

## Responsibilities

| Owns | Never owns |
|------|------------|
| Provider adapter invocation | Strategy or planning decisions |
| Execution receipts with provider evidence | Content generation |
| Idempotency and attempt tracking | Validation verdicts |
| Immutable audit records | Organizational memory |
| Execution events | UI narrative text |
| Retry classification (not orchestration timing) | Publish claims without provider confirmation |

---

## Boundaries

Per [BRAIN_ARCHITECTURE_BLUEPRINT.md](./BRAIN_ARCHITECTURE_BLUEPRINT.md) §4.12:

- Execution is the **final safety gate** before external side effects
- Validation must be `READY` or `READY_WITH_SUGGESTIONS`
- Required approval must be completed
- `BLOCKED` and `CHANGES_REQUIRED` never execute
- Success requires **provider evidence** — never fabricate "Published"

---

## Execution lifecycle

```text
PENDING → READY → EXECUTING → SUCCEEDED | FAILED | RETRYABLE | PARTIALLY_SUCCEEDED | CANCELLED
```

Project Engine schedules Execution Brain. Execution Brain never schedules itself or chooses the next Brain.

---

## Execution contract

| Type | Purpose |
|------|---------|
| `ExecutionInstruction` | Validated operation to perform |
| `ExecutionContext` | Org, project, peer, correlation, dry-run flag |
| `ExecutionTarget` | Provider, destination, channel, deliverable |
| `ExecutionPayload` | Structured content refs — no secrets |
| `ExecutionProvider` | Provider metadata and health |
| `ExecutionAttempt` | Single attempt with timestamps |
| `ExecutionReceipt` | Provider-confirmed evidence |
| `ExecutionFailure` | Classified failure record |
| `ExecutionHistory` | Complete persisted artifact |
| `ExecutionAuditRecord` | Immutable audit entry |
| `ExecutionEvent` | Activity/timeline events |

---

## Provider adapter architecture

Execution Brain contains **zero provider-specific logic** in its core.

```text
ExecutionLayer
      ↓
ExecutionProviderRegistry
      ↓
ExecutionProviderAdapter { supports, validate, execute, lookup, cancel, rollback }
      ↓
Stub adapters (PX-39): LinkedIn, Meta, Google Ads, Email, CMS, CRM, Calendar
```

Every adapter returns normalized `ExecutionResult`.

---

## Provider capabilities

Each adapter declares:

- `supportsPublishing`, `supportsScheduling`, `supportsEditing`, `supportsDeletion`
- `supportsMedia`, `supportsVideo`, `supportsDrafts`
- `supportsRollback`, `supportsLookup`, `supportsCancel`

Execution Brain checks capabilities before invoking — never assumes support.

---

## Provider health

| Status | Behavior |
|--------|----------|
| `healthy` | Execute normally |
| `degraded` | Execute with caution |
| `unavailable` / `maintenance` | Refuse execution |
| `rate_limited` | Classify as `RATE_LIMITED` |

---

## Dry Run

When `dryRun: true`:

- Validates provider, payload, permissions, approval, validation
- Returns simulated receipts marked `dryRun: true`
- No external side effects
- No external URLs on receipts

---

## Idempotency

- Every instruction carries an `idempotencyKey`
- Repository indexes by org + key
- Duplicate execution returns prior receipt — never publishes twice
- Attempt count and correlation id persisted

---

## Retry strategy

Failures classified as:

| Class | Retryable |
|-------|-----------|
| `PERMANENT` | No |
| `VALIDATION` | No |
| `AUTHENTICATION` | No |
| `RETRYABLE` | Yes |
| `RATE_LIMITED` | Yes |
| `PROVIDER_UNAVAILABLE` | Yes |
| `UNKNOWN` | Yes |

Execution Brain classifies — **Project Engine owns retry timing**.

Default max attempts: 3.

---

## Rollback

Adapters expose `supportsRollback()` and `rollback()`.

`classifyRollback()` returns structured classification per entry.

Never assume rollback exists.

---

## Partial execution

Multi-deliverable campaigns execute independently per approved deliverable.

Overall status aggregation:

- All succeed → `SUCCEEDED`
- Mix succeed/fail → `PARTIALLY_SUCCEEDED`
- Any retryable → `RETRYABLE` (unless all failed permanently)

---

## Persistence

`InMemoryExecutionRepository` (PX-39) stores:

- Execution instruction refs
- Status, attempts, timestamps
- Provider receipts (externalId, externalUrl, providerTimestamp)
- Idempotency keys
- Audit records

**Never persists:** API keys, OAuth tokens, secrets.

---

## Audit model

`ExecutionAuditRecord` is immutable after creation:

- who initiated, when, what provider
- payload reference (not raw secrets)
- approval reference, validation reference
- result status, receipt/failure ids
- correlation id, idempotency key, dry-run flag

---

## Events

Published event types:

- `execution_requested`, `execution_started`, `provider_called`
- `execution_succeeded`, `execution_failed`, `execution_retryable`
- `execution_partially_succeeded`, `execution_cancelled`

Future consumers: Brain Output Layer, Memory Brain, Learning Brain, Live Activity.

---

## Project Engine integration

```typescript
executionBrainContract: ProjectBrainContract
  id: "execution"
  capabilityIds: ["execution"]
  requiredContextSlices: ["campaign"]
```

Registered in `createDefaultProjectBrainRegistry()`.

---

## Memory integration

Execution Brain **never writes Memory**.

It returns receipts and events. Memory Brain (scheduled separately) decides what becomes `execution_memory`.

---

## Future Learning integration

Learning Brain will consume:

- Execution receipts
- Failure classifications
- Partial success patterns

Learning writes to Memory — not directly to Strategy or Creative.

---

## Cross-peer reuse

Execution Brain is **peer-agnostic**. Marketing, Sales, Support, and other peers use the same adapter registry with peer-specific provider connections configured via `configRef` — never embedded credentials.

---

## File layout

```text
lib/brain/layers/execution/
├── types.ts
├── execution-provider-adapter.ts
├── execution-provider-registry.ts
├── adapters/stub-adapters.ts
├── execution-validator.ts
├── execution-idempotency.ts
├── execution-retry-policy.ts
├── execution-audit.ts
├── execution-events.ts
├── execution-repository.ts
├── build-execution-history.ts
├── execution-layer.ts
├── execution-brain-executor.ts
├── map-execution-to-output.ts
├── index.ts
└── __tests__/execution-brain.test.ts
```

---

## Constraints (PX-39)

- No UI changes
- No Project Engine architecture changes
- No Brain Output Layer wiring
- No modifications to Creative, Validation, Memory, or Learning Brains
- No changes to BRAIN_ARCHITECTURE_BLUEPRINT.md
