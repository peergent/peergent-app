import { getMarketingCampaignCopy, resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getPeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { buildMarketingPeerAttentionItems } from "@/features/marketing-workspace/lib/build-peer-attention-items";
import { buildMarketingPeerWorkspacePresence } from "@/lib/peer-experience/marketing/colleague/build-marketing-peer-presence";
import { buildMarketingPeerWorkingOnViewModel } from "@/lib/peer-experience/marketing/colleague/build-marketing-peer-sections";
import { buildDeduplicatedCompletedOutcomes } from "@/lib/peer-experience/marketing/colleague/build-deduplicated-outcomes";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { CustomerPeerPresenceViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import type { PresenceLine, PresenceRung } from "@/lib/design-system/foundation";
import { officeHref, toOfficeHref } from "../links";
import type { DeskAutonomyRequest, DeskCopy, DeskViewModel } from "./types";

/**
 * Marketing adapter for the Desk (§4.1).
 *
 * Deliberately thin: every marketing meaning — presence priority, attention
 * classification, outcome de-duplication — already has one home in
 * lib/peer-experience/marketing. This maps those results onto the
 * peer-agnostic Desk shape rather than re-deriving them.
 */

/**
 * §5.1 Maps the customer presence state onto a presence-ladder rung.
 * A genuine failure is a fault and outranks everything else.
 */
function rungForPresence(state: CustomerPeerPresenceViewModel["state"]): PresenceRung {
  switch (state) {
    case "needs_help":
      return "fault";
    case "waiting_for_you":
    case "blocked":
      return "interpretation";
    case "working":
    case "preparing":
      return "observation";
    case "caught_up":
    default:
      return "orientation";
  }
}

function deskCopy(locale: "en" | "nl", peerName: string): DeskCopy {
  if (locale === "nl") {
    return {
      decisionsHeading: (count) =>
        count === 1 ? "Wacht op jou" : `Wacht op jou — ${count}`,
      inFlightHeading: "Waar ik nu mee bezig ben",
      completedHeading: "Sinds je er voor het laatst was",
      viewAllCompleted: "Bekijk alles",
      askPlaceholderName: peerName,
      askPlaceholder: `Vraag ${peerName} iets over je marketing…`,
      rightNowHeading: "Op dit moment",
      openCampaign: "Open campagne",
    };
  }
  return {
    decisionsHeading: (count) =>
      count === 1 ? "Waiting for you" : `Waiting for you — ${count}`,
    inFlightHeading: "What I'm working on",
    completedHeading: "Since you were last here",
    viewAllCompleted: "View all",
    askPlaceholderName: peerName,
    askPlaceholder: `Ask ${peerName} about your marketing…`,
    rightNowHeading: "Right now",
    openCampaign: "Open campaign",
  };
}

export function buildMarketingDeskViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  peerName: string;
  peerRole: string;
  localePreference?: string | null;
  now?: Date;
  /** §4.1a Supplied by the autonomy engine when every condition is met. */
  autonomyRequest?: DeskAutonomyRequest | null;
}): DeskViewModel {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const campaignCopy = getMarketingCampaignCopy(locale);
  const workspaceCopy = getPeerWorkspaceCopy(locale);
  const v17Copy = getV17PeerCopy(locale);
  const { domainInput } = input;
  const peerId = domainInput.peerId;

  // --- Decisions (§4.1: every one, never truncated) ------------------------
  const attention = buildMarketingPeerAttentionItems({
    domainInput,
    locale,
    primaryCtaLabel: v17Copy.reviewCta,
  });

  const decisions = attention.map((item) => ({
    id: item.id,
    title: item.title,
    unblocks: item.whyItMatters,
    primaryLabel: item.primaryActionLabel,
    href: toOfficeHref(peerId, item.href),
    ageLabel: item.ageLabel ?? null,
  }));

  // --- Presence ------------------------------------------------------------
  const presenceModel = buildMarketingPeerWorkspacePresence({
    domainInput,
    campaignCopy,
    workspaceCopy,
    attentionCount: decisions.length,
    waitingPrimaryHref: decisions[0]?.href ?? null,
    locale,
  });

  const presence: PresenceLine = {
    rung: rungForPresence(presenceModel.state),
    text: presenceModel.narrative,
    href: presenceModel.primaryActionHref
      ? toOfficeHref(peerId, presenceModel.primaryActionHref)
      : null,
    timeLabel: presenceModel.lastMeaningfulUpdateLabel,
    working: presenceModel.showLiveIndicator,
  };

  // --- In flight (§4.1: what she's doing, next step, expected) -------------
  const workingOn = buildMarketingPeerWorkingOnViewModel({
    domainInput,
    presenceNarrative: presenceModel.narrative,
    presenceState: presenceModel.state,
    campaignCopy,
    workspaceCopy,
    locale,
    relatedHref: presenceModel.primaryActionHref,
    waitingHref: decisions[0]?.href ?? officeHref(peerId, "desk"),
    attentionCount: decisions.length,
  });

  const inFlight =
    workingOn.mode === "focus" && workingOn.focusTitle
      ? [
          {
            id: "focus",
            what: workingOn.focusTitle,
            nextStep: workingOn.nextStep,
            expected: workingOn.progressLabel,
            href: workingOn.primaryAction?.href
              ? toOfficeHref(peerId, workingOn.primaryAction.href)
              : null,
          },
        ]
      : [];

  // --- Since you were last here -------------------------------------------
  const completed = buildDeduplicatedCompletedOutcomes({
    domainInput,
    locale,
    now: input.now,
  })
    .filter((outcome) => outcome.group === "today" || outcome.group === "yesterday")
    .map((outcome) => ({
      id: outcome.id,
      label: outcome.title,
      context: outcome.projectTitle ?? null,
      timeLabel: outcome.completedTimeLabel ?? null,
      href: outcome.href ? toOfficeHref(peerId, outcome.href) : null,
    }));

  // --- §4.1 The empty state is the ideal state -----------------------------
  const nothingToActOn = decisions.length === 0 && !input.autonomyRequest;
  const empty = nothingToActOn
    ? {
        voice: workspaceCopy.waitingEmptyTitle,
        // Silence is only honest when evidenced.
        next: workingOn.nextStep ?? workspaceCopy.waitingEmptySupport,
      }
    : null;

  return {
    peerId,
    peerName: input.peerName,
    peerRole: input.peerRole,
    presence,
    decisions,
    inFlight,
    completed,
    autonomyRequest: input.autonomyRequest ?? null,
    empty,
    copy: deskCopy(locale, input.peerName),
  };
}
