import type { MarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import type {
  CampaignReviewItem,
  CampaignReviewProgressPhase,
  CampaignReviewViewModel,
} from "@/lib/peer-experience/marketing/campaign-review";

export type DeliverableBadgeKey =
  | "ready_for_review"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "updating"
  | "prepared"
  | "in_progress"
  | "awaiting_review";

export type CustomerCampaignHeaderKey =
  | "waiting_review"
  | "working"
  | "prepared"
  | "setup"
  | "ready_to_start"
  | "needs_attention";

export type CustomerCampaignHeader = {
  key: CustomerCampaignHeaderKey;
  statusLabel: string;
  explanation: string;
  primaryActionLabel: string | null;
  showContinueCampaign: boolean;
  showStartCampaign: boolean;
};

export type PhasePresentation = {
  id: string;
  label: string;
  state: "complete" | "current" | "upcoming" | "not_available";
  stateLabel: string;
};

export type SimplifiedActivity = {
  currentFocus: string | null;
  latestUpdate: string | null;
  nextStep: string | null;
};

export function mapVmStatusToHeaderKey(vm: CampaignReviewViewModel): CustomerCampaignHeaderKey {
  const label = vm.campaignStatusLabel;
  if (label === "Waiting for your review") return "waiting_review";
  if (label === "Marketing Peer is working") return "working";
  if (label === "Campaign prepared") return "prepared";
  if (label === "Setup required") return "setup";
  if (label === "Ready to start") return "ready_to_start";
  return "needs_attention";
}

export function buildLocalizedCampaignHeader(
  vm: CampaignReviewViewModel,
  copy: MarketingCampaignCopy,
  options: {
    continuationRunning: boolean;
    hideStartCampaign: boolean;
    canStartCampaign: boolean;
    canContinueCampaign: boolean;
  }
): CustomerCampaignHeader {
  const key = mapVmStatusToHeaderKey(vm);
  let statusLabel: string;
  let explanation: string;
  let primaryActionLabel: string | null = null;
  let showContinueCampaign = false;
  let showStartCampaign = false;

  switch (key) {
    case "waiting_review":
      statusLabel = copy.statusWaitingReview;
      explanation = copy.summaryWaitingReview(vm.reviewQueue.length);
      primaryActionLabel = copy.reviewPrimaryCta(vm.reviewQueue.length);
      break;
    case "working":
      statusLabel = copy.statusWorking;
      explanation = options.continuationRunning
        ? copy.summaryWorking
        : vm.customerSummary.includes("prepar")
          ? copy.summaryWorking
          : copy.summaryWorking;
      break;
    case "prepared":
      statusLabel = copy.statusPrepared;
      explanation = copy.summaryPrepared;
      break;
    case "setup":
      statusLabel = copy.statusSetupRequired;
      explanation = copy.summarySetup;
      primaryActionLabel = copy.continueSetup;
      break;
    case "ready_to_start":
      statusLabel = copy.statusReadyToStart;
      explanation = copy.summaryReadyToStart;
      if (options.canStartCampaign && !options.hideStartCampaign) {
        primaryActionLabel = copy.startCampaign;
        showStartCampaign = true;
      }
      break;
    default:
      statusLabel = copy.statusNeedsAttention;
      explanation = vm.customerSummary;
      break;
  }

  if (
    key === "working" &&
    options.canContinueCampaign &&
    !vm.reviewQueue.length &&
    !primaryActionLabel
  ) {
    showContinueCampaign = false;
  }

  return {
    key,
    statusLabel,
    explanation,
    primaryActionLabel,
    showContinueCampaign,
    showStartCampaign,
  };
}

export function deliverableBadgeKey(item: CampaignReviewItem): DeliverableBadgeKey {
  if (item.decisionStatus === "updating") return "updating";
  if (item.decisionStatus === "changes_requested") return "changes_requested";
  if (item.decisionStatus === "rejected") return "rejected";
  if (item.decisionStatus === "approved") return "approved";
  if (item.inReviewQueue || item.decisionStatus === "awaiting_review") return "ready_for_review";
  if (item.status === "prepared") return "prepared";
  if (item.status === "in_progress") return "in_progress";
  return "awaiting_review";
}

export function deliverableBadgeLabel(
  key: DeliverableBadgeKey,
  copy: MarketingCampaignCopy
): string {
  switch (key) {
    case "ready_for_review":
      return copy.badgeReadyForReview;
    case "approved":
      return copy.badgeApproved;
    case "changes_requested":
      return copy.badgeChangesRequested;
    case "rejected":
      return copy.badgeRejected;
    case "updating":
      return copy.badgeUpdating;
    case "prepared":
      return copy.badgePrepared;
    case "in_progress":
      return copy.badgeInProgress;
    default:
      return copy.badgeAwaitingReview;
  }
}

export function deliverableActionLabel(
  item: CampaignReviewItem,
  copy: MarketingCampaignCopy
): string | null {
  if (!item.preview) return null;
  if (item.inReviewQueue || item.decisionStatus === "awaiting_review") {
    return copy.reviewDeliverable;
  }
  return copy.viewDeliverable;
}

const PHASE_LABEL_KEYS: Record<string, keyof MarketingCampaignCopy> = {
  setup: "phaseSetup",
  strategy: "phaseStrategy",
  creative: "phaseCreative",
  content: "phaseContent",
  review: "phaseReview",
  publish: "phasePublish",
  measure: "phaseMeasure",
};

export function presentCampaignPhases(
  phases: readonly CampaignReviewProgressPhase[],
  copy: MarketingCampaignCopy
): PhasePresentation[] {
  return phases.map((phase) => {
    const labelKey = PHASE_LABEL_KEYS[phase.id];
    const label = labelKey ? String(copy[labelKey]) : phase.label;
    let state: PhasePresentation["state"];
    if (phase.id === "publish" || phase.id === "measure") {
      state = phase.complete ? "complete" : "not_available";
    } else if (phase.complete) {
      state = "complete";
    } else if (phase.current) {
      state = "current";
    } else {
      state = "upcoming";
    }
    const stateLabel =
      state === "complete"
        ? copy.phaseStateComplete
        : state === "current"
          ? copy.phaseStateCurrent
          : state === "not_available"
            ? copy.phaseStateNotAvailable
            : copy.phaseStateUpcoming;
    return { id: phase.id, label, state, stateLabel };
  });
}

export function currentPhasePresentation(
  phases: readonly PhasePresentation[]
): PhasePresentation | null {
  return phases.find((p) => p.state === "current") ?? null;
}

export function collectAttentionItems(vm: CampaignReviewViewModel): CampaignReviewItem[] {
  const needsChanges = vm.allReviewItems.filter(
    (i) => i.decisionStatus === "changes_requested" && i.preview
  );
  const needsDirection = vm.allReviewItems.filter(
    (i) => i.decisionStatus === "rejected" && i.preview
  );
  const queue = vm.reviewQueue;
  const seen = new Set<string>();
  const out: CampaignReviewItem[] = [];
  for (const item of [...queue, ...needsChanges, ...needsDirection]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export function collectPreparedOverviewItems(vm: CampaignReviewViewModel): CampaignReviewItem[] {
  const attentionIds = new Set(collectAttentionItems(vm).map((i) => i.id));
  return vm.allReviewItems.filter(
    (i) => i.preview && (i.status === "prepared" || i.status === "awaiting_review") && !attentionIds.has(i.id)
  );
}

export function buildSimplifiedCustomerActivity(
  vm: CampaignReviewViewModel,
  copy: MarketingCampaignCopy,
  continuationRunning: boolean
): SimplifiedActivity {
  const inProgress = vm.allReviewItems.find((i) => i.status === "in_progress");
  let currentFocus: string | null = null;
  if (inProgress) {
    currentFocus = activityLineForItem(inProgress, copy);
  } else if (continuationRunning || vm.campaignStatusLabel === "Marketing Peer is working") {
    currentFocus = copy.activityPeerWorking;
  } else if (vm.currentFocus) {
    currentFocus = vm.currentFocus;
  }

  const latestApproved = [...vm.allReviewItems]
    .filter((i) => i.decisionStatus === "approved" && i.decidedAt)
    .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""))[0];

  let latestUpdate: string | null = null;
  if (latestApproved) {
    latestUpdate = copy.deliverableApproved(latestApproved.artifactTypeLabel);
  } else {
    const recent = [...vm.allReviewItems]
      .filter((i) => i.preview && (i.status === "prepared" || i.status === "awaiting_review"))
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))[0];
    if (recent && !continuationRunning) {
      latestUpdate = activityLineForItem(recent, copy);
    }
  }

  const upNext = vm.upcomingItems[0];
  const nextStep = upNext
    ? activityLineForItem(upNext, copy)
    : vm.reviewQueue.length > 0
      ? copy.readyForYourReview
      : continuationRunning
        ? copy.peerPreparingNext
        : null;

  return { currentFocus, latestUpdate, nextStep };
}

function activityLineForItem(item: CampaignReviewItem, copy: MarketingCampaignCopy): string {
  if (item.decisionStatus === "approved") {
    return copy.deliverableApproved(item.artifactTypeLabel);
  }
  if (item.status === "in_progress") {
    return copy.activityPeerWorking;
  }
  if (item.status === "awaiting_review") {
    return copy.badgeReadyForReview;
  }
  return item.artifactTypeLabel;
}

export function assertNoTechnicalCustomerTerms(text: string): void {
  const forbidden = [
    "work unit",
    "artifact",
    "executor",
    "runtime",
    "idempotency",
    "lifecycle",
  ];
  const lower = text.toLowerCase();
  for (const term of forbidden) {
    if (lower.includes(term)) {
      throw new Error(`Customer copy must not include: ${term}`);
    }
  }
}
