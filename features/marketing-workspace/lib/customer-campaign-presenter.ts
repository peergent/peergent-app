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

export type PeerPresenceKey =
  | "working"
  | "waiting_for_you"
  | "caught_up"
  | "preparing"
  | "thinking"
  | "needs_review";

export type PeerPresencePresentation = {
  key: PeerPresenceKey;
  presenceLabel: string;
  narrative: string;
  primaryActionLabel: string | null;
  showStartCampaign: boolean;
  headerKey: CustomerCampaignHeaderKey;
};

export type WorkingNowPresentation = {
  show: boolean;
  currently: string | null;
  latestCompleted: string | null;
  next: string | null;
};

export type EngagementJourneyPresentation = {
  preparation: string;
  currentStage: string | null;
  whatsNext: string | null;
  phases: readonly PhasePresentation[];
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

export function buildPeerPresencePresentation(
  vm: CampaignReviewViewModel,
  copy: MarketingCampaignCopy,
  campaignTitle: string,
  options: {
    continuationRunning: boolean;
    hideStartCampaign: boolean;
    canStartCampaign: boolean;
  }
): PeerPresencePresentation {
  const header = buildLocalizedCampaignHeader(vm, copy, {
    continuationRunning: options.continuationRunning,
    hideStartCampaign: options.hideStartCampaign,
    canStartCampaign: options.canStartCampaign,
    canContinueCampaign: false,
  });

  const inProgress = vm.allReviewItems.find((i) => i.status === "in_progress");
  let key: PeerPresenceKey;
  let narrative: string;

  if (header.key === "waiting_review" || vm.reviewQueue.length > 0) {
    key = "needs_review";
    narrative = copy.narrativeWaitingForYou(vm.reviewQueue.length || 1);
  } else if (header.key === "setup") {
    key = "preparing";
    narrative = copy.narrativeNeedsSetup;
  } else if (header.key === "ready_to_start") {
    key = "preparing";
    narrative = copy.narrativeReadyWhenYouAre;
  } else if (header.key === "prepared") {
    key = "caught_up";
    narrative = copy.narrativeCaughtUp;
  } else if (inProgress) {
    key = options.continuationRunning ? "working" : "preparing";
    narrative = copy.narrativeWorkingOn(inProgress.artifactTypeLabel);
  } else if (options.continuationRunning) {
    key = "working";
    narrative = copy.narrativePreparingCampaign(campaignTitle);
  } else if (vm.allReviewItems.some((i) => i.decisionStatus === "changes_requested")) {
    key = "waiting_for_you";
    narrative = copy.narrativeWaitingForYou(1);
  } else {
    key = "thinking";
    narrative = copy.narrativeThinking;
  }

  const presenceLabel = presenceLabelForKey(key, copy);

  return {
    key,
    presenceLabel,
    narrative,
    primaryActionLabel: header.primaryActionLabel,
    showStartCampaign: header.showStartCampaign,
    headerKey: header.key,
  };
}

function presenceLabelForKey(
  key: PeerPresenceKey,
  copy: MarketingCampaignCopy
): string {
  switch (key) {
    case "working":
      return copy.presenceWorking;
    case "waiting_for_you":
      return copy.presenceWaitingForYou;
    case "caught_up":
      return copy.presenceCaughtUp;
    case "preparing":
      return copy.presencePreparing;
    case "thinking":
      return copy.presenceThinking;
    case "needs_review":
      return copy.presenceNeedsReview;
  }
}

export function buildWorkingNowPresentation(
  vm: CampaignReviewViewModel,
  copy: MarketingCampaignCopy,
  continuationRunning: boolean
): WorkingNowPresentation {
  const inProgress = vm.allReviewItems.find((i) => i.status === "in_progress");
  const show =
    Boolean(inProgress) ||
    continuationRunning ||
    vm.campaignStatusLabel === "Marketing Peer is working" ||
    vm.upcomingItems.length > 0;

  if (!show && vm.reviewQueue.length === 0 && mapVmStatusToHeaderKey(vm) === "prepared") {
    return { show: false, currently: null, latestCompleted: null, next: null };
  }

  let currently: string | null = null;
  if (inProgress) {
    currently = copy.peerWorkingOnArtifact(inProgress.artifactTypeLabel);
  } else if (continuationRunning) {
    currently = copy.workingNowCurrently(copy.phaseStrategy);
  }

  const latestApproved = [...vm.allReviewItems]
    .filter((i) => i.decisionStatus === "approved" && i.decidedAt)
    .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""))[0];

  const latestCompleted = latestApproved
    ? copy.deliverableApproved(latestApproved.artifactTypeLabel)
    : null;

  const upNext = vm.upcomingItems[0];
  let next: string | null = null;
  if (upNext) {
    next = upNext.artifactTypeLabel;
  } else if (vm.reviewQueue.length > 0) {
    next = copy.readyForYourReview;
  } else if (continuationRunning) {
    next = copy.peerPreparingNext.replace("Marketing Peer ", "").replace(/^is /, "");
  }

  return {
    show: show || Boolean(currently || latestCompleted || next),
    currently,
    latestCompleted,
    next,
  };
}

export function buildEngagementJourneyPresentation(
  vm: CampaignReviewViewModel,
  copy: MarketingCampaignCopy
): EngagementJourneyPresentation {
  const phases = presentCampaignPhases(vm.progress.phases, copy);
  const current = currentPhasePresentation(phases);
  const nextPhase = phases.find(
    (p) => p.state === "upcoming" && p.id !== "publish" && p.id !== "measure"
  );

  return {
    preparation: copy.engagementPreparationValue(
      vm.progress.preparedCount,
      vm.progress.totalCount
    ),
    currentStage: current?.label ?? null,
    whatsNext:
      nextPhase?.label ??
      (current?.id === "review" && vm.reviewQueue.length === 0
        ? copy.publishingNotAvailableYet
        : null),
    phases: phases.filter((p) => p.id !== "measure" || p.state !== "not_available"),
  };
}

export function collectPreparedCompletedItems(
  vm: CampaignReviewViewModel
): CampaignReviewItem[] {
  const attentionIds = new Set(collectAttentionItems(vm).map((i) => i.id));
  return vm.allReviewItems.filter((i) => {
    if (!i.preview || attentionIds.has(i.id)) return false;
    if (i.decisionStatus === "approved") return true;
    if (i.inReviewQueue || i.decisionStatus === "awaiting_review") return false;
    if (i.decisionStatus === "changes_requested" || i.decisionStatus === "rejected") {
      return false;
    }
    return i.status === "prepared";
  });
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
