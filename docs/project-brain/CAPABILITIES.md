# Capabilities

Sprint 1 defines a **registry only** — no capability implementations.

## Registered capabilities

| ID | Required context | Approval |
|----|------------------|----------|
| `company_understanding` | organization, business | none |
| `website_understanding` | website | none |
| `brand_understanding` | brand | none |
| `market_understanding` | market | none |
| `competitor_understanding` | business | none |
| `strategy` | campaign, business | before_action |
| `channel_planning` | campaign | before_action |
| `creative_generation` | campaign, brand | before_publish |
| `performance_interpretation` | performance, campaign | none |
| `optimization` | performance, campaign | before_action |
| `memory` | memory, organization | none |

Each definition includes: version, required/optional context slices, output schema, allowed environments, cost class, freshness policy, cacheability.

## Workflow mapping

**One canonical source:** `WORKFLOW_STEP_BRAIN_MODULES` (legacy module ids).

Capabilities derive via:

```
WORKFLOW_STEP_BRAIN_MODULES
  → LEGACY_MODULE_TO_CAPABILITY
  → WORKFLOW_STEP_CAPABILITIES
```

Use `capabilitiesForWorkflowStep(stepId)` — do not duplicate mappings elsewhere.

## Module contract

`BrainCapabilityModule.execute({ context, snapshot })` replaces legacy `ProjectBrainModule.analyze()`.
