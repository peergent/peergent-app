import { resolveMarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
import type { MarketingCampaignCopy, MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { buildEmmaPresenceLine } from "../build-emma-presence-line";
import { formatRelativeTime } from "../emma-narrative";
import {
  getProjectHref,
  marketingPeerSectionHref,
} from "../navigation/marketing-peer-links";
import {
  formatUpdatedLabel,
  presenceWaitingCta,
  presenceWaitingNarrative,
} from "./normalize-customer-workspace-content";
import { buildAllMarketingApprovalQueue } from "../view-models/build-marketing-activity-mappers";
import { deriveProjectStatus } from "../projects/project-engine";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import type { CustomerPeerPresenceViewModel } from "./peer-presence-types";

function activeWorkUnit(input: MarketingPeerDomainInput) {
  return (
    input.workUnits.find((u) => u.id === input.activeWorkUnitId) ??
    input.workUnits.find(
      (u) =>
        !u.cancelled &&
        !u.paused &&
        u.status !== "published" &&
        u.status !== "monitoring"
    )
  );
}

function primaryProject(input: MarketingPeerDomainInput) {
  const unit = activeWorkUnit(input);
  if (unit?.projectId) {
    return input.projects.find((p) => p.id === unit.projectId) ?? null;
  }
  return (
    input.projects.find((p) => {
      const status = deriveProjectStatus(p, input.workUnits, input.drafts, new Set());
      return !["completed", "archived", "monitoring_results"].includes(status);
    }) ?? null
  );
}

export type BuildMarketingPeerPresenceInput = {
  domainInput: MarketingPeerDomainInput;
  campaignCopy: MarketingCampaignCopy;
  workspaceCopy: PeerWorkspaceCopy;
  /** Draft + campaign review attention count (from presenter layer). */
  attentionCount: number;
  waitingPrimaryHref: string | null;
  locale: MarketingCampaignLocale;
};

/**
 * Priority: Needs help → Waiting for you → Blocked → Working → Preparing → Caught up.
 * Never show Working without verified activity (`generating` or in-flight work unit).
 */
export function buildMarketingPeerWorkspacePresence(
  input: BuildMarketingPeerPresenceInput
): CustomerPeerPresenceViewModel {
  const { domainInput, campaignCopy, workspaceCopy, attentionCount, waitingPrimaryHref, locale } =
    input;
  const peerId = domainInput.peerId;
  const unit = activeWorkUnit(domainInput);
  const project = primaryProject(domainInput);
  const projectName = project?.title ?? null;

  const focus = resolveMarketingWorkflowFocus({
    generating: domainInput.generating,
    generatingActivity: domainInput.generatingActivity,
    understanding: domainInput.understanding,
    strategy: domainInput.strategy,
    plan: domainInput.plan,
    drafts: domainInput.drafts,
    publicationPackages: domainInput.publicationPackages,
  });

  const queue = buildAllMarketingApprovalQueue(domainInput);
  const waitingCount = Math.max(attentionCount, queue.length);

  let lastUpdate: string | null = null;
  if (unit?.updatedAt) {
    lastUpdate = formatRelativeTime(unit.updatedAt);
  } else if (queue[0]?.id) {
    const draft = domainInput.drafts.find((d) => d.id === queue[0]?.id);
    if (draft?.generatedAt) {
      lastUpdate = formatRelativeTime(draft.generatedAt);
    }
  }

  const waitingHref =
    waitingPrimaryHref ?? marketingPeerSectionHref(peerId, "waiting_for_me");

  if (waitingCount > 0) {
    return {
      state: "waiting_for_you",
      presentationKey: "waiting_for_you",
      stateLabel: campaignCopy.presenceWaitingForYou,
      narrative: presenceWaitingNarrative(waitingCount, locale),
      primaryActionHref: waitingHref,
      primaryActionLabel: presenceWaitingCta(waitingCount, locale),
      lastMeaningfulUpdateLabel: lastUpdate
        ? formatUpdatedLabel(lastUpdate, locale)
        : null,
      showLiveIndicator: false,
    };
  }

  if (focus.kind === "knowledge_incomplete") {
    return {
      state: "blocked",
      presentationKey: "needs_review",
      stateLabel: workspaceCopy.presenceBlocked,
      narrative: workspaceCopy.narrativeBlockedKnowledge,
      primaryActionHref: marketingPeerSectionHref(peerId, "settings"),
      primaryActionLabel: campaignCopy.continueSetup,
      lastMeaningfulUpdateLabel: lastUpdate,
      showLiveIndicator: false,
    };
  }

  const verifiedWorking =
    domainInput.generating != null ||
    (unit != null &&
      !unit.paused &&
      !unit.cancelled &&
      (unit.status === "understanding" ||
        unit.status === "planning" ||
        unit.status === "creating" ||
        unit.status === "scheduled" ||
        unit.status === "approved"));

  if (verifiedWorking) {
    const presenceLine = buildEmmaPresenceLine(focus);
    const narrative =
      projectName && domainInput.generatingActivity
        ? campaignCopy.narrativeWorkingOn(
            domainInput.generatingActivity.replace(/\.$/, "")
          )
        : projectName
          ? campaignCopy.narrativeWorkingOn(projectName)
          : presenceLine;

    return {
      state: "working",
      presentationKey: "working",
      stateLabel: campaignCopy.presenceWorking,
      narrative,
      primaryActionHref: project ? getProjectHref(peerId, project.id) : null,
      primaryActionLabel: project ? workspaceCopy.openCampaign : null,
      lastMeaningfulUpdateLabel: lastUpdate,
      showLiveIndicator: true,
    };
  }

  const hasActiveEngagement = domainInput.projects.some((p) => {
    const status = deriveProjectStatus(p, domainInput.workUnits, domainInput.drafts, new Set());
    return !["completed", "archived"].includes(status);
  });

  if (
    hasActiveEngagement ||
    focus.kind === "write_next"
  ) {
    const narrative = projectName
      ? campaignCopy.narrativePreparingCampaign(projectName)
      : campaignCopy.narrativePreparingCampaign(domainInput.campaignTitle);
    return {
      state: "preparing",
      presentationKey: "preparing",
      stateLabel: campaignCopy.presencePreparing,
      narrative,
      primaryActionHref: project ? getProjectHref(peerId, project.id) : null,
      primaryActionLabel: project ? workspaceCopy.openCampaign : null,
      lastMeaningfulUpdateLabel: lastUpdate,
      showLiveIndicator: false,
    };
  }

  return {
    state: "caught_up",
    presentationKey: "caught_up",
    stateLabel: campaignCopy.presenceCaughtUp,
    narrative: campaignCopy.narrativeCaughtUp,
    primaryActionHref: null,
    primaryActionLabel: null,
    lastMeaningfulUpdateLabel: lastUpdate,
    showLiveIndicator: false,
  };
}
