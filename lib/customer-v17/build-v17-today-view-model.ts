import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getPeerWorkspaceCopy } from "@/lib/i18n/peer-workspace-copy";
import { buildDeduplicatedCompletedOutcomes } from "@/lib/peer-experience/marketing/colleague/build-deduplicated-outcomes";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { PeerRow } from "@/lib/peer-display";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import {
  buildMarketingPeerAttentionItems,
} from "@/features/marketing-workspace/lib/build-peer-attention-items";
import { buildMarketingPeerWorkingOnViewModel } from "@/lib/peer-experience/marketing/colleague/build-marketing-peer-sections";
import { buildMarketingPeerWorkspacePresence } from "@/lib/peer-experience/marketing/colleague/build-marketing-peer-presence";
import { getMarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { countMarketingPeerAttentionItems, firstMarketingPeerAttentionHref } from "@/features/marketing-workspace/lib/build-peer-attention-items";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { v17ServiceKeyFromPeer } from "@/lib/customer-v17/peer-accent";
import {
  normalizeNeedsYouTitle,
  sanitizeV17CampaignDisplayName,
} from "./sanitize-v17-customer-text";

export type V17AttentionCardModel = {
  id: string;
  title: string;
  contextLine: string;
  primaryLabel: string;
  primaryHref: string;
  serviceKey: import("@/lib/hq/hq-service-key").HqServiceKey;
};

export type V17TodayViewModel = {
  peerId: string;
  attentionCount: number;
  primaryAttention: V17AttentionCardModel | null;
  moreAttentionCount: number;
  viewAllAttentionHref: string;
  completedToday: Array<{ id: string; label: string; href: string | null }>;
  nextItems: Array<{ id: string; label: string; href: string | null }>;
  showCaughtUp: boolean;
  caughtUpHeadline: string;
  caughtUpBody: string;
  copy: ReturnType<typeof getV17PeerCopy>;
};

export function attentionContextForPeer(
  projectTitle: string | undefined,
  itemCount: number | undefined,
  locale: MarketingCampaignLocale
): string {
  const campaign =
    sanitizeV17CampaignDisplayName(projectTitle ?? "") ||
    (locale === "nl" ? "Campagne" : "Campaign");
  if (itemCount && itemCount > 0) {
    return locale === "nl"
      ? `${campaign} · ${itemCount} onderdelen klaar`
      : `${campaign} · ${itemCount} items ready`;
  }
  return locale === "nl"
    ? `${campaign} · klaar voor beoordeling`
    : `${campaign} · ready for review`;
}

export function buildV17TodayViewModel(input: {
  peer: PeerRow;
  domainInput: MarketingPeerDomainInput;
  localePreference?: string | null;
}): V17TodayViewModel {
  const locale = resolveCustomerLocalePreference(input.localePreference) as MarketingCampaignLocale;
  const workspaceCopy = getPeerWorkspaceCopy(locale);
  const v17Copy = getV17PeerCopy(locale);
  const campaignCopy = getMarketingCampaignCopy(locale);
  const peerId = input.domainInput.peerId;

  const attentionItems = buildMarketingPeerAttentionItems({
    domainInput: input.domainInput,
    locale,
    primaryCtaLabel: v17Copy.reviewCta,
  });
  const attentionCount = countMarketingPeerAttentionItems(input.domainInput, locale);
  const waitingHref = firstMarketingPeerAttentionHref(input.domainInput, locale);

  const presence = buildMarketingPeerWorkspacePresence({
    domainInput: input.domainInput,
    campaignCopy,
    workspaceCopy,
    attentionCount,
    waitingPrimaryHref: waitingHref,
    locale,
  });

  const workingOn = buildMarketingPeerWorkingOnViewModel({
    domainInput: input.domainInput,
    presenceNarrative: presence.narrative,
    presenceState: presence.state,
    campaignCopy,
    workspaceCopy,
    locale,
    relatedHref: null,
    waitingHref: waitingHref ?? `/team/${peerId}/waiting`,
    attentionCount,
  });

  let outcomes = buildDeduplicatedCompletedOutcomes({
    domainInput: input.domainInput,
    locale,
  }).filter((o) => o.group === "today");

  if (outcomes.length === 0) {
    const all = buildDeduplicatedCompletedOutcomes({ domainInput: input.domainInput, locale });
    outcomes = all.slice(0, 5);
  }

  if (outcomes.length === 0 && input.domainInput.activityFeed?.length) {
    const todayCount = Math.min(5, input.domainInput.activityFeed.length);
    if (todayCount > 0) {
      outcomes = [
        {
          id: "fallback-completed",
          title:
            locale === "nl"
              ? `${todayCount} marketingtaken afgerond`
              : `${todayCount} marketing tasks completed`,
          href: `/team/${peerId}/done`,
          group: "today" as const,
          completedAt: new Date().toISOString(),
        },
      ];
    }
  }

  const primary = attentionItems[0];
  let primaryAttention: V17AttentionCardModel | null = null;
  if (primary) {
    primaryAttention = {
      id: primary.id,
      title: normalizeNeedsYouTitle(primary.title, locale),
      contextLine: attentionContextForPeer(primary.projectTitle, primary.itemCount, locale),
      primaryLabel: primary.primaryActionLabel,
      primaryHref: primary.href,
      serviceKey: v17ServiceKeyFromPeer({ role: input.peer.role, name: input.peer.name }),
    };
  }

  const moreAttentionCount = Math.max(0, attentionCount - 1);

  const nextItems = workingOn.upcoming.slice(0, 3).map((u) => ({
    id: u.id,
    label: u.title,
    href: u.href ?? null,
  }));

  return {
    peerId,
    attentionCount,
    primaryAttention,
    moreAttentionCount,
    viewAllAttentionHref: `/team/${peerId}/waiting`,
    completedToday: outcomes.slice(0, 5).map((o) => ({
      id: o.id,
      label: o.title,
      href: o.href ?? null,
    })),
    nextItems,
    showCaughtUp:
      !primaryAttention &&
      outcomes.length === 0 &&
      nextItems.length === 0 &&
      workingOn.mode !== "focus",
    caughtUpHeadline: workspaceCopy.caughtUpHeadline,
    caughtUpBody: workspaceCopy.caughtUpBody,
    copy: v17Copy,
  };
}
