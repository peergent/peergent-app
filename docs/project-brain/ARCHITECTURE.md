# Architecture

## Overview

Project Brain is a **single shared package** at `lib/brain/`. It is the orchestration layer between Peers and upstream intelligence systems.

```
Peer (Emma, etc.)
    ↓
BrainRunContext + BrainSnapshot
    ↓
Capability registry → BrainCapabilityModule / Provider
    ↓
BrainStructuredOutput (findings, decisions, recommendations, proposals)
    ↓
Presentation adapter → CampaignEvidenceSection → Vision v13 UI
    ↓
Policy → Approval → Execution → Audit
```

## Directory structure

```
lib/brain/
  domain/          Environment, provenance, confidence
  context/         BrainRunContext, BrainSnapshot, environment resolution
  capabilities/    Registry + workflow → capability mapping
  evidence/        Structured output model (not narrative UI)
  runtime/         Run lifecycle, module registry
  policy/          Approval policy (Working Agreement aligned)
  execution/       Pipeline contract (thinking vs doing)
  providers/       Provider interface, token strategy
  cache/           Provider-neutral cache store
  memory/          Memory candidate design
  audit/           Admin trace records
  presentation/    Campaign evidence adapter
  admin/           Read models (no UI in Sprint 1)
  demo/            Deterministic demo provider
```

## Migration from office prep

Untracked prep in `lib/office/brain/types.ts` was **moved, not duplicated**:

- `BrainContext` renamed to **`BrainRunContext`**
- `WORKFLOW_STEP_BRAIN_MODULES` retained as canonical source
- `WORKFLOW_STEP_CAPABILITIES` derived via `LEGACY_MODULE_TO_CAPABILITY`
- `lib/office/brain/types.ts` is a **deprecated re-export shim**

`lib/office/campaign/brain-evidence-types.ts` remains the narrative UI envelope; core model is `BrainStructuredOutput`.

## Separation of concerns

| Layer | Responsibility |
|-------|----------------|
| Upstream | business-brain, brand-brain, Context Engine, CampaignContext |
| Brain | Orchestration, capabilities, structured output, policy, audit |
| Presentation | Map structured output → CampaignEvidenceSection |
| Customer UI | Vision v13 — unchanged in Sprint 1 |

## Security

All Brain operations are **organization-scoped**. `assertOrganizationScoped()` enforces tenant isolation. Demo environment is isolated from live provider access.
