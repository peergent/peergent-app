# Project Brain — Capabilities (Sprint 5)

Sprint 5 adds seven deterministic marketing intelligence capabilities. Registry ids map to product names as follows:

| Registry id | Product name |
|---|---|
| `strategy` | Campaign strategy |
| `creative_generation` | Deliverable planning |
| `optimization` | Optimization planning |

## Architecture

- **Composable capabilities** — no monolithic MarketingBrain.
- Each capability declares required/optional context, dependencies, readiness, version, and output schema.
- Execution flows through **BrainRuntime** only (request → assembly → readiness → projection → policy → budget → provider → validation → audit).
- **CapabilityExecutionContext** carries task-specific projection: company snapshot, campaign context, upstream outputs, performance metrics, locale.

## Implemented capabilities (deterministic)

1. `brand_understanding`
2. `competitor_understanding`
3. `strategy` (campaign strategy)
4. `channel_planning`
5. `creative_generation` (deliverable planning)
6. `performance_interpretation`
7. `optimization` (optimization planning)

## What capabilities do not own

- LLM inference (Sprint 6+)
- External scraping, publishing, or budget mutation
- React/Next.js UI state
- Direct campaign repository access

## Provider support

All Sprint 5 capabilities declare `providerSupport: ["deterministic"]`. Future LLM providers implement the same contracts.

See per-capability docs and `CAPABILITY_DEPENDENCIES.md`.
