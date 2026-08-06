# Research Layer — Architecture Reference

**Status:** Sprint 8 — Phase 2 (first PROJECT Brain Layer implementation)  
**Authority:** [PEERGENT_CONSTITUTION.md](./PEERGENT_CONSTITUTION.md), [PROJECT_BRAIN_FOUNDATION.md](./PROJECT_BRAIN_FOUNDATION.md)  
**Scope:** Layer 1 — fact discovery only  
**Non-goals:** Strategy, UI changes, Sprint 7.6 workflow redesign

---

## Purpose

The Research Layer is the **only place responsible for collecting knowledge** inside PROJECT Brain.

It discovers facts. It does **not** make decisions. It does **not** generate strategy. Every later Layer (Understanding, Strategy, Planning, Creative) consumes Research output.

```text
Website / Tools / Profile
        ↓
Research Layer (modules)
        ↓
ResearchGraph (canonical output)
        ↓
Understanding Layer (future)
        ↓
Strategy Layer (future extraction)
        ↓
Planning → Creative
```

---

## Responsibilities

| Owns | Does not own |
|------|--------------|
| Fact collection with provenance | Recommendations |
| ResearchGraph assembly | Strategy decisions |
| Unknown recording | Memory commits |
| Ephemeral research storage | Publish / execution |
| Module specifications | UI presentation |

---

## What it must never do

Per [PEERGENT_CONSTITUTION.md](./PEERGENT_CONSTITUTION.md):

- Never fabricate facts
- Never generate recommendations
- Never invent competitors, pricing, or metrics
- Never write to durable Memory (Validation Layer owns that)
- Never bypass capability provenance from grandfathered executors

---

## Lifecycle (Brain episode)

Maps to Constitution Part 4 — **Researching** state:

| | |
|-|-|
| **Entry** | Readiness pass; research required for episode |
| **Exit** | ResearchGraph complete or valid cache reuse |
| **Allowed** | Module collection, capability delegation, repository store |
| **Forbidden** | Strategy, creative generation, publish, Memory writes |

---

## Code location

```text
lib/brain/layers/research/
├── index.ts
├── types.ts                 # ResearchGraph, Evidence, Unknown, Source
├── evidence.ts              # createResearchEvidence
├── unknowns.ts              # createResearchUnknown
├── research-module.ts       # Common module interface
├── modules/specs.ts         # Nine module specifications
├── build-research-graph.ts  # Strangler adapter from capabilities
├── research-repository.ts   # Ephemeral storage contract
└── research-layer.ts        # ResearchLayer orchestrator
```

---

## Research Modules

Each module exposes a common contract:

| Field | Purpose |
|-------|---------|
| **Purpose** | Single responsibility |
| **Input** | CompanySnapshot, campaign context, upstream outputs |
| **Output** | Evidence + unknowns (no recommendations) |
| **Confidence** | Numeric 0–1 |
| **Evidence** | Provenance-backed facts |
| **Sources** | Origin refs |
| **Timestamp** | collectedAt |
| **Version** | Module semver |

### Initial modules

| Module | Status | Legacy capability |
|--------|--------|-------------------|
| Company Research | Spec + adapter | `company_understanding` |
| Website Research | Spec + adapter | `website_understanding` |
| Competitor Research | Spec + adapter | `competitor_understanding` |
| Product Research | Spec only | — |
| Audience Research | Spec only | — |
| SEO Research | Spec only | — |
| Brand Research | Spec only | `brand_understanding` |
| Market Research | Spec only | `market_understanding` |
| Offer Research | Spec only | — |

Modules without adapters today still appear in `RESEARCH_MODULE_SPECS` for future Brains.

---

## ResearchGraph schema

Canonical output consumed by Understanding Layer (future):

```typescript
ResearchGraph {
  version: string
  organizationId: string
  campaignId?: string
  collectedAt: string
  company: ResearchEvidence[]
  website: ResearchEvidence[]
  products: ResearchEvidence[]
  services: ResearchEvidence[]
  competitors: ResearchEvidence[]
  audience: ResearchEvidence[]
  brand: ResearchEvidence[]
  seo: ResearchEvidence[]
  market: ResearchEvidence[]
  offer: ResearchEvidence[]
  strengths: ResearchSwotNode[]
  weaknesses: ResearchSwotNode[]
  opportunities: ResearchSwotNode[]
  risks: ResearchSwotNode[]
  unknowns: ResearchUnknown[]
}
```

Every evidence node includes: **Evidence, Confidence, Source, collectedAt, version**.

Nothing exists without provenance.

---

## Evidence model

```typescript
ResearchEvidence {
  id: string
  title: string
  description: string
  source: ResearchSource
  confidence: number          // 0.00 – 1.00
  collectedAt: string
  version: string
  validationStatus: "pending" | "validated" | "rejected" | "superseded"
}
```

No free-floating text. Descriptions are always tied to a source ref.

---

## Confidence model

| Signal | Score |
|--------|-------|
| Website statement / customer confirmed | 0.95 |
| Homepage / profile inference | 0.70 |
| Weak inference | 0.40 |
| Missing / unknown | 0.00 |

Mapped from legacy `BrainConfidence` (low/medium/high) during strangler migration.

---

## Unknown model

Research explicitly records gaps:

```typescript
ResearchUnknown {
  id: string
  title: string              // e.g. "Pricing model"
  confidence: 0
  reason: string             // e.g. "Website contains no pricing"
  collectedAt: string
  version: string
}
```

Future Layers **must consume Unknowns** instead of guessing.

---

## Source kinds

| Kind | Example |
|------|---------|
| `website` | Crawled page ref |
| `competitor` | Customer-supplied competitor |
| `brandbook` | Brand Brain constraint |
| `customer` | Confirmed input |
| `memory` | Prior validated ref |
| `human` | Manual correction |
| `api` | Integration tool |
| `manual` | Document upload |
| `company_profile` | Business Brain field |
| `campaign_context` | Campaign setup |
| `capability_output` | Legacy capability finding |

---

## Research Repository

**Independent from Memory.**

| | Research Repository | Memory |
|-|---------------------|--------|
| **Durability** | Ephemeral (session / episode) | Durable |
| **Content** | Raw collected facts | Validated knowledge |
| **Write gate** | Research Layer | Validation Layer |
| **Implementation** | `ResearchRepository` contract + `InMemoryResearchRepository` | Sprint 6 persistence |

```typescript
ResearchRepository {
  store(record: ResearchRecord): void
  get(key: ResearchRecordKey): ResearchRecord | null
  getLatest({ organizationId, campaignId? }): ResearchRecord | null
  delete(key): boolean
  clear(): void
}
```

Future: Supabase-backed repository with TTL — not in Phase 2.

---

## Strangler integration (Sprint 7.6 compatible)

Phase 2 does **not** rewrite capabilities. It wraps them:

1. Existing capabilities run unchanged (`company_understanding`, `website_understanding`, `competitor_understanding`).
2. `buildResearchGraph()` maps capability outputs → ResearchGraph.
3. `buildCapabilityExecutionContext()` attaches `researchGraph` when upstream outputs exist.
4. `executeBrainForWorkflowStep` stores graph in Research Repository after dependency chain.
5. **Strategy reads `upstreamOutputs` as before** — `researchGraph` is additional context only.

Customer-visible behaviour is unchanged.

---

## Future integration — Reasoning Layer

ResearchGraph is consumed by the Reasoning Layer (Sprint 9). See [REASONING_LAYER.md](./REASONING_LAYER.md).

Understanding Layer naming in earlier docs maps to **Reasoning Layer** — same responsibility: interpret facts before Strategy.

```text
ResearchGraph
      ↓
ReasoningGraph (Sprint 9)
      ↓
Strategy Layer (capability extraction — future)
```

Understanding will:

- Consume ResearchGraph envelope (not raw capability outputs)
- Never re-crawl when graph version matches
- Promote validated facts to Memory through Validation Layer

---

## Migration path (no big-bang)

| Phase | Action |
|-------|--------|
| **8.2 (now)** | Types, graph, repository, strangler adapter |
| **9.x** | Understanding Layer consumes ResearchGraph |
| **10.x** | Strategy capability moves under Strategy Layer; reads UnderstandingModel |
| **10.x** | Research modules replace inline capability logic one module at a time |
| **11.x** | Real crawl / SEO / market tools behind module adapters |

Each step preserves backwards compatibility. Tests for Sprint 7.6 remain green.

---

## Acceptance (Phase 2)

- [x] Research Layer exists at `lib/brain/layers/research/`
- [x] ResearchGraph, Evidence, Unknown, Confidence models
- [x] Research Repository contract
- [x] Nine module specifications
- [x] Strategy receives ResearchGraph as additional input
- [x] No UI changes
- [x] No Sprint 7.6 workflow changes
- [x] All existing tests pass

---

*Facts before opinions. Unknowns before guesses. Research before Strategy.*
