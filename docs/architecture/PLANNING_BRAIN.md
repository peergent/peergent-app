# Planning Brain (PX-45)

Planning Brain is the **operational planning layer** of Peergent. It operationalizes Strategy without re-deciding it.

## Purpose

Convert authoritative Strategy into an executable project plan:

- How to execute
- In what order
- Which deliverables
- When (or relative sequence when dates unknown)
- Dependencies and approvals
- Creative and Execution handoffs

Planning Brain answers: **"How are we going to execute the strategy?"**

Strategy Brain (PX-44) answers: **"What are we going to do about it?"**

## Responsibilities

- Derive planning objectives only from Strategy
- Decompose campaign objectives into `CampaignPlan`, `Workstream`, `WorkPackage`, `PlannedDeliverable`
- Define milestones, dependencies, critical path, and parallel work groups
- Plan schedule windows (fixed when deadline exists; relative otherwise)
- Create approval gates and review checkpoints
- Track resource assumptions and context gaps
- Produce canonical `CreativeBriefInput[]` for Creative Brain
- Produce `ExecutionPreparation` prerequisites for Execution Brain
- Mark deliverables requiring Validation
- Version and invalidate plans when strategy/budget/approval context changes

## Boundaries

Planning Brain must **never**:

- Choose new audiences, positioning, channel mix, budget allocation, or KPI framework
- Perform research
- Generate campaign concepts or copy (Creative Brain)
- Validate creative quality (Validation Brain)
- Publish or execute (Execution Brain)
- Write Memory (Memory Brain)
- Mutate `CompanyGraph`

If Strategy input is incomplete → return `PlanningEscalation` / `PlanningContextGap`. Do not silently decide.

## Pipeline position

```
Company → Research → Reasoning → Marketing Intelligence → Strategy → Planning → Creative → Validation → Execution
```

Registered as `planningBrainContract` in `createDefaultProjectBrainRegistry()`.

## PlanningGraph layers

1. Strategy Input  
2. Planning Objectives  
3. Campaign Decomposition  
4. Workstreams  
5. Milestones  
6. Work Packages  
7. Deliverables  
8. Dependencies  
9. Approval Gates  
10. Review Checkpoints  
11. Resource Assumptions  
12. Schedule Windows  
13. Creative Hand-offs  
14. Execution Preparation  
15. Planning Risks  
16. Planning Summary  

Canonical type: `PlanningBrainGraph` in `lib/brain/layers/planning/brain-types.ts`.

Legacy Sprint 11 `PlanningGraph` remains at `lib/brain/layers/planning/types.ts`.

## Project / Campaign planning model

- **ProjectPlan** — top-level executable plan for organization/project
- **CampaignPlan** — operational plan per strategy campaign objective
- Deterministic labels (`Campaign plan — {objective}`) — no invented campaign names

## Workstreams / Work Packages

Workstreams: setup, creative development, tracking, approval, publishing preparation, per-channel setup.

Work packages assign `assignedBrain` (creative, validation, execution, planning, customer) without executing them.

## Milestones

Strategy approved → Creative direction ready → Creative complete → Validation passed → Customer approval → Ready for publication → Launched → First performance review.

## Deliverables

Planned deliverables per selected channel plus landing page when funnel defines conversion points. Each specifies validation/execution/approval requirements.

## Dependencies / Critical Path / Parallelism

Explicit `PlanningBrainDependency` types: approval, creative, execution, data dependencies.

Critical path derived from blocking dependencies. Parallel groups for independent creative briefs after strategy approval.

## Schedule model

- **Fixed** when customer deadline provided
- **Relative** (`Week 1`, `After approval`, strategy time horizon) when no deadline
- Never fabricates fixed dates without customer source

## Approval gates

Plans where approval is required: strategy_review, creative_review, budget_approval, campaign_approval, publish_approval. Planning does not approve — it plans gates.

## Resource assumptions / Context gaps

Tracks ad account, CRM, CMS, tracking, budget, creative sources. Missing integrations → `PlanningContextGap` with blocking flag and recommended resolution.

## CreativeBriefInput contract

Complete brief per channel deliverable:

- campaign objective, audience, channel role, funnel stage  
- positioning/messaging/offer direction from Strategy  
- proof, objections, CTA, constraints  
- strategy decision refs and planning refs  

Creative Brain should not reconstruct raw Strategy.

## Validation handoff

Deliverables marked `validationRequired: true`. Validation remains downstream.

## Execution preparation

`ExecutionPreparation` objects specify provider, integration, account, approval, validation, schedule window, payload and tracking requirements. Execution Brain receives these later — Planning does not publish.

## Risks

Planning risks: approval delay, missing integration, tracking readiness, dependency bottlenecks. May propose mitigation — may not alter Strategy.

## Versioning / Invalidation

- `PlanningSnapshot`, `PlanningRun`, `PlanningHistory` with strategy version ref
- `supersedes` links plan versions
- Targeted invalidation scopes for strategy_change, budget_change, approval_rejected, deadline_change

## Confidence model

Derived from strategy confidence, timeline certainty, budget certainty, resource/context completeness. Does not exceed Strategy confidence without justification.

## Strategy relationship

Consumes `StrategyBrainGraph` and `PlanningStrategyInput`. Faithful operationalization — no strategic re-decision.

## Creative relationship

Produces `CreativeBriefInput[]` — Creative decides how to create assets.

## Validation relationship

Marks deliverables requiring validation — does not perform QA.

## Execution relationship

Produces execution preparation artifacts — does not publish.

## Memory consumption

May read historical durations, approval delays, provider constraints. Recommends memory checkpoint moments. Never writes Memory.

## Project Engine integration

Implements `ProjectBrainContract` via `planningBrainContract`.

Required context slices: `campaign`, `goals`.

## Cross-peer reuse

Peer-agnostic contract; Marketing is first consumer.

## Module layout

```
lib/brain/layers/planning/
  brain-types.ts
  planning-brain-graph.ts
  planning-brain-layer.ts
  planning-brain-executor.ts
  planning-brain-repository.ts
  planning-objectives.ts
  planning-campaigns.ts
  planning-workstreams.ts
  planning-work-packages.ts
  planning-milestones.ts
  planning-deliverables.ts
  planning-dependencies.ts
  planning-critical-path.ts
  planning-schedule.ts
  planning-approvals.ts
  planning-resources.ts
  planning-risks.ts
  planning-parallelism.ts
  planning-confidence.ts
  planning-invalidation.ts
  planning-brain-validator.ts
  map-planning-brain-to-output.ts
  index.ts
  __tests__/planning-brain.test.ts
```

Legacy Sprint 11 modules preserved (`planning-builder.ts`, `types.ts`, etc.).

## What remains for Learning Brain / end-to-end orchestration

- Learning Brain: post-execution performance learning and plan refinement signals
- End-to-end orchestration: Project Engine scheduling Planning → Creative → Validation → Execution with live status updates
- BOL translation: current work, milestones, context gaps, timeline UI
- Live progress sync: entity statuses updated from actual Brain runs (not planning-time fabrication)
