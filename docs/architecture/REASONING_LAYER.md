# Reasoning Layer — Architecture Reference

**Status:** Sprint 9 — Phase 1 (second PROJECT Brain Layer)  
**Authority:** [PEERGENT_CONSTITUTION.md](./PEERGENT_CONSTITUTION.md), [RESEARCH_LAYER.md](./RESEARCH_LAYER.md)  
**Scope:** Layer 2 — understanding only  
**Non-goals:** Strategy decisions, campaigns, content, execution, UI, Memory writes

---

## Purpose

Research collects facts. **Reasoning understands facts.** Strategy makes decisions.

The Reasoning Layer builds internal understanding from a `ResearchGraph`. It never produces campaigns, content, recommendations, or execution plans.

```text
ResearchGraph
        ↓
Reasoning Layer (modules)
        ↓
ReasoningGraph
        ↓
Strategy Layer (consumes ReasoningGraph — Sprint 9 Phase 2)
        ↓
Planning → Creative
```

---

## Responsibilities

| Owns | Does not own |
|------|--------------|
| Business model understanding | Campaign strategy |
| Market position inference | Channel plans |
| Customer model (ICP signals) | Creative briefs |
| Competitive landscape | Publish actions |
| Patterns, contradictions, unknowns | Memory commits |
| Opportunities (understanding) | Action recommendations |
| Risks (understanding) | Execution |

---

## What it must never do

- Never generate recommendations ("Run Google Ads")
- Never produce strategy or campaigns
- Never invent personas or metrics
- Never guess when evidence is insufficient — return **Unknown**
- Never hide contradictions
- Never write to Memory

---

## Code location

```text
lib/brain/layers/reasoning/
├── index.ts
├── types.ts                    # ReasoningGraph, node models
├── reasoning-node.ts           # createReasoningNode
├── confidence-engine.ts        # deriveReasoningConfidence
├── reasoning-module.ts         # Common module contract
├── modules/specs.ts            # 13 module specifications
├── build-reasoning-graph.ts    # Strangler adapter from ResearchGraph
├── reasoning-repository.ts     # Ephemeral storage
└── reasoning-layer.ts          # ReasoningLayer orchestrator
```

---

## ReasoningGraph schema

Every node contains: **id, title, description, confidence, supportingEvidence, relatedResearch, reasoningVersion, createdAt**.

```typescript
ReasoningGraph {
  version: string
  organizationId: string
  campaignId?: string
  researchVersion: string      // links to ResearchGraph.version
  createdAt: string
  businessModel: ReasoningNode[]
  marketPosition: ReasoningNode[]
  customerModel: ReasoningNode[]
  competitiveLandscape: ReasoningNode[]
  strengths: ReasoningNode[]
  weaknesses: ReasoningNode[]
  opportunities: ReasoningOpportunity[]
  risks: ReasoningRisk[]
  hypotheses: ReasoningHypothesis[]
  constraints: ReasoningConstraint[]
  assumptions: ReasoningAssumption[]
  unknowns: ReasoningUnknown[]
  contradictions: ReasoningContradiction[]
  priorityInsights: ReasoningPriorityInsight[]
  strategicThemes: ReasoningTheme[]
  patterns: ReasoningPattern[]
}
```

No recommendations. No strategies. No marketing decisions.

---

## Reasoning modules

| Module | Status | Output |
|--------|--------|--------|
| Business Reasoning | Adapter | businessModel |
| Customer Reasoning | Adapter | customerModel |
| Competitor Reasoning | Adapter | competitiveLandscape |
| Positioning Reasoning | Adapter | marketPosition |
| Risk Reasoning | Adapter | risks |
| Opportunity Reasoning | Adapter | opportunities |
| Constraint Reasoning | Adapter | constraints |
| Pattern Recognition | Adapter | patterns |
| Contradiction Detection | Adapter | contradictions |
| Unknown Resolution | Adapter | unknowns |
| Offer Reasoning | Spec only | — |
| Brand Reasoning | Spec only | — |
| Market Reasoning | Spec only | — |

---

## Domain models

### Business Model

Internal representation: what is sold, who buys, why, differentiation, maturity signals. Unknown fields explicit.

### Market Position

Inferred labels: Premium, Budget, Specialist, Generalist, Innovator, Local player, Market leader, Emerging — or **Unknown**.

### Customer Model

ICP from evidence. Pain points, motivations, triggers only when supported. Never invent personas.

### Pattern Recognition

Cross-evidence patterns with provenance (e.g. premium language + quality signals → premium positioning pattern).

### Contradiction Detection

Conflicting evidence surfaced with reduced confidence. Never hidden.

### Unknown Detection

Research unknowns propagated. Future Layers consume unknowns instead of hallucinating.

### Opportunities

Understanding only — e.g. "Weak SEO → discoverability opportunity." Not "Run Google Ads."

### Risks

Evidence-backed risks — no pricing, weak differentiation, competitive density.

### Strategic Themes

Abstract themes (Trust, Premium, Innovation) — **not strategy**.

### Constraints

Budget unknown, limited catalog, unknown fields — Strategy consumes later.

---

## Confidence engine

Every reasoning node has confidence derived from:

- Research evidence confidence (average)
- Evidence quantity (small boost)
- Source quality (confirmed sources boost)
- Contradiction penalty (reduces confidence)

Never output reasoning without confidence. Insufficient evidence → confidence `0` (Unknown).

---

## Evidence chain

Every reasoning node references Research evidence ids via `supportingEvidence` and `relatedResearch`. Reasoning is always explainable.

---

## Reasoning Repository

Ephemeral only — independent from Memory.

```typescript
ReasoningRepository {
  store(record): void
  get(key): ReasoningRecord | null
  getLatest({ organizationId, campaignId? }): ReasoningRecord | null
  delete(key): boolean
  clear(): void
}
```

---

## Strangler integration (Sprint 7.6 compatible)

```text
1. Research capabilities run unchanged
2. buildResearchGraph() as today
3. buildReasoningGraph(researchGraph)
4. CapabilityExecutionContext.researchGraph + reasoningGraph
5. Strategy reads ReasoningGraph first → StrategyGraph → same 19 finding labels (Sprint 7.6 contract)
```

Flow in `executeBrainForWorkflowStep`:

```text
Dependencies → ResearchGraph → ReasoningGraph → Strategy run
```

---

## Migration path — Strategy consumes ReasoningGraph

| Phase | Action |
|-------|--------|
| **9.1** | Types, graph, repository, auto-feed from Research |
| **9.2 (now)** | Strategy consumes ReasoningGraph; quality validator; evidence chains; legacy fallback |
| **10.x** | Planning Layer primary input = StrategyGraph |
| **10.x** | Deprecate direct `upstreamOutputs` for strategy fields one slice at a time |

No big-bang rewrite. Each migration step preserves customer-visible output until explicitly switched.

---

## Acceptance (Phase 1)

- [x] Reasoning Layer at `lib/brain/layers/reasoning/`
- [x] ReasoningGraph with all required sections
- [x] ReasoningRepository contract
- [x] 13 module specifications
- [x] Research automatically feeds Reasoning
- [x] Strategy receives ReasoningGraph and consumes it for StrategyGraph output
- [x] No UI, workflow, or output changes
- [x] All existing tests pass

---

*Research collects. Reasoning understands. Strategy decides — later.*
