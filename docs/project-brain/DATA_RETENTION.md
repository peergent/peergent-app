# Project Brain — Data Retention (Sprint 6)

Sprint 6 defines retention categories without implementing destructive cleanup.

## Categories

| Category | Default retention | Notes |
|----------|-------------------|-------|
| Run metadata | 90 days operational | Extend for compliance as needed |
| Audit events | 1 year | Append-only, org-scoped |
| Capability outputs | Until superseded + grace | Immutable history |
| Snapshots | Version chain retained | Superseded marked, not deleted |
| Corrections | Permanent with supersede chain | Auditable history |
| Memory candidates | 90 days if unrevised | Expire to `expired` state |
| Cache metadata | TTL-based | Invalidated entries retained briefly |
| Idempotency keys | 24–72 hours | Prevent duplicate runs |

## Principles

- Deletion is organization-scoped and auditable
- No automatic production cleanup in Sprint 6
- Legal/privacy review required before implementing purge jobs

See [SECURITY.md](./SECURITY.md) for RLS and access boundaries.
