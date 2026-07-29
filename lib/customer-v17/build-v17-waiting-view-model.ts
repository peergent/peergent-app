import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import type { PeerRow } from "@/lib/peer-display";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { v17ServiceKeyFromPeer } from "@/lib/customer-v17/peer-accent";
import { attentionContextForPeer } from "@/lib/customer-v17/build-v17-today-view-model";
import { normalizeNeedsYouTitle } from "@/lib/customer-v17/sanitize-v17-customer-text";
import { buildMarketingPeerAttentionItems } from "@/features/marketing-workspace/lib/build-peer-attention-items";
import type { V17AttentionCardModel } from "@/lib/customer-v17/build-v17-today-view-model";

export type V17WaitingViewModel = {
  peerId: string;
  attentionCount: number;
  items: V17AttentionCardModel[];
  emptyHeadline: string;
  emptyBody: string;
  copy: ReturnType<typeof getV17PeerCopy>;
};

export function buildV17WaitingViewModel(input: {
  peer: PeerRow;
  domainInput: MarketingPeerDomainInput;
  localePreference?: string | null;
}): V17WaitingViewModel {
  const locale = resolveCustomerLocalePreference(
    input.localePreference
  ) as MarketingCampaignLocale;
  const v17Copy = getV17PeerCopy(locale);
  const peerId = input.domainInput.peerId;
  const serviceKey = v17ServiceKeyFromPeer({
    role: input.peer.role,
    name: input.peer.name,
  });

  const attentionItems = buildMarketingPeerAttentionItems({
    domainInput: input.domainInput,
    locale,
    primaryCtaLabel: v17Copy.reviewCta,
  });

  const items: V17AttentionCardModel[] = attentionItems.map((item) => ({
    id: item.id,
    title: normalizeNeedsYouTitle(item.title, locale),
    contextLine: attentionContextForPeer(item.projectTitle, item.itemCount, locale),
    primaryLabel: item.primaryActionLabel,
    primaryHref: item.href ?? `/team/${peerId}/waiting`,
    serviceKey,
  }));

  const nl = locale === "nl";

  return {
    peerId,
    attentionCount: items.length,
    items,
    emptyHeadline: nl ? "Alles is bijgewerkt" : "You are all caught up",
    emptyBody: nl
      ? "Er staat niets meer klaar voor jouw beoordeling."
      : "Nothing is waiting for your review right now.",
    copy: v17Copy,
  };
}
