# Brain Architecture Blueprint

**Status:** PX-38 — Frozen architecture (documentation only)  
**Effective:** Before PX-39 Execution Brain  
**Authority:** Constitution → Product Bible → Vision v13 → Project Brain → Brain Output Layer → Project Engine → Creative / Validation / Memory Brains  

**Non-goals this sprint:** New Brains, UI changes, Project Engine changes, Brain Output Layer changes, modifications to any implemented Brain.

---

## Executive summary

Peergent is not a workflow engine with LLM steps. It is a **Brain Operating System (BOS)** — a composable architecture of domain-specialist Brains that share contracts, ownership rules, and a single organizational memory.

Every Peer (Marketing, Sales, Support, Finance, HR, CEO, Analytics, …) runs the **same cognitive pipeline** with **peer-specific overlays**. Brains never duplicate reasoning. Every truth has one owner. Memory compounds. Execution stays dumb. Learning improves without circular dependencies.

This document is the **frozen source of truth** for all future Brain work.

---

## Part 1 — What is a Brain?

### Definition

A **Brain** is a versioned, testable cognitive unit that:

1. Implements `ProjectBrainContract` (or its layer-equivalent during migration)
2. Accepts an engine-assembled `BrainContextPackage` + typed payload
3. Returns structured output (`BrainResult`) — never UI text
4. Owns a **single responsibility** in the cognition stack
5. Declares explicit **inputs, outputs, dependencies, and persistence**
6. Emits **events** for activity/timeline projection via Brain Output Layer

A Brain is **not**:

- A prompt
- A chat session
- A UI component
- An orchestrator (that is Project Engine)
- A presentation adapter (that is Brain Output Layer)
- A vector-database wrapper
- A monolith that strategizes, creates, validates, and publishes

### Why Brains exist

| Problem (without Brains) | Solution (with Brains) |
|--------------------------|------------------------|
| Prompt spaghetti | Typed contracts + schemas |
| Duplicated research per feature | Single-owner facts + Memory reads |
| Untraceable AI output | Provenance, evidence, confidence on every artifact |
| UI-coupled intelligence | Brain Output Layer translation |
| Un-testable cognition | Deterministic graph builders + validators |
| Peer silos | Shared platform Brains + peer overlays |

Brains exist so Peergent can scale to **every department** without rewriting cognition for each Peer.

### Brain vs Layer vs Capability vs Peer

| Concept | Scope | Example |
|---------|-------|---------|
| **Peer** | Customer-facing role | Marketing Peer, Sales Peer |
| **Brain** | Cognitive specialist (platform or domain) | Strategy Brain, Creative Brain |
| **Layer** | Implementation module inside a Brain era | `lib/brain/layers/research/` |
| **Capability** | Versioned execution unit | `creative_generation`, `validation` |
| **Tool** | External system | LinkedIn API, website crawler |

During migration, some Brains exist as **Layers + Capabilities** before full `ProjectBrainContract` registration. The architecture treats them as Brains regardless — migration closes the gap, not the definition.

---

## Part 2 — Architecture principles

### 1. Single responsibility

Each Brain answers **one class of question**. Research discovers. Reasoning understands. Strategy decides. Creative produces. Validation evaluates. Memory remembers. Execution acts. Learning extracts patterns.

**Violation signal:** A Brain that both generates copy and publishes it.

### 2. Single ownership

Every fact, graph, and decision has **exactly one write owner**. Other Brains read via contract or Memory — never fork silent copies.

**Violation signal:** Creative Brain storing "official ICP" that Business Brain also stores.

### 3. Brain independence

Brains do not call each other's internals. They communicate via:

- `BrainContextPackage.priorOutputs` (output refs)
- Typed graph payloads in episode payload
- Memory Brain read API
- Brain Communication Protocol (BCP) consult requests (future)

**Violation signal:** Strategy Brain importing Creative Layer builders.

### 4. Shared contracts

Every Brain implements `ProjectBrainContract`:

```text
BrainInput { context, payload, idempotencyKey }
       ↓
Brain.execute()
       ↓
BrainResult { status, outputRef, events, confidence, requiresApproval }
```

Project Engine knows **brainId** — never implementation.

### 5. Composable pipelines

Peer episodes compose Brains in DAG order. Dependencies are acyclic (`CAPABILITY_DEPENDENCIES`). Gates skip Brains when context is sufficient.

### 6. Deterministic outputs

Graph builders (`buildResearchGraph`, `buildCreativeGraph`, …) must be testable without LLM. LLM, when used, lives inside Capability providers — not in architecture seams.

### 7. No UI logic

Brains emit structured graphs and events. Brain Output Layer publishes customer language. UI mappers are thin.

### 8. No duplicated reasoning

If Business Brain owns ICP, Marketing Brain **reads** it. Research Brain crawls once. Memory merges duplicates — it does not recreate upstream graphs.

---

## Part 3 — System topology

### Control plane vs cognition plane

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CONTROL PLANE                             │
│  Project Engine          Context Brain         Approval Gates    │
│  (orchestration)         (context assembly)    (customer)        │
└───────────────────────────────┬─────────────────────────────────┘
                                │ BrainContextPackage
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       COGNITION PLANE                            │
│  Company → Business → Research → Reasoning → MI → Strategy →    │
│  Planning → Creative → Validation → Memory → Execution → Learning│
└───────────────────────────────┬─────────────────────────────────┘
                                │ Structured graphs + outputRefs
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TRANSLATION PLANE                           │
│  Brain Output Layer → Workspace / Campaign Experience / Home     │
└─────────────────────────────────────────────────────────────────┘
```

### Optimal Brain interaction diagram

This is the **canonical pipeline**. Parallel paths noted. This supersedes informal diagrams.

```text
                         ┌──────────────┐
                         │ Context Brain │  ← assembles immutable episode context
                         └───────┬──────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       ┌────────────┐    ┌────────────┐    ┌─────────────┐
       │  Company   │    │ Knowledge  │    │   Memory    │  ← read-only bootstrap
       │   Brain    │    │   Brain    │    │   (read)    │
       └─────┬──────┘    └─────┬──────┘    └─────────────┘
             │                 │
             └────────┬────────┘
                      ▼
               ┌────────────┐
               │  Business  │  ← commercial truth (products, ICP, goals)
               │   Brain    │
               └─────┬──────┘
                     │
                     ▼
               ┌────────────┐
               │  Research  │  ← external + internal fact discovery
               │   Brain    │
               └─────┬──────┘
                     │
                     ▼
               ┌────────────┐
               │ Reasoning  │  ← understanding (ReasoningGraph)
               │   Brain    │     [Understanding function — see §4.4]
               └─────┬──────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Marketing Intelligence│  ← peer overlay (Marketing only)
          │       Brain           │     optional for non-marketing peers
          └──────────┬───────────┘
                     │
                     ▼
               ┌────────────┐
               │  Strategy  │  ← decisions + direction
               │   Brain    │
               └─────┬──────┘
                     │  [approval gate: strategy_review]
                     ▼
               ┌────────────┐
               │  Planning  │  ← sequencing, dependencies, readiness
               │   Brain    │
               └─────┬──────┘
                     │
                     ▼
               ┌────────────┐
               │  Creative  │  ← artifacts, concepts, messaging
               │   Brain    │
               └─────┬──────┘
                     │
                     ▼
               ┌────────────┐
               │ Validation │  ← publication readiness
               │   Brain    │
               └─────┬──────┘
                     │  [approval gate: deliverable_review / campaign_approval]
                     ▼
               ┌────────────┐
               │   Memory   │  ← commit episode knowledge (post-validation)
               │   Brain    │
               └─────┬──────┘
                     │
                     ▼
               ┌────────────┐
               │ Execution  │  ← dumb executor (PX-39)
               │   Brain    │
               └─────┬──────┘
                     │
                     ▼
               ┌────────────┐
               │  Learning  │  ← pattern extraction from outcomes
               │   Brain    │
               └─────┬──────┘
                     │
                     ▼
               ┌────────────┐
               │   Memory   │  ← second commit (performance + learning domains)
               │   Brain    │
               └────────────┘
```

**Key corrections vs early assumptions:**

1. **Memory runs twice** — after validation (creative/strategy/validation domains) and after execution/learning (execution/performance/learning domains). One Brain, multiple scheduled episodes.
2. **Marketing Intelligence is a peer overlay** — not every peer runs it. Sales Intelligence (future) occupies the same slot for Sales Peer.
3. **Context Brain precedes all** — nothing runs without assembled context.
4. **Knowledge Brain is upstream** — curated reference corpus, not learned memory.
5. **Execution is after Memory pre-commit** — validated artifacts are remembered before external action.

---

## Part 4 — Brain catalog

Each Brain follows the same specification template.

**Implementation legend:**

| Symbol | Meaning |
|--------|---------|
| ✅ | `ProjectBrainContract` registered |
| 🔶 | Layer + Capability implemented; contract pending |
| ⬜ | Architecture only |

---

### 4.1 Context Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Assemble immutable, versioned input for one reasoning episode |
| **Responsibilities** | Scope resolution, slice loading, memory projection, tool truth, readiness gate |
| **Inputs** | Org id, peer id, project id, episode id, slice requirements, memory refs |
| **Outputs** | `BrainContextPackage`, `BrainSnapshot`, context version bump events |
| **Consumers** | Every Brain via Project Engine |
| **Producers** | Context Engine (`lib/context-engine/`), `create-snapshot.ts` |
| **Persistence** | Snapshot refs, context version — not domain facts |
| **Dependencies** | None (first in pipeline) |
| **Future expansion** | Parallel slice loaders, incremental invalidation, cross-peer context |
| **Status** | 🔶 |

**Must never own:** Business facts, strategy, creative, memory entities.

---

### 4.2 Company Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Organization identity — who this company is at the entity level |
| **Responsibilities** | Legal name, industry, size signals, geography, org structure hints, profile confidence |
| **Inputs** | Customer profile, CRM org data, website meta, registration data |
| **Outputs** | `CompanySnapshot`, company understanding capability output |
| **Consumers** | Business Brain, Research Brain, all peer Brains (read) |
| **Producers** | `executeCompanyUnderstanding`, company profile builders |
| **Persistence** | `companySnapshot`, org profile records |
| **Dependencies** | Context Brain |
| **Future expansion** | Multi-entity orgs, subsidiary graphs, firmographic enrichment |
| **Status** | 🔶 (`company_understanding` capability) |

---

### 4.3 Business Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Commercial truth — what the company sells, to whom, against whom, toward what goals |
| **Responsibilities** | Products/services, pricing signals, ICP, USPs, goals, competitor index, brand constraints (read API) |
| **Inputs** | Company Brain output, website snapshot, customer input, Research Brain refs |
| **Outputs** | Business model facts, brand graph (`BrandGraph`), competitor profiles |
| **Consumers** | Research, Reasoning, Strategy, Creative, Validation, all peers |
| **Producers** | Brand/website/competitor understanding capabilities, `collectBrandGraph` |
| **Persistence** | Brand model, business facts, competitor entities |
| **Dependencies** | Company Brain, Context Brain |
| **Future expansion** | Full BCP read API, customer-validated fact supersession, staleness policies |
| **Status** | 🔶 (split across `brand_understanding`, `website_understanding`, `competitor_understanding`) |

**Note:** Brand expression (tone, visual identity) is **owned by Business Brain** as `BrandGraph`. There is no separate Brand Brain in the frozen architecture — it is a domain of Business Brain with a dedicated read API for Creative and Validation.

---

### 4.4 Research Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Discover and cite facts — never interpret or decide |
| **Responsibilities** | Website crawl, market signals, competitor evidence, source normalization, unknown recording |
| **Inputs** | Business/Company context, research scope, tool connections, freshness policy |
| **Outputs** | `ResearchGraph` — facts, sources, gaps, evidence, unknowns |
| **Consumers** | Reasoning Brain, Strategy Brain (fallback), Business Brain (fact refresh) |
| **Producers** | `lib/brain/layers/research/`, research capabilities |
| **Persistence** | Ephemeral research store + repository (not durable Memory) |
| **Dependencies** | Context Brain, Business Brain (seeds) |
| **Future expansion** | CRM ingest, analytics seeds, regulated industry sources |
| **Status** | 🔶 |

**Must never own:** Recommendations, strategy, memory commits.

---

### 4.5 Reasoning Brain (Understanding function)

| Field | Definition |
|-------|------------|
| **Purpose** | Understand facts — build coherent internal model before decisions |
| **Responsibilities** | Business model inference, market position, customer model, contradictions, hypotheses, unknown preservation |
| **Inputs** | `ResearchGraph`, Memory reads (business/audience), campaign context |
| **Outputs** | `ReasoningGraph` — segments, pains, triggers, constraints, opportunities (understanding-level) |
| **Consumers** | Marketing Intelligence Brain, Strategy Brain |
| **Producers** | `lib/brain/layers/reasoning/` |
| **Persistence** | Episode-scoped reasoning graphs |
| **Dependencies** | Research Brain |
| **Future expansion** | Cross-episode reasoning reuse, contradiction resolution UI |
| **Status** | 🔶 |

**Naming:** Early docs used "Understanding Brain." The frozen architecture consolidates this into **Reasoning Brain** — understanding is its function, `ReasoningGraph` is its output. Do not add a separate Understanding Brain.

**Must never own:** Campaign decisions, creative, channel plans, memory commits.

---

### 4.6 Marketing Intelligence Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Translate understanding into marketing-specific thinking |
| **Responsibilities** | Buying motivation, pain/emotion mapping, positioning strength, messaging dominance, anti-patterns, marketing assumptions |
| **Inputs** | `ReasoningGraph`, `ResearchGraph`, campaign context |
| **Outputs** | `MarketingIntelligenceGraph` |
| **Consumers** | Strategy Brain (primary input priority) |
| **Producers** | `lib/brain/layers/marketing-intelligence/` |
| **Persistence** | Episode-scoped MI graphs |
| **Dependencies** | Reasoning Brain |
| **Future expansion** | Sales Intelligence, Support Intelligence overlays for other peers |
| **Status** | 🔶 |

**Peer scope:** Marketing Peer always runs this. Other peers replace with domain-equivalent overlay or skip.

---

### 4.7 Strategy Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Decide direction — what to achieve, for whom, why now |
| **Responsibilities** | Positioning, value prop, audience focus, themes, risks, rejected alternatives, `DecisionCollection` |
| **Inputs** | MI Graph, Reasoning Graph, Research Graph, Business/Brand context, Memory reads, campaign context |
| **Outputs** | `StrategyGraph`, `DecisionCollection`, strategy findings in `BrainStructuredOutput` |
| **Consumers** | Planning Brain, Creative Brain, Brain Output Layer, Memory Brain |
| **Producers** | `lib/brain/strategy/`, `executeStrategy`, decision engine |
| **Persistence** | Strategy output on `campaignBrainOutputs`, decision records |
| **Dependencies** | Reasoning Brain, Business Brain, Marketing Intelligence Brain |
| **Future expansion** | Performance-informed strategy consult, multi-campaign coherence |
| **Status** | 🔶 |

**Must never own:** Copy, channel schedules, publish actions.

---

### 4.8 Planning Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Turn strategy into an outcome-driven execution plan |
| **Responsibilities** | Work sequencing, dependencies, readiness, risks, customer input gaps — not calendar scheduling |
| **Inputs** | `StrategyGraph`, `DecisionCollection`, `BrandGraph`, MI/Research refs |
| **Outputs** | `PlanningGraph` |
| **Consumers** | Creative Brain, Brain Output Layer, Project Engine (progress truth) |
| **Producers** | `lib/brain/layers/planning/`, `ensureCampaignPlanning` |
| **Persistence** | `campaign_planning` on brain outputs |
| **Dependencies** | Strategy Brain |
| **Future expansion** | Cross-channel dependency graph, resource constraints |
| **Status** | 🔶 |

---

### 4.9 Creative Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Produce structured campaign intelligence — concepts, messaging, channel plans, deliverable specs |
| **Responsibilities** | Seven-phase creative thinking, discard tracking, creative decisions |
| **Inputs** | Strategy, Planning, Decisions, Brand, MI, Research, Reasoning, Memory reads |
| **Outputs** | `CreativeGraph` on `BrainStructuredOutput` |
| **Consumers** | Validation Brain, Memory Brain, Brain Output Layer |
| **Producers** | `lib/brain/layers/creative/`, `creativeBrainContract` |
| **Persistence** | Creative repository, output refs |
| **Dependencies** | Strategy Brain, Planning Brain, Business Brain (brand) |
| **Future expansion** | Pixel Brain delegation for visual assets, channel-specific generators |
| **Status** | ✅ |

**Must never own:** Publication readiness verdict, organizational memory commits, external publish.

---

### 4.10 Validation Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Evaluate publication readiness — senior creative/brand/marketing director judgment |
| **Responsibilities** | 19-domain evaluation, issues/warnings/passes, per-deliverable verdicts, `PublicationReadiness` |
| **Inputs** | `CreativeGraph`, Brand constraints, campaign context, business rules |
| **Outputs** | `ValidationGraph`, `ValidationReport` |
| **Consumers** | Memory Brain, Brain Output Layer, Project Engine (approval gates) |
| **Producers** | `lib/brain/layers/validation/`, `validationBrainContract` |
| **Persistence** | Validation repository, output refs |
| **Dependencies** | Creative Brain, Business Brain (brand) |
| **Future expansion** | Regulatory packs, industry-specific rule packs, Memory-informed recurring issue detection |
| **Status** | ✅ |

**Must never own:** Content generation, copy rewriting, memory commits, publish.

---

### 4.11 Memory Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Organizational memory — what to remember, merge, archive, or forget |
| **Responsibilities** | Extract from upstream graphs, quality decisions, merge/dedupe, graph relations, scoped retrieval |
| **Inputs** | Creative, Validation, Strategy, Planning, Approval decisions; (future) Execution, Performance, Feedback |
| **Outputs** | `MemoryGraph`, `MemoryRecord`, `MemoryDecision`, `MemoryEvolution` |
| **Consumers** | All Brains (read via retriever), Brain Output Layer (future), Learning Brain |
| **Producers** | `lib/brain/layers/memory/`, `memoryBrainContract` |
| **Persistence** | `MemoryRepository`, org-level memory store, snapshots |
| **Dependencies** | Validation Brain (minimum), Creative Brain, Business Brain |
| **Future expansion** | Supabase graph persistence, archive/forget automation, cross-org isolation audits |
| **Status** | ✅ |

**Must never own:** Content generation, validation, optimization, execution.

See [MEMORY_BRAIN.md](./MEMORY_BRAIN.md).

---

### 4.12 Execution Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Execute approved plans in the real world — faithfully, dumbly, traceably |
| **Responsibilities** | Invoke tools, record external ids, confirm outcomes, surface errors |
| **Inputs** | Approved `CreativeGraph`, validated deliverables, channel connections, schedule intent |
| **Outputs** | `ExecutionRecord` — status, external ids, timestamps, errors |
| **Consumers** | Memory Brain, Learning Brain, Brain Output Layer, Project Engine |
| **Producers** | PX-39 (not yet implemented) |
| **Persistence** | Execution records, publish confirmations |
| **Dependencies** | Validation Brain pass, customer approval, connected tools |
| **Future expansion** | Multi-channel orchestration, partial publish recovery, idempotent retries |
| **Status** | ⬜ |

#### Why Execution must remain a dumb Brain

Execution Brain is **deliberately non-cognitive**:

| Execution DOES | Execution NEVER |
|----------------|-----------------|
| Call Tool Gateway with approved payload | Re-strategize |
| Wait for external confirmation | Regenerate creative |
| Record truthfully (success/failure/pending) | Bypass validation or approval |
| Emit execution events | Invent publish state |
| Pass outcomes to Memory/Learning | Optimize campaigns |
| Retry transient tool failures | Interpret performance |

**Rationale:** Cognition errors are expensive and untraceable when mixed with side effects. Keeping Execution dumb makes publish truth auditable and prevents "the AI published something we didn't approve."

---

### 4.13 Learning Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Extract patterns from outcomes — improve future cognition without re-running episodes |
| **Responsibilities** | Hypothesis formation, confidence trends, best/worst pattern detection, lesson summaries |
| **Inputs** | Execution records, performance metrics, prior Memory, validation history |
| **Outputs** | `LearningGraph` — patterns, lessons, hypotheses (structured, not prose) |
| **Consumers** | Memory Brain (write), Strategy/Creative/Validation (read via Memory) |
| **Producers** | PX-40+ (not yet implemented) |
| **Persistence** | Learning episode outputs (ephemeral); durable storage via Memory Brain only |
| **Dependencies** | Execution Brain, Memory Brain (read), Performance data |
| **Future expansion** | Causal inference guards, A/B aggregation, segment-level learning |
| **Status** | ⬜ |

#### Learning without circular dependencies

```text
Strategy → Creative → Validation → Memory
                                      ↓
Execution → Performance data → Learning Brain
                                      ↓
                               Memory Brain (write learning_memory)
                                      ↓
              Next episode: Strategy/Creative READ Memory (never Learning directly)
```

**Rules:**

1. Learning Brain **never calls** Strategy or Creative directly.
2. Learning Brain **writes only** through Memory Brain's merge contract.
3. Upstream Brains **read Memory**, not Learning output — breaking the cycle.
4. Learning runs **after** execution/monitoring, not before creative generation in the same episode.

---

### 4.14 Knowledge Brain

| Field | Definition |
|-------|------------|
| **Purpose** | Curated reference corpus — documents the customer explicitly provides |
| **Responsibilities** | Ingest, chunk, index, version customer docs (FAQs, product sheets, policies, playbooks) |
| **Inputs** | Customer uploads, admin imports, URL allowlist docs |
| **Outputs** | `KnowledgeGraph` — reference entities with source document provenance |
| **Consumers** | Research Brain (seeds), Reasoning Brain, Strategy Brain, Support Peer |
| **Producers** | Knowledge ingestion pipeline (future) |
| **Persistence** | Document store, knowledge graph (org-scoped) |
| **Dependencies** | Context Brain, Company Brain |
| **Future expansion** | RAG retrieval API, document expiry, access control per peer |
| **Status** | ⬜ |

#### Knowledge vs Memory

| | Knowledge Brain | Memory Brain |
|---|-----------------|--------------|
| **Source** | Customer-curated uploads | Learned from episodes |
| **Mutability** | Versioned by document replace | Merge/evolve with evidence |
| **Writer** | Customer + ingestion pipeline | Memory Brain only |
| **Example** | Product PDF, FAQ doc | "Headline X won on LinkedIn" |

---

## Part 5 — Data ownership matrix

**Rule:** No overlap. One write owner per truth type.

| Truth | Owner | Readers | Never stored by |
|-------|-------|---------|-----------------|
| Org identity | Company Brain | All | Creative, Validation |
| Products & services | Business Brain | All | Creative (reference only) |
| Website crawl snapshot | Research Brain | Business, Reasoning | Strategy (embed copy) |
| Competitor profiles | Business Brain (index) + Research Brain (evidence) | Strategy, Reasoning | Creative |
| Market signals | Research Brain | Reasoning, Strategy | Memory (direct — via Memory Brain) |
| Brand tone & visual rules | Business Brain (`BrandGraph`) | Creative, Validation | Memory (direct) |
| Audience / ICP | Business Brain (baseline) + Strategy Brain (campaign focus) | Creative, Validation | Reasoning (persist) |
| Strategy decisions | Strategy Brain | Planning, Creative, Memory | Validation |
| Campaign plan | Planning Brain | Creative, Engine | Strategy |
| Creative artifacts | Creative Brain | Validation, Memory | Validation (mutate) |
| Publication readiness | Validation Brain | Engine, Memory, BOL | Creative |
| Organizational memory | Memory Brain | All | Any other Brain (direct write) |
| Publish records | Execution Brain | Memory, Learning, BOL | Creative, Validation |
| Performance metrics | Execution Brain (raw) + Learning Brain (interpreted) | Memory, Strategy | Creative |
| Learned patterns | Memory Brain (`learning_memory` domain) | Strategy, Creative, Research | Learning Brain (direct durable) |
| Reference documents | Knowledge Brain | Research, Reasoning | Memory Brain |
| Episode context | Context Brain | All | Any Brain |
| UI narrative | Brain Output Layer | UI | All Brains |
| Project lifecycle | Project Engine | UI, BOL | All Brains |

### Data that may never be owned by any Brain

| Data | Owner |
|------|-------|
| Chat transcripts as truth | Nobody — UX only |
| UI workflow state | Project Engine / workstream |
| Raw LLM token streams | Provider logs — not product truth |
| Unvalidated creative | Nowhere durable — ephemeral until Validation |
| Fake metrics | Forbidden entirely (Constitution) |
| Customer passwords / secrets | Auth system — never Brain-accessible |

---

## Part 6 — Information movement

### Episode data flow

```text
1. Context Brain assembles BrainContextPackage (immutable)
2. Engine schedules Brains in dependency order
3. Each Brain receives prior output REFS + typed payload graphs
4. Brain validates input → produces graph → stores outputRef
5. Brain returns BrainResult to Engine
6. Engine advances lifecycle state
7. After episode phase: Memory Brain commits durable knowledge
8. Brain Output Layer resolves outputRefs → customer intelligence
9. UI renders mapped slices — never raw graphs
```

### Handover contract

Every Brain-to-Brain transfer uses typed graphs — not prose, not prompt chains:

```text
Handover {
  outputRef          // memory:org:project:timestamp
  capabilityIds[]
  decisionIds[]
  graphVersion
  provenance[]
  confidence
}
```

### Invalidation

When Business Brain updates ICP, Context Brain bumps `contextVersion`. Dependent capabilities invalidate cache keys. Memory Brain emits evolution entries — never silent overwrite.

---

## Part 7 — Memory governance

### Who writes Memory

| Writer | When | Domains |
|--------|------|---------|
| Memory Brain | After validation approval | creative, validation, audience, brand |
| Memory Brain | After strategy approval | business, competitive, learning |
| Memory Brain | After execution | execution |
| Memory Brain | After learning episode | performance, learning |
| **Nobody else** | — | — |

### Who reads Memory

| Reader | Scope |
|--------|-------|
| Context Brain | Projects refs into `BrainContextPackage.memoryRefs` |
| Research Brain | Prior findings before re-crawl |
| Reasoning Brain | Business/audience baseline |
| Strategy Brain | Historical decisions, performance patterns |
| Creative Brain | Winning hooks, rejected concepts, brand rules |
| Validation Brain | Recurring issues, approved/forbidden claims |
| Learning Brain | Prior patterns (read-only input) |
| Brain Output Layer | Historical insights (future wiring) |
| All peer Brains | Via scoped retriever |

### Who may update Memory

Only **Memory Brain** — via merge strategy (`merge`, `update`, `store_permanent`, `store_temporary`). Upstream Brains propose candidates; Memory Brain decides.

### Who may archive Memory

Memory Brain only — `archive` and `forget` actions (future lifecycle automation). Requires confidence decay rules or customer policy.

---

## Part 8 — Cross-peer architecture

Every Peer shares the **same platform Brains**. Peers differ in **overlay**, **objectives**, **tool connections**, and **which pipeline stages activate**.

```text
                    ┌─────────────────────────────────┐
                    │     PLATFORM BRAIN POOL          │
                    │  Context · Company · Business ·  │
                    │  Research · Reasoning · Strategy · │
                    │  Planning · Creative · Validation│
                    │  Memory · Execution · Learning · │
                    │  Knowledge                        │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────┬───────────┬───┴───┬───────────┬───────────┐
        ▼           ▼           ▼       ▼           ▼           ▼
   Marketing     Sales      Support  Finance      HR         CEO
      Peer        Peer        Peer    Peer       Peer       Peer
        │           │           │       │           │           │
        ▼           ▼           ▼       ▼           ▼           ▼
       MI         SI*         VoC*    FP*         Policy*    Multi-Brain
    overlay     overlay     overlay overlay     overlay     orchestration
```

\* Future peer-specific overlays (Sales Intelligence, Voice-of-Customer, Financial Planning, HR Policy).

### Peer composition matrix

| Peer | Overlay Brain | Primary outputs | Consults |
|------|---------------|-----------------|----------|
| **Marketing** | Marketing Intelligence | Campaigns, creative, publish | Business, Memory, Analytics |
| **Sales** | Sales Intelligence (future) | Pipeline plays, sequences | Business, Marketing, Support |
| **Support** | Voice-of-Customer (future) | Ticket themes, churn signals | Business, Knowledge |
| **Finance** | Financial Planning (future) | Budget scenarios, ROI | Business, Analytics |
| **HR** | Policy overlay (future) | Role specs, compliance | Knowledge, Business |
| **Recruitment** | Candidate Intelligence (future) | Job campaigns, screening | Business, HR |
| **Planner** | Cross-functional scheduling | Timeline coordination | All active peers |
| **CEO** | Multi-Brain orchestration | Executive synthesis | All peers (BCP) |
| **Analytics** | Performance interpretation | Metrics, anomalies | Memory, Execution |

### Reuse rules

1. **Never duplicate Company/Business/Research** per peer — always read platform truth.
2. **Peer overlays are optional modules** — skip if peer doesn't need domain translation.
3. **Memory is org-scoped** — all peers read/write through same Memory Brain with namespace tags.
4. **BCP consult is read-only** — requesting peer owns the decision.
5. **Brain Output Layer** aggregates cross-peer intelligence for CEO/Workspace views.

---

## Part 9 — Project Engine & Brain Output Layer (boundary)

These are **not Brains**. Documented here to prevent scope creep.

| Component | Role | May never |
|-----------|------|-----------|
| **Project Engine** | Lifecycle state machine, brain scheduling, approval routing, retries | Generate content, store domain facts |
| **Brain Output Layer** | Translate graphs → customer intelligence | Mutate brain outputs, decide strategy |

Brain registry today (`createDefaultProjectBrainRegistry`):

```text
creative    ✅
validation  ✅
memory      ✅
(research → learning: engine-ready IDs, layer implementation pending contract)
```

---

## Part 10 — Current architecture audit

### Implementation status (PX-38 snapshot)

| Brain | Contract | Layer | Tests | BOL wired |
|-------|----------|-------|-------|-----------|
| Context | ⬜ | 🔶 | partial | n/a |
| Company | ⬜ | 🔶 | yes | partial |
| Business | ⬜ | 🔶 | yes | partial |
| Knowledge | ⬜ | ⬜ | no | no |
| Research | ⬜ | 🔶 | yes | partial |
| Reasoning | ⬜ | 🔶 | yes | partial |
| Marketing Intelligence | ⬜ | 🔶 | yes | partial |
| Strategy | ⬜ | 🔶 | yes | yes |
| Planning | ⬜ | 🔶 | yes | yes |
| Creative | ✅ | ✅ | yes | yes |
| Validation | ✅ | ✅ | yes | yes |
| Memory | ✅ | ✅ | yes | no |
| Execution | ⬜ | ⬜ | no | no |
| Learning | ⬜ | ⬜ | no | no |

### Missing Brains

| Brain | Risk if delayed |
|-------|-----------------|
| **Execution** | Blocks truthful publish loop (PX-39) |
| **Learning** | No compounding intelligence across campaigns |
| **Knowledge** | Customer docs disconnected from cognition |
| **Context** (as contract) | Engine can't enforce uniform context assembly |

### Redundant concepts (resolved in this blueprint)

| Was | Resolution |
|-----|------------|
| Understanding Brain + Reasoning Brain | Consolidated → **Reasoning Brain** |
| Brand Brain (separate) | Consolidated → **Business Brain** (`BrandGraph`) |
| Layer vs Brain dual naming | Brain is canonical; Layer is implementation path |
| Memory Layer vs Memory Brain | **Memory Brain** is canonical (PX-37) |

### Overlapping responsibilities (watch list)

| Overlap | Mitigation |
|---------|------------|
| Business Brain vs Memory `business_memory` | Business Brain owns live truth; Memory stores **learned campaign context** — not a second source. Memory extracts, Business validates. |
| Strategy audience vs Business ICP | Business = baseline ICP; Strategy = campaign-specific focus. Strategy must reference Business, not replace. |
| Research vs Business competitor data | Research = evidence; Business = indexed profile. Research feeds Business updates. |
| Planning vs Execution scheduling | Planning = work order; Execution = calendar/tool dispatch. Planning never calls publish APIs. |
| Performance capability vs Learning Brain | Performance interprets raw metrics; Learning extracts cross-campaign patterns. Performance feeds Learning; neither decides strategy. |

### Future problems

1. **Pipeline order drift** — `DEFAULT_BRAIN_PIPELINE` places memory after execution; canonical diagram schedules Memory twice. Engine stage router must support multiple Memory episodes per project.
2. **Partial contract migration** — Research/Strategy as layers while Creative/Validation/Memory as contracts creates dual registration paths. Complete migration before Execution Brain.
3. **Memory without BOL** — Memory Brain implemented but not wired to customer surfaces. Risk of invisible intelligence until PX-38+ wiring sprint.
4. **In-memory persistence** — Memory and Creative repositories are in-process. Production requires Supabase-backed repositories before multi-instance deploy.

### Scalability issues

| Issue | Impact | Direction |
|-------|--------|-----------|
| Full graph payloads in episode payload | Memory pressure on long campaigns | Reference-only payloads via outputRefs (engine already supports) |
| Synchronous brain pipeline | Latency stacks | Parallel Company/Business/Research where acyclic; async brain runs |
| Org-level memory growth | Retrieval slows | MemoryIndexer sharding, archive policy, domain TTL |
| 19-domain Validation | CPU on every deliverable | Incremental validation on diff only |

### Coupling risks

| Coupling | Risk | Guard |
|----------|------|-------|
| BOL reads `campaignBrainOutputs` directly | Schema drift | Versioned output contracts |
| Strategy findings ↔ 19 labels | Legacy lock-in | StrategyGraph as primary; labels as projection |
| Creative → Validation → Memory chain | Tight sequential dependency | Engine retry/recovery per brain |
| Demo data in brain builders | Live/demo divergence | Environment flag in all builders |

### Performance bottlenecks

1. Full pipeline re-run on minor context change — needs capability-level cache keys (partially exists).
2. Validation runs all 19 domains always — future: dirty-flag domains on creative diff.
3. Memory merge on large org histories — needs indexed merge key lookup (MemoryIndexer exists; production store must use it).

### Maintenance risks

1. **Registry filename** `creative-brain-registry.ts` holds three brains — rename in dedicated cleanup sprint.
2. **Dual export paths** in `lib/brain/index.ts` — contract exports vs layer exports require discipline.
3. **Documentation drift** — this blueprint supersedes conflicting layer ordering in older docs. Update references, not duplicate.

---

## Part 11 — PX-39+ gate checklist

Before Execution Brain begins, verify:

- [ ] This blueprint reviewed and locked
- [ ] Memory dual-schedule model reflected in Project Engine stage router (future sprint — not PX-38)
- [ ] Execution Brain spec references §4.12 dumb executor rules
- [ ] No Brain writes Memory except Memory Brain
- [ ] BCP schema defined for cross-peer consult (future)
- [ ] Knowledge vs Memory boundary respected in ingestion design

---

## Related documents

| Document | Scope |
|----------|-------|
| [PROJECT_BRAIN_FOUNDATION.md](./PROJECT_BRAIN_FOUNDATION.md) | Original foundation — layers, BCP, roadmap |
| [PROJECT_ENGINE.md](./PROJECT_ENGINE.md) | Orchestrator — not a Brain |
| [BRAIN_OUTPUT_LAYER.md](./BRAIN_OUTPUT_LAYER.md) | Translation — not a Brain |
| [BRAIN_DNA.md](./BRAIN_DNA.md) | Peer personality & autonomy per domain |
| [CREATIVE_BRAIN.md](./CREATIVE_BRAIN.md) | PX-35 implementation |
| [VALIDATION_BRAIN.md](./VALIDATION_BRAIN.md) | PX-36 implementation |
| [MEMORY_BRAIN.md](./MEMORY_BRAIN.md) | PX-37 implementation |
| [RESEARCH_LAYER.md](./RESEARCH_LAYER.md) | Research Brain implementation |
| [REASONING_LAYER.md](./REASONING_LAYER.md) | Reasoning Brain implementation |
| [STRATEGY_LAYER.md](./STRATEGY_LAYER.md) | Strategy Brain implementation |
| [PLANNING_LAYER.md](./PLANNING_LAYER.md) | Planning Brain implementation |

---

*Frozen architecture note:* This document defines **what Peergent's Brain Operating System is**. Implementation catches up. No new Brain may contradict single ownership, dumb execution, or Memory-only writes without an explicit architecture amendment.
