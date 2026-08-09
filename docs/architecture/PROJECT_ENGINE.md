# Project Engine (Brain Orchestrator)

**Status:** PX-34 — Architecture implemented  
**Authority:** [PROJECT_BRAIN_FOUNDATION.md](./PROJECT_BRAIN_FOUNDATION.md), [BRAIN_OUTPUT_LAYER.md](./BRAIN_OUTPUT_LAYER.md)

---

## Problem

Peergent had Brains, a Brain Output Layer, Workspace, and Campaign Experience — but **nothing owned the lifecycle of a project**.

Brains could run. Output could be published. UI could render.  
No layer decided *which* Brain runs next, *when*, *why*, or *with what context*.

---

## Solution

The **Project Engine** (`lib/brain/project-engine/`) is the orchestrator for every project inside Peergent.

```text
User
  ↓
Project
  ↓
Project Engine          ← lib/brain/project-engine/  (THIS SPRINT)
  ↓
Project Brain / Specialist Brains
  ↓
Brain Output Layer      ← lib/brain/output/
  ↓
Workspace / Campaign Experience
```

**Rule:** The Project Engine **never generates content**. It only coordinates lifecycle, context, scheduling, approvals, and recovery.

---

## Responsibilities

| Owns | Never owns |
|------|------------|
| Project lifecycle state machine | Copywriting |
| Brain orchestration & scheduling | Strategy content |
| Context assembly & passing | Research findings |
| Execution order | Creative output |
| Waiting states | Validation verdicts |
| Approval gates | |
| Retries & recovery | |
| Project status & progress refs | |
| Brain events (source of truth) | |
| Project memory references | |

---

## Module layout

| Module | Purpose |
|--------|---------|
| `types.ts` | Core types: states, actions, snapshot, events |
| `brain-contract.ts` | Universal Brain plugin interface |
| `project-state.ts` | State definitions + valid transitions |
| `context-model.ts` | Context slices + assembly |
| `event-model.ts` | Engine events → activity/timeline |
| `approval-model.ts` | Approval gates & checkpoints |
| `persistence-model.ts` | Persisted record shape + trim limits |
| `stage-router.ts` | State ↔ Brain ↔ Capability ↔ legacy run stage |
| `create-snapshot.ts` | Snapshot factory |
| `evaluate-project.ts` | Pure evaluation — what should happen next |
| `advance-project.ts` | Apply brain results, approvals, publish signals |
| `map-from-campaign-run.ts` | Strangler bridge from `CampaignRunState` |

---

## State machine

Every project moves through canonical lifecycle states:

```text
CREATED
  ↓
COLLECTING_CONTEXT
  ↓
RESEARCHING
  ↓
STRATEGIZING
  ↓
PLANNING
  ↓
GENERATING
  ↓
VALIDATING
  ↓
WAITING_FOR_APPROVAL
  ↓
READY_TO_PUBLISH
  ↓
PUBLISHING
  ↓
MONITORING
  ↓
LEARNING
  ↓
COMPLETE
```

Each state in `PROJECT_STATE_DEFINITIONS` defines:

- **entry conditions** — required completed Brains
- **exit conditions** — valid next states (`PROJECT_STATE_TRANSITIONS`)
- **required Brain** — primary specialist while in state
- **possible next states** — including `failed` and approval branches

Terminal states: `complete`, `failed` (with retry/recover paths).

---

## Brain contract

Every Brain exposes the same interface. The engine knows **brainId** and **contract** — never implementation.

```typescript
BrainInput      // engine-assembled context + payload
BrainContext    // BrainContextPackage (slices, prior outputs, memory refs)
BrainOutput     // outputRef handle — full payload in brain persistence
BrainEvents     // BrainEvent[] during execution
BrainStatus     // queued | running | completed | failed | waiting_approval
BrainResult     // status + output + events + confidence + requiresApproval
ProjectBrainContract.execute()  // plugin entry point
```

Creative Brain (PX-35) will be the first Brain wired through this contract.

---

## Context flow

Before each Brain run, the engine assembles a `BrainContextPackage`:

| Slice | Source |
|-------|--------|
| Business | Company profile |
| Brand | Brand Brain memory |
| Website | Website snapshot |
| Products | Catalog / project |
| Competitors | Research graph |
| Goals | Project intent |
| Campaign | Campaign entity |
| Prior outputs | Completed brains in episode |
| Decisions | `decisionIds` from prior runs |
| Memory | Entity refs |

`assembleBrainContext()` builds the package. `contextSatisfiedForBrain()` gates scheduling.

---

## Events

Every Brain and state transition publishes `ProjectEngineEvent` records:

- `project_created`, `context_ready`
- `brain_started`, `brain_completed`, `brain_failed`
- `approval_required`, `approval_granted`
- `publish_started`, `publish_completed`
- `learning_updated`, `project_completed`

These events are the **source of truth** for:

- Live Activity (via Brain Output Layer mappers)
- Timeline
- Progress narrative
- Future notifications

The Brain Output Layer **projects** engine events into customer-safe `LiveActivityEvent` and `ProgressNarrative` — it does not own orchestration.

---

## Approval model

Approval gates (`APPROVAL_GATE_DEFINITIONS`) attach to Brain completions:

| Gate | Typical trigger |
|------|-----------------|
| `strategy_review` | Strategy Brain |
| `channel_review` | Planning Brain |
| `deliverable_review` | Creative Brain |
| `campaign_approval` | Validation Brain |
| `publication_confirm` | Pre-publish |

When `BrainResult.requiresApproval` is true, the engine transitions to `waiting_for_approval` and creates an `ApprovalCheckpoint`. Advancement requires `approvalSatisfied: true`.

---

## Persistence model

`PersistedProjectEngineRecord` stores:

- Current state & active Brain
- Completed / pending Brains
- Brain history (`BrainExecutionRecord[]`)
- Decision history (`decisionIds`)
- Event log (trimmed to `MAX_EVENT_LOG_ENTRIES`)
- Retry counts per Brain
- Approval checkpoints

Repository contract: `ProjectEngineRepository` — implementation deferred to integration sprint. In-memory adapter shape defined in `persistence-model.ts`.

---

## Evaluation vs advancement

| Function | Role |
|----------|------|
| `evaluateProjectEpisode()` | Pure — given snapshot + signals, returns next `ProjectEngineAction` |
| `advanceProjectEpisode()` | Mutates snapshot — applies brain results, approvals, publish |
| `projectEngineEvaluate()` | Alias for evaluate (read-only orchestration) |

This split keeps orchestration testable without side effects.

---

## Legacy bridge

Existing campaign execution uses `CampaignRunState` and `campaign-intelligence-orchestrator`.  
PX-34 does **not** replace them.

`projectSnapshotFromCampaignRun()` maps legacy run stages → engine states via `stage-router.ts`.  
Future integration: orchestrator becomes a thin projector over `evaluateProjectEpisode`.

---

## Integration with Brain Output Layer

```text
Project Engine events + brain history
        ↓
Brain Output Layer publishers (future wiring)
        ↓
lib/office/brain-output/ mappers
        ↓
Workspace / Campaign Experience (unchanged layout)
```

PX-33 established the output translation layer. PX-34 establishes orchestration truth.  
Wiring engine events into `publishActivityEvents` / `publishProgressNarrative` is a follow-up — not this sprint.

---

## Why this architecture scales

1. **Peer-agnostic** — `peerId` + `ProjectBrainRegistry` let Finance, Sales, or Support peers define their own Brain pipelines without forking orchestration.
2. **Brain-agnostic** — New Brains register via `ProjectBrainContract`; engine schedules by `brainId` only.
3. **Capability mapping** — `stage-router.ts` maps Brains → existing `BrainCapabilityId`s; no LangGraph or workflow nodes required.
4. **Pure evaluation** — State machine logic is deterministic and unit-testable.
5. **Strangler pattern** — Legacy run store bridges in; UI untouched until integration sprint.
6. **Separation of concerns** — Engine coordinates; Brains think; Output Layer translates; Office renders.

---

## Adding a new Brain

1. Implement `ProjectBrainContract` with `id`, `capabilityIds`, `requiredContextSlices`, `execute()`.
2. Register in `ProjectBrainRegistry`.
3. Add state mapping in `project-state.ts` if the Brain owns a lifecycle phase.
4. Add capability mapping in `stage-router.ts` (`BRAIN_TO_CAPABILITIES`).
5. Add approval gate in `approval-model.ts` if human review required.
6. Wire execution in integration layer (not engine) — engine only schedules.

---

## Out of scope (PX-34)

- Creative Brain execution (PX-35)
- LangGraph / workflow nodes
- UI changes (Home, Workspace, Campaign Experience)
- Replacing `campaign-intelligence-orchestrator`
- Live persistence repository implementation

---

## Public API

Exported from `@/lib/brain/project-engine` and `@/lib/brain`:

- `createProjectEngineSnapshot`, `evaluateProjectEpisode`, `advanceProjectEpisode`
- `assembleBrainContext`, `createProjectEngineEvent`
- `projectSnapshotFromCampaignRun`, `isEngineBlocked`
- All types listed in `lib/brain/project-engine/index.ts`
