# PROJECT Brain Foundation — Architecture Blueprint

**Status:** Phase 1 — Architecture only (Sprint 8)  
**Authority:** [PEERGENT_CONSTITUTION.md](./PEERGENT_CONSTITUTION.md), Experience Constitution, Product Bible, Vision v13 (UI unchanged until approved)  
**Scope:** Long-term AI Brain architecture for every Peer in Peergent  
**Non-goals:** UI changes, Sprint 7.6 behaviour changes  

**Layer implementation:** Research Layer — [RESEARCH_LAYER.md](./RESEARCH_LAYER.md). Reasoning Layer — [REASONING_LAYER.md](./REASONING_LAYER.md). Marketing Intelligence — [MARKETING_INTELLIGENCE_LAYER.md](./MARKETING_INTELLIGENCE_LAYER.md) (Sprint 9.3). Strategy Layer — [STRATEGY_LAYER.md](./STRATEGY_LAYER.md).

---

## Executive summary

Peergent is evolving from a **workflow engine with LLM steps** into a **software architecture of domain-specialist Brains** that all think through the same reusable **Layers**.

| Concept | One-line definition |
|---------|---------------------|
| **Brain** | A domain specialist (Marketing, Sales, Support…) with its own objectives, memory namespace, and capability graph |
| **Layer** | A reusable stage of thinking with exactly one responsibility |
| **Capability** | A versioned, testable unit of work inside a Layer |
| **Tool** | An external system the Brain may invoke (API, integration, deterministic service) |
| **Memory** | Structured, queryable organisational knowledge — not chat history |
| **Context** | The immutable input package assembled for one reasoning episode |
| **Decision** | A recorded choice with rationale, alternatives considered, and approval state |
| **Output** | Schema-validated structured artifact handed to the next Layer or to Execution |

**Design principle:** Brains are not prompts. Layers are how every Brain thinks. Specialization lives in the Brain; cognition lives in the Layers.

---

## Task 1 — Core concepts and relationships

### Concept map

```text
                    ┌─────────────────────────────────────┐
                    │           Organization              │
                    │  (tenant, goals, policies, tools) │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │         Context Engine 2.0          │
                    │  assembles BrainSnapshot per episode  │
                    └─────────────────┬───────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
   ┌───────────┐              ┌───────────────┐            ┌─────────────┐
   │ Brand Brain│◄────────────│ Marketing Brain│──────────►│ Sales Brain │
   │ (shared)   │   consults  │  (domain)     │  delegates │  (domain)   │
   └───────────┘              └───────┬───────┘            └─────────────┘
                                      │
                              Layer pipeline
                                      │
         Research → Understanding → Strategy → Planning → Creative
              → Validation → Memory (write) → Execution
                                      │
                              Capabilities + Tools
                                      │
                              Decisions + Outputs
                                      │
                              Memory (read/write)
```

### Brain

A **Brain** is a long-lived domain specialist bound to a Peer role.

- Owns a **capability graph** (which Layers it uses, in what order, with what gates)
- Owns a **memory namespace** (what it may read/write)
- Owns **objectives** (what “good” means for this domain)
- Does **not** own Layers (Layers are platform-wide)
- Does **not** embed prompts as architecture (prompts are capability implementation details)

**Examples:** Marketing Brain, Sales Brain, Support Brain, Planner Brain, Finance Brain, HR Brain, Recruitment Brain, Reception Brain, Analytics Brain, CEO Brain.

**Relationship to Peer:** One Peer wears one primary Brain in production UI. A Peer may **consult** other Brains without becoming them.

### Layer

A **Layer** is a reusable cognitive stage with exactly one responsibility.

- Receives structured input from the previous Layer (or Context Engine)
- Produces structured output for the next Layer
- Contains one or more **Capabilities**
- Enforces **handover contracts** (schemas, provenance, confidence)
- Is **domain-agnostic** — Marketing and Sales both use Strategy Layer; only capabilities differ

Layers are **ordered** but not always **fully executed** — gates skip Layers when context is sufficient.

### Capability

A **Capability** is the smallest unit of Brain work that is:

- **Versioned** (`capabilityId` + `capabilityVersion`)
- **Schema-bound** (input projection + output schema)
- **Cacheable** (keyed by context version + capability version)
- **Observable** (run id, latency, provider, validation retries)
- **Approval-aware** (none | before_action | before_publish)

Capabilities live **inside** Layers. They may call Tools. They emit Outputs and optionally Decisions.

*Current codebase alignment:* `lib/brain/capabilities/registry.ts` — extend, do not replace.

### Tool

A **Tool** is an external or deterministic capability boundary:

- Integrations (LinkedIn, Meta, Google Ads, Mailchimp, WordPress…)
- Deterministic services (scrapers, validators, calculators)
- Other Brains (via Brain Communication Protocol)
- Human customer (approval, input)

Tools are **never** Layers. Capabilities **invoke** Tools through a Tool Gateway with policy checks.

### Memory

**Memory** is structured, durable knowledge — not conversation transcripts.

- Entity graph (brand, campaign, customer, competitor, decision…)
- Typed facts with provenance and validity windows
- Queryable by Context Engine and Layers
- Write path: Validation Layer + explicit Memory Layer commits
- Read path: Context Engine projections into BrainSnapshot

Chat history may inform UX but **must not** be the Memory architecture.

### Context

**Context** is the immutable input package for one reasoning episode (`BrainSnapshot`).

- Assembled by Context Engine 2.0 before any Capability runs
- Contains **references** to heavy stores, not embedded payloads
- Includes known facts, assumptions, unknowns, sources
- Versioned (`assembledAt`, slice ref ids, campaign context version)

One episode = one snapshot. Invalidation rules bump versions; capabilities cache on version keys.

### Decision

A **Decision** is a recorded choice requiring traceability:

- What was decided
- Why (rationale, evidence refs)
- Alternatives considered
- Confidence / uncertainty
- Approval state (pending | approved | rejected | superseded)
- Who decided (Brain, customer, policy)

Decisions are first-class Memory entities. Strategy Layer produces decisions; Validation Layer may challenge them; customer approval promotes them.

### Output

An **Output** is schema-validated structured data from a Capability:

- Immutable once validated (new run → new output id)
- Carries provenance (capability id/version, run id, snapshot ref)
- Handed to next Layer via **Handover Envelope**
- Presented to UI via presentation adapters (never raw LLM text in product)

---

## Task 2 — Reusable Layers (generic)

Nine platform Layers. Every future Brain composes from this set (subset + ordering + gates).

### Layer 1 — Research Layer

| Field | Definition |
|-------|------------|
| **Purpose** | Gather external and internal facts needed before interpretation |
| **Inputs** | Context snapshot (org, objective, seeds), research scope, freshness policy |
| **Outputs** | `ResearchBundle`: facts[], sources[], gaps[], confidence |
| **Responsibilities** | Collect, normalize, cite, flag unknowns |
| **Must NOT** | Strategize, plan campaigns, generate creative, write to Memory as truth |
| **Dependencies** | Context Engine, Tools (web, CRM, analytics APIs) |
| **Handover** | ResearchBundle → Understanding Layer |
| **Interface** | `ResearchLayer.run(scope) → ResearchBundle` |

### Layer 2 — Understanding Layer

| Field | Definition |
|-------|------------|
| **Purpose** | Interpret research into a coherent model of situation, audience, and constraints |
| **Inputs** | ResearchBundle, Memory (brand, business, history), Context snapshot |
| **Outputs** | `UnderstandingModel`: segments, pains, triggers, constraints, hypotheses |
| **Responsibilities** | Synthesize, resolve conflicts, surface gaps for customer |
| **Must NOT** | Choose strategy, schedule work, publish, invent metrics |
| **Dependencies** | Research Layer (or cached equivalent) |
| **Handover** | UnderstandingModel → Strategy Layer |
| **Interface** | `UnderstandingLayer.interpret(research, memory) → UnderstandingModel` |

### Layer 3 — Strategy Layer

| Field | Definition |
|-------|------------|
| **Purpose** | Decide direction — what to achieve, for whom, why now |
| **Inputs** | ReasoningGraph (primary), ResearchGraph, legacy upstreamOutputs, campaign context, business goals |
| **Outputs** | `StrategyGraph` → `BrainStructuredOutput` (19 finding labels preserved for Sprint 7.6) |
| **Responsibilities** | Propose direction, document rationale, rejected alternatives, risks, unknowns; require approval when configured |
| **Must NOT** | Write ad copy, pick publish times, call publish Tools |
| **Dependencies** | Reasoning Layer (Sprint 9), Research Layer fallback |
| **Handover** | StrategyGraph → Planning Layer (future primary consumer) |
| **Interface** | `executeStrategyWithGraph(ctx) → BrainStructuredOutput` — see [STRATEGY_LAYER.md](./STRATEGY_LAYER.md) |

### Layer 4 — Planning Layer

| Field | Definition |
|-------|------------|
| **Purpose** | Turn strategy + decisions into an outcome-driven execution plan (order, dependencies, readiness, risks) |
| **Inputs** | StrategyGraph, DecisionCollection, Brand Brain snapshot |
| **Outputs** | `PlanningGraph` → persisted as `campaign_planning` in `campaignBrainOutputs` |
| **Responsibilities** | Sequence work by business value; identify customer input; never conflate with scheduling |
| **Must NOT** | Generate creative assets, mark published, replace `campaignSchedule` |
| **Dependencies** | Strategy Layer |
| **Handover** | PlanningGraph → Creative Layer (future) |
| **Interface** | `ensureCampaignPlanning()` — see [PLANNING_LAYER.md](./PLANNING_LAYER.md) |
| **Live status** | Sprint 11.1 — auto-builds after strategy persist; Executive Briefing Execution Plan section |

### Layer 5 — Creative Layer

| Field | Definition |
|-------|------------|
| **Purpose** | Produce domain artifacts (copy, visuals specs, scripts, documents) |
| **Inputs** | ExecutionPlan, Brand constraints (from Brand Brain), format rules |
| **Outputs** | `CreativeArtifactSet`: drafts with channel metadata, review status |
| **Responsibilities** | Generate, format, self-check against brand rules |
| **Must NOT** | Publish externally, bypass Validation, store as approved without review |
| **Dependencies** | Planning Layer, Brand Brain read API |
| **Handover** | CreativeArtifactSet → Validation Layer |
| **Interface** | `CreativeLayer.produce(plan, brand) → CreativeArtifactSet` |

### Layer 6 — Validation Layer

| Field | Definition |
|-------|------------|
| **Purpose** | Verify outputs against schemas, policies, brand rules, and business logic |
| **Inputs** | Any Layer output, ValidationPolicy, Brand rules |
| **Outputs** | `ValidationResult`: pass | fail, issues[], safe customer messages |
| **Responsibilities** | Schema validation, business rule checks, leak detection, retry guidance |
| **Must NOT** | Silently fix and approve, hide failures, run new creative generation |
| **Dependencies** | Upstream output, Brand Brain, policy engine |
| **Handover** | Validated envelope → Memory Layer (if commit) or back to originating Layer |
| **Interface** | `ValidationLayer.validate(artifact, policy) → ValidationResult` |

### Layer 7 — Memory Layer

| Field | Definition |
|-------|------------|
| **Purpose** | Commit durable facts, decisions, and relationships with provenance |
| **Inputs** | Validated outputs, Decisions, customer approvals |
| **Outputs** | `MemoryCommitReceipt`: entity ids, version bumps, invalidation events |
| **Responsibilities** | Write graph, maintain provenance, emit invalidation for Context Engine |
| **Must NOT** | Store raw chat, overwrite without version, commit unvalidated data |
| **Dependencies** | Validation Layer pass, approval gates |
| **Handover** | Updated Memory index → Context Engine (next episode) |
| **Interface** | `MemoryLayer.commit(validated, approval) → MemoryCommitReceipt` |

### Layer 8 — Execution Layer

| Field | Definition |
|-------|------------|
| **Purpose** | Carry out approved plans in the real world (publish, send, schedule, ticket) |
| **Inputs** | Approved ExecutionPlan, CreativeArtifactSet, Tool connections |
| **Outputs** | `ExecutionRecord`: status, external ids, errors, timestamps |
| **Responsibilities** | Invoke Tools truthfully, record outcomes, never claim success without confirmation |
| **Must NOT** | Strategize, regenerate creative, bypass approval, fake integration state |
| **Dependencies** | Validation + approval, Tool Gateway |
| **Handover** | ExecutionRecord → Memory Layer + Performance Brain (future) |
| **Interface** | `ExecutionLayer.execute(approved, tools) → ExecutionRecord` |

### Layer 9 — Orchestration Layer (cross-cutting)

| Field | Definition |
|-------|------------|
| **Purpose** | Route episodes through Layers, enforce gates, manage run lifecycle |
| **Inputs** | Brain config, current state, customer actions |
| **Outputs** | Active layer, primary action, workflow truth for UI |
| **Responsibilities** | Phase resolution, approval routing, cache reuse, no false “published/active” |
| **Must NOT** | Contain domain logic, embed LLM prompts |
| **Dependencies** | All Layers (invocation only) |
| **Handover** | UI view models, Work bucket classification |
| **Interface** | `BrainOrchestrator.evaluate(state) → OrchestrationState` |

*Note:* Orchestration is not “thinking” — it is the conductor. Sprint 7.6 `campaign-intelligence-orchestrator` evolves into Brain Orchestration, not into a Layer.

### Standard Handover Envelope

Every Layer-to-Layer transfer uses:

```text
HandoverEnvelope {
  envelopeId
  sourceLayer
  targetLayer
  capabilityId
  capabilityVersion
  contextVersion
  snapshotRef
  payload          // schema-validated
  provenance[]
  confidence
  approvalState
  createdAt
}
```

---

## Task 3 — Marketing Brain design

Marketing Brain is the first full Brain implementation. It maps Sprint 7.6 workflow steps onto Layers without changing current behaviour until approved.

### Layer mapping (Marketing)

| Layer | Marketing responsibility | Sprint 7.6 alignment |
|-------|-------------------------|----------------------|
| Research | Company, website, competitor gathering | business/website/competitor analyzed steps |
| Understanding | Audience, offer, market fit model | campaign context, brand context |
| Strategy | Campaign angle, objectives, rationale | strategy_determined capability |
| Planning | Channel mix, deliverable plan, schedule intent | channels_selected, scheduled |
| Creative | Deliverable drafts per channel | deliverables_created, creative_generation |
| Validation | Schema + business rules + approval gates | output-quality, review flow |
| Memory | Persist brain outputs, decisions, schedule | campaignSetup, session storage |
| Execution | Publish when integration confirmed | published step (truthful, not faked) |

### Information flow (Marketing campaign episode)

```text
Customer starts campaign
        │
        ▼
Context Engine 2.0 ──► BrainSnapshot (org, brand, campaign seeds)
        │
        ▼
Research Layer ──► company / website / competitor ResearchBundles
        │
        ▼
Understanding Layer ──► MarketingUnderstandingModel
        │
        ▼
Strategy Layer ──► StrategyDecision [customer approval gate]
        │
        ▼
Planning Layer ──► ChannelPlan + DeliverablePlan [customer approval gate]
        │
        ▼
Creative Layer ──► CreativeArtifactSet [customer approval gate]
        │
        ▼
Validation Layer ──► pass → schedule intent stored
        │
        ▼
Memory Layer ──► commit schedule, outputs, approvals (versioned)
        │
        ▼
Execution Layer ──► publish ONLY when Tool confirms (future Sprint)
        │
        ▼
Performance feedback ──► Analytics Brain (future) ──► Memory
```

### Marketing-specific gates (truthful lifecycle)

- **Scheduled ≠ Published ≠ Active** — Orchestration enforces (Sprint 7.6 locked)
- Missing integrations → Execution Layer blocked, not Workflow Layer
- Customer approval before publication — never bypass

---

## Task 4 — Shared Brain Memory architecture

Memory is an **entity graph** with typed edges, not a log.

### Memory domains (namespaces)

| Domain | Examples | Writers | Readers |
|--------|----------|---------|---------|
| **Brand** | tone, colors, typography rules | Brand Brain | All creative Layers |
| **Knowledge** | products, services, FAQs | Research, Understanding | All Brains |
| **Decisions** | strategy choices, approvals | Strategy, Validation, customer | All Brains |
| **Campaign history** | plans, schedules, outcomes | Marketing Memory Layer | Marketing, Performance |
| **Performance** | CTR, CPA, ROAS snapshots | Performance Brain, Tools | Strategy, Planning |
| **Competitors** | profiles, positioning | Research | Understanding, Strategy |
| **Preferences** | customer approval style, channels | customer actions | Planning, Orchestration |
| **Learned behaviour** | what worked, segment response | Performance Brain | Strategy |
| **Relationships** | customer ↔ segment ↔ campaign | all Layers | Context Engine |

### Memory record shape (conceptual)

```text
MemoryEntity {
  id
  type                 // brand_rule | decision | campaign | metric | ...
  namespace            // org-scoped
  brainScope           // which Brain owns write authority
  payload              // typed, schema-versioned
  provenance           // capability run, source, customer
  validFrom / validTo
  supersedes           // prior entity id
  relationships[]      // typed edges
}
```

### Read vs write

- **Read:** Context Engine projects slices into BrainSnapshot refs
- **Write:** Only Memory Layer after Validation pass (+ approval if required)
- **Invalidation:** `contextVersion` bumps propagate to capability cache keys

### What Memory is NOT

- Chat transcripts as source of truth
- Unvalidated LLM output
- UI workflow state (that stays in workstream/orchestration)
- Duplicate copies of Business Brain / Brand Brain stores (reference, don’t embed)

---

## Task 5 — Context Engine 2.0

Evolution of `lib/context-engine/` + `BrainSnapshot` into the single assembly point before any Capability.

### Assembly pipeline

```text
1. Scope resolution (org, peer, actor, session)
2. Objective binding (current task, campaign id, customer intent)
3. Parallel slice loaders (lazy + eager)
4. Memory projection (facts, decisions, performance summaries)
5. Tool availability truth (connected | not_configured | failed)
6. BrainSnapshot materialization (immutable)
7. Readiness gate (block or proceed with unknowns surfaced)
```

### Context slices (target)

| Slice | Source | Notes |
|-------|--------|-------|
| Organization | Supabase org, policies | tenant boundary |
| Brain | Peer role, brain config | which Layers active |
| Website | crawl snapshot | Research input |
| Brand | Brand Brain API | creative constraint |
| Research | latest ResearchBundles | refs only |
| Memory | Memory graph query | decisions, history |
| Campaign | active campaign setup | versioned |
| Previous outputs | capability output store | cache reuse |
| Connected tools | integrations registry | truthful status |
| Business goals | objective + OKR refs | strategy input |
| Current objective | episode intent | single primary goal |

### Principles

- **References over copies** — snapshot stays small
- **Truthful tool state** — never imply publish readiness
- **Version keys everywhere** — campaign context version, capability version
- **Provenance required** — every fact traceable
- **Peer-agnostic assembly** — same engine, different loader sets per Brain

---

## Task 6 — Brain communication

Brains consult each other without duplicating work via **Brain Communication Protocol (BCP)**.

### Pattern: Ask → Answer (not prompt chain)

```text
Marketing Brain                    Sales Brain
      │                                  │
      │  ConsultRequest {                │
      │    questionType: "pipeline_fit"  │
      │    contextRef: snapshotRef       │
      │    scope: read_only              │
      │  }                               │
      ├─────────────────────────────────►│
      │                                  │ Research (cached?)
      │                                  │ Understanding
      │  ConsultResponse {               │
      │    answer: structured            │
      │    provenance, confidence        │
      │    no raw re-fetch               │
      │  }                               │
      │◄─────────────────────────────────┤
```

### Rules

1. **Consultation is read-only** by default — no cross-Brain Memory writes without policy
2. **Requests reference Context refs** — not full payload duplication
3. **Responses are structured** — schema-bound, cacheable
4. **Authority stays with requesting Brain** — Sales answers; Marketing decides
5. **Analytics Brain is a shared service** — many Brains consult; one performance truth
6. **CEO Brain orchestrates multi-Brain episodes** — future; not workflow UI

### Anti-patterns (forbidden)

- Copy-paste Marketing strategy into Sales prompts
- Each Brain re-scraping the same website independently
- Chat-style “talk to another Brain” without schemas
- Implicit Memory writes from cross-Brain calls

---

## Task 7 — Future Brand Brain (design only)

Brand Brain is the **living source of truth** for identity and expression.

### Responsibilities

| Domain | Contents |
|--------|----------|
| Mission / Vision | strategic north star |
| Tone of voice | register, vocabulary, avoid-list |
| Typography | fonts, scale, usage rules |
| Colors | palette, contrast, accessibility |
| Layouts | grid, spacing, composition |
| Writing style | sentence length, CTA patterns |
| Photography | mood, subjects, treatment |
| Illustrations | style, metaphors, restrictions |
| Design rules | do’s and don’ts |
| Channel adaptations | LinkedIn vs email vs web |

### Architecture role

- **Not a Layer** — Brand Brain is a **shared specialist Brain** with read-heavy API
- Creative Layer **must** consult Brand Brain before output
- Pixel Brain **consumes** Brand Brain as primary constraint
- Updates go through Validation + customer approval (brand steward)

### Interface (conceptual)

```text
BrandBrain.query(orgId, aspect: "tone" | "color" | …) → BrandConstraintSet
BrandBrain.validate(artifact) → BrandComplianceResult
```

---

## Task 8 — Future Pixel Brain (design only)

Pixel Brain produces **perfectly branded visual assets**.

### Inputs

- Brand Brain constraints
- Creative Layer outputs (copy + structure)
- Channel requirements (dimensions, safe zones)
- Templates + Design System tokens
- Asset history (what performed)

### Outputs

- Rendered assets (images, carousels, HTML email blocks)
- Asset manifest with provenance
- Preview URLs for customer review

### Position in architecture

```text
Creative Layer → copy/structure
       │
       ▼
Pixel Brain (Creative execution specialist)
       │
       ▼
Validation Layer → brand + channel compliance
       │
       ▼
Execution Layer → upload/publish via Tools
```

Pixel Brain is a **specialist Brain** using Creative + Validation Layers internally, not a replacement for Marketing Brain.

---

## Task 9 — Future Performance Brain (design only)

Performance Brain **learns continuously** and feeds Memory — it does not replace Strategy.

### Inputs (from Tools + Memory)

- CTR, CPC, CPA, ROAS, conversions
- Organic engagement
- Customer behaviour signals
- Campaign history
- Channel-level breakdowns

### Outputs

- `PerformanceInsight` entities → Memory
- `RecommendationSignal` (not auto-apply) → Strategy/Planning consult
- Anomaly flags → Orchestration (customer attention)

### Loop

```text
Execution Layer → external platforms
        │
        ▼
Performance Brain ingests metrics
        │
        ▼
Memory Layer writes PerformanceEntity
        │
        ▼
Strategy Layer (future episodes) consults Performance Brain
```

**Principle:** Performance informs; Strategy decides. No fake metrics in UI (Constitution law).

---

## Task 10 — Phased roadmap

### Sprint 8 — PROJECT Brain Foundation (architecture → spine)

**Goal:** Formalize architecture without breaking Sprint 7.6.

| Deliverable | Description |
|-------------|-------------|
| Architecture docs | This blueprint + Layer interfaces (TypeScript types only) |
| Layer registry | Platform Layer definitions, Handover Envelope types |
| Brain registry | Marketing Brain config as first entry |
| Context Engine 2.0 spec | Slice loader plan, snapshot evolution |
| Orchestration alignment | Map orchestrator → Orchestration Layer concept |
| Memory schema spec | Entity types, namespaces, invalidation |
| BCP spec | ConsultRequest/Response schemas |
| No UI changes | Vision v13 frozen |
| No behaviour regression | Sprint 7.6 tests remain green |

### Sprint 9 — Memory + Context Engine 2.0 (implementation)

**Goal:** Durable Memory graph + richer Context assembly.

- Memory Layer implementation (Supabase graph tables)
- Context Engine 2.0 parallel loaders
- Decision entity persistence
- Invalidation pipeline wired to capability cache
- Marketing Brain reads/writes Memory through Layer API
- Brand Brain read stub (constraints from existing brand data)

### Sprint 10 — Layer extraction (Marketing)

**Goal:** Refactor Sprint 7.6 capabilities into explicit Layers.

- Extract Research, Understanding, Strategy, Planning, Creative, Validation as Layer modules
- Capabilities move under Layers unchanged behaviour-first
- Handover Envelopes between Layers
- Brain Orchestrator replaces ad-hoc workflow routing
- Work page buckets driven by Orchestration Layer truth

### Sprint 11 — Brain communication + specialist Brains

**Goal:** Multi-Brain consultation + first specialists.

- BCP implementation (Marketing ↔ Sales ↔ Analytics consult)
- Analytics Brain MVP (ingest + Memory write)
- Brand Brain MVP (constraint API for Creative Layer)
- Performance feedback loop into Strategy consult
- Pixel Brain design spike → Sprint 12 implementation

### Beyond Sprint 11

| Brain | Priority rationale |
|-------|-------------------|
| Sales Brain | Pipeline fit consultations |
| Support Brain | Voice of customer → Understanding |
| Planner Brain | Cross-functional scheduling |
| CEO Brain | Multi-Brain episode orchestration |
| Finance / HR / Recruitment / Reception | Domain expansion |

---

## Relationship to existing code (migration, not rewrite)

| Existing | Future role |
|----------|-------------|
| `lib/brain/capabilities/` | Capabilities inside Layers |
| `lib/brain/runtime/` | Capability execution engine |
| `lib/brain/context/snapshot.ts` | Context Engine 2.0 output |
| `lib/context-engine/` | Context Engine 2.0 host |
| `lib/office/campaign/campaign-intelligence-orchestrator.ts` | Orchestration Layer (Marketing) |
| `lib/office/campaign/campaign-lifecycle.ts` | Orchestration + Memory truth |
| `lib/marketing-workspace/` | Persistence adapter (preserve) |
| `lib/marketing-intelligence/` | Legacy gen paths (preserve until Layer migration) |

**Rule:** Strangler pattern — new Layers wrap existing capabilities; behaviour preserved until parity tests pass.

---

## Approval gate

This document is **architecture only**. No implementation proceeds until:

1. Product review (Constitution + Product Bible alignment)
2. UX confirmation (no Vision v13 change in Sprint 8)
3. Engineering review (Layer interfaces + migration plan)
4. Explicit approval to begin Sprint 8 Phase 2 (types + registry scaffolding)

---

*Chief Architect note:* Optimize for a five-year platform. Layers stay stable; Brains multiply; Capabilities version; Tools connect the real world; Memory compounds; Context stays truthful.
