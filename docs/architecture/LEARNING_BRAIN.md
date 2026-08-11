# Learning Brain (PX-46)

Learning Brain is the **feedback and improvement layer** of Peergent. It transforms observed outcomes into evidence-backed organizational learning without mutating upstream Brains or Memory directly.

## Purpose

Learning Brain answers:

- What actually happened?
- How did reality compare with what we expected?
- What appears to have worked or not worked?
- Why might that have happened?
- What should Peergent remember?
- What should future Brains reconsider?
- How confident are we in that lesson?

It does **not** automatically optimize live campaigns, rewrite strategy, regenerate creative, publish, or write Memory.

## Responsibilities

- Consume read-only upstream graphs and performance observations
- Compare observed vs expected outcomes across comparison types
- Detect meaningful anomalies with evidence thresholds
- Distinguish single events from durable patterns
- Maintain hypothesis lifecycle with causality safety
- Produce domain learning signals (Strategy, Planning, Creative, Validation, Execution, Audience, Channel, Messaging, Approval)
- Assess attribution and data quality; reduce confidence when weak
- Preserve contradictions and unknowns
- Emit `MemoryWriteProposal[]` for Memory Brain quality gate
- Emit future recommendations and system improvement proposals (non-binding)
- Version learning episodes incrementally

## Boundaries

Learning Brain must **never**:

- Mutate `CompanyGraph`, `ResearchBrainGraph`, `ReasoningBrainGraph`, `MarketingIntelligenceBrainGraph`, `StrategyBrainGraph`, `PlanningBrainGraph`, `CreativeGraph`, `ValidationGraph`, `ExecutionHistory`, or `MemoryGraph`
- Call `MemoryRepository.store()` or any direct Memory write
- Edit prompts, model configuration, code, validation weights, or provider configuration
- Fabricate metrics, causality, or cross-campaign evidence

**Frozen rule:** Learning writes only through Memory — via `MemoryWriteProposal[]`.

## Pipeline position

```
Company → Research → Reasoning → Marketing Intelligence → Strategy → Planning → Creative → Validation → Approval → Execution → Performance / Observed Outcomes → Learning → Memory → future runs READ Memory
```

Registered as `learningBrainContract` in `createDefaultProjectBrainRegistry()`. Project Engine decides when Learning runs; Learning never schedules itself.

If insufficient outcome data → `WAIT` / `insufficient_outcome_data`. Do not invent learning.

## LearningGraph layers

Canonical type: `LearningBrainGraph` in `lib/brain/layers/learning/brain-types.ts`.

1. Observed Outcomes (`PerformanceObservation[]`)
2. Expected Outcomes (derived from Strategy KPIs, Planning metrics, Validation estimates)
3. Comparisons (`LearningComparison[]`)
4. Anomalies (`LearningAnomaly[]`)
5. Patterns (`LearningPattern[]`)
6. Hypotheses (`LearningHypothesis[]`)
7. Evidence Evaluation (data quality + attribution)
8. Learnings (`LearningInsight[]`, `LearningOutcome[]`)
9. Contradictions (`LearningContradiction[]`)
10. Confidence (`LearningConfidence`)
11. Future Recommendations (`LearningRecommendation[]`)
12. Memory Write Proposals (`MemoryWriteProposal[]`)
13. Learning Summary (`LearningSummary`)

## Performance observation contract

Input contracts only — no provider integrations in PX-46.

Key type: `PerformanceObservation` with fields:

- `id`, `organizationId`, `projectId`, `campaignId`, `deliverableId?`
- `channel`, `metric`, `value`, `unit`
- `baseline`, `target`, `comparisonValue`
- `measurementWindow`, `observedAt`, `source`, `sourceRef`
- `attributionModel`, `attributionConfidence`, `dataQuality`
- `sampleSize?`, `segment?`, `metadata`

Related contracts: `CustomerFeedbackObservation`, `MeasurementContext`, `AttributionContext`, funnel/channel/audience observation shapes.

Never fabricate missing values.

## Observed vs expected

Learning compares actual outcomes against upstream expectations from Strategy KPI framework, campaign objectives, Planning success metrics, Creative expected outcomes, Validation estimates, and Execution expectations.

Each `LearningComparison` includes: `expected`, `observed`, `delta`, `direction`, `significance`, `confidence`, `evidenceRefs`, `context`.

Not every numerical difference is meaningful.

## Comparison model

Supported types:

- `target_vs_actual`, `baseline_vs_actual`, `expected_vs_actual`
- `variant_vs_variant`, `creative_vs_creative`
- `channel_vs_channel`, `audience_vs_audience`
- `period_vs_period`
- `validation_vs_performance`, `strategy_vs_outcome`, `plan_vs_execution`

## Anomaly detection

`LearningAnomaly` captures meaningful deviations (e.g. high CTR + low conversion, validation score vs weak performance, execution failure affecting measurement window).

Fields: `metric`, `expectedRange`, `observedValue`, `severity`, `possibleExplanations`, `evidence`, `confidence`, `requiresMoreData`.

Anomalies require sufficient evidence — not every outlier qualifies.

## Pattern model

`LearningPattern` requires repeated or sufficiently strong evidence:

- Minimum thresholds: ≥3 observations and ≥2 campaigns for pattern candidacy
- Fields: `category`, `title`, `description`, `scope`, supporting refs, `sampleSize`, `consistency`, `businessImpact`, `confidence`, timestamps, `contradictions`

Categories: audience, channel, messaging, creative, offer, funnel, timing, budget, validation, execution, conversion, retention, measurement.

## Single-event vs durable learning

| Evidence level | Artifact |
|----------------|----------|
| One campaign win | Observation / hypothesis |
| Same territory wins across comparable campaigns | Possible pattern |
| Repeated evidence over time | Durable learning candidate |

One successful campaign is **not** automatically a durable pattern.

## Hypotheses and causality safety

`LearningHypothesis` lifecycle: `proposed` → `supported` / `weakened` / `rejected` / `confirmed`.

`CausalityStrength`: `none`, `correlation`, `suggestive`, `experimental`, `strong`.

Correlation does not become causation without controlled experiment evidence, sufficient attribution, valid comparison groups, and sample size.

Valid experiment context (`LearningExperimentContext`) may allow stronger causality confidence.

## Outcome classification

`LearningOutcome` classifications: `outperformed`, `met_expectation`, `underperformed`, `inconclusive`, `measurement_failure`, `execution_failure`, `mixed`.

Multi-metric reasoning combines related metrics (e.g. CTR ↑ + CVR ↓ → attention without fit). Business outcomes beat vanity metrics when downstream data exists.

## Domain learning signals

| Signal type | Evaluates |
|-------------|-----------|
| `StrategyLearningSignal` | Channel mix, audience response, positioning, funnel, KPI framework |
| `PlanningLearningSignal` | Approval delays, tracking dependencies, sequencing, resource assumptions |
| `CreativeLearningSignal` | Hook types, format, objection handling, CTA fit |
| `ValidationLearningSignal` | Prediction vs performance alignment, blind spots |
| `ExecutionLearningSignal` | Reliability, partial execution, provider friction |
| `AudienceLearningSignal` | Segment response vs expectation |
| `ChannelLearningSignal` | Efficiency, quality, funnel contribution |
| `MessagingLearningSignal` | Territory, hook, proof, CTA performance relationships |
| `ApprovalLearningSignal` | Customer rejection/selection patterns |

None of these mutate upstream graphs.

## Customer feedback and approval learning

`CustomerFeedbackObservation` treats explicit customer actions (approved, rejected, edited, commented, rated, variant selected) as important evidence — distinct from business performance metrics.

## Experiments

`LearningExperimentContext` supports hypothesis, control, variants, metrics, validity, and confounders. Experiment execution is out of scope for PX-46.

## Attribution and data quality

`AttributionContext`: model, source, confidence, limitations, cross-channel effects, tracking completeness.

`DataQualityAssessment`: sample size, missing metrics, duration, attribution, outliers → `qualityScore`, `qualityLevel`, `limitations`, `usableForLearning`, `usableForDurablMemory`.

Weak attribution reduces overall learning confidence.

## Confidence

Derived from data quality, sample size, observation count, campaign count, consistency, attribution, comparison validity, contradicting evidence, measurement duration, upstream confidence.

Levels: `low`, `medium`, `high`. Do not amplify certainty.

## Contradictions and unknowns

`LearningContradiction` preserves conflicting claims with scoped evidence (e.g. proof-led vs urgency-led wins in different contexts).

`LearningUnknown` documents insufficient sample, unclear attribution, incomplete tracking, short duration, missing baseline, execution interruption.

## MemoryWriteProposal

Critical output — Learning does **not** write Memory.

Each proposal includes: `id`, `category`, `title`, `learning`, `scope`, `evidenceRefs`, `confidence`, `importance`, `durability`, `recommendedMemoryDomain`, related campaigns/deliverables, `contradictions`, `expiresAt?`, `reasonToStore`.

Durability: `temporary`, `reinforce_if_repeated`, `durable_candidate`.

Memory Brain applies its own quality gate before merge into `MemoryGraph`.

## Learning → Memory relationship

```
Learning Brain → MemoryWriteProposal[] → Memory Brain → Memory merge / quality gate → MemoryGraph
```

Enforced in tests: Learning never calls `MemoryRepository.store()`.

## Learning decay

Proposals include `durability`, `freshnessSensitivity`, `reviewAfter`, `expiresAt` when appropriate (e.g. platform CPM behavior vs brand rules).

## Incremental learning

Versioned episodes via `supersedes`, `priorHypotheses`, `priorPatterns`. New evidence updates or contradicts hypotheses — prior history is never overwritten.

## Cross-campaign learning

Supports single-campaign, multi-campaign, organization-, audience-, channel-, and offer-level learning when historical observations or Memory exist. Never fabricate cross-campaign evidence.

## Future recommendations

`LearningRecommendation`: title, recommendation, reason, evidence, expected benefit, confidence, scope, `targetBrain`, `requiresValidation`.

Target brains: research, reasoning, marketing_intelligence, strategy, planning, creative, validation, execution.

These are **future consideration signals**, not commands.

## System proposals

`LearningSystemProposal` identifies possible system improvements (e.g. validation blind spots, planning underestimation). `autoApply: false` always — no self-modifying system.

## Persistence

`LearningBrainRepository` persists snapshots, runs, and history:

- observations, comparisons, patterns, hypotheses, insights, outcomes
- contradictions, recommendations, memory write proposals
- confidence, data quality, version, timestamps

Location: `lib/brain/layers/learning/learning-brain-repository.ts`.

## Project Engine integration

`learningBrainContract` implements `ProjectBrainContract`:

- Runs after observable outcomes exist
- Returns `skipped` + `insufficient_outcome_data` when no observations
- Detects upstream graph version mutation and fails closed

## Brain Output Layer (future)

`learningBrainGraph?` on `BrainStructuredOutput` via `mapLearningBrainToStructuredOutput`. No Office UI in PX-46. Future BOL publishers may surface "What Emma learned", performance explanations, and confidence narratives.

## Module layout

```
lib/brain/layers/learning/
├── brain-types.ts
├── learning-brain-graph.ts
├── learning-brain-layer.ts
├── learning-brain-executor.ts
├── learning-brain-repository.ts
├── learning-comparisons.ts
├── learning-anomalies.ts
├── learning-patterns.ts
├── learning-outcomes.ts
├── learning-signals.ts
├── learning-contradictions.ts
├── learning-memory-proposals.ts
├── learning-data-quality.ts
├── learning-confidence.ts
├── learning-validator.ts
├── map-learning-brain-to-output.ts
└── __tests__/learning-brain.test.ts
```

## Tests

48+ cases in `lib/brain/layers/learning/__tests__/learning-brain.test.ts` covering observations, comparisons, anomalies, patterns, causality safety, domain signals, Memory boundary, incremental versioning, and Project Engine contract integration.
