import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { BrainCapabilityId } from "./registry";

/**
 * Legacy module ids from lib/office/brain/types.ts prep.
 * Kept only for migration — capabilities are canonical.
 */
export type LegacyBrainModuleId =
  | "business"
  | "website"
  | "competitor"
  | "seo"
  | "strategy"
  | "channel"
  | "content"
  | "campaign"
  | "publishing"
  | "optimization";

/** Canonical mapping from legacy prep modules → shared capabilities. */
export const LEGACY_MODULE_TO_CAPABILITY: Readonly<
  Record<LegacyBrainModuleId, BrainCapabilityId>
> = {
  business: "company_understanding",
  website: "website_understanding",
  seo: "website_understanding",
  competitor: "competitor_understanding",
  strategy: "strategy",
  channel: "channel_planning",
  content: "creative_generation",
  campaign: "strategy",
  publishing: "creative_generation",
  optimization: "optimization",
};

/**
 * Original workflow → module mapping from office prep.
 * DO NOT duplicate — capabilities derive from this single source.
 */
export const WORKFLOW_STEP_BRAIN_MODULES: Readonly<
  Record<CampaignWorkflowStepId, readonly LegacyBrainModuleId[]>
> = {
  business_analyzed: ["business"],
  website_analyzed: ["website", "seo"],
  competitors_analyzed: ["competitor"],
  strategy_determined: ["strategy", "business", "competitor"],
  channels_selected: ["channel", "strategy"],
  deliverables_created: ["content", "channel"],
  waiting_for_approval: ["campaign"],
  scheduled: ["publishing", "campaign"],
  published: ["publishing"],
  optimizing: ["optimization", "publishing"],
};

function uniqueCapabilities(ids: readonly BrainCapabilityId[]): readonly BrainCapabilityId[] {
  return [...new Set(ids)];
}

/** Canonical workflow → capability map for all peers. */
export const WORKFLOW_STEP_CAPABILITIES: Readonly<
  Record<CampaignWorkflowStepId, readonly BrainCapabilityId[]>
> = Object.fromEntries(
  (Object.entries(WORKFLOW_STEP_BRAIN_MODULES) as [CampaignWorkflowStepId, readonly LegacyBrainModuleId[]][]).map(
    ([step, modules]) => [
      step,
      uniqueCapabilities(modules.map((m) => LEGACY_MODULE_TO_CAPABILITY[m])),
    ]
  )
) as Record<CampaignWorkflowStepId, readonly BrainCapabilityId[]>;

export function capabilitiesForWorkflowStep(
  stepId: CampaignWorkflowStepId
): readonly BrainCapabilityId[] {
  return WORKFLOW_STEP_CAPABILITIES[stepId] ?? [];
}
