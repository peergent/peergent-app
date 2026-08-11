# Research Brain (PX-41)

Research Brain is Peergent's **external discovery layer**. It investigates the world around the company, structures evidence, and returns findings — without owning organizational truth, creating campaigns, or making final strategy decisions.

Authority: Brain Architecture Blueprint (PX-38, frozen). Company Brain (PX-40) remains the canonical source of organizational truth.

## Purpose

Research Brain answers:

> What can we discover externally that helps us understand the market, customer, competitors, and opportunities?

Company Brain answers:

> What is true about this organization?

Research produces **findings**. Company Brain owns **facts**.

## Boundaries

Research Brain **may**:

- Read `CompanyGraph` as starting truth
- Read prior Memory (via refs / read-only graph injection)
- Confirm, challenge, enrich, or contradict company claims **with evidence**
- Propose updates via `CompanyUpdateProposal`

Research Brain **must not**:

- Write `CompanyGraph` directly
- Write Memory (Memory Brain decides long-term retention)
- Generate creative, validate, execute, or schedule itself
- Fabricate pricing, performance, or unsupported claims
- Hardcode scraping or external API assumptions in core logic

## Position in the Brain stack

```
Company Brain  →  Research Brain  →  Reasoning Brain (future)
```

Project Engine decides **when** Research runs. Research returns structured status + evidence.

## ResearchGraph

Layered graph (see `ResearchBrainGraph` in `lib/brain/layers/research/brain-types.ts`):

```
ResearchObjective
      ↓
   Sources
      ↓
   Findings
      ↓
   Evidence
      ↓
 Comparisons
      ↓
  Patterns
      ↓
Contradictions
      ↓
Opportunities / Risks
      ↓
ProposedUpdates (CompanyUpdateProposal)
```

Every conclusion references evidence. Hypotheses are never stored as high-confidence facts.

## ResearchPlan

Built before collection (`buildResearchPlan`):

| Field | Role |
|-------|------|
| `objective` | Project objective + scoped questions |
| `domains` | Which research domains to cover |
| `sourcesNeeded` | Expected source types |
| `knownFacts` | Seeds from CompanyGraph |
| `unknowns` | Gaps from CompanyGraph |
| `budget` | Hard limits (sources, requests, pages, competitors, cost) |
| `stopConditions` | When to stop collecting |

Research is **question-driven** — it does not collect everything.

## Evidence model

| Type | Description |
|------|-------------|
| `ResearchSourceRecord` | Provenance identity, URL, freshness |
| `ResearchBrainEvidence` | Raw excerpt, normalized summary, confidence |
| `ResearchCitation` | Link finding → evidence → source |
| `ResearchEvidenceRef` | Lightweight cross-reference |

Source types include `company_website`, `competitor_website`, `search_result`, `review_platform`, `company_graph`, `memory_read`, `future_connector`, and more — architecture is not web-only.

## Provider architecture

```
ResearchBrain
      ↓ orchestrates
ResearchProviderRegistry
      ↓
ResearchProvider adapters (search, fetch, extract, snapshot)
```

Providers expose capabilities (`searchWeb`, `fetchWebsite`, `searchCompetitors`, etc.). Unsupported capabilities return structured rejection — not thrown errors.

Default stub: `company_context_stub` — derives evidence from CompanyGraph only (no external APIs).

Future providers: web search, crawler, SEO, ad library, review platforms, market data, social listening.

## Domain modules

| Module | Output |
|--------|--------|
| `research-competitors.ts` | `CompetitorProfile`, comparisons — no fabricated pricing |
| `research-market.ts` | `MarketSignal` from evidenced industry/market facts |
| `research-audience.ts` | `AudienceInsight` — enrichment only |
| `research-positioning.ts` | Gaps, saturation, contradictions |
| `research-update-proposals.ts` | `CompanyUpdateProposal` — never mutates Company |

## Confidence

Factors: source authority, freshness, supporting sources, consistency, direct vs inferred, contradicting evidence.

Levels: `low` | `medium` | `high`

Rules:

- No evidence → `low`
- Hypothesis → always `low`
- Single evidence cannot be `high` for facts

## Freshness

Research evidence tracks `capturedAt`, `validUntil`, `freshnessStatus` (`fresh` | `stale` | `expired` | `unknown`).

Company facts may be stable; research evidence decays.

## Company Brain relationship

```
CompanyGraph (read)  →  ResearchBrain  →  CompanyUpdateProposal (propose only)
                              ↓
                    Company Brain (future accept/reject)
```

Proposals include `requiresCustomerConfirmation: true` by default.

## Memory relationship

Research **reads** prior Memory (competitive notes, past research patterns).

Research **does not write** Memory. Memory Brain ingests validated outcomes later.

## Project Engine integration

- Implements `ProjectBrainContract` as `researchBrainContract`
- Registered in `createDefaultProjectBrainRegistry()`
- Required context slices: `business`, `campaign`
- Capability outputs: `company_understanding`, `website_understanding`, `competitor_understanding`
- Structured output field: `BrainStructuredOutput.researchBrainGraph`

## Brain Output Layer (future)

Research produces structured artifacts for future BOL publishers:

- Research discoveries
- Market opportunities
- Competitor changes
- Business risks
- Research-based recommendations
- Executive summaries

No UI wiring in PX-41.

## Persistence

`ResearchBrainRepository` stores:

- `ResearchRun` — execution record
- `ResearchSnapshot` — versioned graph + `outputRef`
- `ResearchHistory` — chronological versions per org/project

Separate from Memory and Company repositories.

## Stop conditions

Research ends when:

- Required questions answered
- Confidence threshold met
- Source budget reached
- No useful additional evidence
- Provider limit reached

Budget exhaustion returns structured state (`budgetState.exhausted`, `stopReason`) — not error text.

## Security / privacy

- Organization-scoped sources (`organizationScoped: true`)
- No cross-org evidence leakage
- Provider credentials stay in adapter layer

## What belongs to Reasoning Brain (not implemented here)

Reasoning Brain will:

- Synthesize Research + Company into strategy options
- Resolve contradictions with judgment (not silent overwrite)
- Prioritize opportunities and recommend actions
- Feed Planning and Creative with interpreted intelligence

Research Brain supplies **verified external intelligence** — Reasoning decides **what it means**.

## Module layout

```
lib/brain/layers/research/
├── brain-types.ts
├── research-plan.ts
├── research-graph.ts
├── research-brain-layer.ts
├── research-brain-executor.ts
├── research-brain-repository.ts
├── research-validator.ts
├── research-confidence.ts
├── research-freshness.ts
├── research-provider.ts
├── research-provider-registry.ts
├── research-evidence-builder.ts
├── research-competitors.ts
├── research-market.ts
├── research-audience.ts
├── research-positioning.ts
├── research-update-proposals.ts
├── map-research-graph-to-output.ts
├── providers/company-context-stub-provider.ts
└── __tests__/research-brain.test.ts
```

Legacy Sprint 8 Research Layer (`buildResearchGraph`, `ResearchLayer`) remains for strangler compatibility.

## Tests

15 cases in `__tests__/research-brain.test.ts` covering plan building, evidence, confidence ceilings, contradictions, competitors, audience enrichment, company proposals, provenance, freshness, budget, provider rejection, persistence, memory read-only, contract integration, and anti-fabrication.
