import type { PeerRow } from "@/lib/peer-display";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getMarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { getPeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { buildMarketingPeerWorkspacePresence } from "@/lib/peer-experience/marketing/colleague/build-marketing-peer-presence";
import {
  buildMarketingPeerAttentionItems,
  countMarketingPeerAttentionItems,
  firstMarketingPeerAttentionHref,
} from "@/features/marketing-workspace/lib/build-peer-attention-items";
import { buildPeerWorkBriefingViewModel } from "./build-peer-work-briefing";
import { sanitizeV17CampaignDisplayName } from "./sanitize-v17-customer-text";
import { resolveActiveMarketingPeerCustomerSection } from "@/lib/peer-experience/marketing/navigation/marketing-peer-sections";

export type V17MarketingPeerShellModel = {
  peerId: string;
  peerName: string;
  peerRole: string;
  statusLabel: string;
  presentationKey: string;
  briefing: ReturnType<typeof buildPeerWorkBriefingViewModel>;
  peerCopy: ReturnType<typeof getV17PeerCopy>;
  activeTab: ReturnType<typeof resolveActiveMarketingPeerCustomerSection>;
  showAssign: boolean;
  showPause: boolean;
  pauseDisabled: boolean;
};

export function buildV17MarketingPeerShellModel(input: {
  peer: PeerRow;
  domainInput: MarketingPeerDomainInput;
  pathname: string;
  localePreference?: string | null;
  pauseDisabled?: boolean;
}): V17MarketingPeerShellModel {
  const locale = resolveCustomerLocalePreference(input.localePreference) as MarketingCampaignLocale;
  const campaignCopy = getMarketingCampaignCopy(locale);
  const peerCopy = getV17PeerCopy(locale);
  const attentionItems = buildMarketingPeerAttentionItems({
    domainInput: input.domainInput,
    locale,
    primaryCtaLabel: peerCopy.reviewCta,
  });
  const attentionCount = countMarketingPeerAttentionItems(input.domainInput, locale);
  const waitingHref = firstMarketingPeerAttentionHref(input.domainInput, locale);

  const workspaceCopy = getPeerWorkspaceCopy(locale);

  const presence = buildMarketingPeerWorkspacePresence({
    domainInput: input.domainInput,
    campaignCopy,
    workspaceCopy,
    attentionCount,
    waitingPrimaryHref: waitingHref,
    locale,
  });

  const primaryAttention = attentionItems[0];
  const isWorking = presence.state === "working" || presence.state === "preparing";

  const briefing = buildPeerWorkBriefingViewModel({
    domainInput: input.domainInput,
    peerDisplayName: input.peer.name,
    locale,
    waitingGroupTitle: primaryAttention?.title ?? null,
    waitingGroupContext: primaryAttention?.projectTitle
      ? sanitizeV17CampaignDisplayName(primaryAttention.projectTitle)
      : null,
    waitingItemCount: primaryAttention?.itemCount,
    isActivelyWorking: isWorking,
  });

  return {
    peerId: input.peer.id,
    peerName: input.peer.name,
    peerRole: input.peer.role,
    statusLabel: presence.stateLabel,
    presentationKey: presence.presentationKey,
    briefing,
    peerCopy,
    activeTab: resolveActiveMarketingPeerCustomerSection(input.pathname, input.peer.id),
    showAssign: true,
    showPause: true,
    pauseDisabled: input.pauseDisabled ?? true,
  };
}
