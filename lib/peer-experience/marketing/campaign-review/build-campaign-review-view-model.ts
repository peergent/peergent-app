import { lifecycleStageIndex } from "@/lib/peer-workflow/work-lifecycle";

import { CampaignOrchestrator } from "../campaign-orchestrator";
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
import {
  CAMPAIGN_REVIEW_ARTIFACT_TYPE_LABELS,
  buildCampaignStrategyReviewPreview,
  buildCreativeDirectionReviewPreview,
  buildEmailReviewPreview,
  buildLinkedInReviewPreview,
  shortSummaryFromPreview,
} from "./campaign-review-artifact-presenter";
import {
  customerStatusLabelForReviewItem,
  isCustomerReviewRelevant,
  resolveCampaignCustomerStatus,
} from "./campaign-review-status";
import type {
  CampaignReviewBuildInput,
  CampaignReviewItem,
  CampaignReviewItemPreview,
  CampaignReviewProgressPhase,
  CampaignReviewViewModel,
} from "./campaign-review-types";

const ARTIFACT_ORDER: Record<
  CampaignReviewItem["artifactType"],
  number
> = {
  campaign_strategy: 0,
  creative_direction: 1,
  linkedin_post: 2,
  email_campaign: 3,
};

function isReviewReadyStage(unit: { status: string }): boolean {
  return lifecycleStageIndex(unit.status as never) >= lifecycleStageIndex("review_ready");
}

function sortReviewItems(items: CampaignReviewItem[]): CampaignReviewItem[] {
  return [...items].sort((a, b) => {
    const order =
      ARTIFACT_ORDER[a.artifactType] - ARTIFACT_ORDER[b.artifactType];
    if (order !== 0) return order;
    return a.workUnitId.localeCompare(b.workUnitId);
  });
}

function buildStrategyItem(input: CampaignReviewBuildInput): CampaignReviewItem | null {
  const unit = findCampaignStrategyWorkUnit(input.projectId, input.workUnits);
  if (!unit || unit.cancelled) return null;

  const strategy = input.strategy;
  const hasArtifact = Boolean(strategy?.summary?.trim());
  const preview: CampaignReviewItemPreview | null = hasArtifact && strategy
    ? buildCampaignStrategyReviewPreview({ project: input.project, strategy })
    : null;

  const reviewReady = isCampaignStrategyWorkUnitReviewReady(unit);
  const reviewRequired =
    isCustomerReviewRelevant(input.approvalMode) && reviewReady && hasArtifact;

  let status: CampaignReviewItem["status"] = "upcoming";
  if (unit.status === "creating") status = "in_progress";
  else if (reviewReady && hasArtifact) {
    status = reviewRequired ? "awaiting_review" : "prepared";
  } else if (hasArtifact || unit.eventLog.length > 1) status = "in_progress";

  return {
    id: unit.id,
    workUnitId: unit.id,
    artifactType: "campaign_strategy",
    artifactTypeLabel: CAMPAIGN_REVIEW_ARTIFACT_TYPE_LABELS.campaign_strategy,
    title: input.project.title
      ? `${input.project.title} — Strategy`
      : "Campaign strategy",
    shortSummary: shortSummaryFromPreview(preview),
    status,
    statusLabel: customerStatusLabelForReviewItem(status),
    preparedByLabel: input.peerName,
    preview,
    reviewRequired,
    blockingNextWork: reviewRequired,
    createdAt: unit.startedAt ?? null,
    updatedAt: unit.updatedAt ?? null,
  };
}

function buildCreativeItem(input: CampaignReviewBuildInput): CampaignReviewItem | null {
  const unit = findCreativeDirectionWorkUnit(input.projectId, input.workUnits);
  if (!unit || unit.cancelled) return null;

  const brief = input.creativeBriefByCampaignId?.[input.projectId];
  const hasArtifact = Boolean(brief?.campaignGoal.summary?.trim());
  const preview = hasArtifact && brief ? buildCreativeDirectionReviewPreview(brief) : null;
  const reviewReady = isCreativeDirectionWorkUnitReviewReady(unit);
  const reviewRequired =
    isCustomerReviewRelevant(input.approvalMode) && reviewReady && hasArtifact;

  let status: CampaignReviewItem["status"] = "upcoming";
  if (unit.status === "creating") status = "in_progress";
  else if (reviewReady && hasArtifact) {
    status = reviewRequired ? "awaiting_review" : "prepared";
  } else if (hasArtifact || isReviewReadyStage(unit)) status = "in_progress";

  const plan = CampaignOrchestrator.plan({
    projectId: input.projectId,
    workUnits: input.workUnits,
    strategy: input.strategy,
    creativeBriefByCampaignId: input.creativeBriefByCampaignId,
  });
  const blocked = plan.blockedWorkUnits.some(
    (b) => b.runtimeKind === "creative_direction"
  );

  if (blocked && !reviewReady) status = "blocked";

  return {
    id: unit.id,
    workUnitId: unit.id,
    artifactType: "creative_direction",
    artifactTypeLabel: CAMPAIGN_REVIEW_ARTIFACT_TYPE_LABELS.creative_direction,
    title: "Creative direction",
    shortSummary: shortSummaryFromPreview(preview),
    status,
    statusLabel: customerStatusLabelForReviewItem(status),
    preparedByLabel: input.peerName,
    preview,
    reviewRequired,
    blockingNextWork: false,
    createdAt: unit.startedAt ?? null,
    updatedAt: unit.updatedAt ?? null,
  };
}

function buildLinkedInItem(
  input: CampaignReviewBuildInput,
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit
): CampaignReviewItem {
  const post = input.linkedinPostByWorkUnitId?.[unit.id];
  const hasArtifact = Boolean(post?.body?.trim());
  const preview = hasArtifact && post ? buildLinkedInReviewPreview(post) : null;
  const reviewReady = isLinkedInPostWorkUnitReviewReady(unit);
  const reviewRequired =
    isCustomerReviewRelevant(input.approvalMode) && reviewReady && hasArtifact;

  let status: CampaignReviewItem["status"] = "upcoming";
  if (unit.status === "creating") status = "in_progress";
  else if (reviewReady && hasArtifact) {
    status = reviewRequired ? "awaiting_review" : "prepared";
  } else if (hasArtifact) status = "in_progress";

  const plan = CampaignOrchestrator.plan({
    projectId: input.projectId,
    workUnits: input.workUnits,
    strategy: input.strategy,
    creativeBriefByCampaignId: input.creativeBriefByCampaignId,
  });
  if (
    plan.blockedWorkUnits.some((b) => b.workUnitId === unit.id) &&
    !reviewReady
  ) {
    status = "blocked";
  }

  return {
    id: unit.id,
    workUnitId: unit.id,
    artifactType: "linkedin_post",
    artifactTypeLabel: CAMPAIGN_REVIEW_ARTIFACT_TYPE_LABELS.linkedin_post,
    title: unit.title,
    shortSummary: shortSummaryFromPreview(preview),
    status,
    statusLabel: customerStatusLabelForReviewItem(status),
    preparedByLabel: input.peerName,
    preview,
    reviewRequired,
    blockingNextWork: false,
    createdAt: unit.startedAt ?? null,
    updatedAt: unit.updatedAt ?? null,
  };
}

function buildEmailItem(
  input: CampaignReviewBuildInput,
  unit: import("@/lib/peer-workflow/work-unit").WorkUnit
): CampaignReviewItem {
  const email = input.emailByWorkUnitId?.[unit.id];
  const hasArtifact = Boolean(email?.body?.trim());
  const preview = hasArtifact && email ? buildEmailReviewPreview(email) : null;
  const reviewReady = isEmailCampaignWorkUnitReviewReady(unit);
  const reviewRequired =
    isCustomerReviewRelevant(input.approvalMode) && reviewReady && hasArtifact;

  let status: CampaignReviewItem["status"] = "upcoming";
  if (unit.status === "creating") status = "in_progress";
  else if (reviewReady && hasArtifact) {
    status = reviewRequired ? "awaiting_review" : "prepared";
  } else if (hasArtifact) status = "in_progress";

  const plan = CampaignOrchestrator.plan({
    projectId: input.projectId,
    workUnits: input.workUnits,
    strategy: input.strategy,
    creativeBriefByCampaignId: input.creativeBriefByCampaignId,
  });
  if (
    plan.blockedWorkUnits.some((b) => b.workUnitId === unit.id) &&
    !reviewReady
  ) {
    status = "blocked";
  }

  return {
    id: unit.id,
    workUnitId: unit.id,
    artifactType: "email_campaign",
    artifactTypeLabel: CAMPAIGN_REVIEW_ARTIFACT_TYPE_LABELS.email_campaign,
    title: unit.title,
    shortSummary: shortSummaryFromPreview(preview),
    status,
    statusLabel: customerStatusLabelForReviewItem(status),
    preparedByLabel: input.peerName,
    preview,
    reviewRequired,
    blockingNextWork: false,
    createdAt: unit.startedAt ?? null,
    updatedAt: unit.updatedAt ?? null,
  };
}

function buildProgressPhases(
  items: readonly CampaignReviewItem[],
  input: CampaignReviewBuildInput
): CampaignReviewProgressPhase[] {
  const strategy = items.find((i) => i.artifactType === "campaign_strategy");
  const creative = items.find((i) => i.artifactType === "creative_direction");
  const content = items.filter(
    (i) => i.artifactType === "linkedin_post" || i.artifactType === "email_campaign"
  );
  const reviewCount = items.filter((i) => i.status === "awaiting_review").length;

  const setupComplete = input.onboardingComplete || input.hasExecutionWork;
  const strategyComplete =
    strategy?.status === "prepared" || strategy?.status === "awaiting_review";
  const creativeComplete =
    creative?.status === "prepared" || creative?.status === "awaiting_review";
  const contentComplete =
    content.length > 0 &&
    content.every((c) => c.status === "prepared" || c.status === "awaiting_review");

  const phases: CampaignReviewProgressPhase[] = [
    {
      id: "setup",
      label: "Setup",
      complete: setupComplete,
      current: !setupComplete,
    },
    {
      id: "strategy",
      label: "Strategy",
      complete: strategyComplete,
      current: setupComplete && !strategyComplete,
    },
    {
      id: "creative",
      label: "Creative",
      complete: creativeComplete,
      current: strategyComplete && !creativeComplete,
    },
    {
      id: "content",
      label: "Content",
      complete: contentComplete,
      current: creativeComplete && !contentComplete && content.length > 0,
    },
    {
      id: "review",
      label: "Review",
      complete: reviewCount === 0 && contentComplete,
      current: reviewCount > 0,
    },
    { id: "publish", label: "Publish", complete: false, current: false },
    { id: "measure", label: "Measure", complete: false, current: false },
  ];

  if (!phases.some((p) => p.current) && setupComplete) {
    const firstIncomplete = phases.find((p) => !p.complete && p.id !== "publish" && p.id !== "measure");
    if (firstIncomplete) {
      return phases.map((p) =>
        p.id === firstIncomplete.id ? { ...p, current: true } : { ...p, current: false }
      );
    }
  }

  return phases;
}

function activityCopyForItem(item: CampaignReviewItem): string {
  switch (item.artifactType) {
    case "campaign_strategy":
      return item.status === "awaiting_review" || item.status === "prepared"
        ? "Campaign strategy prepared"
        : "Preparing campaign strategy";
    case "creative_direction":
      return item.status === "awaiting_review" || item.status === "prepared"
        ? "Creative direction prepared"
        : "Preparing creative direction";
    case "linkedin_post":
      return item.status === "awaiting_review" || item.status === "prepared"
        ? "LinkedIn content is ready"
        : "Writing LinkedIn content";
    case "email_campaign":
      return item.status === "awaiting_review" || item.status === "prepared"
        ? "Email campaign is ready"
        : "Preparing email campaign";
    default:
      return "Preparing campaign work";
  }
}

export function buildCampaignReviewViewModel(
  input: CampaignReviewBuildInput
): CampaignReviewViewModel {
  const items: CampaignReviewItem[] = [];

  const strategyItem = buildStrategyItem(input);
  if (strategyItem) items.push(strategyItem);

  const creativeItem = buildCreativeItem(input);
  if (creativeItem) items.push(creativeItem);

  for (const unit of findLinkedInPostWorkUnits(input.projectId, input.workUnits)) {
    items.push(buildLinkedInItem(input, unit));
  }
  for (const unit of findEmailCampaignWorkUnits(input.projectId, input.workUnits)) {
    items.push(buildEmailItem(input, unit));
  }

  const allReviewItems = sortReviewItems(items);
  const reviewQueue = allReviewItems.filter(
    (i) => i.status === "awaiting_review" && i.preview
  );
  const preparedItems = allReviewItems.filter(
    (i) => i.status === "prepared" && i.preview
  );
  const upcomingItems = allReviewItems.filter(
    (i) => i.status === "upcoming" || i.status === "blocked"
  );
  const completedItems = allReviewItems.filter(
    (i) =>
      (i.status === "prepared" || i.status === "awaiting_review") && i.preview
  );

  const preparedCount = allReviewItems.filter(
    (i) => i.preview && (i.status === "prepared" || i.status === "awaiting_review")
  ).length;
  const totalCount = allReviewItems.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((preparedCount / totalCount) * 100);

  const customerStatus = resolveCampaignCustomerStatus({
    onboardingComplete: input.onboardingComplete,
    hasExecutionWork: input.hasExecutionWork,
    reviewQueueCount: reviewQueue.length,
    preparedCount,
    totalTrackable: totalCount,
    continuationRunning: Boolean(input.continuationRunning),
    activeWorkUnitId: input.activeWorkUnitId ?? null,
    blockedCustomerMessage: null,
  });

  const inProgress = allReviewItems.find((i) => i.status === "in_progress");
  const recentlyDone = [...allReviewItems]
    .reverse()
    .find((i) => i.status === "prepared" || i.status === "awaiting_review");
  const upNext = upcomingItems[0] ?? null;

  const lastUpdated = allReviewItems.reduce<string | null>((latest, item) => {
    if (!item.updatedAt) return latest;
    if (!latest || item.updatedAt > latest) return item.updatedAt;
    return latest;
  }, input.project.updatedAt ?? null);

  return {
    campaignId: input.projectId,
    campaignTitle: input.campaignDetail.title,
    campaignStatus: input.campaignDetail.status,
    campaignStatusLabel: customerStatus.statusLabel,
    customerSummary: customerStatus.customerSummary,
    currentFocus: inProgress
      ? activityCopyForItem(inProgress)
      : customerStatus.currentFocus,
    progress: {
      preparedCount,
      totalCount,
      percent,
      phases: buildProgressPhases(allReviewItems, input),
    },
    needsAttention: customerStatus.needsAttention,
    attentionMessage: customerStatus.attentionMessage,
    primaryActionLabel: customerStatus.primaryActionLabel,
    primaryActionHref: null,
    preparedItems,
    upcomingItems,
    completedItems,
    reviewQueue,
    activitySummary: {
      currentFocus: inProgress
        ? activityCopyForItem(inProgress)
        : customerStatus.currentFocus,
      recentlyCompleted: recentlyDone ? activityCopyForItem(recentlyDone) : null,
      upNext: upNext ? activityCopyForItem(upNext) : null,
    },
    hasTechnicalDetails: true,
    lastUpdated,
    allReviewItems,
  };
}
