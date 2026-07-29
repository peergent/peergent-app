import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { buildMarketingProjectsViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-projects-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import { sanitizeV17CustomerLine } from "./sanitize-v17-customer-text";

export type V17CampaignRowModel = {
  id: string;
  name: string;
  metaLine: string;
  statusTag: string;
  href: string;
};

export type V17WorkGroupModel = {
  id: string;
  title: string;
  rows: V17CampaignRowModel[];
};

export type V17WorkViewModel = {
  peerId: string;
  title: string;
  subtitle: string;
  groups: V17WorkGroupModel[];
  createLabel: string;
  copy: ReturnType<typeof getV17PeerCopy>;
};

function localizedStatusTag(statusLabel: string, locale: MarketingCampaignLocale): string {
  const lower = statusLabel.toLowerCase().trim();
  if (locale === "nl") {
    if (lower === "active" || lower.includes("in progress") || lower.includes("bezig")) return "bezig";
    if (lower === "ready" || lower.includes("ready")) return "klaar";
    if (lower === "planned" || lower.includes("planning") || lower.includes("gepland")) return "gepland";
    if (lower.includes("complete") || lower.includes("monitor") || lower.includes("done"))
      return "afgerond";
    if (lower.includes("archiv")) return "gearchiveerd";
    if (lower.includes("waiting") || lower.includes("review")) return "wacht op beoordeling";
    if (lower.includes("draft")) return "concept";
    if (lower.includes("scheduled")) return "gepland";
  }
  if (lower.includes("plan")) return "planned";
  if (lower.includes("complete") || lower.includes("monitor")) return "completed";
  if (lower.includes("waiting") || lower.includes("review")) return "waiting for review";
  return lower === "active" ? "active" : statusLabel;
}

function mapRow(
  item: ReturnType<typeof buildMarketingProjectsViewModel>["items"][number],
  locale: MarketingCampaignLocale,
  copy: ReturnType<typeof getV17PeerCopy>
): V17CampaignRowModel {
  const meta = sanitizeV17CustomerLine(item.startedLabel ?? "", locale);
  return {
    id: item.id,
    name: item.title,
    metaLine: meta || copy.workMetaFallback(),
    statusTag: localizedStatusTag(item.statusLabel, locale),
    href: item.href,
  };
}

export function buildV17WorkViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  peerDisplayName?: string;
  localePreference?: string | null;
}): V17WorkViewModel {
  const locale = resolveCustomerLocalePreference(input.localePreference) as MarketingCampaignLocale;
  const copy = getV17PeerCopy(locale);
  const peerName = input.peerDisplayName ?? input.domainInput.peerName;
  const activeVm = buildMarketingProjectsViewModel({ ...input.domainInput, filter: "active" });
  const upcomingVm = buildMarketingProjectsViewModel({ ...input.domainInput, filter: "upcoming" });
  const completedVm = buildMarketingProjectsViewModel({ ...input.domainInput, filter: "completed" });

  const groups: V17WorkGroupModel[] = [];
  if (activeVm.items.length) {
    groups.push({
      id: "active",
      title: locale === "nl" ? "Actief" : "Active",
      rows: activeVm.items.map((item) => mapRow(item, locale, copy)),
    });
  }
  if (upcomingVm.items.length) {
    groups.push({
      id: "planned",
      title: locale === "nl" ? "Gepland" : "Planned",
      rows: upcomingVm.items.map((item) => mapRow(item, locale, copy)),
    });
  }
  if (completedVm.items.length) {
    groups.push({
      id: "completed",
      title: locale === "nl" ? "Afgerond" : "Completed",
      rows: completedVm.items.map((item) => mapRow(item, locale, copy)),
    });
  }

  return {
    peerId: input.domainInput.peerId,
    title: copy.workTitle,
    subtitle: copy.workSubtitle.replace("deze Peer", peerName).replace("this peer", peerName),
    groups,
    createLabel: locale === "nl" ? "Nieuwe campagne" : "New campaign",
    copy,
  };
}
