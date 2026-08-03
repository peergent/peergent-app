# Project Brain

Project Brain is Peergent's **shared intelligence foundation**. Every Peer — Marketing, Sales, Support, Planner, Finance — uses the same Brain runtime, contracts, and orchestration layer.

**Brains are infrastructure. Peers are the colleagues customers work with.**

Customers never see Brain modules, prompts, reasoning, token usage, or traces. They see findings, evidence summaries, recommendations, approvals, actions, and results.

Sprint 1 delivers **contracts and architecture only** — no AI providers, scraping, or generation.

Sprint 2 adds **Company & Website Intelligence** (profiles, snapshots, capabilities).

Sprint 3 adds **Context Assembly** — one canonical Company Snapshot via `CompanyContextAssembler`.

Sprint 4 adds **Brain Runtime** — provider-neutral capability execution orchestrator.

Sprint 5 adds **Marketing Intelligence Capabilities** — seven deterministic capabilities (brand, competitor, strategy, channels, deliverables, performance, optimization) with dependency graph, quality safeguards, and demo orchestration.

## Package location

```
lib/brain/
```

## Three environments

| Environment | Purpose |
|-------------|---------|
| `live` | Real customer work — default after login |
| `demo` | Deterministic fixtures — demo peer only, no live access |
| `test` | Automated tests — `NODE_ENV=test` |

Resolved centrally via `resolveBrainEnvironment()`. Demo provider rejects live; live providers reject demo.

## What Brain consumes (does not replace)

- **CampaignContext** — campaign workspace state
- **CampaignEvidenceSection** — customer-facing evidence UI
- **business-brain** / **brand-brain** — upstream knowledge
- **Context Engine** — context assembly
- **Working Agreement** / Marketing autonomy — approval policy

Brain orchestrates and structures output; upstream systems remain authoritative.

## Documentation

| Doc | Topic |
|-----|-------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layers, data flow, migration |
| [ENVIRONMENTS.md](./ENVIRONMENTS.md) | Live, demo, test separation |
| [CAPABILITIES.md](./CAPABILITIES.md) | Registry and workflow mapping |
| [CAPABILITY_DEPENDENCIES.md](./CAPABILITY_DEPENDENCIES.md) | Capability dependency graph |
| [BRAND_UNDERSTANDING.md](./BRAND_UNDERSTANDING.md) | Brand capability contract |
| [COMPETITOR_UNDERSTANDING.md](./COMPETITOR_UNDERSTANDING.md) | Competitor capability contract |
| [CAMPAIGN_STRATEGY.md](./CAMPAIGN_STRATEGY.md) | Strategy capability contract |
| [CHANNEL_PLANNING.md](./CHANNEL_PLANNING.md) | Channel planning contract |
| [DELIVERABLE_PLANNING.md](./DELIVERABLE_PLANNING.md) | Deliverable planning contract |
| [PERFORMANCE_INTERPRETATION.md](./PERFORMANCE_INTERPRETATION.md) | Performance interpretation contract |
| [OPTIMIZATION_PLANNING.md](./OPTIMIZATION_PLANNING.md) | Optimization planning contract |
| [TOKEN_PROJECTIONS.md](./TOKEN_PROJECTIONS.md) | Future provider context projections |
| [RUN_LIFECYCLE.md](./RUN_LIFECYCLE.md) | BrainRun states and metadata |
| [EVIDENCE.md](./EVIDENCE.md) | Structured output and presentation |
| [MEMORY.md](./MEMORY.md) | Memory candidate design |
| [CACHE.md](./CACHE.md) | Provider-neutral cache strategy |
| [APPROVAL.md](./APPROVAL.md) | Policy and Working Agreement integration |
| [AUDIT.md](./AUDIT.md) | Admin trace model |
| [COMPANY_INTELLIGENCE.md](./COMPANY_INTELLIGENCE.md) | Company Profile, snapshot builder, source priority |
| [CONTEXT_ASSEMBLY.md](./CONTEXT_ASSEMBLY.md) | CompanyContextAssembler pipeline |
| [READINESS.md](./READINESS.md) | Readiness scoring and missing information |
| [WEBSITE_EXECUTION.md](./WEBSITE_EXECUTION.md) | Website scan executor and providers |
| [DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md) | Invalidation cascade and context hashes |
| [RUNTIME.md](./RUNTIME.md) | BrainRuntime orchestrator |
| [CAPABILITY_EXECUTION.md](./CAPABILITY_EXECUTION.md) | How capabilities execute through runtime |
| [CONTEXT_PROJECTION.md](./CONTEXT_PROJECTION.md) | Slice projection and cache keys |
| [RUNTIME_SECURITY.md](./RUNTIME_SECURITY.md) | Isolation and audit security |
| [RUNTIME_ERRORS.md](./RUNTIME_ERRORS.md) | Runtime error catalog |
| [ROADMAP.md](./ROADMAP.md) | Sprint 2+ direction |

## Office migration shims

Legacy prep under `lib/office/brain/types.ts` re-exports from `@/lib/brain`. Use `@/lib/brain` for all new code.

`BrainContext` → **`BrainRunContext`** (canonical name).
