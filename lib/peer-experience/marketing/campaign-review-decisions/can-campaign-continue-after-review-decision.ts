import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";
import type { MarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import {
  findCampaignStrategyWorkUnit,
  findCreativeDirectionWorkUnit,
  findEmailCampaignWorkUnits,
  findLinkedInPostWorkUnits,
  isCampaignStrategyWorkUnitReviewReady,
  isCreativeDirectionWorkUnitReviewReady,
  isEmailCampaignWorkUnitReviewReady,
  isLinkedInPostWorkUnitReviewReady,
} from "../runtime/identify-work-unit";
import type { CampaignReviewArtifactType } from "../campaign-review/campaign-review-types";
import { getCampaignArtifactVersion } from "./campaign-artifact-version";
import { resolveCurrentCampaignReviewDecision } from "./campaign-review-decision-history";
import type {
  CampaignArtifactVersionMap,
  CampaignReviewDecisionMap,
} from "./campaign-review-decision-types";

export type CampaignReviewArtifactContext = {
  readonly workUnitId: string;
  readonly artifactType: CampaignReviewArtifactType;
  readonly reviewReady: boolean;
  readonly hasArtifact: boolean;
  readonly artifactVersion: number;
};

export function listCampaignReviewArtifactContexts(input: {
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  linkedinPostByWorkUnitId?: Readonly<Record<string, MarketingLinkedInPost>>;
  emailByWorkUnitId?: Readonly<Record<string, MarketingEmailCampaign>>;
  artifactVersions?: CampaignArtifactVersionMap;
}): CampaignReviewArtifactContext[] {
  const contexts: CampaignReviewArtifactContext[] = [];

  const strategyUnit = findCampaignStrategyWorkUnit(input.projectId, input.workUnits);
  if (strategyUnit && !strategyUnit.cancelled) {
    contexts.push({
      workUnitId: strategyUnit.id,
      artifactType: "campaign_strategy",
      reviewReady: isCampaignStrategyWorkUnitReviewReady(strategyUnit),
      hasArtifact: Boolean(input.strategy?.summary?.trim()),
      artifactVersion: getCampaignArtifactVersion(strategyUnit.id, input.artifactVersions),
    });
  }

  const creativeUnit = findCreativeDirectionWorkUnit(input.projectId, input.workUnits);
  const brief = input.creativeBriefByCampaignId?.[input.projectId];
  if (creativeUnit && !creativeUnit.cancelled) {
    contexts.push({
      workUnitId: creativeUnit.id,
      artifactType: "creative_direction",
      reviewReady: isCreativeDirectionWorkUnitReviewReady(creativeUnit),
      hasArtifact: Boolean(brief?.campaignGoal.summary?.trim()),
      artifactVersion: getCampaignArtifactVersion(creativeUnit.id, input.artifactVersions),
    });
  }

  for (const unit of findLinkedInPostWorkUnits(input.projectId, input.workUnits)) {
    const post = input.linkedinPostByWorkUnitId?.[unit.id];
    contexts.push({
      workUnitId: unit.id,
      artifactType: "linkedin_post",
      reviewReady: isLinkedInPostWorkUnitReviewReady(unit),
      hasArtifact: Boolean(post?.body?.trim()),
      artifactVersion: getCampaignArtifactVersion(unit.id, input.artifactVersions),
    });
  }

  for (const unit of findEmailCampaignWorkUnits(input.projectId, input.workUnits)) {
    const email = input.emailByWorkUnitId?.[unit.id];
    contexts.push({
      workUnitId: unit.id,
      artifactType: "email_campaign",
      reviewReady: isEmailCampaignWorkUnitReviewReady(unit),
      hasArtifact: Boolean(email?.body?.trim()),
      artifactVersion: getCampaignArtifactVersion(unit.id, input.artifactVersions),
    });
  }

  return contexts;
}

export function campaignReviewBlocksContinuation(input: {
  approvalMode: CampaignApprovalMode | undefined;
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  linkedinPostByWorkUnitId?: Readonly<Record<string, MarketingLinkedInPost>>;
  emailByWorkUnitId?: Readonly<Record<string, MarketingEmailCampaign>>;
  decisions?: CampaignReviewDecisionMap;
  artifactVersions?: CampaignArtifactVersionMap;
}): boolean {
  if (input.approvalMode === "no_approval_required") {
    return false;
  }
  if (input.approvalMode === "approval_before_publication") {
    return false;
  }

  const contexts = listCampaignReviewArtifactContexts(input);
  for (const ctx of contexts) {
    if (!ctx.reviewReady || !ctx.hasArtifact) continue;
    const decision = resolveCurrentCampaignReviewDecision({
      workUnitId: ctx.workUnitId,
      artifactVersion: ctx.artifactVersion,
      decisions: input.decisions,
    });
    if (!decision || decision.decision !== "approved") {
      return true;
    }
  }
  return false;
}

export function canCampaignContinueAfterReviewDecision(input: {
  approvalMode: CampaignApprovalMode | undefined;
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  linkedinPostByWorkUnitId?: Readonly<Record<string, MarketingLinkedInPost>>;
  emailByWorkUnitId?: Readonly<Record<string, MarketingEmailCampaign>>;
  decisions?: CampaignReviewDecisionMap;
  artifactVersions?: CampaignArtifactVersionMap;
}): boolean {
  return !campaignReviewBlocksContinuation(input);
}
