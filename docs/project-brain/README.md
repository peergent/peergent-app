# Project Brain

Project Brain is Peergent's **shared intelligence foundation**. Every Peer — Marketing, Sales, Support, Planner, Finance — uses the same Brain runtime, contracts, and orchestration layer.

**Brains are infrastructure. Peers are the colleagues customers work with.**

Customers never see Brain modules, prompts, reasoning, token usage, or traces. They see findings, evidence summaries, recommendations, approvals, actions, and results.

Sprint 1 delivers **contracts and architecture only** — no AI providers, scraping, or generation.

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
| [RUN_LIFECYCLE.md](./RUN_LIFECYCLE.md) | BrainRun states and metadata |
| [EVIDENCE.md](./EVIDENCE.md) | Structured output and presentation |
| [MEMORY.md](./MEMORY.md) | Memory candidate design |
| [CACHE.md](./CACHE.md) | Provider-neutral cache strategy |
| [APPROVAL.md](./APPROVAL.md) | Policy and Working Agreement integration |
| [AUDIT.md](./AUDIT.md) | Admin trace model |
| [COMPANY_INTELLIGENCE.md](./COMPANY_INTELLIGENCE.md) | Company Profile, snapshot builder, source priority |
| [ROADMAP.md](./ROADMAP.md) | Sprint 2+ direction |

## Office migration shims

Legacy prep under `lib/office/brain/types.ts` re-exports from `@/lib/brain`. Use `@/lib/brain` for all new code.

`BrainContext` → **`BrainRunContext`** (canonical name).
