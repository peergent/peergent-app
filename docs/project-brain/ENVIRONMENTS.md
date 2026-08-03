# Environments

Brain runs in exactly one of three environments, resolved by `resolveBrainEnvironment()`:

## live

Default for real customer work. Live providers may access organization data. Demo fixtures are rejected.

## demo

Resolved when `peerId === "demo"` or explicitly set. Uses `DemoBrainCapabilityProvider` — deterministic output, no tokens, no costs, no live data access.

- `assertDemoEnvironmentOnly()` — demo provider entry guard
- `assertEnvironmentAllowsLiveAccess()` — live provider entry guard (rejects demo)

## test

Resolved when `NODE_ENV=test` unless overridden. Used by automated tests.

## Admin vs customer

| Stream | Sees |
|--------|------|
| Live customer | Findings, evidence, recommendations, approvals, actions, results only |
| Admin | Brain health, runs, capabilities, cache, audit (read models — no UI yet) |
| Demo | Same runtime, demo adapter only |

No duplicate Brain implementation per stream.
