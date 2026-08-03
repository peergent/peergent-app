# Run lifecycle

## BrainRun statuses

| Status | Meaning |
|--------|---------|
| `queued` | Accepted, not started |
| `gathering_context` | Assembling BrainSnapshot |
| `ready` | Context complete, awaiting execution |
| `running` | Capability in progress |
| `waiting_for_input` | Blocked on user input |
| `waiting_for_approval` | Blocked on approval |
| `completed` | Success |
| `partial` | Some outputs, some failures |
| `failed` | Terminal failure |
| `cancelled` | User or system cancelled |
| `blocked` | Policy or dependency block |

## Metadata

Each `BrainRun` includes:

- `traceId`, `parentRunId`, `childRunIds` — distributed tracing
- `usage` — token placeholders (no provider in Sprint 1)
- `budget` — run budget caps
- `provider` — provider id placeholder

Sprint 1 defines types only; no run executor yet.
