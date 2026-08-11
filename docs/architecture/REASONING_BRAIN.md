# Reasoning Brain (PX-42)

Reasoning Brain is Peergent's **judgment layer**. It transforms structured evidence from Company Brain and Research Brain into structured understanding — without generating strategy, campaigns, creative, validation, execution, or research.

Authority: Brain Architecture Blueprint (PX-38, frozen).

## Purpose

| Brain | Question |
|-------|----------|
| Company Brain | What is true? |
| Research Brain | What did we discover? |
| **Reasoning Brain** | **What does this actually mean?** |

Reasoning produces **interpretations**, not actions.

## Responsibilities

Reasoning Brain **may**:

- Read `CompanyGraph` (canonical truth, read-only)
- Read `ResearchBrainGraph` (external discovery, read-only)
- Read Memory (read-only)
- Interpret evidence into structured understanding
- Detect and interpret contradictions
- Track assumptions and hypotheses explicitly
- Identify opportunities, risks, and unknowns
- Generate decision **options** (not decisions)
- Escalate conflicts requiring customer or Strategy input
- Prioritize signals by impact, confidence, urgency, effort, risk

Reasoning Brain **must not**:

- Write Company Graph, Research Graph, or Memory
- Perform external research
- Generate strategy ("we should launch LinkedIn ads")
- Generate creative (headlines, hooks, ads, emails)
- Validate quality (Validation Brain)
- Execute actions (Execution Brain)

## Boundaries

```
CompanyGraph (read)  ──┐
ResearchBrainGraph (read) ──┼──► ReasoningBrain ──► ReasoningBrainGraph
Memory (read) ──────────┘              │
                                       ├── Interpretations
                                       ├── Contradictions (interpreted)
                                       ├── Assumptions / Hypotheses
                                       ├── Opportunities / Risks
                                       ├── Unknowns
                                       ├── Decision Options
                                       └── Escalations → Strategy Brain
```

## Reasoning Graph

Layered structure (`ReasoningBrainGraph`):

```
Evidence
    ↓
Interpretations
    ↓
Contradictions
    ↓
Hypotheses
    ↓
Assumptions
    ↓
Opportunities / Risks
    ↓
Priority Signals
    ↓
Unknowns
    ↓
Decision Options
    ↓
Escalations
```

## Interpretations

Every `ReasoningInterpretation` includes:

- `title`, `summary`, `confidence`, `importance`
- `supportedEvidence`, `relatedFacts`, `relatedResearch`
- `businessImpact`, `customerImpact`, `marketImpact`
- `confidenceReason`

Example (correct):

> "LinkedIn appears underutilized despite high competitor activity."

Example (incorrect — strategy):

> "We should launch LinkedIn ads."

## Contradictions

Reasoning Brain **owns contradiction interpretation**:

| Research | Company | Reasoning output |
|----------|---------|------------------|
| Competitors dominate LinkedIn | Never uses LinkedIn | Interpretation: underutilized channel |
| USP appears saturated | Believes USP is unique | Escalation: customer confirmation required |

Contradictions are never silently resolved.

## Assumptions

Every `ReasoningAssumption` tracks:

- `statement`, `confidence`, `whyAssumed`
- `requiredEvidence`, `validationNeeded`

Low-confidence company facts and research hypotheses become explicit assumptions.

## Unknowns

Categories:

- `missing_information` — Company domain gaps
- `missing_research` — Unresolved research questions
- `uncertain_assumption` — Hypotheses needing validation
- `investigation_required` — Budget exhausted or inconclusive research

## Decision options

Structured options (A/B/C), not decisions:

- `advantages`, `disadvantages`, `confidence`
- `requiredEffort`, `expectedOutcome`, `dependencies`

Strategy Brain chooses among options.

## Prioritization

`ReasoningPrioritySignal` ranks subjects as `high | medium | low` based on:

- Business impact
- Confidence
- Urgency
- Effort
- Risk

## Confidence

Derived from:

- Company certainty
- Research certainty
- Evidence quality and count
- Contradictions (penalty)
- Unknowns (penalty)

Rules:

- No evidence → `low`
- Single evidence cannot be `high`
- Never fabricate certainty

## Company relationship

Company facts remain canonical. Reasoning interprets — never overwrites.

## Research relationship

Reasoning consumes `ResearchBrainGraph` only. It never triggers research.

## Strategy relationship

Reasoning feeds Strategy Brain (future) with:

- Interpretations
- Escalations
- Decision options
- Priority signals

Strategy Brain decides what to do.

## Project Engine integration

- Implements `ProjectBrainContract` as `reasoningBrainContract`
- Registered in `createDefaultProjectBrainRegistry()` after Research
- Required context slices: `business`, `campaign`
- Capability: `market_understanding`
- Structured output: `BrainStructuredOutput.reasoningBrainGraph`
- Sets `requiresApproval` when escalations need customer input

## Cross-peer reuse

Reasoning graphs are persisted per organization/project/campaign with version history. Any peer can consume prior reasoning snapshots via repository refs.

## Persistence

`ReasoningBrainRepository` stores:

- `ReasoningRun`
- `ReasoningSnapshot`
- `ReasoningHistory`

Separate from Company, Research, and Memory repositories.

## What belongs to Marketing Intelligence Brain (not implemented here)

Marketing Intelligence Brain will:

- Apply market-specific intelligence models
- Enrich reasoning with category benchmarks and channel intelligence
- Connect competitive signals to marketing-specific opportunity framing
- Feed Strategy Brain with marketing-domain synthesis

Reasoning Brain supplies **general structured judgment**; Marketing Intelligence adds **marketing-domain intelligence**.

## Module layout

```
lib/brain/layers/reasoning/
├── brain-types.ts
├── reasoning-graph.ts
├── reasoning-brain-layer.ts
├── reasoning-brain-executor.ts
├── reasoning-brain-repository.ts
├── reasoning-validator.ts
├── reasoning-confidence.ts
├── reasoning-prioritization.ts
├── reasoning-contradictions.ts
├── reasoning-assumptions.ts
├── reasoning-opportunities.ts
├── reasoning-risks.ts
├── reasoning-options.ts
├── reasoning-escalations.ts
├── map-reasoning-graph-to-output.ts
└── __tests__/reasoning-brain.test.ts
```

Legacy Sprint 9 Reasoning Layer (`buildReasoningGraph`, `ReasoningLayer`) remains for strangler compatibility.

## Tests

16 cases in `__tests__/reasoning-brain.test.ts` covering graph creation, interpretations, contradictions, assumptions, opportunities, risks, unknowns, decision options, confidence, prioritization, persistence, contract integration, no Company mutation, no strategy, and no creative.
