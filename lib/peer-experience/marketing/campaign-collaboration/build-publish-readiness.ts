import type { CampaignReviewItem } from "../campaign-review/campaign-review-types";
import { isCustomerReviewRelevant } from "../campaign-review/campaign-review-status";
import { campaignReviewBlocksContinuation } from "../campaign-review-decisions/can-campaign-continue-after-review-decision";
import { resolveCampaignExperienceMode } from "@/lib/office/campaign/campaign-experience-mode";
import {
  computeCampaignPackageVersion,
  isCampaignApprovalValid,
  resolveCampaignApprovalForProject,
} from "../campaign-approval";

import type {
  CampaignCollaborationBuildInput,
  CampaignPublishReadinessStatus,
  CampaignPublishReadinessViewModel,
} from "./campaign-collaboration-types";

export function buildCampaignPublishReadinessViewModel(input: {
  reviewItems: readonly CampaignReviewItem[];
  buildInput: CampaignCollaborationBuildInput;
}): CampaignPublishReadinessViewModel {
  const diagnostics: string[] = [];
  const approvalRelevant = isCustomerReviewRelevant(input.buildInput.approvalMode);

  const inProgress = input.reviewItems.some((i) => i.status === "in_progress");
  const updating = input.reviewItems.some((i) => i.decisionStatus === "updating");
  if (input.buildInput.continuationRunning || inProgress || updating) {
    diagnostics.push("Marketing Peer is still generating campaign deliverables.");
    return readiness("waiting_for_generation", diagnostics);
  }

  const needsRevision = input.reviewItems.some(
    (i) => i.decisionStatus === "changes_requested" || i.canRequestRevision
  );
  if (needsRevision) {
    diagnostics.push("One or more items have requested changes or pending revision.");
    return readiness("waiting_for_revisions", diagnostics);
  }

  const needsReview = input.reviewItems.some((i) => i.inReviewQueue);
  if (needsReview && resolveCampaignExperienceMode(input.buildInput.approvalMode) === "guided") {
    diagnostics.push("One or more deliverables are awaiting customer review.");
    return readiness("waiting_for_review", diagnostics);
  }

  const experienceMode = resolveCampaignExperienceMode(input.buildInput.approvalMode);
  if (experienceMode === "approval_required") {
    const project = input.buildInput.project;
    const approval = resolveCampaignApprovalForProject({
      projectId: input.buildInput.projectId,
      campaignApprovalByProjectId: input.buildInput.campaignApprovalByProjectId,
    });
    const packageVersion = computeCampaignPackageVersion({ project });
    if (!isCampaignApprovalValid(approval, packageVersion)) {
      diagnostics.push("Campaign management briefing awaiting approval.");
      return readiness("waiting_for_review", diagnostics);
    }
    diagnostics.push("Campaign package approved on current version.");
    return readiness("ready", diagnostics);
  }

  if (needsReview) {
    diagnostics.push("One or more deliverables are awaiting customer review.");
    return readiness("waiting_for_review", diagnostics);
  }

  const rejected = input.reviewItems.some((i) => i.decisionStatus === "rejected");
  if (rejected) {
    diagnostics.push("Rejected items need customer direction before publishing.");
    return readiness("waiting_for_revisions", diagnostics);
  }

  if (approvalRelevant) {
    const trackable = input.reviewItems.filter((i) => i.preview);
    const notApproved = trackable.filter(
      (i) => i.decisionStatus !== "approved" || !i.currentDecision
    );
    if (notApproved.length > 0) {
      diagnostics.push("Not every deliverable has an approved current version.");
      return readiness("waiting_for_review", diagnostics);
    }

    const blocked = campaignReviewBlocksContinuation({
      approvalMode: input.buildInput.approvalMode,
      projectId: input.buildInput.projectId,
      workUnits: input.buildInput.workUnits,
      strategy: input.buildInput.strategy,
      creativeBriefByCampaignId: input.buildInput.creativeBriefByCampaignId,
      linkedinPostByWorkUnitId: input.buildInput.linkedinPostByWorkUnitId,
      emailByWorkUnitId: input.buildInput.emailByWorkUnitId,
      decisions: input.buildInput.campaignReviewDecisionByWorkUnitId,
      artifactVersions: input.buildInput.campaignArtifactVersionByWorkUnitId,
    });
    if (blocked) {
      diagnostics.push("Campaign continuation is blocked by review policy.");
      return readiness("waiting_for_review", diagnostics);
    }
  }

  diagnostics.push("All required deliverables are approved on their latest version.");
  return readiness("ready", diagnostics);
}

function readiness(
  status: CampaignPublishReadinessStatus,
  diagnostics: string[]
): CampaignPublishReadinessViewModel {
  switch (status) {
    case "ready":
      return {
        status,
        customerLabel: "Ready for publishing",
        customerSummary: "Every required deliverable is approved. Publishing will be available in a future release.",
        diagnostics,
      };
    case "waiting_for_review":
      return {
        status,
        customerLabel: "Waiting for your review",
        customerSummary: "Review prepared deliverables to move the campaign forward.",
        diagnostics,
      };
    case "waiting_for_revisions":
      return {
        status,
        customerLabel: "Waiting for revisions",
        customerSummary: "Marketing Peer needs your direction or feedback before continuing.",
        diagnostics,
      };
    case "waiting_for_generation":
      return {
        status,
        customerLabel: "Waiting for generation",
        customerSummary: "Marketing Peer is still preparing campaign deliverables.",
        diagnostics,
      };
    default:
      return {
        status: "waiting_for_review",
        customerLabel: "Waiting for your review",
        customerSummary: "Review prepared deliverables to move the campaign forward.",
        diagnostics,
      };
  }
}
