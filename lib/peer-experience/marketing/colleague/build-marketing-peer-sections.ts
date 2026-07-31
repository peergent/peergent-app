import type { MarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import type { PeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { clampCustomerText } from "./normalize-customer-workspace-content";
import { buildDeduplicatedCompletedOutcomes } from "./build-deduplicated-outcomes";
import { deriveProjectStatus } from "../projects/project-engine";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import type {
  CustomerPeerPresenceViewModel,
  PeerCompletedOutcomeViewModel,
  PeerUpcomingWorkItem,
  PeerWorkingOnViewModel,
} from "./peer-presence-types";
import { formatRelativeTime } from "../emma-narrative";
import { marketingPeerSectionHref } from "../navigation/marketing-peer-links";

export function buildMarketingPeerCompletedOutcomes(input: {
  domainInput: MarketingPeerDomainInput;
  locale: MarketingCampaignLocale;
  now?: Date;
}): PeerCompletedOutcomeViewModel[] {
  return buildDeduplicatedCompletedOutcomes(input).map((o) => ({
    ...o,
    completedTimeLabel: formatRelativeTime(o.completedAt, input.locale),
  }));
}

export function groupCompletedOutcomes(
  items: readonly PeerCompletedOutcomeViewModel[],
  copy: PeerWorkspaceCopy
): Array<{ key: PeerCompletedOutcomeViewModel["group"]; label: string; items: PeerCompletedOutcomeViewModel[] }> {
  const order: PeerCompletedOutcomeViewModel["group"][] = [
    "today",
    "yesterday",
    "this_week",
    "older",
  ];
  const labels: Record<PeerCompletedOutcomeViewModel["group"], string> = {
    today: copy.doneToday,
    yesterday: copy.doneYesterday,
    this_week: copy.doneThisWeek,
    older: copy.doneOlder,
  };
  return order
    .map((key) => ({
      key,
      label: labels[key],
      items: items.filter((i) => i.group === key),
    }))
    .filter((g) => g.items.length > 0);
}

function activeProject(input: MarketingPeerDomainInput) {
  const unit =
    input.workUnits.find((u) => u.id === input.activeWorkUnitId) ??
    input.workUnits.find(
      (u) =>
        !u.cancelled &&
        !u.paused &&
        u.status !== "published" &&
        u.status !== "monitoring"
    );
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

function stageLabelForState(
  presenceState: CustomerPeerPresenceViewModel["state"],
  locale: MarketingCampaignLocale,
  campaignCopy: MarketingCampaignCopy
): string | null {
  switch (presenceState) {
    case "working":
      return campaignCopy.presenceWorking;
    case "preparing":
      return campaignCopy.presencePreparing;
    case "waiting_for_you":
      return campaignCopy.presenceWaitingForYou;
    case "blocked":
      return locale === "nl" ? "Geblokkeerd" : "Blocked";
    case "caught_up":
      return campaignCopy.presenceCaughtUp;
    default:
      return null;
  }
}

export function buildMarketingPeerWorkingOnViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  presenceNarrative: string;
  presenceState: CustomerPeerPresenceViewModel["state"];
  campaignCopy: MarketingCampaignCopy;
  workspaceCopy: PeerWorkspaceCopy;
  locale: MarketingCampaignLocale;
  relatedHref: string | null;
  waitingHref: string;
  attentionCount: number;
}): PeerWorkingOnViewModel {
  const {
    domainInput,
    presenceNarrative,
    presenceState,
    workspaceCopy,
    relatedHref,
    waitingHref,
    campaignCopy,
    locale,
    attentionCount,
  } = input;

  const project = activeProject(domainInput);
  const focusTitle = project?.title ?? domainInput.campaignTitle;
  const description = clampCustomerText(presenceNarrative, 160);
  const stageLabel = stageLabelForState(presenceState, locale, campaignCopy);

  const outcomes = buildDeduplicatedCompletedOutcomes({
    domainInput,
    locale: input.locale,
  });
  const lastOutcome = outcomes[0];

  if (presenceState === "caught_up") {
    return {
      mode: "caught_up",
      focusLabel: workspaceCopy.caughtUpHeadline,
      focusTitle: null,
      description: workspaceCopy.caughtUpBody,
      stageLabel: campaignCopy.presenceCaughtUp,
      progressLabel: null,
      nextStepLabel: null,
      nextStep: null,
      primaryAction: null,
      upcoming: [],
      caughtUpLastOutcome: lastOutcome
        ? { title: lastOutcome.title, href: lastOutcome.href ?? null }
        : null,
    };
  }

  if (presenceState === "waiting_for_you") {
    return {
      mode: "waiting",
      focusLabel: workspaceCopy.workingOnNowLabel,
      focusTitle,
      description,
      stageLabel,
      progressLabel: null,
      nextStepLabel: workspaceCopy.workingOnNext,
      nextStep:
        locale === "nl"
          ? `${attentionCount} onderdelen wachten op je beslissing.`
          : `${attentionCount} items are waiting for your decision.`,
      primaryAction: {
        label:
          locale === "nl"
            ? attentionCount === 1
              ? "Beoordeel onderdeel"
              : "Beoordeel onderdelen"
            : attentionCount === 1
              ? "Review item"
              : "Review items",
        href: waitingHref,
        variant: "primary",
      },
      upcoming: [],
      caughtUpLastOutcome: null,
    };
  }

  let primaryAction: PeerWorkingOnViewModel["primaryAction"] = null;
  if (relatedHref) {
    primaryAction = {
      label: workspaceCopy.viewWork,
      href: relatedHref,
      variant: "primary",
    };
  }

  let nextStep: string | null = null;
  if (presenceState === "working") {
    nextStep = campaignCopy.peerPreparingNext;
  } else if (presenceState === "preparing") {
    nextStep =
      locale === "nl"
        ? "Ik start zodra de campagne klaarstaat."
        : "I'll start as soon as the campaign is ready.";
  }

  const otherProjects = domainInput.projects
    .filter((p) => p.id !== project?.id)
    .slice(0, 2)
    .map<PeerUpcomingWorkItem>((p) => ({
      id: p.id,
      title: p.title,
      explanation:
        locale === "nl" ? "Geplande campagnewerk" : "Planned campaign work",
      timingLabel: null,
      href: `/team/${domainInput.peerId}/projects/${encodeURIComponent(p.id)}`,
    }));

  return {
    mode: "focus",
    focusLabel: workspaceCopy.workingOnNowLabel,
    focusTitle,
    description,
    stageLabel,
    progressLabel: domainInput.generatingActivity
      ? clampCustomerText(domainInput.generatingActivity, 80)
      : null,
    nextStepLabel: workspaceCopy.workingOnNext,
    nextStep,
    primaryAction,
    upcoming: otherProjects,
    caughtUpLastOutcome: null,
  };
}
