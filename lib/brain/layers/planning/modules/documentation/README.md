# Planning Brain — Module Documentation

Sprint 11.0 foundation.

## Purpose

The Planning Brain transforms **strategic Decisions** into an **executable campaign plan** that maximizes business value while minimizing customer effort.

Planning is **not** a calendar, task manager, or checklist.

## Inputs

- `DecisionCollection` (Sprint 10.2)
- `StrategyGraph`
- `ReasoningGraph` (optional)
- `ResearchGraph` (optional)
- `MarketingIntelligenceGraph` (optional)
- `BrandGraph` (optional)
- `CampaignContext`

## Output

`PlanningGraph` — see `types.ts`

## Core principle

Planning thinks in **outcomes**, not tasks. Every node answers why the activity exists, why now, business value, dependencies, and review triggers.

## Engines

| Engine | File | Responsibility |
|--------|------|----------------|
| Dependency | `planning-dependency-engine.ts` | Critical path, cycles, parallel opportunities |
| Readiness | `planning-readiness-engine.ts` | Ready / Mostly Ready / Waiting / Blocked |
| Timeline | `planning-timeline-engine.ts` | Phase intent, not calendar dates |
| Risk | `planning-risk-engine.ts` | Probability, impact, mitigation, fallback |

## Future consumers

- Creative Layer (HOW)
- Pixel Brain (visual assets)
- Execution (delivery)
- Performance Brain (evaluation)

Planning never generates creative assets.

## Strangler pattern

Existing `channel_planning` capability and Sprint 7.6 workflow remain unchanged. Planning Layer is additive under `lib/brain/layers/planning/`.
