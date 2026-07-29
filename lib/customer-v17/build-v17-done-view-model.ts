import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import { buildDeduplicatedCompletedOutcomes } from "@/lib/peer-experience/marketing/colleague/build-deduplicated-outcomes";
import type { PeerCompletedOutcomeViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

export type V17DoneGroupId = "today" | "yesterday" | "this_week" | "older";

export type V17DoneGroup = {
  id: V17DoneGroupId;
  title: string;
  items: Array<{ id: string; label: string; href: string | null }>;
};

export type V17DoneViewModel = {
  peerId: string;
  groups: V17DoneGroup[];
  emptyHeadline: string;
  emptyBody: string;
  copy: ReturnType<typeof getV17PeerCopy>;
};

function groupTitle(id: V17DoneGroupId, locale: MarketingCampaignLocale): string {
  if (locale === "nl") {
    switch (id) {
      case "today":
        return "Vandaag";
      case "yesterday":
        return "Gisteren";
      case "this_week":
        return "Deze week";
      default:
        return "Eerder";
    }
  }
  switch (id) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "this_week":
      return "This week";
    default:
      return "Earlier";
  }
}

function bucketOutcomes(outcomes: PeerCompletedOutcomeViewModel[]): V17DoneGroup[] {
  const order: V17DoneGroupId[] = ["today", "yesterday", "this_week", "older"];
  const buckets = new Map<V17DoneGroupId, V17DoneGroup["items"]>();
  for (const id of order) buckets.set(id, []);

  for (const o of outcomes) {
    const group = o.group === "today" ? "today" : o.group;
    const key =
      group === "yesterday"
        ? "yesterday"
        : group === "this_week"
          ? "this_week"
          : group === "today"
            ? "today"
            : "older";
    buckets.get(key)?.push({
      id: o.id,
      label: o.title,
      href: o.href ?? null,
    });
  }

  return order
    .map((id) => ({
      id,
      title: "",
      items: buckets.get(id) ?? [],
    }))
    .filter((g) => g.items.length > 0);
}

export function buildV17DoneViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  localePreference?: string | null;
}): V17DoneViewModel {
  const locale = resolveCustomerLocalePreference(
    input.localePreference
  ) as MarketingCampaignLocale;
  const v17Copy = getV17PeerCopy(locale);
  const peerId = input.domainInput.peerId;

  const outcomes = buildDeduplicatedCompletedOutcomes({
    domainInput: input.domainInput,
    locale,
  });

  const groups = bucketOutcomes(outcomes).map((g) => ({
    ...g,
    title: groupTitle(g.id, locale),
  }));

  const nl = locale === "nl";

  return {
    peerId,
    groups,
    emptyHeadline: nl ? "Nog geen afgerond werk" : "No completed work yet",
    emptyBody: nl
      ? "Zodra Marketing Peer taken afrondt, verschijnen ze hier."
      : "When Marketing Peer completes work, it will show up here.",
    copy: v17Copy,
  };
}
