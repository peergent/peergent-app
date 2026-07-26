/**
 * Architectural ownership for Campaign Planner (boundary only).
 * Deterministic work decomposition — not persistence, AI, or rendering.
 */

export const CAMPAIGN_PLANNER_OWNED_MODULES = [
  "workDecomposition",
  "deterministicSequencing",
  "dependencies",
  "recommendedOwnership",
  "effortBands",
  "approvalPlacement",
  "planGaps",
  "existingWorkMergeInterpretation",
] as const;

export type CampaignPlannerOwnedModule =
  (typeof CAMPAIGN_PLANNER_OWNED_MODULES)[number];

export const CAMPAIGN_PLANNER_EXCLUDED_CONCERNS = [
  "campaignPersistence",
  "workUnitPersistence",
  "generatedContent",
  "creativeBriefContents",
  "marketingDecisionContents",
  "aiExecution",
  "publishing",
  "performanceValues",
  "ui",
  "storage",
  "promptBuilder",
  "aiRuntime",
  "database",
] as const;

export type CampaignPlannerExcludedConcern =
  (typeof CAMPAIGN_PLANNER_EXCLUDED_CONCERNS)[number];

export const CAMPAIGN_PLANNER_MODULE_DESCRIPTIONS: Readonly<
  Record<CampaignPlannerOwnedModule, string>
> = {
  workDecomposition:
    "Breaking campaign intent into executable work packages without generating deliverable bodies.",
  deterministicSequencing:
    "Stable ordering and execution order derived from policy and dependencies.",
  dependencies:
    "Directed acyclic edges between packages; conservative defaults when intelligence refs are absent.",
  recommendedOwnership:
    "Suggested workforce role or responsibility for each package — not assignment persistence.",
  effortBands:
    "Low / medium / high effort estimates from plan metadata or fixed tables.",
  approvalPlacement:
    "Where human gates apply in the sequence based on campaign and decision policy.",
  planGaps:
    "Explicit missing inputs (channels, plan, briefs) — never silently filled.",
  existingWorkMergeInterpretation:
    "Mapping prior Work Unit summaries to packages without mutating units.",
};

export const CAMPAIGN_PLANNER_REQUIRED_SECTIONS = CAMPAIGN_PLANNER_OWNED_MODULES;

export type CampaignPlannerRequiredSection =
  (typeof CAMPAIGN_PLANNER_REQUIRED_SECTIONS)[number];

export const CAMPAIGN_PLANNER_GAPS = CAMPAIGN_PLANNER_OWNED_MODULES;

export type CampaignPlannerGap = CampaignPlannerOwnedModule;
