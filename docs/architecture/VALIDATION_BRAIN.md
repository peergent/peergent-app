# Validation Brain

**Status:** PX-36 — Architecture implemented  
**Authority:** [PROJECT_BRAIN_FOUNDATION.md](./PROJECT_BRAIN_FOUNDATION.md), [PROJECT_ENGINE.md](./PROJECT_ENGINE.md), [CREATIVE_BRAIN.md](./CREATIVE_BRAIN.md)

---

## Role

Validation Brain is **not** a spell checker, grammar corrector, or content rewriter.

It behaves like a **senior Creative Director, Brand Manager, and Marketing Director combined**. Its purpose is to determine whether Creative Brain output is good enough to publish.

```text
Business + Brand + Website + Research + MI + Strategy + Planning + CreativeGraph
                              ↓
                       Validation Brain
                              ↓
     ValidationReport · Issues · Warnings · Passes · Publication Readiness
                              ↓
                    Brain Output Layer (future wiring)
                              ↓
              Approval · Memory Brain · Learning Brain
```

**Never:** create, rewrite, or publish.  
**Only:** evaluate Creative Brain output for publication readiness.

---

## Validation domains

Validation Brain evaluates independently across nineteen domains:

| Domain | Question |
|--------|----------|
| Business Fit | Does this campaign solve the business objective? |
| Brand Consistency | Does messaging match brand identity? |
| Tone of Voice | Does communication match desired tone? |
| Audience Fit | Will the intended audience understand and respond? |
| Positioning | Does this strengthen the chosen market position? |
| Competitive Differentiation | Does this avoid sounding like competitors? |
| Creative Quality | Is the concept original enough? |
| Message Clarity | Can someone understand the message within seconds? |
| Trust | Are sufficient trust builders included? |
| Objections | Are customer objections addressed? |
| LinkedIn / Google Ads / Email / Landing Page / Blog | Is channel content appropriate? |
| CTA Quality | Is there one clear next action? |
| Conversion Potential | How likely is this to convert? |
| Consistency | Do all deliverables tell the same story? |
| Legal & Claims | Are there unsupported claims? |

Each domain produces a `ValidationCategory` with status (`pass` | `warning` | `fail`), score, and summary.

---

## Structured output

Validation Brain never returns paragraphs only. All outputs are typed objects:

| Type | Purpose |
|------|---------|
| `ValidationReport` | Complete validation artifact with scores, readiness, issues |
| `ValidationCategory` | Per-domain evaluation result |
| `ValidationIssue` | Blocking or non-blocking problem with resolution guidance |
| `ValidationWarning` | Non-blocking improvement opportunity |
| `ValidationPass` | Explicit pass record for audit |
| `ValidationDecision` | Per-deliverable approve/reject verdict |
| `ValidationGraph` | Persisted brain output — mapped to `BrainStructuredOutput` |

Every `ValidationIssue` includes: category, severity, reason, business impact, suggested resolution, blocking flag.

---

## Publication readiness

Validation Brain determines one of four outcomes:

| Verdict | Meaning |
|---------|---------|
| `READY` | Score ≥ 85, no fails, publish with confidence |
| `READY_WITH_SUGGESTIONS` | Publishable with optional improvements |
| `CHANGES_REQUIRED` | Multiple fails or score < 65 — rework needed |
| `BLOCKED` | Blocking issues, legal fail, or score < 45 |

---

## Scoring model

1. Each domain evaluates to a score (0–100) and status.
2. **Overall score** = weighted average using domain weights (`VALIDATION_MODULE_SPECS`).
3. **Legal & Claims** and **Business Fit** carry higher weights.
4. **Estimated conversion** = composite of overall score, CTA score, trust score, minus issue penalties.
5. **Confidence** = derived from overall score and issue count.

Blocking issues (especially unsupported claims like "Best in the Netherlands") force `BLOCKED`.

---

## Module layout

| Module | Path |
|--------|------|
| Types | `lib/brain/layers/validation/types.ts` |
| Domain specs | `modules/specs.ts` |
| Graph builder | `build-validation-graph.ts` |
| Scoring | `scoring.ts` |
| Layer | `validation-layer.ts` |
| Executor + contract | `validation-brain-executor.ts` |
| Repository | `validation-repository.ts` |
| Meta-validator | `validation-validator.ts` |
| Output mapper | `map-validation-graph-to-output.ts` |
| Publisher | `validation-publisher.ts` |
| Registry hook | `lib/brain/integration/creative-brain-registry.ts` |

---

## Project Engine integration

Validation Brain implements `ProjectBrainContract` with `id: "validation"`.

- Project Engine schedules Validation **after** Creative Brain (`validating` state → `validation` brain).
- Validation never decides when to execute — the engine orchestrates timing.
- On completion with `READY` or `READY_WITH_SUGGESTIONS`, executor sets `requiresApproval: true`, `approvalKind: "campaign_approval"`.
- On `BLOCKED` or `CHANGES_REQUIRED`, executor returns `errorCode: "validation_changes_required"`.

Existing hooks in Project Engine (unchanged in PX-36):

- `project-state.ts` — `validating` requires `validation` brain
- `stage-router.ts` — `validation` brain mapping
- `approval-model.ts` — `campaign_approval` gate after validation

Register via:

```typescript
import { createDefaultProjectBrainRegistry } from "@/lib/brain";
const registry = createDefaultProjectBrainRegistry();
// registry.validation → validationBrainContract
```

---

## Brain Output Layer consumption (future)

Validation Brain publishes structured output via `ValidationPublisher` and `mapValidationGraphToBrainOutput`. Brain Output Layer will translate:

- `ValidationReport.publicationReadiness` → approval explanations
- `ValidationReport.overallScore` → executive quality summaries
- `ValidationGraph.phases` → validation progress narrative
- `ValidationIssue[]` → approval reasons, business risks
- `ValidationCategory[]` → quality indicators

Brain Output Layer is **not modified in PX-36** — structured output is ready for future wiring.

---

## Approval consumption

Approval system reads:

- `publicationReadiness` — gate decision
- `approvedDeliverables` / `rejectedDeliverables` — per-asset verdicts
- `requiredFixes` — blocking items before approval
- `businessRisks` / `brandRisks` — executive briefing context

`campaign_approval` checkpoint unlocks `ready_to_publish` when customer approves validated package.

---

## Memory Brain consumption (future)

Memory Brain will store:

- Validation verdicts and scores
- Issue patterns that recurred across campaigns
- Approved/rejected deliverable decisions with reasoning
- Business and brand risk records

Memory writes require Validation pass + approval — Validation Brain produces the validated envelope.

---

## Learning Brain consumption (future)

Learning Brain will analyze:

- Which validation domains fail most often
- Correlation between warnings and post-publication performance
- Generic hook / claim patterns that predict low conversion
- Domain score trends over time

Validation provides labeled training signal — pass/warn/fail per domain with business impact.

---

## Out of scope (PX-36)

- UI changes (Home, Workspace, Campaign Experience)
- Project Engine modifications
- Brain Output Layer publisher wiring
- Memory Brain, Execution Brain, Learning Brain
