import type { PeerRow } from "@/lib/peer-display";
import { getMarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { getPeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import { buildMarketingPeerWorkspacePresence } from "@/lib/peer-experience/marketing/colleague/build-marketing-peer-presence";
import {
  buildMarketingPeerCompletedOutcomes,
  buildMarketingPeerWorkingOnViewModel,
} from "@/lib/peer-experience/marketing/colleague/build-marketing-peer-sections";
import type { MarketingPeerSectionId } from "@/lib/peer-experience/marketing/navigation/marketing-peer-sections";
import { getProjectHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  buildMarketingPeerAttentionItems,
  countMarketingPeerAttentionItems,
  firstMarketingPeerAttentionHref,
} from "../lib/build-peer-attention-items";

export function buildPeerWorkspaceColleagueViewModel(input: {
  peer: PeerRow;
  domainInput: MarketingPeerDomainInput;
  activeSection: MarketingPeerSectionId;
  localePreference?: string | null;
}) {
  const locale = resolveCustomerLocalePreference(input.localePreference);
  const campaignCopy = getMarketingCampaignCopy(locale);
  const workspaceCopy = getPeerWorkspaceCopy(locale);
  const attentionItems = buildMarketingPeerAttentionItems({
    domainInput: input.domainInput,
    locale,
    primaryCtaLabel: workspaceCopy.attentionPrimaryCta,
  });
  const attentionCount = countMarketingPeerAttentionItems(input.domainInput, locale);
  const waitingPrimaryHref = firstMarketingPeerAttentionHref(
    input.domainInput,
    locale
  );

  const presence = buildMarketingPeerWorkspacePresence({
    domainInput: input.domainInput,
    campaignCopy,
    workspaceCopy,
    attentionCount,
    waitingPrimaryHref,
    locale,
  });

  const activeProject =
    input.domainInput.projects.find((p) => {
      const unit = input.domainInput.workUnits.find((u) => u.projectId === p.id);
      return unit && !["published", "monitoring"].includes(unit.status);
    }) ?? input.domainInput.projects[0];

  const relatedHref = activeProject
    ? getProjectHref(input.domainInput.peerId, activeProject.id)
    : null;

  const workingOn = buildMarketingPeerWorkingOnViewModel({
    domainInput: input.domainInput,
    presenceNarrative: presence.narrative,
    presenceState: presence.state,
    campaignCopy,
    workspaceCopy,
    locale,
    relatedHref,
    waitingHref: waitingPrimaryHref ?? `/team/${input.domainInput.peerId}/waiting`,
    attentionCount,
  });

  const completedOutcomes = buildMarketingPeerCompletedOutcomes({
    domainInput: input.domainInput,
    locale,
  });

  return {
    peerId: input.domainInput.peerId,
    peerName: input.peer.name,
    peerRole: input.peer.role,
    locale,
    workspaceCopy,
    campaignCopy,
    activeSection: input.activeSection,
    presence,
    attentionItems,
    attentionCount,
    workingOn,
    completedOutcomes,
    breadcrumbTeamHref: "/team",
  };
}

export type PeerWorkspaceColleagueViewModel = ReturnType<
  typeof buildPeerWorkspaceColleagueViewModel
>;
