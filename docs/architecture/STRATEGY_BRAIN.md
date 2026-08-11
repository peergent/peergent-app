# Strategy Brain (PX-44)

Strategy Brain is the **decision layer** of Peergent. It is the first Brain in the pipeline allowed to decide what Marketing should do.

## Purpose

Convert upstream truth and intelligence into explicit strategic choices:

- Company truth (Company Brain)
- Research evidence (Research Brain)
- Reasoning judgment (Reasoning Brain)
- Marketing-domain intelligence (Marketing Intelligence Brain)
- Relevant Memory (read-only)

Strategy Brain answers: **"What are we going to do about it?"**

Planning Brain (future) will answer: **"How and when will we do it?"**

## Responsibilities

- Define strategic problems before deciding
- Select which marketing opportunities to pursue (and reject/defer others)
- Prioritize audiences using upstream intelligence
- Choose positioning, channel mix, funnel model, offer presentation, and messaging territory
- Allocate budget strategically when known; flag `budgetRequired` when unknown
- Define KPI framework and campaign objectives
- Record decisions, trade-offs, rejected alternatives, assumptions, and risks
- Produce `PlanningStrategyInput` so Planning does not re-decide strategy
- Escalate when critical inputs are missing
- Flag approval requirements for major strategic decisions

## Boundaries

Strategy Brain must **never**:

- Create campaign assets, copy, headlines, or creative concepts (Creative Brain)
- Produce timelines, milestones, task lists, or content calendars (Planning Brain)
- Crawl or fetch external sources (Research Brain)
- Mutate `CompanyGraph` (Company Brain)
- Write Memory (Memory Brain)
- Perform creative QA (Validation Brain)
- Execute campaigns (Execution Brain)

## Pipeline position

```
Company → Research → Reasoning → Marketing Intelligence → Strategy → Planning → Creative → …
```

Registered as `strategyBrainContract` in `createDefaultProjectBrainRegistry()`.

## StrategyGraph layers

1. Business Objective  
2. Strategic Context  
3. Strategic Problems  
4. Opportunity Selection  
5. Audience Prioritization  
6. Positioning Direction  
7. Channel Strategy  
8. Funnel Strategy  
9. Offer Direction  
10. Messaging Direction  
11. Budget Strategy  
12. KPI Framework  
13. Campaign Objectives  
14. Strategic Trade-offs  
15. Risks / Assumptions  
16. Selected Strategy  
17. Rejected Alternatives  
18. Planning Inputs  

Canonical type: `StrategyBrainGraph` in `lib/brain/layers/strategy/brain-types.ts`.

## Strategic Problems

Every problem includes: `id`, `title`, `description`, `businessImpact`, `marketingImpact`, evidence, `confidence`, `urgency`, `dependencies`.

Problems are derived from funnel gaps, channel intent imbalance, and upstream reasoning risks — not generic goals like "increase leads."

## Opportunity Selection

Marketing Intelligence may surface many opportunities. Strategy selects a focused subset:

- `selected` — pursue now  
- `deferred` — valid but not now  
- `rejected` — explicitly not pursuing  

Each selection records reason, expected impact, confidence, resource requirement, dependencies, and timing relevance.

**Strategy is subtraction.**

## Audience Strategy

Uses upstream `AudienceSegmentIntelligence` — does not invent personas.

Supports: `primary`, `secondary`, `deprioritized`, `future`.

## Positioning Strategy

Chooses strategic angle and positioning statement direction — not final campaign copy.

Includes proof requirements, differentiation, risks, and `rejectedAngles`.

## Channel Strategy

Unlike Marketing Intelligence, Strategy **may choose channels** and assign roles:

- primary acquisition  
- demand capture  
- authority  
- retargeting  
- nurture  
- brand building  

Does not create provider-specific campaigns.

## Budget Strategy

When budget is known: absolute allocation with rationale.

When budget is unknown:

- `budgetRequired: true`  
- relative allocation ranges only when evidence supports them  
- no fabricated spend figures  

## Funnel / Offer / Messaging Direction

- **Funnel:** stage objectives, channel roles, conversion points, gaps — no content  
- **Offer:** how to present the existing offer (audit, consultation, proof) — does not modify canonical product  
- **Messaging:** message territory, proof/objection themes, claims to avoid — not final copy  

## KPI Framework

Defines measurement criteria without fabricated numeric targets unless baseline evidence exists.

## Campaign Objectives

High-level objectives for Planning Brain to operationalize — audience, channel role, business outcome, success metric, time horizon.

## Decisions / Trade-offs / Rejected Alternatives

`StrategicDecision` records every major choice with alternatives, trade-offs, confidence, reversibility, and review triggers.

Rejected alternatives are persisted to prevent future Brains from re-proposing dismissed strategies without new evidence.

## Assumptions / Risks / Escalations

- **Assumptions:** sourced from Reasoning Brain assumptions  
- **Risks:** from Marketing Intelligence and Reasoning risk signals  
- **Escalations:** budget missing, goal conflict, insufficient evidence, customer confirmation required  

Blocking escalations set run status to `blocked`.

## Approval model

Strategy returns `requiresApproval`, `approvalKind`, and `approvalReason` for major decisions (budget commitment, repositioning, new audience/market).

Project Engine orchestrates approval — Strategy only flags requirements.

## Marketing Intelligence relationship

Consumes `MarketingIntelligenceBrainGraph` and `MarketingStrategyInput`.

Marketing Intelligence interprets what marketing **could** mean; Strategy decides what Marketing **will** do.

## Planning relationship

Produces canonical `PlanningStrategyInput` on every graph:

- selected objectives, audiences, channels  
- positioning, messaging, funnel, offer, budget direction  
- KPIs, priorities, constraints, dependencies, risks, assumptions  
- approval requirements and time horizon  

Planning Brain should execute without re-deciding strategy.

## Memory consumption

May read prior strategic decisions, rejected strategies, channel history, and performance lessons.

Never writes Memory.

## Project Engine integration

Implements `ProjectBrainContract` via `strategyBrainContract`.

Required context slices: `business`, `goals`, `campaign`.

Approval kind: `strategy_review`.

## Cross-peer reuse

Strategy Brain is peer-agnostic at the contract level. Marketing is the first consumer; other peers can reuse the same decision layer with peer-specific upstream graphs.

## Module layout

```
lib/brain/layers/strategy/
  brain-types.ts
  strategy-brain-graph.ts
  strategy-brain-layer.ts
  strategy-brain-executor.ts
  strategy-brain-repository.ts
  strategy-problems.ts
  strategy-opportunity-selection.ts
  strategy-audience.ts
  strategy-positioning.ts
  strategy-channels.ts
  strategy-budget.ts
  strategy-funnel.ts
  strategy-offer.ts
  strategy-messaging.ts
  strategy-kpis.ts
  strategy-campaign-objectives.ts
  strategy-tradeoffs.ts
  strategy-risks.ts
  strategy-confidence.ts
  strategy-escalations.ts
  strategy-validator.ts
  map-strategy-brain-to-output.ts
  index.ts
  __tests__/strategy-brain.test.ts
```

Legacy Sprint 10 strategy code remains at `lib/brain/strategy/` and is not replaced.

## What belongs to Planning Brain

- Task lists and work breakdown  
- Dates, timelines, milestones  
- Content calendars and publishing schedules  
- Campaign project plans  
- Resource scheduling  
- Operational sequencing of Creative and Execution  

Strategy chooses **what** and **why**; Planning chooses **how** and **when**.
