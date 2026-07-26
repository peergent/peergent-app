import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import { getReviewHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { workUnitsForProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { isPlannerOrientedNextActionLabel } from "./marketing-peer-onboarding-presenter";
import { projectHasCampaignExecutionWork } from "./campaign-start-action-presenter";

export type CampaignDetailHeroPresentation = {
  readonly statusLabel: string;
  readonly statusChipVariant: "planning" | "blocked" | "default";
  readonly showLinkedNextAction: boolean;
  readonly nextActionLabel: string;
  readonly nextActionHref: string;
  readonly nextActionReason?: string;
  readonly stateLine: string | null;
};

function derivePostStartStateLine(
  workUnits: readonly WorkUnit[],
  peerName: string,
  pendingApprovals: number
): string {
  if (pendingApprovals > 0) {
    return "Waiting for your approval on campaign work.";
  }
  const active = workUnits.filter((u) => !u.cancelled);
  if (active.some((u) => u.status === "review_ready")) {
    return "Review work in progress.";
  }
  if (active.some((u) => u.status === "creating" || u.status === "planning")) {
    return `${peerName} is working on audience and campaign strategy.`;
  }
  return `${peerName} is working on this campaign.`;
}

function derivePostStartNextAction(input: {
  peerId: string;
  campaignId: string;
  workUnits: readonly WorkUnit[];
  peerName: string;
  pendingApprovals: number;
  reviewHref: string;
}): Pick<CampaignDetailHeroPresentation, "nextActionLabel" | "nextActionHref" | "showLinkedNextAction"> {
  if (input.pendingApprovals > 0) {
    return {
      showLinkedNextAction: true,
      nextActionLabel: "Review approvals",
      nextActionHref: input.reviewHref,
    };
  }
  const active = input.workUnits.filter((u) => !u.cancelled);
  if (active.some((u) => u.status === "review_ready")) {
    return {
      showLinkedNextAction: true,
      nextActionLabel: "Review work in progress",
      nextActionHref: input.reviewHref,
    };
  }
  return {
    showLinkedNextAction: false,
    nextActionLabel: `${input.peerName} is working on this campaign.`,
    nextActionHref: input.reviewHref,
  };
}

export function presentCampaignDetailHero(input: {
  campaign: MarketingCampaignDetailViewModel;
  projectId: string;
  peerId: string;
  peerName: string;
  workUnits: readonly WorkUnit[];
}): CampaignDetailHeroPresentation {
  const executionStarted = projectHasCampaignExecutionWork(input.projectId, input.workUnits);
  const reviewHref = getReviewHref(input.peerId);
  const chipFromLabel = (label: string): CampaignDetailHeroPresentation["statusChipVariant"] => {
    const lower = label.toLowerCase();
    if (lower.includes("block")) return "blocked";
    if (lower.includes("plan")) return "planning";
    return "default";
  };

  if (!executionStarted) {
    const showLinkedNextAction = !isPlannerOrientedNextActionLabel(input.campaign.nextAction.label);
    return {
      statusLabel: input.campaign.statusLabel,
      statusChipVariant: chipFromLabel(input.campaign.statusLabel),
      showLinkedNextAction,
      nextActionLabel: input.campaign.nextAction.label,
      nextActionHref: input.campaign.nextAction.href,
      nextActionReason: input.campaign.nextAction.reason,
      stateLine: null,
    };
  }

  const projectUnits = workUnitsForProject(input.projectId, [...input.workUnits]);
  const pendingApprovals = input.campaign.approvalQueue.pendingCount;
  const postStartNext = derivePostStartNextAction({
    peerId: input.peerId,
    campaignId: input.campaign.id,
    workUnits: projectUnits,
    peerName: input.peerName,
    pendingApprovals,
    reviewHref,
  });

  return {
    statusLabel: "Active",
    statusChipVariant: "default",
    stateLine: derivePostStartStateLine(projectUnits, input.peerName, pendingApprovals),
    ...postStartNext,
  };
}

export function shouldSuppressStartCampaignFeedback(
  workUnits: readonly WorkUnit[],
  projectId: string,
  sessionStarted: boolean
): boolean {
  if (sessionStarted) return false;
  return projectHasCampaignExecutionWork(projectId, workUnits);
}
