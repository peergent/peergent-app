import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { getBrainCapability } from "../capabilities/registry";
import { STRATEGY_GRAPH_VERSION } from "../strategy/strategy-graph";
import { DECISION_ENGINE_VERSION } from "../decision/decision-types";
import { PLANNING_LAYER_VERSION } from "../layers/planning/types";
import { BRAND_LAYER_VERSION } from "../layers/brand/types";
import {
  CAMPAIGN_PLANNING_CAPABILITY_ID,
  type PlanningOutputMetadata,
} from "./campaign-planning-types";
import { isStoredOutputCompatible, readCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";

export function computePlanningCacheIdentity(input: {
  project: MarketingProject;
  strategyOutput: BrainStructuredOutput;
  brandLayerVersion?: string;
}): PlanningOutputMetadata {
  const contextVersion = input.project.campaignSetup?.campaignContextVersion ?? 0;
  const planningDef = getBrainCapability(CAMPAIGN_PLANNING_CAPABILITY_ID);

  return {
    projectId: input.project.id,
    contextVersion,
    planningCapabilityId: CAMPAIGN_PLANNING_CAPABILITY_ID,
    planningCapabilityVersion: planningDef.version,
    strategyCapabilityVersion: input.strategyOutput.capabilityVersion,
    strategyGraphVersion: STRATEGY_GRAPH_VERSION,
    decisionEngineVersion: DECISION_ENGINE_VERSION,
    decisionCount: input.strategyOutput.decisionRecords?.length ?? 0,
    brandLayerVersion: input.brandLayerVersion ?? BRAND_LAYER_VERSION,
    strategyGeneratedAt: input.strategyOutput.generatedAt,
    validationStatus: "valid",
    planningSource: "built",
    cacheReused: false,
  };
}

export function isPlanningMetadataCompatible(
  stored: PlanningOutputMetadata | undefined,
  expected: PlanningOutputMetadata
): boolean {
  if (!stored) return false;
  return (
    stored.projectId === expected.projectId &&
    stored.contextVersion === expected.contextVersion &&
    stored.planningCapabilityVersion === expected.planningCapabilityVersion &&
    stored.strategyCapabilityVersion === expected.strategyCapabilityVersion &&
    stored.strategyGraphVersion === expected.strategyGraphVersion &&
    stored.decisionEngineVersion === expected.decisionEngineVersion &&
    stored.decisionCount === expected.decisionCount &&
    stored.strategyGeneratedAt === expected.strategyGeneratedAt &&
    (stored.brandLayerVersion ?? BRAND_LAYER_VERSION) === (expected.brandLayerVersion ?? BRAND_LAYER_VERSION)
  );
}

export function readStoredCampaignPlanning(project: MarketingProject): BrainStructuredOutput | undefined {
  const outputs = readCampaignBrainOutputs(project);
  const planning = outputs[CAMPAIGN_PLANNING_CAPABILITY_ID];
  if (!planning) return undefined;
  if (!isStoredOutputCompatible(CAMPAIGN_PLANNING_CAPABILITY_ID, planning)) return undefined;
  return planning;
}

export function isStoredCampaignPlanningCompatible(
  project: MarketingProject,
  strategyOutput: BrainStructuredOutput
): boolean {
  const stored = readStoredCampaignPlanning(project);
  if (!stored?.planningGraph) return false;
  const expected = computePlanningCacheIdentity({ project, strategyOutput });
  return isPlanningMetadataCompatible(stored.planningMetadata, expected);
}

/** Planning layer version bump invalidates stored planning even when strategy unchanged. */
export function storedPlanningLayerVersionMatches(stored: BrainStructuredOutput | undefined): boolean {
  if (!stored?.planningGraph) return false;
  return stored.planningGraph.version === PLANNING_LAYER_VERSION;
}
