import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";
import { resolveInvalidationCascade, type InvalidationNode } from "@/lib/brain/invalidation/dependency-graph";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignWorkflowStepId } from "./workflow-types";
import type { DemoStepApprovalStatus } from "@/lib/office/demo/demo-workflow-simulation";

export type CampaignContextChangeTrigger =
  | "brand_context"
  | "website"
  | "competitors"
  | "goal"
  | "audience";

const TRIGGER_TO_INVALIDATION: Record<CampaignContextChangeTrigger, InvalidationNode> = {
  brand_context: "company_profile",
  website: "website_snapshot",
  competitors: "competitor_understanding",
  goal: "company_profile",
  audience: "company_profile",
};

export function invalidationTriggerForContextChange(
  trigger: CampaignContextChangeTrigger
): InvalidationNode {
  return TRIGGER_TO_INVALIDATION[trigger];
}

export function capabilitiesInvalidatedByChange(
  trigger: CampaignContextChangeTrigger
): readonly BrainCapabilityId[] {
  const node = invalidationTriggerForContextChange(trigger);
  const capabilityIds = new Set<BrainCapabilityId>([
    "company_understanding",
    "website_understanding",
    "competitor_understanding",
    "strategy",
    "channel_planning",
    "creative_generation",
    "optimization",
  ]);
  return resolveInvalidationCascade(node).filter((n): n is BrainCapabilityId =>
    capabilityIds.has(n as BrainCapabilityId)
  );
}

export function nextCampaignContextVersion(project: MarketingProject): number {
  return (project.campaignSetup?.campaignContextVersion ?? 0) + 1;
}

/** Clears downstream approvals when upstream context changes — monotonic workflow. */
export function approvalsToClearOnInvalidation(
  trigger: CampaignContextChangeTrigger
): Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>> {
  const affected = capabilitiesInvalidatedByChange(trigger);
  const clear: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>> = {};

  if (affected.includes("strategy")) {
    clear.strategy_determined = "pending";
  }
  if (affected.includes("channel_planning")) {
    clear.channels_selected = "pending";
  }
  if (affected.includes("creative_generation")) {
    clear.deliverables_created = "pending";
  }

  return clear;
}

export function mergeStepApprovals(
  existing: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>> | undefined,
  patch: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>>
): Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>> {
  const next = { ...existing };
  for (const [step, status] of Object.entries(patch) as [
    CampaignWorkflowStepId,
    DemoStepApprovalStatus,
  ][]) {
    if (status === "pending") {
      delete next[step];
    } else {
      next[step] = status;
    }
  }
  return next;
}
