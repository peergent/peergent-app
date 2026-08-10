# Memory Brain

**Status:** PX-37 — Architecture implemented  
**Authority:** [PROJECT_BRAIN_FOUNDATION.md](./PROJECT_BRAIN_FOUNDATION.md), [PROJECT_ENGINE.md](./PROJECT_ENGINE.md), [VALIDATION_BRAIN.md](./VALIDATION_BRAIN.md), [CREATIVE_BRAIN.md](./CREATIVE_BRAIN.md)

---

## Role

Memory Brain is **not** chat history and **not** a vector database wrapper.

It is the **organizational memory** of every customer. It decides what to remember, what to forget, what becomes long-term knowledge, and what should influence future decisions.

```text
Business + Brand + Research + MI + Strategy + Planning + CreativeGraph + ValidationGraph
                              ↓
                         Memory Brain
                              ↓
     MemoryGraph · MemoryRecord · MemoryRelation · MemoryDecision · MemoryEvolution
                              ↓
              Future: Creative · Strategy · Research · Learning · Execution Brains
```

**Never:** generate content, validate, or optimize.  
**Only:** learn and remember structured organizational knowledge.

---

## Memory domains

Memory Brain stores knowledge in nine independent domains:

| Domain | Contents |
|--------|----------|
| Business Memory | Products, services, USPs, markets, goals |
| Brand Memory | Tone, style, visual identity, approved/forbidden claims |
| Audience Memory | ICP, personas, pain points, objections, FAQs |
| Competitive Memory | Competitors, positioning, differentiators |
| Creative Memory | Winning concepts, headlines, hooks, rejected ideas |
| Validation Memory | Approved/rejected assets, warnings, recurring issues |
| Execution Memory | Published campaigns, schedules, channel history (future) |
| Performance Memory | CTR, ROAS, conversion, engagement (future) |
| Learning Memory | Patterns, lessons, hypotheses, best practices |

---

## Memory object

Every `MemoryRecord` contains:

| Field | Purpose |
|-------|---------|
| `id` | Stable memory identifier |
| `category` | Domain (`business_memory`, etc.) |
| `title` / `description` | Human-readable knowledge |
| `source` | Origin brain (`strategy`, `creative`, `validation`, …) |
| `confidence` | `low` \| `medium` \| `high` |
| `importance` | `low` \| `medium` \| `high` \| `critical` |
| `createdAt` / `updatedAt` | Freshness tracking |
| `expiresAt` | Optional TTL for temporary memories |
| `evidence` | Traceable proof from upstream brains |
| `relatedCampaigns` / `relatedDecisions` / `relatedAssets` | Cross-references |
| `tags` | Retrieval and grouping |
| `mergeKey` | Deduplication key |
| `lifecycle` | `active` \| `archived` \| `expired` |

---

## Memory graph

The `MemoryGraph` layers domains in organizational order:

```text
Business → Brand → Audience → Competitors → Creative → Validation → Execution → Performance → Lessons
```

Each layer is a `MemoryNode` referencing memory IDs in that domain. `MemoryRelation` links related memories (e.g. creative concept `derived_from` validation approval).

---

## Quality decisions

Memory Brain does **not** store everything. For each candidate memory, `decideMemoryAction` returns:

| Action | When |
|--------|------|
| `store_permanent` | High confidence, critical importance, or blocking validation issue |
| `store_temporary` | Low confidence — expires in 90 days |
| `merge` | Duplicate or near-duplicate (75% title similarity or exact merge key) |
| `skip` | Low confidence + low importance |
| `archive` / `forget` | Reserved for future lifecycle management |

Every decision is recorded in `MemoryDecision` with reason and target memory.

---

## Persistence

| Component | Role |
|-----------|------|
| `MemoryRepository` | Org-level store interface |
| `InMemoryMemoryRepository` | Default in-process persistence |
| `MemorySnapshot` | Point-in-time campaign memory commit |
| `MemoryEvolutionEntry` | Audit trail of merge/update actions |
| `MemoryIndexer` | Category, tag, and campaign indexes |
| `MemoryRetriever` | Scope-based query engine |

Output ref format: `memory:{organizationId}:{campaignId}:{createdAt}`

---

## Retrieval

`MemoryRetriever` exposes scoped queries:

| Scope | Returns |
|-------|---------|
| `business` | Business memory |
| `brand` | Brand memory |
| `campaign` | Creative + validation + execution |
| `creative` | Creative memory |
| `performance` | Performance memory |
| `learning` | Learning memory |
| `context` | Cross-domain context bundle |
| `recent` | Sorted by `updatedAt` |
| `relevant` | Scored by confidence, campaign match, tags, importance |

Memory is retrievable by **relevance**, not only recency.

---

## Project Engine integration

Memory Brain implements `ProjectBrainContract`:

- `id`: `"memory"`
- `capabilityIds`: `["memory"]`
- `requiredContextSlices`: `["business"]`

Project Engine schedules Memory Brain after customer approval, publication, validation, or meaningful learning events. Memory Brain never decides execution timing.

Registered in `createDefaultProjectBrainRegistry()` alongside Creative and Validation brains.

---

## Brain Output Layer

Memory Brain does **not** write UI text. It publishes structured memory via `MemoryPublisher` for future consumers:

- Historical insights
- Past campaign summaries
- Business / brand / creative evolution
- Recurring risks and strengths

`BrainStructuredOutput.memoryGraph` carries the full graph for downstream wiring (not connected in PX-37).

---

## Upstream consumption

Memory Brain receives structured output from:

- Research, Marketing Intelligence, Strategy, Planning
- CreativeGraph, ValidationGraph
- Approval decisions
- (Future) Execution, Performance, Customer feedback

---

## Downstream consumption (future)

| Brain | Uses Memory for |
|-------|-----------------|
| Creative Brain | Winning hooks, rejected concepts, brand rules |
| Strategy Brain | Business goals, positioning, audience |
| Research Brain | Prior findings before re-crawling |
| Validation Brain | Recurring issues, approved claims |
| Learning Brain | Pattern updates |
| Execution Brain | Publication history, schedules |

---

## File layout

```text
lib/brain/layers/memory/
├── types.ts                  # MemoryRecord, MemoryGraph, MemoryQuery, …
├── modules/specs.ts          # Nine domain specs + layer order
├── build-memory-graph.ts     # Extraction + graph assembly
├── merge-strategy.ts         # Dedupe, merge, quality decisions
├── memory-indexer.ts         # Index builder
├── memory-retriever.ts       # Scoped retrieval
├── memory-validator.ts       # Graph validation + quality score
├── memory-repository.ts      # Persistence
├── memory-layer.ts           # Layer orchestration
├── memory-publisher.ts       # Structured publish payload
├── memory-brain-executor.ts  # ProjectBrainContract
├── map-memory-graph-to-output.ts
└── index.ts
```

---

## Constraints (PX-37)

- No UI changes
- No Project Engine modifications
- No Brain Output Layer wiring
- No Creative Brain or Validation Brain modifications
- No Execution Brain or Learning Brain
