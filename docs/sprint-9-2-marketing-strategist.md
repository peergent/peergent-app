# Sprint 9.2 — Marketing Strategist

Peer-specific strategic reasoning capability for the Marketing Peer.

## Purpose

Transforms **Marketing Understanding** into a structured **Marketing Strategy** object with rationale on every recommendation.

This sprint focuses on **strategic reasoning**, not content generation, publishing, or external tools.

## Architecture placement

```
Marketing Understanding (9.1)
        │
        ▼
buildContext() → buildPrompt(outputFormat: marketing-strategy) → execute() → parseMarketingStrategyResponse()
        │
        ▼
MarketingStrategy (structured output with rationale)
```

The platform execution pipeline is unchanged. Strategy generation is a peer capability layered on top.

## Marketing Strategy sections

| Section | Description |
|---------|-------------|
| `targetAudiences` | Priority-ranked audience recommendations |
| `positioningRecommendations` | Brand/market positioning guidance |
| `contentPillars` | Thematic content pillars with themes |
| `campaignIdeas` | Campaign concepts with channels |
| `seoOpportunities` | SEO topics and search intent |
| `socialMediaStrategy` | Platform-specific approach |
| `customerJourneyRecommendations` | Stage-based journey guidance |
| `leadGenerationOpportunities` | Lead gen tactics |
| `marketingPriorities` | Ranked strategic priorities |

Every recommendation includes:

```typescript
rationale: {
  why: string;           // Plain-language explanation
  basedOn: string[];     // company-dna | business-brain | marketing-understanding
}
```

## Key modules

| Module | Path |
|--------|------|
| Strategy types | `lib/marketing-intelligence/types/strategy.ts` |
| Readiness assessment | `lib/marketing-intelligence/strategy/assess-strategy-readiness.ts` |
| Task prompt appendix | `lib/marketing-intelligence/strategy/build-strategy-task-prompt.ts` |
| Response parser | `lib/marketing-intelligence/strategy/parse-marketing-strategy-response.ts` |
| Orchestrator | `lib/marketing-intelligence/strategy/generate-marketing-strategy.ts` |

## API

`POST /api/marketing-intelligence/strategy`

```json
{
  "peerId": "uuid",
  "taskHint": "Optional strategy focus",
  "options": { "model": "...", "temperature": 0.35 }
}
```

Requires a **Marketing** peer. Returns `{ strategy, traceId, warnings }`.

## Guardrails

- Rule-based readiness caps confidence based on understanding completeness
- Prompt explicitly forbids marketing copy / publishable content
- Parser validates rationale and evidence sources on every recommendation
- Knowledge gaps surfaced in strategy output

## Future capabilities

Content strategy, content creation, campaign planning, and optimization build on this strategy object without changing the execution pipeline.

See also: [Sprint 9.3 — Marketing Planner](./sprint-9-3-marketing-planner.md)
