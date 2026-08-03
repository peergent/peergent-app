# Performance Interpretation

**Capability id:** `performance_interpretation`  
**Version:** 1.0.0

## Owns

- Data sufficiency assessment
- Metric observations (facts)
- Trend/channel comparisons (calculated)
- Hypotheses (explicitly labeled)
- Honest insufficient-data results

## Does not own

- Live analytics integrations (Sprint 6+)
- Fabricated demo metrics in live environments
- Causal claims without evidence

## Inputs

- `performanceMetrics` on `BrainRunRequest` / `CapabilityExecutionContext` (demo/test only)
- Campaign metadata from `CampaignContext`

## Dependencies

None hard-coded; consumes performance context slice when populated.
