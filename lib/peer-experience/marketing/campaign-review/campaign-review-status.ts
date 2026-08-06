import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import {
  requiresStepByStepReview,
  resolveCampaignExperienceMode,
  type CampaignExperienceMode,
} from "@/lib/office/campaign/campaign-experience-mode";

import type { CampaignReviewViewModel } from "./campaign-review-types";

export type CampaignCustomerStatusInput = {
  readonly onboardingComplete: boolean;
  readonly hasExecutionWork: boolean;
  readonly reviewQueueCount: number;
  readonly executiveBriefingPending?: boolean;
  readonly preparedCount: number;
  readonly totalTrackable: number;
  readonly continuationRunning: boolean;
  readonly activeWorkUnitId: string | null;
  readonly blockedCustomerMessage: string | null;
};

export type CampaignCustomerStatus = {
  readonly statusLabel: string;
  readonly customerSummary: string;
  readonly currentFocus: string;
  readonly needsAttention: boolean;
  readonly attentionMessage: string | null;
  readonly primaryActionLabel: string | null;
};

export function resolveCampaignReviewExperienceMode(
  approvalMode: CampaignApprovalMode | undefined
): CampaignExperienceMode {
  return resolveCampaignExperienceMode(approvalMode);
}

export function isCustomerReviewRelevant(
  approvalMode: CampaignApprovalMode | undefined
): boolean {
  if (!approvalMode) {
    return true;
  }
  return requiresStepByStepReview(resolveCampaignExperienceMode(approvalMode));
}

export function resolveCampaignCustomerStatus(
  input: CampaignCustomerStatusInput
): CampaignCustomerStatus {
  if (!input.onboardingComplete && !input.hasExecutionWork) {
    return {
      statusLabel: "Setup required",
      customerSummary: "Finish campaign setup so Marketing Peer can begin preparing your campaign.",
      currentFocus: "Campaign setup",
      needsAttention: true,
      attentionMessage: "Complete setup to unlock campaign preparation.",
      primaryActionLabel: "Continue setup",
    };
  }

  if (input.blockedCustomerMessage) {
    return {
      statusLabel: "Needs attention",
      customerSummary: input.blockedCustomerMessage,
      currentFocus: "Resolve blockers",
      needsAttention: true,
      attentionMessage: input.blockedCustomerMessage,
      primaryActionLabel: "View campaign details",
    };
  }

  if (input.executiveBriefingPending) {
    return {
      statusLabel: "Ready for your review",
      customerSummary: "Emma prepared your management briefing — one review, then she can continue.",
      currentFocus: "Management briefing",
      needsAttention: true,
      attentionMessage: "Review Emma's management briefing to approve the campaign approach.",
      primaryActionLabel: "Review briefing",
    };
  }

  if (input.reviewQueueCount > 0) {
    const n = input.reviewQueueCount;
    return {
      statusLabel: "Waiting for your review",
      customerSummary:
        n === 1
          ? "Marketing Peer prepared 1 item for your review."
          : `Marketing Peer prepared ${n} items for your review.`,
      currentFocus: "Your review",
      needsAttention: true,
      attentionMessage:
        n === 1
          ? "Marketing Peer prepared 1 item for your review."
          : `Marketing Peer prepared ${n} items for your review.`,
      primaryActionLabel: n === 1 ? "Review item" : `Review ${n} items`,
    };
  }

  if (input.continuationRunning || input.activeWorkUnitId) {
    return {
      statusLabel: "Marketing Peer is working",
      customerSummary: "Marketing Peer is continuing your campaign.",
      currentFocus: "Preparing campaign deliverables",
      needsAttention: false,
      attentionMessage: null,
      primaryActionLabel: null,
    };
  }

  if (
    input.totalTrackable > 0 &&
    input.preparedCount >= input.totalTrackable
  ) {
    return {
      statusLabel: "Campaign prepared",
      customerSummary: "Everything Marketing Peer can prepare right now is ready.",
      currentFocus: "Review and publishing next",
      needsAttention: false,
      attentionMessage: null,
      primaryActionLabel: null,
    };
  }

  if (!input.hasExecutionWork) {
    return {
      statusLabel: "Ready to start",
      customerSummary: "Your campaign is ready for Marketing Peer to begin.",
      currentFocus: "Ready to start",
      needsAttention: false,
      attentionMessage: null,
      primaryActionLabel: "Start campaign",
    };
  }

  return {
    statusLabel: "Marketing Peer is working",
    customerSummary: "Marketing Peer is preparing your campaign.",
    currentFocus: "Preparing campaign deliverables",
    needsAttention: false,
    attentionMessage: null,
    primaryActionLabel: null,
  };
}

export function customerStatusLabelForReviewItem(status: string): string {
  switch (status) {
    case "awaiting_review":
      return "Ready for your review";
    case "prepared":
      return "Prepared";
    case "in_progress":
      return "In progress";
    case "upcoming":
      return "Up next";
    case "blocked":
      return "Waiting on earlier steps";
    default:
      return "In progress";
  }
}

export function assertCustomerSafePresentation(text: string): void {
  const forbidden = [
    "work unit",
    "workunit",
    "executor",
    "idempotency",
    "runtime kind",
    "campaign_strategy",
    "creative_direction",
    "linkedin_post",
    "email_campaign",
    "operation",
    "dependency",
  ];
  const lower = text.toLowerCase();
  for (const term of forbidden) {
    if (lower.includes(term)) {
      throw new Error(`Customer presentation must not expose internal term: ${term}`);
    }
  }
}

export type CustomerCampaignPresentation = Pick<
  CampaignReviewViewModel,
  | "campaignStatusLabel"
  | "customerSummary"
  | "currentFocus"
  | "attentionMessage"
  | "primaryActionLabel"
>;

export function extractCustomerPresentation(
  vm: CampaignReviewViewModel
): CustomerCampaignPresentation {
  const presentation = {
    campaignStatusLabel: vm.campaignStatusLabel,
    customerSummary: vm.customerSummary,
    currentFocus: vm.currentFocus,
    attentionMessage: vm.attentionMessage,
    primaryActionLabel: vm.primaryActionLabel,
  };
  assertCustomerSafePresentation(presentation.campaignStatusLabel);
  assertCustomerSafePresentation(presentation.customerSummary);
  assertCustomerSafePresentation(presentation.currentFocus);
  if (presentation.attentionMessage) {
    assertCustomerSafePresentation(presentation.attentionMessage);
  }
  if (presentation.primaryActionLabel) {
    assertCustomerSafePresentation(presentation.primaryActionLabel);
  }
  return presentation;
}
