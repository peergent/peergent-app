# Memory

Sprint 1 defines **memory design contracts only** — no persistence.

## Scopes

| Scope | Lifetime |
|-------|----------|
| `temporary` | Session / run |
| `campaign` | Single campaign |
| `organization` | Org-wide |
| `peer` | Peer-specific |
| `user` | User-specific |

## BrainMemoryCandidate

Each candidate includes:

- `provenance` — traceable source refs
- `confidence` — low / medium / high
- `reviewState` — candidate / approved / rejected / expired
- `expiresAt` — optional TTL

`isMemoryExpired()` checks expiration. Implementation deferred to Sprint 2+.
