# Brain Output Layer

**Status:** PX-33 — Architecture implemented  
**Authority:** [PROJECT_BRAIN_FOUNDATION.md](./PROJECT_BRAIN_FOUNDATION.md)

---

## Problem

Project Brain stores structured cognition (`BrainStructuredOutput`, `Decision`, `PlanningGraph`).  
Office surfaces (Workspace, Campaign Experience) were composing copy from campaign fields, desk heuristics, and demo strings.

That disconnect made Peergent feel like a dashboard instead of an autonomous marketing department.

---

## Solution

The **Brain Output Layer** (`lib/brain/output/`) is the translation layer between every Brain and every customer surface.

```text
Research Brain
      ↓
Reasoning Brain
      ↓
Marketing Intelligence Brain
      ↓
Strategy Brain
      ↓
Creative Brain
      ↓
Validation Brain
      ↓
Memory Brain
      ↓
══════════════════════════
   Brain Output Layer      ← lib/brain/output/
══════════════════════════
      ↓
Marketing Workspace       ← lib/office/brain-output/ (thin mappers)
      ↓
Campaign Experience
      ↓
Future Work tab / Home
```

**Rule:** UI builders never read `project.goal`, `statusLabel`, or ad-hoc demo strings for intelligence copy. They consume mapped slices from the Brain Output Layer.

---

## Output contracts

| Object | Purpose |
|--------|---------|
| `ExecutiveSummary` | What we discovered, why it matters, decision made, what's next, expected impact |
| `BusinessIntelligence` | Explained changes — never metrics alone |
| `BrainOutputRecommendation` | Reason, expected outcome, confidence, business impact, why now |
| `ContextGap` / `MissingContext` | What Emma still needs |
| `BusinessRisk` / `BusinessOpportunity` | Risks and upside from decisions + planning |
| `RecentDiscovery` / `RecentDecision` / `RecentLearning` | Memory of what happened |
| `SuggestedAction` | Action proposals from strategy |
| `LiveActivityEvent` | Real brain events with why-it-matters |
| `ProgressNarrative` | Decision explanations, not workflow stage labels |
| `CampaignNarrative` | Executive brief structure for Campaign Experience |
| `ApprovalReason` | Why approval is needed and what it unblocks |
| `ExpectedBusinessImpact` | Quantified or qualitative impact |
| `ConfidenceScore` | Aggregated confidence for recommendations |

Aggregates:

- **`CampaignBrainOutput`** — full intelligence for one campaign
- **`WorkspaceBrainOutput`** — peer-level aggregation across campaigns

---

## How Brains publish intelligence

Brains do **not** write UI text. They persist structured outputs:

1. Capability runs via `BrainRuntime` → `BrainStructuredOutput`
2. Outputs persist on `project.campaignSetup.campaignBrainOutputs`
3. Decisions attach via `decisionRecords` on strategy output
4. Planning attaches via `planningGraph` on strategy or `campaign_planning`

The Output Layer **publishes** customer intelligence via:

| Publisher | Input | Output |
|-----------|-------|--------|
| `publishExecutiveSummary` | Briefing + strategy + decisions | `ExecutiveSummary` |
| `publishBusinessIntelligence` | Findings + decisions + planning risks | `BusinessIntelligence` |
| `publishRecommendations` | Decisions + strategy recommendations | `BrainOutputRecommendation[]` |
| `publishProgressNarrative` | Workflow state + strategy + decisions | `ProgressNarrative` |
| `publishActivityEvents` | Capability outputs + execution results | `LiveActivityEvent[]` |

Entry points:

- `resolveCampaignBrainOutput()` — one campaign
- `resolveWorkspaceBrainOutput()` — peer desk (demo or live brain-backed projects)

Demo mode uses `buildDemoCampaignBrainOutput` / `buildDemoWorkspaceBrainOutput` — structured like live output, not scattered UI strings.

---

## How UI consumes intelligence

Thin mappers in `lib/office/brain-output/` translate contracts → existing view-model shapes **without changing layout**:

| Mapper | Consumes | Produces |
|--------|----------|----------|
| `mapCampaignExperienceFromBrain` | `CampaignBrainOutput` | brief, progress, recommendation, activity slices |
| `mapWorkspaceSlicesFromBrain` | `WorkspaceBrainOutput` | BI bullets, activity band, recommendation |
| `applyBrainBulletsToMetrics` | BI bullets + performance metrics | metric tabs with brain bullets |

Wired in:

- `build-campaign-experience.ts` — prefers brain slices; legacy fallback when no brain data
- `build-marketing-workspace-bands.ts` — demo/live brain BI, activity, recommendations

---

## File structure

```text
lib/brain/output/
├── types.ts                          # Output contracts
├── presentation-context.ts           # Locale, demo, peer context
├── sanitize.ts                       # Customer-safe text
├── capability-source.ts              # capabilityId → BrainSource
├── publish/                          # Per-object publishers
├── aggregate/build-campaign-brain-output.ts
├── resolve-campaign-brain-output.ts
├── resolve-workspace-brain-output.ts
├── demo/demo-brain-output.ts
└── index.ts

lib/office/brain-output/
├── map-campaign-experience.ts
├── map-workspace-slices.ts
└── index.ts
```

Existing presentation layer (`lib/brain/presentation/`) remains for evidence modals and executive review. The Output Layer extends it for Workspace + Campaign Experience.

---

## Future work (not PX-33)

- Creative Brain explanations on asset cards
- `optimization` capability publisher for live performance interpretation
- Home command center consumption
- Work tab full brain wiring
- Replace legacy `build-marketing-brain-insights.ts` (legacy MarketingStrategy path)

---

## Non-goals (PX-33)

- No UI redesign
- No layout changes
- No Creative Brain implementation
- No Project Brain architecture changes
