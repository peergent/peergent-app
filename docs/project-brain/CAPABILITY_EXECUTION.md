# Capability Execution

Capabilities never assemble context or execute themselves. The runtime handles everything.

## Execution path

```
BrainRunRequest
  → getBrainCapability(id)
  → CompanyContextAssembler
  → evaluateReadinessGate()
  → projectBrainContext()
  → selectBrainProvider()
  → provider.execute() / executeSync()
  → validateBrainStructuredOutput()
  → BrainOutputRepository.store()
```

## Implemented capabilities (demo)

| Capability | Provider | Notes |
|------------|----------|-------|
| `company_understanding` | Demo | Deterministic from CompanySnapshot |
| `website_understanding` | Demo | Deterministic from WebsiteSnapshot |

Other capabilities return demo fixtures when a company snapshot is available.

## Readiness requirements

Per-capability requirements in `lib/brain/runtime/readiness-gate.ts`:

- `minimumReadinessScore`
- `requiredDimensions`
- `criticalFields`
- `partialExecutionAllowed`

Insufficient readiness → `waiting_for_input` or `blocked`. Never invented context.

## Policy

`evaluateBrainPolicy()` returns:
- `allow`
- `require_approval`
- `block` (reserved for future Working Agreement rules)

## Output

All output conforms to `BrainStructuredOutput`:
- findings with provenance
- warnings, recommendations, action proposals
- no chain of thought

## Marketing Workspace

`business_analyzed` and `website_analyzed` execute through:

```
buildBrainStepEvidence()
  → executeBrainForWorkflowStepSync()
  → BrainRuntime.executeRunSync()
  → presentBrainOutputForCampaign()
```

No layout or UX changes.
