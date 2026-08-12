# Autonomous Marketing Peer v1 (PX-47)

## Purpose

PX-47 proves the first **end-to-end autonomous Marketing Peer episode** without manual wiring between individual Brains. It is **integration glue only** — not a new Brain, not a second lifecycle engine, and not a UI redesign.

## Why integration, not another Brain

All Brains (Company → Learning) already exist with frozen ownership boundaries. PX-47 adds `lib/brain/project-runtime/` to:

1. Follow **Project Engine** evaluation as the sole lifecycle authority
2. Resolve registered Brain contracts from **ProjectBrainRegistry**
3. Assemble canonical **context handoffs** between Brain outputs
4. Persist **artifact references**, approvals, observations, and events
5. Pause/resume on context gaps, approvals, and outcome waits

## End-to-end lifecycle

```
Company → Research → Reasoning → Marketing Intelligence → Strategy
  → Planning → Creative → Validation → Memory (CP1)
  → Approval → Execution → Monitoring → Performance observations
  → Learning → Memory (CP2) → Complete
```

Project 2 for the same organization retrieves **prior Memory** assembled into downstream Brain context (e.g. Strategy).

## ProjectEpisodeRunner

`ProjectEpisodeRunner` (`project-episode-runner.ts`):

- Loads/creates `ProjectEpisodeRecord`
- Calls `evaluateProjectEpisode()` — never hardcodes Brain order
- Executes the Brain returned by evaluation via registry
- Persists output refs, resolved graph cache, events
- Pauses on `waiting_for_context`, `waiting_for_approval`, `waiting_for_outcomes`
- Supports `resumeEpisode()` after approval or observation ingestion

Runner flags (not a second state machine): `memoryCheckpoint1Complete`, `memoryCheckpoint2Complete`, `validationApprovalPending`, `performanceObservationsAvailable`, `approvalGrantedForExecution`.

## Project Engine relationship

Project Engine remains authoritative for lifecycle states. The runner:

- Calls `advanceProjectEpisode()` after each Brain result
- Defers **validation approval** until after Memory CP1
- Ignores non-gated Brain approval signals (e.g. Reasoning escalations)
- Transitions `monitoring → learning` after Learning completes so Memory CP2 can run

## Brain registry

Uses `createDefaultProjectBrainRegistry()` — no hardcoded Brain implementations in the runner.

## Context handoffs

`brain-context-handoff.ts` maps upstream resolved graphs to downstream payloads:

| Downstream | Upstream inputs |
|---|---|
| Research | CompanyGraph |
| Reasoning | Company + Research |
| Marketing Intelligence | Company + Research + Reasoning + selectedChannels |
| Strategy | Full research phase + MI strategyInputs |
| Planning | StrategyBrainGraph |
| Creative | Planning + Strategy + MI + Research + Reasoning |
| Validation | CreativeGraph |
| Memory CP1 | Creative + Validation |
| Execution | Creative + Validation + approvalGranted |
| Learning | Performance observations + full upstream graphs |
| Memory CP2 | Learning proposals + prior memories |

## Artifact references

`ProjectBrainArtifacts` stores output refs only. `brain-output-resolver.ts` resolves full graphs from layer repositories. `ProjectEpisodeRecord.resolvedGraphs` caches in-episode graphs for reliable handoffs.

## Approval pause / resume

- `submitProjectApproval()` persists decisions and sets `approvalGrantedForExecution` for campaign/publication gates
- `pauseEpisode()` creates a fresh `approvalCheckpoint` when prior checkpoints are satisfied
- `resumeEpisode()` advances Project Engine state on approval before continuing

## Memory checkpoint 1

After Validation completes, Memory Brain runs **before** campaign approval. Validation `requiresApproval` is deferred so CP1 always executes first.

## Execution

Execution Brain runs with stub providers only. Receipts persist via Execution repository. Requires `approvalGrantedForExecution`.

## Performance observation ingestion

`ingestPerformanceObservations()` validates and persists fixture/test observations. No live analytics.

## Monitoring wait

After Execution, project enters `monitoring`. Learning does **not** run until observations are ingested. Runner returns `waiting_for_outcomes`.

## Learning

Learning Brain runs after observations are available. It returns `MemoryWriteProposal[]` only — **never writes Memory directly**.

## Learning → Memory handoff

`learning-memory-handoff.ts` extracts proposals from `LearningBrainGraph`. Memory CP2 consumes `learningProposals` on `MemoryBrainInput`. Memory Brain applies its quality gate (store / merge / reinforce / skip).

## Memory checkpoint 2

After Learning, Memory Brain second-pass stores performance, creative, channel, and validation learnings when quality rules allow.

## Second-project Memory proof

End-to-end test runs Project 1 to completion, then verifies Project 2 `resolveBrainOutputs().priorMemories` and Strategy payload include Project 1 learning (e.g. proof-led messaging pattern).

## Event stream

`project-event-stream.ts` aggregates lifecycle events: `project_started`, brain completions, `memory_checkpoint_completed`, `waiting_for_approval`, `approval_received`, `execution_completed`, `waiting_for_outcomes`, `learning_completed`, `memory_updated`, `project_completed`.

## Failure / retry / resume

Brain failures set `episodeStatus: failed` with `lastError`. Prior Brain output refs and resolved graphs are preserved. Idempotency keys prevent duplicate Brain runs on resume.

## Idempotency

`executedBrainKeys` tracks `{correlationId}:{brainId}:{state}`. Completed Brains are not re-run unless invalidated.

## Invalidation

Uses existing Project Engine / Brain invalidation — no second invalidation graph in the runner.

## Observability

Each episode exposes: `episodeId`, `organizationId`, `projectId`, `correlationId`, snapshot state, artifact refs, event count, approval/observation flags, `lastError`.

## Persistence boundaries

PX-47 uses **in-memory repositories** for integration tests. Clean repository interfaces allow PX-48 to swap durable Supabase stores without changing runner logic.

## Out of scope (PX-47)

- Supabase persistence (PX-48)
- Real context acquisition / website gaps UI (PX-49)
- Live provider APIs / n8n (PX-50)
- UI redesign
- New Brains or lifecycle state machines

## Fixture

`fixtures/marketing-peer-fixture.ts` — deterministic B2B LeadFlow Services project with demo org, website, channels, performance observations, and execution stubs.
