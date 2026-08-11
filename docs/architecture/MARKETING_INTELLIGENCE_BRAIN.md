# Marketing Intelligence Brain (PX-43)

Marketing Intelligence Brain is Peergent's **marketing-domain interpretation layer**. It consumes Company truth, Research evidence, and Reasoning judgment — then transforms that into structured marketing intelligence.

Authority: Brain Architecture Blueprint (PX-38, frozen).

## Purpose

| Brain | Question |
|-------|----------|
| Company Brain | What is true about this company? |
| Research Brain | What did we discover externally? |
| Reasoning Brain | What does this mean? |
| **Marketing Intelligence Brain** | **What does this mean specifically for marketing?** |
| Strategy Brain (future) | What are we going to do about it? |

## Responsibilities

Marketing Intelligence Brain **may**:

- Read `CompanyGraph`, `ResearchBrainGraph`, `ReasoningBrainGraph`, and Memory (read-only)
- Translate general understanding into marketing-specific intelligence
- Assess audience, channels, messaging, competitors, market, funnel, offer, content, search, paid, organic
- Create opportunity and risk signals with evidence
- Prioritize marketing signals (not strategic decisions)
- Package `MarketingStrategyInput` for Strategy Brain

Marketing Intelligence Brain **must not**:

- Perform external research
- Mutate Company Graph
- Write Memory
- Generate strategy plans or channel allocation
- Generate creative (headlines, ads, emails, landing pages)
- Validate quality or execute campaigns
- Fabricate benchmarks, spend, ROAS, or performance data

## Boundaries

```
CompanyGraph (read) ──────┐
ResearchBrainGraph (read) ─┼──► Marketing Intelligence Brain ──► MarketingIntelligenceBrainGraph
ReasoningBrainGraph (read) ─┤                                      │
Memory (read) ──────────────┘                                      └── MarketingStrategyInput
                                                                           │
                                                                    Strategy Brain (future)
```

## MarketingIntelligenceGraph

Layered structure:

```
Business Context
      ↓
Audience Intelligence
      ↓
Market / Competitive Marketing Intelligence
      ↓
Channel / Messaging Intelligence
      ↓
Offer / Funnel / Content Intelligence
      ↓
Search / Paid / Organic Intelligence
      ↓
Opportunity / Risk Signals
      ↓
Benchmark Context
      ↓
Marketing Priorities
      ↓
Strategy Inputs
```

## Audience Intelligence

Per-segment marketing intelligence: importance, intent level, core problem, motivations, objections, trust builders, preferred channels, message sensitivity, evidence, confidence.

Enrichment only — Company Brain audience facts remain canonical.

## Channel Intelligence

Per-channel assessment: audience fit, intent fit, objective fit, creative fit, competitive intensity, complexity, measurement quality, funnel role, risks, opportunities.

Correct:

> "Google Search has the strongest observed intent fit and clearest measurement path."

Incorrect:

> "Spend 60% on Google Search."

## Messaging Intelligence

Dominant messages, saturated claims, underused messages, trust themes, proof requirements, objection themes, differentiation gaps, message risks.

Detects saturation (e.g. "Fast implementation" in multiple competitors) without choosing alternative messaging.

## Competitive Intelligence

Channel presence, messaging share, campaign themes, positioning clusters, offer/CTA patterns, content themes, proof usage, saturation, weaknesses, whitespace — all evidence-backed. Never fabricates spend or ROAS.

## Market Intelligence

Market signals translated to marketing implications with urgency, affected audiences/channels, and evidence.

## Funnel Intelligence

Per-stage assessment (awareness → advocacy): gaps, weak handoffs, missing proof/content/CTA, trust gaps, measurement gaps. Intelligence only — no funnel strategy.

## Offer Intelligence

Marketing perspective on clarity, differentiation, proof, pricing transparency, value communication — strengths, weaknesses, opportunities, risks.

## Content / Search / Paid / Organic Intelligence

- **Content:** themes, coverage gaps, authority gaps, comparison opportunities
- **Search:** intent clusters, opportunity themes, competitive search pressure
- **Paid:** intent quality, measurement readiness, competitive pressure — with `insufficientData` flags
- **Organic:** authority, content consistency, search visibility, thought leadership opportunity

## Benchmark model

`MarketingBenchmark` with `BenchmarkSource`, `BenchmarkRange`, `BenchmarkConfidence`.

When no real benchmark evidence exists: `benchmarkUnavailable: true` — never fabricated numbers.

## Opportunities / Risks

`MarketingOpportunity` and `MarketingRisk` with category, audience, channels, funnel stage, impact, urgency, effort, confidence, evidence, dependencies.

Not converted to strategy actions.

## Priority model

`MarketingPrioritySignal` ranks subjects high/medium/low based on business impact, evidence strength, urgency, confidence, effort — not strategic decisions.

## Strategy Input contract

`MarketingStrategyInput` packages clean inputs for Strategy Brain:

- Top audience, channel, messaging, market, competitive signals
- Top funnel gaps, opportunities, risks
- Benchmark context, constraints, unknowns, confidence

Strategy Brain should not need to re-interpret raw Research.

## Confidence model

Derived from upstream Company/Research/Reasoning confidence, evidence count, consistency, contradictions, unknowns. Never amplified beyond upstream evidence. `enforceMarketingConfidenceCeiling()` prevents high confidence without evidence.

## Insufficient data states

Explicit flags: `insufficient_data`, `benchmark_unavailable`, `channel_data_missing`, `audience_evidence_weak`, `measurement_not_ready`.

## Relationships

- **Company Brain:** read-only canonical truth
- **Research Brain:** consume graph only, no new research
- **Reasoning Brain:** consume judgments, add marketing-domain specialization
- **Strategy Brain (future):** receives `MarketingStrategyInput`
- **Memory:** read-only (performance patterns, historical channel learnings)

## Project Engine integration

- Implements `ProjectBrainContract` as `marketingIntelligenceBrainContract`
- Registered after Reasoning in `createDefaultProjectBrainRegistry()`
- Required context slices: `business`, `competitors`
- Capabilities: `market_understanding`, `competitor_understanding`
- Structured output: `BrainStructuredOutput.marketingIntelligenceBrainGraph`

## Cross-peer / domain specialization

Marketing Intelligence specializes general Reasoning for the Marketing peer domain. Graphs are persisted per org/project/campaign with version history for cross-episode reuse.

## What belongs to Strategy Brain (not implemented here)

Strategy Brain will:

- Choose channel mix and budget allocation
- Decide campaign direction and objectives
- Prioritize which opportunities to pursue
- Resolve trade-offs between marketing priorities
- Produce actionable strategic plans

Marketing Intelligence supplies **marketing-domain understanding**; Strategy decides **what to do**.

## Module layout

```
lib/brain/layers/marketing-intelligence/
├── brain-types.ts
├── marketing-intelligence-graph.ts
├── marketing-intelligence-brain-layer.ts
├── marketing-intelligence-brain-executor.ts
├── marketing-intelligence-brain-repository.ts
├── marketing-intelligence-confidence.ts
├── marketing-intelligence-evidence.ts
├── marketing-intelligence-audience.ts
├── marketing-intelligence-channels.ts
├── marketing-intelligence-messaging.ts
├── marketing-intelligence-competitors.ts
├── marketing-intelligence-market.ts
├── marketing-intelligence-funnel.ts
├── marketing-intelligence-offer.ts
├── marketing-intelligence-content.ts
├── marketing-intelligence-search.ts
├── marketing-intelligence-paid.ts
├── marketing-intelligence-organic.ts
├── marketing-intelligence-benchmarks.ts
├── marketing-intelligence-opportunities.ts
├── marketing-intelligence-risks.ts
├── marketing-intelligence-priorities.ts
├── marketing-intelligence-validator.ts
├── map-marketing-intelligence-to-output.ts
└── __tests__/marketing-intelligence-brain.test.ts
```

Legacy Sprint 9.3 layer (`buildMarketingIntelligenceGraph`, `MarketingIntelligenceLayer`) remains for strangler compatibility.

## Tests

22 cases in `__tests__/marketing-intelligence-brain.test.ts` covering all required scenarios.
