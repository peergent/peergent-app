import { resolveCampaignExperienceMode } from "@/lib/office/campaign/campaign-experience-mode";
import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { MarketingProject } from "../projects/types";
import type { CampaignReviewItem } from "../campaign-review/campaign-review-types";
import { isExecutiveBriefingReady } from "../campaign-review/build-campaign-executive-briefing";
import type { CampaignApprovalRecord, CampaignPackageVersion } from "./campaign-approval-types";
import { computeCampaignPackageVersion } from "./compute-campaign-package-version";

export function isCampaignApprovalValid(
  approval: CampaignApprovalRecord | null | undefined,
  current: CampaignPackageVersion
): boolean {
  if (!approval) return false;
  return approval.campaignPackageVersion === current.campaignPackageVersion;
}

export function resolveCampaignApprovalForProject(input: {
  projectId: string;
  campaignApprovalByProjectId?: Readonly<Record<string, CampaignApprovalRecord>>;
}): CampaignApprovalRecord | null {
  return input.campaignApprovalByProjectId?.[input.projectId] ?? null;
}

export function isCampaignApprovalPending(input: {
  project: MarketingProject;
  allReviewItems: readonly CampaignReviewItem[];
  approvalMode?: CampaignApprovalMode;
  campaignApproval?: CampaignApprovalRecord | null;
  executiveBriefing?: ExecutiveCampaignBriefing | null;
}): boolean {
  if (!isExecutiveBriefingReady({
    allReviewItems: input.allReviewItems,
    approvalMode: input.approvalMode,
    project: input.project,
  })) return false;
  if (resolveCampaignExperienceMode(input.approvalMode) !== "approval_required") {
    return false;
  }
  const current = computeCampaignPackageVersion({
    project: input.project,
  });
  return !isCampaignApprovalValid(input.campaignApproval, current);
}

export function isCampaignPublicationUnlocked(input: {
  project: MarketingProject;
  approvalMode?: CampaignApprovalMode;
  campaignApproval?: CampaignApprovalRecord | null;
  executiveBriefing?: ExecutiveCampaignBriefing | null;
}): boolean {
  if (resolveCampaignExperienceMode(input.approvalMode) !== "approval_required") {
    return true;
  }
  const current = computeCampaignPackageVersion({
    project: input.project,
  });
  return isCampaignApprovalValid(input.campaignApproval, current);
}
