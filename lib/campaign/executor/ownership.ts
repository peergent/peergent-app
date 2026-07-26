/**
 * Architectural ownership for Campaign Executor (boundary only).
 * Operation intent translation — not persistence or side effects.
 */

export const CAMPAIGN_EXECUTOR_OWNED_MODULES = [
  "planToOperationTranslation",
  "operationOrdering",
  "idempotency",
  "executionRestrictions",
  "ownerAssignmentProposals",
  "dependencyLinkProposals",
  "campaignTargetStatusProposals",
] as const;

export type CampaignExecutorOwnedModule = (typeof CAMPAIGN_EXECUTOR_OWNED_MODULES)[number];

export const CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS = [
  "planning",
  "workUnitPersistence",
  "campaignPersistence",
  "actualApprovals",
  "aiExecution",
  "contentGeneration",
  "publishing",
  "notifications",
  "ui",
  "storage",
  "hooks",
  "sessionStorage",
] as const;

export type CampaignExecutorExcludedConcern = (typeof CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS)[number];

export const CAMPAIGN_EXECUTOR_MODULE_DESCRIPTIONS: Readonly<
  Record<CampaignExecutorOwnedModule, string>
> = {
  planToOperationTranslation:
    "Maps CampaignExecutionPlan work packages to proposed execution operations.",
  operationOrdering:
    "Stable sequence aligned with planner execution order and dependency safety.",
  idempotency:
    "Deterministic operation ids and keys; suppresses duplicate work unit creation.",
  executionRestrictions:
    "Blocked, restricted, and manual-only policies preserved as non-executable intent.",
  ownerAssignmentProposals:
    "Conservative responsibility-based owner assignment proposals only.",
  dependencyLinkProposals:
    "Dependency links between proposed or existing work unit references.",
  campaignTargetStatusProposals:
    "Target campaign lifecycle transitions as explicit mark operations.",
};

export const CAMPAIGN_EXECUTOR_REQUIRED_SECTIONS = CAMPAIGN_EXECUTOR_OWNED_MODULES;

export type CampaignExecutorRequiredSection = (typeof CAMPAIGN_EXECUTOR_REQUIRED_SECTIONS)[number];

export const CAMPAIGN_EXECUTOR_GAPS = CAMPAIGN_EXECUTOR_OWNED_MODULES;

export type CampaignExecutorGap = CampaignExecutorOwnedModule;
