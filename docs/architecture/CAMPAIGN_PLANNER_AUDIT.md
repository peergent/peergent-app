# Campaign Planner — Architecture Audit (Sprint 16)

**Status:** Audit only — no production code changes in this sprint.  
**Date:** 2026-07-26  
**Scope:** How a Marketing Peer should **deterministically** turn a Campaign into **executable work** (WHAT to do), without generating AI content.

**Related code:** `lib/campaign/`, `lib/marketing-intelligence/`, `lib/marketing-decision/`, `lib/creative-brief/`, `lib/peer-workflow/`, `lib/peer-experience/marketing/`, `hooks/useMarketingWorkspace.ts`, `lib/prompt-builder/`, `lib/ai-runtime/`.

**Companion doc:** `docs/architecture/CAMPAIGN_EXPERIENCE_AUDIT.md` (customer Campaign UI and persistence anchor).

---

## Executive summary

Today, **Campaign creation** (Create Campaign wizard) persists a **`MarketingProject`** with **`campaignSetup`** and **`origin: campaign_wizard`** but creates **no Work Units, no plan slice, and no drafts**. Executable work appears only through **separate paths**: delegation, responsibility “create project,” or manual assignment — each of which creates **`WorkUnit`(s)** and often triggers **AI strategy/plan/draft** generation.

The platform already has strong **deterministic assembly** layers (`assembleCampaign`, `assembleMarketingDecision`, `assembleCreativeBrief`) and a **universal Work Unit lifecycle** (`lib/peer-workflow/`). What is missing is a **Campaign-scoped planning step** that bridges “customer defined campaign” → **ordered, policy-aware work packages** before any LLM runs.

**Recommendation:** Introduce a **pure Campaign Planner** under **`lib/campaign/planner/`** that outputs a **`CampaignExecutionPlan`** (work packages + dependencies + effort + owners + approvals + execution order). **Do not** create content drafts or call AI inside the planner. **Instantiate** `WorkUnit` records in a separate, explicit **apply** step (future sprint), driven by planner output and existing `createWorkUnit` / `transitionWorkUnit`.

**Safest Action 1:** Add planner types, deterministic `planCampaignExecution()` with Vitest fixtures (wizard project + plan calendar + responsibilities), **zero** changes to `useMarketingWorkspace`, APIs, or generation pipelines.

---

## 1. Current flow: Campaign creation → content generation

### 1.1 End-to-end diagram (Marketing Peer today)

```mermaid
flowchart TD
  subgraph customer
    W[Create Campaign wizard]
    D[Delegation / chat task]
    R[Approve responsibility plan]
    M[Manual New project / content]
  end

  subgraph session_workspace["Session workspace (sessionStorage)"]
    P[MarketingProject[]]
    WU[WorkUnit[]]
    STR[MarketingStrategy]
    PLN[MarketingPlan]
    DR[MarketingContentDraft[]]
  end

  subgraph deterministic["Deterministic domain (no LLM)"]
    AC[assembleCampaign]
    AMD[assembleMarketingDecision]
    ACB[assembleCreativeBrief]
    VMs[Campaign / project view-models]
  end

  subgraph ai["AI pipeline (LLM)"]
    GS[generateMarketingStrategy]
    GP[generateMarketingPlan]
    GD[generateMarketingContentDraft]
    PB[buildPrompt]
    RT[ai-runtime.execute]
  end

  W -->|createMarketingCampaignProject| P
  W -.->|no work units| WU

  D -->|createMarketingProject + createWorkUnit| P
  D --> WU
  D --> GS --> STR
  D --> GP --> PLN
  D --> GD --> DR
  GD --> AMD --> ACB
  GD --> PB --> RT

  R -->|createMarketingProject + createWorkUnit| P
  R --> WU

  M --> P
  M --> WU
  M --> GD

  P --> AC
  STR --> AC
  PLN --> AC
  WU --> VMs
  DR --> VMs
  AC --> VMs

  PLN --> GD
  STR --> GP
```

### 1.2 Path A — Create Campaign wizard (Sprint 15)

| Step | What happens | Work created? | AI? |
|------|----------------|---------------|-----|
| User submits wizard | `handleCreateCampaign` → `createMarketingCampaignProject` | **Project only** (`campaignSetup`, `origin: campaign_wizard`) | **No** |
| Navigation | `/team/[peerId]/projects/[projectId]` → Campaign Experience (flag + origin) | — | — |
| Campaign read model | `assembleCampaignForMarketingProject(project, source)` in view-models | — | **No** (deterministic) |

**Gap:** Wizard campaigns have **no automatic link** to peer-level `strategy` / `plan` in sessionStorage, no scoped plan activities, and **no Work Units**. “Next action” in UI is derived from project status (typically planning with 0% progress).

### 1.3 Path B — Delegation (`handleExecuteDelegation`)

| Step | What happens | Work created? | AI? |
|------|----------------|---------------|-----|
| Task accepted | `createMarketingProject` + `createWorkUnit` (→ `understanding`) | **Project + Work Unit** | — |
| Strategy missing | `generateMarketingStrategy` (API → `buildPrompt` → `ai-runtime`) | Updates **peer-level** `strategy` | **Yes** |
| Plan missing | `generateMarketingPlan` | Updates **peer-level** `plan` | **Yes** |
| Match calendar | `findPlanActivityForDelegation` → set `planActivityReference` on unit | — | — |
| Content | `handleGenerateDraftWithHint` / generation path | **Draft** + `draftId` on unit | **Yes** |

Work Units are the **execution handle**; drafts attach via `draftId` or `planActivityReference`.

### 1.4 Path C — Responsibility plan approval

| Step | What happens | Work created? | AI? |
|------|----------------|---------------|-----|
| `evaluateResponsibility` | May return `action: create_project` + `proposedProject` | — | **No** |
| `handleApproveResponsibilityPlan` | `createMarketingProject` (`origin: responsibility`) + `createWorkUnit` (→ `planning`) | **Project + Work Unit** | Optional follow-on generation (not automatic in all cases) |

Planning items come from evaluation engine + plan calendar gaps — **not** from Campaign domain.

### 1.5 Path D — Content draft without new project

| Step | What happens | Work created? | AI? |
|------|----------------|---------------|-----|
| User picks plan activity | `handleGenerateDraft(planActivityReference)` | **Draft** only (links to **active** work unit if set) | **Yes** |
| Server path | `generateMarketingContentDraft` | — | **Yes** |
| Pre-LLM policy | `assembleMarketingDecision` → optional `assembleCreativeBrief` | **Decision + Brief records in-memory** for prompt enrichment | **No** (deterministic) |

Decision and brief are **per content execution**, not per campaign wizard record.

### 1.6 Campaign assembler vs execution

`assembleCampaign` (`lib/campaign/assemble-campaign.ts`) merges strategy, plan, decisions (refs), workforce, timeline, approval mode into a **read-only `Campaign`**. It does **not** schedule work or mutate workspace state. Customer detail VMs (`buildMarketingCampaignDetailViewModel`) project deliverables from **existing** work units and drafts.

---

## 2. Where work is currently created

| Location | Trigger | Creates | Does not create |
|----------|---------|---------|-----------------|
| `project-engine.ts` | Wizard / manual / responsibility inputs | `MarketingProject` | Work units, drafts |
| `work-unit-engine.ts` `createWorkUnit` | Delegation, responsibility approval, some task handlers | `WorkUnit` (`requested` → transitions) | Project (caller creates project first) |
| `useMarketingWorkspace.ts` | `handleExecuteDelegation`, `handleApproveResponsibilityPlan`, work task actions | Projects + units + automations | Campaign entity in storage |
| `useMarketingWorkspace.ts` | `handleGenerateDraft*` | `MarketingContentDraft` | Work unit (updates existing) |
| `sync-work-units.ts` | Hook sync effect | Updates unit **lifecycle** from generating + draft status | New units |
| `evaluation-engine.ts` | Responsibility evaluation | **Proposed** project spec only | Persistence (caller applies) |

**No single module** today answers: “Given this **campaign_wizard** project and peer context, what **ordered work** should exist?”

---

## 3. Work Units — existence and meaning

### 3.1 Definition

`WorkUnit` (`lib/peer-workflow/work-unit.ts`) is the **universal execution atom** for all peer roles:

- **Customer anchor:** optional `projectId` → `MarketingProject`
- **Shape of work:** `deliverableKind`, `channel`, `objective`, `audience`, `needsVisual`, `recurrence`
- **Plan link:** `planActivityReference` (matches `MarketingPlan.contentCalendar[].title`)
- **Output link:** `draftId` → `MarketingContentDraft`
- **Lifecycle:** `WorkLifecycleStage` + `eventLog` (requested → understanding → … → published / monitoring)

### 3.2 What they represent for customers

Project experience (`buildProjectExperience`) **translates** units into steps, timeline, and “what happens next” — customers see **phases and activity**, not “WorkUnit” labels (Campaign Experience avoids the term).

### 3.3 Current population

- **Wizard campaigns:** typically **zero** units.
- **Delegation / responsibility / manual:** one or more units per project.
- **Peer-level plan/strategy:** shared across projects — not partitioned by `MarketingProject.id` except via unit `planActivityReference` and implicit channel matching.

---

## 4. Information already available for planning

| Source | Location | Useful for planner |
|--------|----------|-------------------|
| **Campaign (assembled)** | `assembleCampaign` / `assembleCampaignForMarketingProject` | Goal, audience, channels, timeline, approval mode, workforce roles, status |
| **MarketingProject** | sessionStorage | Title, goal, `campaignType`, `campaignSetup` (dates, budget, audience, approval mode, primary goal id), `responsibilityId`, `origin` |
| **MarketingStrategy** | sessionStorage / API | Audiences, positioning, pillars, channel ideas, confidence |
| **MarketingPlan** | sessionStorage / API | `contentCalendar`, `planned campaigns`, dependencies, objectives, priorities, effort/impact on activities |
| **MarketingDecision** | Assembled on demand | Eligibility, approval/budget policy, channel/content type rankings, creative volume bounds, constraints |
| **Creative Brief** | Assembled on demand (from decision + activity) | Per-piece creative constraints — **downstream of a specific work package** |
| **Responsibilities** | sessionStorage | Category, autonomy, approval policy, guardrails, enabled state |
| **Integrations** | localStorage connections | Blockers for paid/social channels |
| **WorkUnit[] / drafts** | sessionStorage | Existing execution — planner must **merge**, not duplicate |

### 4.1 Strong deterministic primitives already tested

- Campaign status precedence (`deriveCampaignStatus`)
- Decision evidence and recommendation status enums
- Plan activity draftability (`isDraftablePlanActivity`, readiness assessors)
- Project status/progress derivation from units + drafts
- Responsibility evaluation (gaps, integration blockers, calendar gap heuristics)

---

## 5. Information still missing

| Gap | Impact on planner |
|-----|-------------------|
| **Campaign ↔ plan scope** | No first-class “these calendar rows belong to project X” — only peer-global plan |
| **Persisted Campaign entity** | Assembler input is projected from project + peer state; no versioned campaign plan artifact |
| **Explicit dependencies per project** | Plan has `dependencies[]` but not mapped to project or wizard setup |
| **Channel selection from wizard** | Wizard captures goal/audience/dates/budget; **does not** pick channels → planner must infer from `campaignType` + strategy + responsibilities |
| **Workforce peer assignments** | Campaign workforce is role labels; only some paths set `peerId` on assignments |
| **Deliverable catalog** | No domain list of non-content work (e.g. “setup tracking,” “configure ads account”) — only content calendar types |
| **Execution state machine for “plan approved”** | No customer gate between “campaign defined” and “start execution” |
| **Idempotent replan** | No rules for updating packages when plan/strategy changes after units exist |

These gaps should be **inputs or explicit warnings** in v1 planner output, not silent guesses.

---

## 6. What should the Campaign Planner create?

| Artifact | Planner creates? | Rationale |
|----------|------------------|-----------|
| **AI content / copy** | **Never** | Owned by `generateMarketingContentDraft` + `ai-runtime` |
| **MarketingContentDraft** | **No** (v1) | Drafts are **outputs** of generation; planner only references **future** draft slots |
| **CreativeBrief (assembled)** | **Optional per package, not required v1** | Brief assembly is cheap and deterministic but **piece-scoped**; planner can emit **`briefPlanRef`** (activity + content type) for later `assembleCreativeBrief` at generation time |
| **MarketingDecisionRecord** | **No** (reuse at execution) | Decision depends on activity-level context; planner uses **policy snapshots** from responsibilities + campaign approval mode |
| **Peer-level MarketingPlan** | **No** | Plan remains intelligence output; planner **selects/subsets** activities |
| **Work Units** | **Not inside planner pure function** | Planner emits **`CampaignWorkPackage`** specs; **applier** creates `WorkUnit` via `createWorkUnit` (separation of plan vs side effects) |
| **CampaignExecutionPlan** | **Yes — primary output** | Ordered packages, dependencies, effort, owner, approvals, execution order |

### 6.1 Recommended answer to “create all three?”

**Create a Plan (execution plan), then instantiate Work Units from it.** Do **not** create deliverables (drafts) inside planning. Treat **deliverables** as customer language for **planned outputs** (`PlannedDeliverable` descriptors linked to packages), not `MarketingContentDraft` rows.

Creative briefs remain **execution-time** assembly when a package moves to “ready to generate,” unless a future sprint adds **brief stubs** as package metadata only (IDs/refs, no LLM).

---

## 7. Ownership boundaries and module placement

### 7.1 Layering (target)

```
Customer UI (features/marketing-workspace)
    ↓ consumes
Peer experience view-models (lib/peer-experience/marketing/view-models)
    ↓ consumes
Campaign Planner (NEW) + Campaign assembler (existing)
    ↓ reads
Marketing intelligence (strategy/plan types)
Marketing decision + creative brief (policy + creative constraints at execution)
Peer workflow (WorkUnit lifecycle)
    ↓
Workspace hook / persistence (side effects — not in planner)
```

### 7.2 Module location options

| Option | Pros | Cons |
|--------|------|------|
| **`lib/campaign-planner/`** (top-level sibling) | Visible in repo search | Splits campaign cohesion; duplicates “campaign” boundary already in `lib/campaign/ownership.ts` |
| **`lib/campaign/planner/`** ✅ | Campaign coordinates work; matches `assemble-campaign` ownership; clear that planner **does not** own intelligence or LLM | Marketing-specific inputs in v1 |
| **`lib/peer-experience/marketing/planner/`** | Close to workspace | Wrong layer — mixes UI-adjacent code with domain; hard for Sales/Support reuse |
| **`lib/peer-workflow/planner/`** | Universal work packages | v1 inputs are marketing-heavy (plan calendar, decision); premature abstraction |

### 7.3 Recommendation

**Use `lib/campaign/planner/`** for Marketing Campaign Planner v1:

- Aligns with **`CAMPAIGN_EXCLUDED_CONCERNS`** (planner must not import `aiRuntime`, `promptBuilder`, or embed brief bodies).
- Export types from `lib/campaign/planner/types.ts` and `plan-campaign-execution.ts` (pure function).
- When Sales/Support need equivalents, extract **peer-neutral** `WorkPackage` / `ExecutionPlan` types into `lib/peer-workflow/planning/` and keep **domain-specific mappers** in `lib/campaign/planner/` and future `lib/sales/planner/` etc.

**Marketing Decision** stays **`lib/marketing-decision/`** — planner **reads** responsibility + campaign approval mode; does not fork decision logic.

**Creative Brief** stays **`lib/creative-brief/`** — planner may list **`contentType` + `planActivityReference`** per package; brief assembly stays at generation boundary.

**Work Unit creation** stays **`lib/peer-workflow/work-unit-engine.ts`** — invoked only from an **`applyCampaignExecutionPlan`** adapter (future, not planner core).

---

## 8. Deterministic Campaign Planner design

### 8.1 Principles

- **Pure function:** same inputs → same output; no I/O, no React, no Supabase.
- **No LLM, no randomness, no clocks** in core (use injected `asOf` / `assembledAt` if needed).
- **Fail closed:** emit `blocked` packages with `blockedReasons` instead of inventing calendar rows.
- **Idempotent-friendly:** output includes stable **`packageKey`** derived from project id + plan activity title + channel.
- **Merge-aware:** accept existing `workUnits` and **skip or update** proposals for already-active units.

### 8.2 Inputs (`CampaignPlannerSource`)

| Field | Type | Role |
|-------|------|------|
| `organizationId`, `peerId` | string | Scope |
| `project` | `MarketingProject` | Wizard/manual campaign anchor |
| `campaign` | `Campaign` | Assembled snapshot (from `assembleCampaignForMarketingProject` or stored source) |
| `strategy` | `MarketingStrategy \| null` | Audience/channel context |
| `plan` | `MarketingPlan \| null` | Calendar, dependencies, campaigns |
| `decisions` | `MarketingDecisionRecord[] \| undefined` | Optional precomputed policy (or planner calls `assembleMarketingDecision` per package in pure mode) |
| `responsibilities` | `MarketingResponsibility[]` | Owners, autonomy, approval policy, guardrails |
| `connections` | `IntegrationConnection[]` | Channel blockers |
| `existingWorkUnits` | `WorkUnit[]` | Dedup / merge |
| `existingDrafts` | `MarketingContentDraft[]` | Mark packages satisfied |
| `options` | `{ maxPackages?, includeNonDraftable? }` | Bounds |

### 8.3 Outputs (`CampaignExecutionPlan`)

| Field | Description |
|-------|-------------|
| `planId` | Stable id (`cep-${project.id}-v1`) |
| `campaignId` | `campaign.id` (aligned with project id when using projection) |
| `status` | `ready` \| `blocked` \| `partial` |
| `summary` | Customer-safe one line |
| `packages` | Ordered **`CampaignWorkPackage[]`** |
| `warnings` | Non-fatal gaps (e.g. no plan) |
| `blockedReasons` | Fatal blockers |

**`CampaignWorkPackage` fields (required):**

| Field | Description |
|-------|-------------|
| `id` / `packageKey` | Stable identifier |
| `sequence` | Execution order (integer) |
| `title` | Customer-safe label |
| `kind` | `content` \| `setup` \| `review` \| `publish` \| `monitor` (v1 mostly `content`) |
| `channel`, `deliverableKind` | Maps to `CreateWorkUnitInput` |
| `planActivityReference` | Nullable link to plan calendar title |
| `dependsOnPackageKeys` | Dependency edges (from plan `dependencies` + week ordering) |
| `estimatedEffort` | `low` \| `medium` \| `high` (from plan activity or default table) |
| `estimatedDurationMinutes` | Optional numeric hint (deterministic table, not AI) |
| `recommendedOwner` | `{ role: CampaignWorkerRole \| 'customer', responsibilityId?, peerId? }` |
| `approvalRequirements` | `{ mode, brandReviewRequired, legalReviewRequired }` from decision/responsibility/campaign setup |
| `executionPhase` | `plan` \| `create` \| `review` \| `publish` \| `measure` |
| `state` | `proposed` \| `already_exists` \| `blocked` |
| `workUnitId` | Set when merging existing unit |

### 8.4 Core algorithm (deterministic v1)

1. **Validate readiness** — If no `plan` and project `origin === campaign_wizard`, return `partial` with packages derived only from wizard (`campaignType` → template steps) or block with “Plan required.”
2. **Select activities** — Filter `plan.contentCalendar` by channel overlap with `campaign.execution.channels`, `project.campaignType`, and enabled responsibilities; respect `plan.dependencies`.
3. **Sort** — Primary: `scheduledWeek`; secondary: dependency topological order; tertiary: effort (low first) tie-break.
4. **Policy per package** — Merge `campaign.execution.approvalMode`, responsibility `approvalPolicy`, and optional `assembleMarketingDecision` for `{ channel, contentType }` if decision source can be built without LLM.
5. **Owner assignment** — Map channel → responsibility category; fallback role `content_creator` / Marketing peer.
6. **Merge** — Match existing units by `projectId` + `planActivityReference`; mark `already_exists`.
7. **Emit** — No mutation; return plan only.

### 8.5 Explicit non-goals (v1)

- Generating or rewriting `MarketingPlan` JSON.
- Calling `generateMarketingContentDraft`, `buildPrompt`, or `ai-runtime`.
- Persisting to sessionStorage or Supabase.

---

## 9. How the Marketing Peer should consume the planner

### 9.1 Read path (safe, no execution)

- **`buildMarketingCampaignDetailViewModel`** (or sibling) can call `planCampaignExecution` to populate:
  - **Overview:** count of proposed packages, blocked reasons
  - **Workforce activity:** map `recommendedOwner` → workforce section
  - **Next action:** first `proposed` package not blocked (customer label: “Start planning content for …” not “Create WorkUnit”)

Keep flags gated until UX is ready.

### 9.2 Write path (future sprint — not Sprint 16)

1. Customer action: **“Start campaign work”** / automatic after plan exists (product decision).
2. Hook loads planner source from workspace domain input.
3. `const executionPlan = planCampaignExecution(source)`.
4. If `status === ready`, **`applyCampaignExecutionPlan(executionPlan)`** (new adapter in `lib/peer-experience/marketing/` or `hooks/`):
   - For each `proposed` package: `createWorkUnit({ ... })`, `transitionWorkUnit` to `planning` or `requested`.
   - Log activity feed entries (customer-safe copy).
   - **Do not** call draft generation until user or autonomy policy triggers it.

### 9.3 Relationship to existing flows

- **Delegation** becomes a **shortcut** that creates one unit first, then AI — planner should eventually **align** delegation tasks with a package from the plan.
- **Responsibility approval** should prefer **packages from CampaignExecutionPlan** instead of ad hoc `proposedProject` when a campaign project exists.

---

## 10. Reuse pattern for Sales, Support, HR peers

| Layer | Reuse |
|-------|--------|
| **`WorkUnit` + lifecycle** | Already role-agnostic (`PeerWorkflowPeerRole`) |
| **`ExecutionPlan` / `WorkPackage` types** | Lift to `lib/peer-workflow/planning/` when second peer needs planning |
| **Domain planner** | `lib/{domain}/planner/` — e.g. Sales: `Opportunity` + playbook steps → packages |
| **Policy engine** | Marketing uses `MarketingDecision`; Sales might use `SalesDecision` — same **planner shape**, different policy assembler |
| **Intelligence inputs** | Peer-specific plan/strategy types; planner accepts **normalized `PlannedActivity` interface** |
| **Workspace hook** | Pattern: `planXExecution` → `applyXExecutionPlan` → existing unit engine |

Marketing proves the pattern: **deterministic plan → unit instantiation → optional AI at execution boundary**.

---

## 11. Safest first implementation action (Action 1)

**Do not touch production generation, hooks, APIs, or React.**

1. Add **`lib/campaign/planner/`** with:
   - `types.ts` — `CampaignPlannerSource`, `CampaignExecutionPlan`, `CampaignWorkPackage`
   - `plan-campaign-execution.ts` — pure `planCampaignExecution()`
   - `__tests__/plan-campaign-execution.test.ts` — fixtures:
     - Wizard project + null plan → `partial` / blocked with clear reasons
     - Wizard project + sample plan calendar → ordered packages, dependencies
     - Existing work unit merge → `already_exists`
     - Responsibility integration blocker → `blocked` package
2. Add **`docs/architecture/CAMPAIGN_PLANNER_AUDIT.md`** (this document).
3. Optional dev-only inspector (like marketing-decision inspector) — **only if** it lives under `lib/dev/` and is not routed to customers.

**Exit criteria for Action 1:** Tests pass; `npm run build` unchanged; no imports from planner into `useMarketingWorkspace` or API routes.

---

## Appendix A — Key file reference

| Concern | Path |
|---------|------|
| Campaign types / assembler | `lib/campaign/types/campaign.ts`, `lib/campaign/assemble-campaign.ts` |
| Campaign ownership | `lib/campaign/ownership.ts` |
| Project + wizard create | `lib/peer-experience/marketing/projects/project-engine.ts` |
| Campaign projection | `lib/peer-experience/marketing/view-models/build-project-campaign-projection.ts` |
| Work units | `lib/peer-workflow/work-unit.ts`, `work-unit-engine.ts` |
| Workspace orchestration | `hooks/useMarketingWorkspace.ts` |
| Content generation | `lib/marketing-intelligence/content/generate-marketing-content-draft.ts` |
| Decision / brief at generation | `resolve-creative-brief-for-content.ts`, `assemble-marketing-decision.ts` |
| Prompt + runtime | `lib/prompt-builder/prompt-builder.ts`, `lib/ai-runtime/ai-runtime.ts` |
| Responsibilities | `lib/peer-experience/marketing/responsibilities/evaluation-engine.ts` |

---

## Deliverable summary (Sprint 16)

| Item | Value |
|------|--------|
| **Files created** | `docs/architecture/CAMPAIGN_PLANNER_AUDIT.md` |
| **Biggest findings** | Wizard campaigns persist projects but **no work**; Work Units created only via delegation/responsibility/manual; strategy/plan are **peer-global**; Decision+Brief run at **draft generation**, not campaign create; `assembleCampaign` is read-only coordination |
| **Recommended architecture** | Pure **`lib/campaign/planner/`** → **`CampaignExecutionPlan`**; separate **apply** step → **`WorkUnit`**; no drafts/AI in planner |
| **Safest Action 1** | Planner module + tests only; gated documentation; zero hook/API wiring |
