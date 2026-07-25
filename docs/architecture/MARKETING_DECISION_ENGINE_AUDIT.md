# Marketing Decision Engine — Architecture Audit

**Status:** Audit only (no implementation).  
**Date:** 2026-07-25  
**Scope:** Whether Peergent should introduce a dedicated **Marketing Decision Engine** before any new “builder” work, given existing Context Engine, brains, Creative Brief domain, Marketing Intelligence, and AI Runtime.

**Related:** `lib/marketing-intelligence/`, `lib/marketing-workspace/`, `lib/creative-brief/`, `lib/context-engine/`, `docs/architecture/BRAIN_REGISTRY_AUDIT.md`, `docs/architecture/BRAND_BRAIN_IMPLEMENTATION_AUDIT.md`.

---

## Executive summary

Today, **most marketing “decisions” are produced inside LLM pipelines** (strategy → plan → content draft) with **thin deterministic guardrails** (readiness, confidence caps, parsers, content-type normalization, workspace recommendations). There is **no separate decision layer** that emits a stable, reusable **Decision Record** consumed by Creative Brief assembly or rendering.

**Verdict:** A dedicated Marketing Decision Engine **is justified**, but **not as another LLM**. It should be a **deterministic, marketing-specific policy + assembly layer** that:

- Reads **Context Engine slices** (Business Brain, Brand Brain, Marketing Understanding) and **human/policy inputs** (campaign goal, budget, audience).
- **Selects and constrains** outputs that today are implicit in prompts and parsers.
- **Feeds Creative Brief creation** (execution-level) without replacing `MarketingPlan` / `MarketingStrategy` storage yet.

**Do not** build a generic “Decision Engine” platform first. **Do not** merge strategy/plan generation into the decision layer in MVP.

**Safest implementation action 1:** Domain types + **read-only assembler** that maps `(ContextPackage slices, MarketingPlan activity, responsibility policy)` → `MarketingDecisionRecord` (no AI, no DB, no API).

---

## 1. Decisions currently made implicitly inside Marketing Intelligence

### 1.1 Inside LLM generation (strategy, plan, draft)

| Decision area | Where it happens | Mechanism today |
|---------------|------------------|-----------------|
| Target audiences & priority | `generateMarketingStrategy` | Model output → `MarketingStrategy.targetAudiences` |
| Positioning & messaging direction | Same | `positioningRecommendations`, `contentPillars` |
| Recommended channels (strategic) | Same | `campaignIdeas.channels`, `socialMediaStrategy.platform` |
| Campaign themes & objectives | Same | `campaignIdeas`, `marketingPriorities` |
| SEO / journey / lead-gen bets | Same | respective strategy arrays |
| **Execution plan shape** | `generateMarketingPlan` | Model output → objectives, timeline, **campaigns**, **contentCalendar** |
| **Channel per calendar slot** | Plan JSON | `ContentCalendarEntry.channel` (optional string) |
| **Content type per slot** | Plan JSON | `contentType` (enum after parse/normalize) |
| **Creative volume (count)** | Plan JSON | Length of `contentCalendar` + campaign milestones (model-chosen) |
| **CTA copy** | `generateMarketingContentDraft` | Model output → `callToAction` on draft |
| **Approval posture** | Not in MI types | Implicit “human reviews draft” via workspace statuses only |

**Pipeline:** `buildContext` → `buildPrompt(outputFormat: marketing-strategy | marketing-plan | marketing-content-draft)` → `defaultAIRuntime.execute` → parse/validate.

**Context inputs to those prompts:** Company DNA, Business Brain (query-truncated), Marketing Understanding (composite brand + catalog), optional embedded strategy/plan JSON — **not** Brand Brain slice yet (available in Context Engine but not consumed by prompt builder).

### 1.2 Deterministic (non-LLM) decisions already in Marketing Intelligence / workspace

| Decision | Location | Rule |
|----------|----------|------|
| Can generate strategy? | `assessStrategyReadiness` | Understanding `available`, completeness thresholds, segment warnings |
| Max strategy confidence | `capStrategyConfidence` | Capped by understanding completeness & segments |
| Can generate plan? | `assessPlanReadiness` | Strategy summary + minimum recommendation count |
| Can generate draft for activity? | `assessContentDraftReadiness`, `resolve-plan-activity` | Plan activity exists, **draftable content type**, supported enum |
| Content type normalization | `normalizeContentType`, `isDraftablePlanActivity` | Alias map + `SUPPORTED_DRAFT_CONTENT_TYPES` |
| Draft entity hallucination checks | `parse-marketing-content-draft` | Known product names, generic term warnings |
| **Next workspace action** | `lib/marketing-workspace/recommendations.ts` | Phase machine: fill gaps → strategy → plan → draft → review → publish |
| **Next plan activity to draft** | `findNextMarketingPlanActivity`, lifecycle map | Calendar order + draft existence |
| **Budget spend autonomy** | `features/marketing-workspace/lib/marketing-settings-policy.ts` | `deriveBudgetAutonomyLimit`, pilot zero spend |
| **Posting autonomy / approval** | Same + responsibility guardrails | Category sets (LinkedIn, ads, etc.) |

These rules are **scattered**; they are not unified as a “decision” product object.

### 1.3 What Marketing Understanding decides (composition, not strategy)

`buildMarketingUnderstanding` **merges** Company DNA + Business Brain entities + marketing profile into a **single completeness-scored view**. It does **not** choose channels or plans; it only **surfaces gaps** (`brandPositioning`, `goals`, etc.) that downstream LLM steps may ignore or override.

---

## 2. Decisions that belong in a reusable decision layer

A **Marketing Decision Engine** (deterministic) should own **policy, eligibility, and structured recommendations with evidence pointers** — not prose generation.

| Decision | Rationale |
|----------|-----------|
| **Readiness & confidence ceilings** | Already rule-based; centralize so Creative Brief and future Performance loops share one truth |
| **Eligible channels** | Intersect: responsibility categories enabled, budget headroom, supported content types, (future) Performance Brain channel efficiency |
| **Eligible content types** | Single gate: plan activity → normalized type → brief + draft pipeline (today split across `resolve-plan-activity` and prompts) |
| **Recommended channel mix (ranked)** | Derive from strategy links + plan campaigns + policy — **suggest**, not author calendar |
| **Recommended content types per channel** | Map channel → allowed `MarketingDraftContentType` / future brief `contentType` |
| **CTA strategy (rules-level)** | Primary/secondary pattern, allowed URLs, alignment with Brand Brain `preferredCtaPatterns` — **not** final copy |
| **Creative count bounds** | Min/max variants per activity from plan + budget tier + autonomy mode |
| **Approval requirements** | Merge org policy, responsibility `approvalPolicy`, legal/brand flags → brief `approvalRequirements` |
| **Forbidden claims / words (execution)** | Merge Brand Brain voice rules + brief-level blocks + compliance list — **validation input**, not LLM memory |
| **Traceability** | StrategyLink → plan activity → decision record ID for explainability |

**Reusable across:** Marketing Peer workspace, API routes, future Sales/Support motion **only after** a second domain proves the pattern — see §8.

**Inputs:** Context slices + explicit human fields (goal, budget, audience override) + stored strategy/plan artifacts.

**Outputs:** Stable JSON (`MarketingDecisionRecord`) consumed by Creative Brief builder and UI explainability — **not** a prompt.

---

## 3. Decisions that belong in Creative Brief creation

Creative Brief (`lib/creative-brief/`) owns **this execution** — the contract immediately before any creative LLM or renderer.

| Creative Brief section | Source of truth |
|------------------------|-----------------|
| `campaignGoal` | Decision record + plan objective / user goal |
| `audience` | Decision record primary segment + pains/triggers from Business Brain |
| `channel`, `contentType` | Decision record **selected** slot (one calendar activity) |
| `tone` | Brief-specific directive; **informed by** Brand Brain voice, not a copy of it |
| `cta` | **Concrete** primary/secondary/url for this piece (may be filled from decision CTA strategy + user edit) |
| `messagingPriorities` | Ranked messages for **this** asset (from plan rationale + strategy links) |
| `visualPriorities`, `requiredAssets` | Execution art direction; references Brand Brain asset IDs |
| `forbiddenClaims`, `forbiddenWords`, `requiredDisclaimers` | **Merged** from decision layer + Brand Brain + legal |
| `platformConstraints` | Brand Brain layout constraints + channel limits (characters, ratio) |
| `outputRequirements` | Variants, formats, dimensions for this deliverable |
| `approvalRequirements` | **Instance** of decision-layer approval gates |

**Boundary:** Decision Engine answers **what we should do and what is allowed**; Creative Brief answers **what this single creative must contain** for downstream models.

---

## 4. Decisions that belong in rendering

Rendering (not implemented as a brain today; excluded from Creative Brief) owns **presentation mechanics**:

| Decision | Owner |
|----------|--------|
| Template / layout selection | Renderer |
| Typography & color application | Renderer (using Brand Brain tokens) |
| Image crop, safe zones, export dimensions | Renderer |
| File format encoding (PNG, PDF, MP4) | Renderer |
| Accessibility rendering (alt text placement) | Renderer |

**Today:** `prepareDraftForPublication` (`lib/marketing-workspace/publication-service.ts`) packages **text** for human publish — **not** visual render. No channel API publish in MVP.

Decision Engine may pass **constraints**; renderer resolves **how** to satisfy them.

---

## 5. Decisions that must never be delegated to an LLM

| Category | Examples in Peergent context |
|----------|------------------------------|
| **Money & spend** | Ad budget allocation, bids, exceeding `maxMonthlySpend`, pilot “zero budget” (`marketing-settings-policy`) |
| **Autonomy & publish** | Whether content may go live without human confirm; overriding `approval_required` |
| **Legal / compliance** | Required disclaimers present; regulated claims blocked — **validate deterministically** |
| **Identity & access** | Org scope, peer role (`Marketing` gate on MI generators) |
| **Forbidden enforcement** | Final pass: block publish if brief `forbiddenWords` / `forbiddenClaims` appear in body |
| **Canonical facts** | Product names, pricing, URLs — should match Business Brain / verified records (draft parser partially checks products) |
| **Confidence as authorization** | Low confidence must not auto-enable autonomous posting |
| **Brain ownership** | LLM must not redefine Brand Brain, Business Brain, or Performance metrics as source of truth |

LLMs may **propose** strategy/plan/copy; **decision layer + human review** must **authorize** execution and brief freeze.

---

## 6. Required inputs (mapping to today + future)

| Input | Status | Used today for marketing decisions |
|-------|--------|-------------------------------------|
| **Business Brain** | Production (Context slice) | Marketing Understanding, prompts, draft entity checks |
| **Brand Brain** | Context slice loaded; **not in prompts** | Dev inspector only; should feed decision + brief merge |
| **Market Brain** | Future | Not in codebase — external/market signals for channel mix |
| **Performance Brain** | Future | Partial metrics UI; no closed loop into plan/channel choice |
| **Campaign goal** | Partial | Strategy/plan objectives (LLM); `marketing_goals` in profile; not unified |
| **Budget** | Partial | Responsibility guardrails (`google_ads`, `meta_ads`), not plan generator input |
| **Audience** | Partial | Strategy `targetAudiences`; segments from Business Brain; no single “selected audience” object |

**Gap:** Budget and explicit campaign goal are **not** passed into `generateMarketingPlan` / `generateMarketingStrategy` as structured fields — only via free-text `taskHint` and context narrative.

---

## 7. Required outputs (mapping to today + target)

| Output | Today | Target owner |
|--------|-------|----------------|
| **Campaign Plan** | `MarketingPlan` (LLM JSON) | Keep artifact; Decision Engine adds **policy-wrapped view** + eligibility |
| **Recommended channels** | Inside `MarketingStrategy` / plan `campaigns.channels` | Decision Engine: ranked list + reasons + evidence refs |
| **Recommended content types** | Plan `contentCalendar.contentType` | Decision Engine: allowed set per channel/goal |
| **CTA strategy** | Ad hoc in draft `callToAction` | Decision Engine: rules; Brief: concrete CTA |
| **Creative count** | Implicit calendar length | Decision Engine: explicit `recommendedCreativeCount` / bounds |
| **Approval requirements** | Workspace statuses + responsibility guardrails | Decision Engine → brief `approvalRequirements` |

---

## 8. Generic Decision Engine vs marketing-specific

| Option | Assessment |
|--------|------------|
| **Generic Decision Engine now** | **Premature.** Only Marketing has a full strategy → plan → draft chain. Sales/Support lack equivalent artifacts and policy surfaces. |
| **Marketing-specific engine first** | **Recommended.** Namespaced `lib/marketing-decision/` (or `lib/marketing-intelligence/decision/`) with types aligned to MI artifacts and Creative Brief. |
| **Extract generic later** | When a second peer domain needs `(policy × context slices × goal) → DecisionRecord`, refactor shared **primitives** (readiness, evidence refs, confidence caps) — not the marketing taxonomy. |

**Relationship to Context Engine:** Decision Engine **consumes** `ContextPackage` slices; it does **not** replace loaders or add a second context build path (per Brain Registry audit).

---

## 9. Smallest MVP

**Goal:** Prove the layer without new LLM steps, DB, or UI.

1. **Types only** (`MarketingDecisionRecord`, inputs, outputs listed in §7) — readonly, similar to `lib/creative-brief/`.
2. **`assembleMarketingDecision` (pure function):**
   - Inputs: `ContextPackage` (at minimum Business Brain, Marketing Understanding, optional Brand Brain), optional `MarketingStrategy`, optional `MarketingPlan`, optional `ContentCalendarEntry` or activity ref, optional `MarketingResponsibility[]` or budget limit snapshot.
   - Outputs: eligibility flags, capped confidence, ranked channel suggestions **derived from existing strategy/plan strings** (no new AI), content type allowance, creative count from calendar, approval flags from policy, forbidden lists **merged from Brand Brain when present**.
3. **Tests:** fixtures from existing MI types; degradation when slices missing.
4. **No** changes to `generateMarketingStrategy` / `buildPrompt` / API routes in MVP.

**Explicitly out of MVP:** Market Brain, Performance Brain loops, new calendar generation, renderer, persistence.

---

## 10. Exact implementation order

| Step | Action | Depends on |
|------|--------|------------|
| **1** | `lib/marketing-decision/` (or `lib/marketing-intelligence/decision/`) — types + ownership doc + `assembleMarketingDecision` | Creative Brief types (done), Context slices |
| **2** | Unit tests + golden fixtures from `plan.test.ts` / strategy fixtures | Step 1 |
| **3** | Wire **read-only** into dev tooling (extend `/dev/context` or marketing dev page) — show Decision Record next to Brand Brain | Step 1–2 |
| **4** | `assembleCreativeBriefFromDecision` (deterministic) — maps Decision Record + Brand Brain → `CreativeBrief` | Step 1, Brand Brain slice stable |
| **5** | Replace implicit draft prerequisites: call decision assembler inside `assessContentDraftReadiness` path (behavior-preserving) | Step 4 |
| **6** | Prompt builder: optional section driven by **frozen Creative Brief**, not re-deriving strategy prose | Step 4–5 |
| **7** | Performance Brain (future): feed channel weights into decision assembler only | Performance domain |
| **8** | Market Brain (future): external signals input | Market domain |

**Parallel safe work:** Brand Brain prompt consumption (separate track) should **precede** step 6 but **not** block steps 1–4.

---

## Architecture recommendation (target state)

```text
ContextEngine.buildContext()
        │
        ├─ slices: businessBrain, brandBrain, marketingUnderstanding, …
        │
        ▼
MarketingDecisionEngine.assemble()     ← deterministic, no LLM
        │
        ├─ MarketingDecisionRecord
        │
        ▼
CreativeBrief.assemble()               ← deterministic, no LLM
        │
        ├─ CreativeBrief (canonical LLM input for creative)
        │
        ▼
AI Runtime (copy/layout proposals)     ← LLM allowed here only after brief freeze
        │
        ▼
Renderer (future) / Publication package (today)
```

**Marketing Intelligence** retains **strategic artifacts** (`MarketingStrategy`, `MarketingPlan`) as **human-reviewable documents** generated by LLM today; over time, LLM output should **align to** decision constraints rather than inventing channels outside policy.

---

## Risks if we skip the Decision Engine

- Channel/content/approval choices remain **entangled in prompts** and **non-replayable**.
- Brand Brain and Creative Brief stay **disconnected** from strategy/plan LLM steps.
- Budget and autonomy policies **do not constrain** plan/calendar generation.
- Future Performance/Market brains have **no insertion point** except another LLM pass.

---

## Safest implementation action 1

Create **`lib/marketing-decision/`** (name TBD) with:

- Readonly **`MarketingDecisionRecord`** and **`assembleMarketingDecision()`**
- Evidence pointers to strategy links / context slice fields
- **No** database, API, UI, prompt-builder, or changes to existing `generateMarketing*` functions

Validate in tests that given a fixed `MarketingPlan` activity + responsibility policy + fixture `ContextPackage`, the assembler returns stable channel/type/approval/forbidden outputs.

---

*End of audit — no code changes.*
