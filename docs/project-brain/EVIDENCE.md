# Evidence

## Core model: BrainStructuredOutput

Structured only. Narrative UI text is **never** the core model.

| Type | Purpose |
|------|---------|
| `BrainFinding` | Observable fact with confidence + provenance |
| `BrainDecision` | Chosen direction with rationale |
| `BrainRecommendation` | Suggested next step |
| `BrainActionProposal` | Proposed action (requires policy/approval) |
| `BrainExecutionResult` | Outcome of executed action |
| `BrainWarning` | Non-fatal issue |
| `BrainError` | Fatal or retryable error |

Every finding references **provenance** (`BrainProvenanceRef`).

## Provenance kinds

`customer_input`, `website`, `integration`, `document`, `company_profile`, `performance`, `memory`, `market`, `competitor`, `demo_fixture`, `model_inference`

## Customer presentation

```
BrainStructuredOutput
  → presentBrainOutputForCampaign()
  → CampaignEvidenceSection[]
  → Vision v13 UI
```

Do not bypass `CampaignEvidenceSection`. Marketing workspace remains visually unchanged in Sprint 1.

## Legacy envelope

`BrainEvidence` in `lib/office/campaign/brain-evidence-types.ts` is deprecated narrative UI shape. New code uses structured output + presentation adapter.
