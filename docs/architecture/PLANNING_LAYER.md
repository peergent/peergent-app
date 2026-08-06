# Planning Layer — Live Integration (Sprint 11.1)

## Purpose

The Planning Layer turns validated **StrategyGraph** + **DecisionCollection** into an outcome-driven **PlanningGraph** that Emma presents as an **Execution Plan** inside the Executive Briefing.

Planning is **not** channel selection (`channel_planning`) and **not** scheduling (`campaignSchedule`).

## Live integration path

```
Campaign context
  → ResearchGraph
  → ReasoningGraph
  → MarketingIntelligenceGraph
  → StrategyGraph
  → DecisionCollection (embedded in strategy.decisionRecords)
  → ensureCampaignPlanning()
  → PlanningGraph
  → BrainStructuredOutput (campaign_planning)
  → campaignBrainOutputs.campaign_planning
  → buildCampaignExecutiveBriefing()
  → ExecutiveCampaignBriefing.executionPlan
  → ExecutiveCampaignBriefingPanel (progressive disclosure)
```

Strategy execution persists via `persistCampaignBrainOutputs()`, which calls `mergeCampaignOutputsWithPlanning()` to auto-build and store `campaign_planning` when strategy exists.

## Canonical output identity

| Field | Value |
|-------|-------|
| Capability ID | `campaign_planning` |
| Capability version | `1.0.0` (from brain capability registry) |
| Planning layer version | `PLANNING_LAYER_VERSION` (`1.0.0`) |

Cache identity (`PlanningOutputMetadata`) includes:

- `projectId`
- `campaignContextVersion`
- `planningCapabilityId` / `planningCapabilityVersion`
- `strategyCapabilityVersion`
- `strategyGraphVersion`
- `decisionEngineVersion`
- `decisionCount`
- `strategyGeneratedAt`
- `brandLayerVersion` (when relevant)

## Cache and reuse

`ensureCampaignPlanning()` is **deterministic** (no LLM). When a compatible stored output exists:

- Reuse immediately
- Do not rebuild Strategy or Decisions
- Set `planningMetadata.cacheReused: true` and `planningSource: "stored"`

Rebuild only when upstream truth changes.

## Invalidation

Planning is invalidated when:

- `campaignContextVersion` changes (clears all `campaignBrainOutputs`)
- Strategy output changes (`strategyGeneratedAt`, capability version, decision count)
- Strategy graph or decision engine version bumps
- Brand layer version changes (when bound in metadata)
- Planning layer version bumps

Planning is **not** invalidated by:

- Opening/closing the briefing modal
- Previous/Next navigation
- Developer diagnostics toggles
- Schedule date changes (unless plan explicitly binds to dates — not implemented in 11.1)

## Planning vs scheduling

| PlanningGraph | campaignSchedule |
|---------------|------------------|
| Execution order, dependencies, readiness | Approved internal date/time |
| Proposes what Emma will do and when logically | Customer scheduling decision |
| Does not mark `scheduled` / `published` / `active` | Sprint 7.6 authoritative record |

## Executive Briefing presentation

Primary sections (V2):

1. Executive summary
2. Top decisions
3. Business impact
4. Execution plan (when planning exists)
5. What Emma needs from you
6. Risks and unknowns
7. Approval summary

Customer-facing copy comes from `planning-presenter.ts` — no internal graph terminology.

Progressive disclosure: Briefing → Decision → Execution Plan → Planning Decision → Dependency → Evidence → Research.

## Future Creative Layer handover

PlanningGraph `executionStages` with `ownerBrain: "creative"` identify where Creative Layer will attach. Sprint 11.1 does **not** generate creative assets inside Planning.

## Key files

- `lib/brain/integration/ensure-campaign-planning.ts` — build/reuse orchestration
- `lib/brain/integration/merge-campaign-planning-outputs.ts` — persist hook
- `lib/brain/planning/planning-cache-identity.ts` — cache compatibility
- `lib/brain/planning/map-planning-graph-to-output.ts` — persistence mapping
- `lib/brain/layers/planning/` — graph engines and validation
- `lib/brain/presentation/executive-briefing.ts` — briefing sections
- `lib/office/campaign/live-campaign-context-store.ts` — `persistCampaignBrainOutputs`
