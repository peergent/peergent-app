import type { MetricSnapshot } from "@/lib/metrics/types";
import type { IntegrationConnection, IntegrationProviderId } from "@/lib/integrations/types";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { INTEGRATION_LABELS } from "@/lib/integrations/types";
import { officeHref } from "../links";
import { resolveProjectIdForDraft } from "../attribution";
import { officeMetricDef, providerCanReport } from "./metric-catalog";
import type { PerformanceSectionMetric } from "./sections";

export type PerformanceProviderCardId =
  | "linkedin"
  | "google_ads"
  | "ga4"
  | "hubspot";

export type PerformanceProviderCard = {
  id: PerformanceProviderCardId;
  title: string;
  metrics: PerformanceSectionMetric[];
  detailHref: string;
};

const EXECUTIVE_KEYS = ["attributed_revenue", "reach", "leads"] as const;

export function curateExecutiveMetrics(
  metrics: PerformanceSectionMetric[]
): PerformanceSectionMetric[] {
  const byKey = new Map(metrics.map((metric) => [metric.key, metric]));
  return EXECUTIVE_KEYS.map((key) => byKey.get(key)).filter(
    (metric): metric is PerformanceSectionMetric => metric != null
  );
}

function connectedProviders(connections: readonly IntegrationConnection[]): Set<string> {
  return new Set(
    connections.filter((c) => c.status === "connected").map((c) => c.id as string)
  );
}

function providerLabel(provider: string): string {
  return (
    INTEGRATION_LABELS[provider as IntegrationProviderId] ??
    (provider === "operational" ? "Peergent" : provider)
  );
}

function resolveStoredMetric(
  key: string,
  locale: MarketingCampaignLocale,
  peerId: string,
  storedMetrics: readonly MetricSnapshot[],
  connections: readonly IntegrationConnection[]
): PerformanceSectionMetric | null {
  const def = officeMetricDef(key);
  if (!def) return null;

  const connected = connectedProviders(connections);
  const snapshot = [...storedMetrics]
    .filter((m) => m.peerId === peerId && m.metricKey === key)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];

  if (!snapshot) return null;
  if (!providerCanReport(def, snapshot.provider)) return null;
  if (!connected.has(snapshot.provider)) return null;

  const value = `${snapshot.value ?? ""}`.trim();
  if (!value || value === "—") return null;

  const nl = locale === "nl";
  return {
    key,
    label: def.label[locale],
    value,
    kind: def.kind,
    upIsGood: def.upIsGood,
    sourceLabel: providerLabel(snapshot.provider),
    methodology: nl
      ? `Gerapporteerd door ${providerLabel(snapshot.provider)}.`
      : `Reported by ${providerLabel(snapshot.provider)}.`,
    delta: null,
    priority: def.priority,
  };
}

function countLinkedInCampaigns(domainInput: MarketingPeerDomainInput): number {
  return domainInput.projects.filter((project) => {
    if (project.campaignType.includes("linkedin")) return true;
    if (project.campaignSetup?.selectedChannels?.includes("linkedin")) return true;
    return domainInput.drafts.some((draft) => {
      if (draft.channel !== "linkedin" && draft.contentType !== "linkedin_post") {
        return false;
      }
      return resolveProjectIdForDraft(draft, domainInput.workUnits) === project.id;
    });
  }).length;
}

export function buildProviderPerformanceCards(input: {
  peerId: string;
  locale: MarketingCampaignLocale;
  domainInput: MarketingPeerDomainInput;
}): PerformanceProviderCard[] {
  const { peerId, locale, domainInput } = input;
  const nl = locale === "nl";
  const stored = domainInput.storedMetrics ?? [];
  const connections = domainInput.connections;

  const cards: PerformanceProviderCard[] = [];

  const linkedinMetrics = [
    resolveStoredMetric("linkedin_reach", locale, peerId, stored, connections),
    resolveStoredMetric("engagement", locale, peerId, stored, connections),
    resolveStoredMetric("content_engagement", locale, peerId, stored, connections),
  ].filter((m): m is PerformanceSectionMetric => m != null);

  const linkedInCampaignCount = countLinkedInCampaigns(domainInput);
  if (linkedInCampaignCount > 0) {
    linkedinMetrics.push({
      key: "linkedin_campaigns",
      label: nl ? "Campagnes" : "Campaigns",
      value: String(linkedInCampaignCount),
      kind: "activity",
      upIsGood: true,
      sourceLabel: nl ? "Intern geteld" : "Counted internally",
      methodology: nl
        ? "Campagnes met LinkedIn als kanaal in deze workspace."
        : "Campaigns with LinkedIn as a channel in this workspace.",
      delta: null,
      priority: 200,
    });
  }

  if (linkedinMetrics.length > 0) {
    cards.push({
      id: "linkedin",
      title: "LinkedIn",
      metrics: linkedinMetrics.slice(0, 4),
      detailHref: `${officeHref(peerId, "performance")}/linkedin`,
    });
  }

  const googleMetrics = [
    resolveStoredMetric("google_spend", locale, peerId, stored, connections),
    resolveStoredMetric("roas", locale, peerId, stored, connections),
    resolveStoredMetric("cpa", locale, peerId, stored, connections),
    resolveStoredMetric("cpc", locale, peerId, stored, connections),
    resolveStoredMetric("ctr", locale, peerId, stored, connections),
    resolveStoredMetric("campaign_leads", locale, peerId, stored, connections),
  ].filter((m): m is PerformanceSectionMetric => m != null);

  if (googleMetrics.length > 0) {
    cards.push({
      id: "google_ads",
      title: "Google Ads",
      metrics: googleMetrics.slice(0, 4),
      detailHref: `${officeHref(peerId, "performance")}/google-ads`,
    });
  }

  const ga4Metrics = [
    resolveStoredMetric("reach", locale, peerId, stored, connections),
    resolveStoredMetric("content_clicks", locale, peerId, stored, connections),
  ].filter((m): m is PerformanceSectionMetric => m != null);

  if (ga4Metrics.length > 0) {
    cards.push({
      id: "ga4",
      title: "Google Analytics",
      metrics: ga4Metrics.slice(0, 4),
      detailHref: `${officeHref(peerId, "performance")}/ga4`,
    });
  }

  const crmMetrics = [
    resolveStoredMetric("attributed_revenue", locale, peerId, stored, connections),
    resolveStoredMetric("attributed_leads", locale, peerId, stored, connections),
    resolveStoredMetric("leads", locale, peerId, stored, connections),
  ].filter((m): m is PerformanceSectionMetric => m != null);

  if (crmMetrics.length > 0) {
    cards.push({
      id: "hubspot",
      title: "CRM",
      metrics: crmMetrics.slice(0, 4),
      detailHref: `${officeHref(peerId, "performance")}/crm`,
    });
  }

  return cards;
}
