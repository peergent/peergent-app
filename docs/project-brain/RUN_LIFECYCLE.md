# Run Lifecycle

Sprint 4 implements strict runtime lifecycle with explicit transitions.

## Status flow

```
queued
  ↓
gathering_context
  ↓
ready
  ↓
running
  ↓
completed
```

## Branches

| Status | Meaning |
|--------|---------|
| `waiting_for_input` | Insufficient readiness — customer must supply context |
| `waiting_for_approval` | Policy requires approval before action proposals proceed |
| `blocked` | Policy or budget block |
| `partial` | Capability ran with incomplete context |
| `failed` | Terminal failure |
| `cancelled` | User or system cancelled |

## Transition rules

Illegal transitions throw `BrainRunTransitionError`.

Examples:
- `queued` → `gathering_context` ✓
- `running` → `completed` ✓
- `completed` → `running` ✗

Use `assertValidTransition(from, to)` to validate.

## Run metadata

Each `BrainRunRecord` includes:
- Identity: `id`, `traceId`, `parentRunId`, `childRunIds`
- Scope: `organizationId`, `peerId`, `campaignId`, `environment`, `capabilityId`
- Runtime: `status`, `usage`, `budget`
- Audit refs: `contextHash`, `snapshotVersion`, `policyDecision`, `outputId`

## Resume and cancel

- **Resume:** `waiting_for_input` or `waiting_for_approval` → re-execute
- **Cancel:** any non-terminal status → `cancelled`

Sprint 1 defined types; Sprint 4 implements the state machine in `lib/brain/runtime/state-machine.ts`.
