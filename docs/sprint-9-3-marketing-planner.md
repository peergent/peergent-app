# Sprint 9.3 — Marketing Planner

Peer-specific planning capability that transforms a Marketing Strategy into an actionable execution plan.

## Purpose

Produces a structured **Marketing Plan** object from a **Marketing Strategy**. This sprint focuses on **planning**, not content generation, publishing, or external tools.

Future capabilities (Content Creation, Publishing, Performance Review) should consume **MarketingPlan** rather than MarketingStrategy directly.

## Architecture placement

```
Marketing Strategy (9.2)
        │
        ▼
buildContext() → buildPrompt({ outputFormat: "marketing-plan", marketingStrategy }) → execute() → parseMarketingPlanResponse()
        │
        ▼
MarketingPlan (structured execution plan)
```

The platform execution pipeline is unchanged. Plan generation is a peer capability layered on top.

## Marketing Plan sections

| Section | Description |
|---------|-------------|
| `objectives` | Measurable plan objectives with success criteria |
| `priorities` | Ranked execution priorities |
| `timeline` | Phased timeline with week ranges and activities |
| `campaigns` | Planned campaigns with channels and milestones |
| `contentCalendar` | Content slots (type, channel, week) — not content itself |
| `dependencies` | Activity dependencies with rationale |
| `expectedOutcomes` | Expected results with timeframes |
| `successMetrics` | Metrics and targets linked to strategy |

## Activity requirements

Every planned activity includes:

```typescript
{
  rationale: { why: string };
  linkedStrategyItems: [{ type: StrategyLinkType, reference: string }];
  estimatedEffort: "low" | "medium" | "high";
  expectedImpact: "low" | "medium" | "high";
}
```

## Key modules

| Module | Path |
|--------|------|
| Plan types | `lib/marketing-intelligence/types/plan.ts` |
| Readiness assessment | `lib/marketing-intelligence/plan/assess-plan-readiness.ts` |
| Task prompt appendix | `lib/marketing-intelligence/plan/build-plan-task-prompt.ts` |
| Response parser | `lib/marketing-intelligence/plan/parse-marketing-plan-response.ts` |
| Orchestrator | `lib/marketing-intelligence/plan/generate-marketing-plan.ts` |

## API

`POST /api/marketing-intelligence/plan`

```json
{
  "peerId": "uuid",
  "strategy": { "...MarketingStrategy object..." },
  "taskHint": "Optional planning focus",
  "options": { "temperature": 0.3 }
}
```

Requires a **Marketing** peer and a valid **MarketingStrategy**. Returns `{ plan, traceId, warnings }`.

## Capability chain

```
Marketing Understanding (9.1) → Marketing Strategy (9.2) → Marketing Plan (9.3) → Content Creation / Publishing / Performance Review (future)
```

## Guardrails

- No marketing copy, publishing, or external tools
- Every activity must link to specific strategy items
- Content calendar describes slots, not content
- Plan confidence capped based on strategy completeness

See also: [Sprint 9.4 — Marketing Content Creator](./sprint-9-4-marketing-content-creator.md)
