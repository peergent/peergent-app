# Marketing Intelligence Layer — Architecture Reference

**Status:** Sprint 9.3 — internal Marketing Brain layer  
**Authority:** [PEERGENT_CONSTITUTION.md](./PEERGENT_CONSTITUTION.md), [REASONING_LAYER.md](./REASONING_LAYER.md)  
**Scope:** Marketing thinking between Reasoning and Strategy  
**Non-goals:** Ads, channels, creative, UI, Memory writes

---

## Purpose

Research collects facts. Reasoning understands facts. **Marketing Intelligence translates understanding into marketing thinking.**

```text
ResearchGraph
        ↓
ReasoningGraph
        ↓
Marketing Intelligence Layer
        ↓
MarketingIntelligenceGraph
        ↓
Strategy Layer
```

This is **not** a separate Brain. It is an internal layer of the Marketing Brain (`lib/brain/layers/marketing-intelligence/`).

---

## Responsibilities

| Owns | Does not own |
|------|--------------|
| Business reality in marketing terms | Campaign execution |
| Buying motivation, pain, emotions | Channel selection |
| Positioning strength, messaging dominance | Creative assets |
| Campaign probability (understanding) | Publish actions |
| Anti-patterns (what NOT to do) | Scheduling |
| Missing information & assumptions | Customer UI |

---

## Strangler integration

1. `buildCapabilityExecutionContext()` auto-builds `MarketingIntelligenceGraph` from `ReasoningGraph`
2. `executeBrainForWorkflowStep()` stores graph via `MarketingIntelligenceLayer.thinkAndStore()`
3. Strategy reads `marketingIntelligenceGraph` first, then Reasoning, Research, legacy
4. Legacy paths unchanged when reasoning unavailable

---

## Migration

| Phase | Action |
|-------|--------|
| **9.3 (now)** | Layer + Strategy consumption + self-critique |
| **9.4+** | LLM prompts Reasoning-first → MI-first |
| **10.x** | Planning consumes StrategyGraph directly |

---

*Think like a senior marketer. Never generate ads.*
