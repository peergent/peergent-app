# Audit

Admin trace model for Brain runs — **no chain of thought** stored.

## BrainAuditRecord

Captures:

- Sources consulted
- Capabilities invoked
- Policy decisions
- Approval events
- Tool requests (placeholder)
- Errors and warnings
- Usage and timing metadata

## BrainAuditTrace

Groups records by `traceId` for a full run tree (parent/child runs).

## Admin read models (Sprint 1)

| Model | Purpose |
|-------|---------|
| `BrainHealth` | Org-level health snapshot |
| `BrainRunSummary` | Single run summary for admin |
| `BrainSourceHealth` | Freshness of upstream sources |

No admin UI in Sprint 1 — contracts and read models only.
