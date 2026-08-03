# Roadmap

## Sprint 1–4 (complete)

Foundation, company/website intelligence, context assembly, Brain Runtime.

## Sprint 5 (complete)

- Seven deterministic marketing capabilities through BrainRuntime
- Capability dependency graph and orchestration
- Quality safeguards and provenance extensions
- Presentation adapters and admin capability read models
- Marketing Workspace integration (demo peer, with office fallbacks)
- Comprehensive tests (`capabilities-sprint5.test.ts`)

## Sprint 6 (recommended)

1. **LLM provider adapter** — implement `BrainCapabilityProvider` for strategy, brand, competitor with token projections
2. **Performance slice population** — wire real metrics into `BrainSnapshot.performance`
3. **Persistent run/output stores** — beyond in-memory repositories
4. **Memory review workflow** — persist and approve memory candidates
5. **Live peer brain path** — extend beyond demo-only brain-backed evidence steps
6. **Admin API** — expose `CapabilityInspectionReadModel`

## Principles (unchanged)

- One Brain runtime for all Peers
- Customers see outcomes, not infrastructure
- Upstream systems stay authoritative
- Vision v13 wins for customer UI
