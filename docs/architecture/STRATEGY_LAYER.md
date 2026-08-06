# Strategy Layer — Architecture Reference

**Status:** Sprint 9 — Phase 2 (Strategy consumes Reasoning)  
**Authority:** [PEERGENT_CONSTITUTION.md](./PEERGENT_CONSTITUTION.md), [REASONING_LAYER.md](./REASONING_LAYER.md)  
**Scope:** Strategy Layer — decision-making from understanding  
**Non-goals:** Planning, Creative, UI workflow changes, Memory writes

---

## Purpose

Strategy answers strategic questions — not copy, not deliverables, not channel execution.

```text
ResearchGraph
        ↓
ReasoningGraph
        ↓
StrategyGraph → BrainStructuredOutput
        ↓
Planning (future primary consumer)
        ↓
Creative
```

---

## Input priority

Strategy consumes sources in this order:

1. **MarketingIntelligenceGraph** — marketing thinking (Sprint 9.3)
2. **ReasoningGraph** — primary understanding model
3. **ResearchGraph** — evidence and unknowns
4. **Legacy upstreamOutputs** — grandfathered capabilities until full migration

Also: campaign context, brand information, approval state, tool availability.

---

## StrategyGraph

Internal model (`lib/brain/strategy/strategy-graph.ts`) with sections:

- Business Summary, Strategic Positioning, Value Proposition
- Primary/Secondary Audience, Customer Problems, Motivations, Buying Triggers, Objections
- Differentiators, Strategic Themes, Priority Opportunities, Strategic Risks
- Constraints, Assumptions, Unknowns, Evidence Summary
- Rejected Alternatives, Decision Rationales, Recommended Direction, Success Criteria

Each section: title, description, confidence, supportingEvidence, reasoningReferences.

Maps to existing `BrainStructuredOutput` finding labels for backwards compatibility.

---

## Decision framework

Every important decision includes:

- Decision, reason, evidence
- Alternatives considered and rejected (minimum two when ReasoningGraph present)
- Confidence, risks, unknowns, future validation

---

## Quality validation

`lib/brain/strategy/strategy-quality-validator.ts` scores:

| Dimension | Checks |
|-----------|--------|
| Business Specificity | Company name, offer references |
| Evidence Density | Research + reasoning refs |
| Decision Quality | Rejected alternatives |
| Reasoning Depth | Themes, opportunities, risks |
| Differentiation | Non-generic positioning |
| Traceability | Evidence chain |
| Unknown Awareness | Unknowns preserved |

Generic strategies fail validation (LLM path rejects; deterministic adds warnings).

---

## Code location

```text
lib/brain/strategy/
├── strategy-graph.ts
├── build-strategy-graph.ts
├── map-strategy-graph-to-output.ts
├── strategy-quality-validator.ts
├── execute-strategy-with-graph.ts
└── index.ts
```

---

## Strangler integration

- `executeStrategy()` delegates to `executeStrategyWithGraph()`
- Same finding labels, same capability contract
- Channel planning and creative unchanged
- Presentation enriched for strategy evidence (position → evidence → direction)

---

## Migration plan

| Phase | Action |
|-------|--------|
| **9.2 (now)** | Strategy builds from ReasoningGraph; legacy fallback |
| **9.3+** | LLM prompts fully Reasoning-first |
| **10.x** | Planning consumes StrategyGraph directly |
| **10.x** | Deprecate legacy upstream fields incrementally |

---

## Future Planning Layer interface

Planning will consume:

```typescript
{
  strategyGraph: StrategyGraph;
  reasoningGraph: ReasoningGraph;
  campaignContext: CampaignContext;
}
```

Not raw `BrainStructuredOutput.findings`.

---

*Understand first. Decide with evidence. Never guess.*
