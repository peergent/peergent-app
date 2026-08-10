# Creative Brain

**Status:** PX-35 — Architecture implemented  
**Authority:** [PROJECT_BRAIN_FOUNDATION.md](./PROJECT_BRAIN_FOUNDATION.md), [PROJECT_ENGINE.md](./PROJECT_ENGINE.md), [BRAIN_OUTPUT_LAYER.md](./BRAIN_OUTPUT_LAYER.md)

---

## Role

Creative Brain is **not** a copywriter, ChatGPT wrapper, or prompt shell.

It is a **senior marketing strategist** that transforms business understanding into structured campaign direction. It thinks before creating.

```text
Business + Brand + Website + Research + MI + Strategy + Planning + Decisions + Memory
                              ↓
                       Creative Brain
                              ↓
        Creative Direction · Campaign Concepts · Messaging · Channels · Deliverable Specs
                              ↓
                    Brain Output Layer (future wiring)
                              ↓
              Workspace / Campaign Experience (unchanged in PX-35)
```

**Never:** publish, execute, optimize.  
**Only:** create structured creative intelligence.

---

## How Creative Brain thinks

Seven sequential phases — never jump directly to writing:

| Phase | Question answered |
|-------|-------------------|
| 1. Understand business | What business reality must creative reflect? |
| 2. Understand audience | Who receives the message and what do they need? |
| 3. Find positioning | What angle and emotion is strongest? |
| 4. Generate campaign concepts | What campaigns should exist? |
| 5. Generate messaging | What should we communicate and why? |
| 6. Generate channel strategy | Which channels fit — organic and paid? |
| 7. Generate deliverables | What assets belong together? |

Each phase produces structured records in `CreativeGraph.phases` and reasoning steps in `CreativeGraph.reasoning`.

---

## Structured output

Creative Brain never returns plain text. All outputs are typed objects:

| Type | Purpose |
|------|---------|
| `CreativeCampaign` | Campaign concept — objective, audience, key message, emotional trigger, impact |
| `CreativeMessaging` | Headline, supporting message, CTA, proof, objections, trust builders |
| `CreativeChannelPlan` | Per-channel why, goal, audience, priority, organic/paid |
| `CreativeDeliverable` | Asset spec with headline/hook/CTA variations |
| `CreativeDecision` | Selected direction, discarded alternatives, business impact |
| `CreativeDirection` | Positioning angle and emotional trigger |
| `CreativeGraph` | Complete brain output — persisted and mapped to `BrainStructuredOutput` |

Discarded ideas and reasoning are stored for audit and future Learning Brain consumption.

---

## Module layout

| Module | Path |
|--------|------|
| Types | `lib/brain/layers/creative/types.ts` |
| Graph builder (7 phases) | `build-creative-graph.ts` |
| Layer | `creative-layer.ts` |
| Executor + contract | `creative-brain-executor.ts` |
| Repository | `creative-repository.ts` |
| Validator | `creative-validator.ts` |
| Output mapper | `map-creative-graph-to-output.ts` |
| Registry hook | `lib/brain/integration/creative-brain-registry.ts` |

---

## Project Engine integration

Creative Brain implements `ProjectBrainContract`:

```typescript
{
  id: "creative",
  capabilityIds: ["creative_generation"],
  requiredContextSlices: ["brand", "campaign"],
  execute(input: BrainInput): Promise<BrainResult>
}
```

- **Project Engine decides when** Creative Brain runs (`generating` state).
- **Creative Brain receives** `BrainContextPackage` assembled by the engine.
- **Creative Brain returns** `BrainResult` with `outputRef`, events, confidence, and `requiresApproval: true` (`deliverable_review`).

The Project Engine module is **not modified** in PX-35. Registration lives in `creative-brain-registry.ts`.

---

## Brain Output Layer consumption

Creative Brain does **not** write UI text. It publishes:

1. `BrainStructuredOutput` with JSON-serialized findings per concept, messaging, channel, deliverable
2. Optional `creativeGraph` on structured output (same extension pattern as `planningGraph`)
3. `BrainEvent[]` per thinking phase for activity/timeline

Future wiring (not PX-35):

```text
CreativeGraph → Brain Output Layer publishers → Executive Summary, Brief, Assets, Progress, Activity
```

The Brain Output Layer module is **not modified** in PX-35.

---

## Persistence

`CreativeRepository` stores:

- Full `CreativeGraph`
- `outputRef` handle
- Campaign concepts, decisions, selected direction
- Discarded ideas, reasoning, confidence, estimated business impact

Default: `InMemoryCreativeRepository` with `getDefaultCreativeRepository()`.

---

## Future Brains extending this pattern

| Brain | Extends Creative Brain by… |
|-------|---------------------------|
| **Validation** | Consuming `CreativeGraph.deliverables` → `ValidationResult`; never regenerates creative |
| **Execution** | Consuming validated artifacts → `ExecutionRecord`; never strategizes |
| **Memory** | Committing approved creative decisions with provenance |
| **Learning** | Reading performance outcomes → updating future creative reasoning |

Each future Brain implements `ProjectBrainContract`, registers in `ProjectBrainRegistry`, and maps to `BrainStructuredOutput` via a dedicated layer under `lib/brain/layers/`.

---

## Public API

```typescript
import {
  createFromBrainInputs,
  creativeBrainContract,
  createDefaultProjectBrainRegistry,
  buildCreativeGraph,
  CreativeBrainExecutor,
} from "@/lib/brain";
```

---

## Out of scope (PX-35)

- Validation, Execution, Learning Brain
- UI changes (Home, Workspace, Campaign Experience)
- Project Engine modifications
- Brain Output Layer modifications
- LangGraph / workflow nodes
