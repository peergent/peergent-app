import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import {
  buildMarketingPerformanceViewModel,
  parsePerformanceFilters,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-performance-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { getConnectionsHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { deriveProjectStatus } from "@/lib/peer-experience/marketing/projects/project-engine";

export type V17MetricCardModel = {
  id: string;
  value: string;
  label: string;
  href: string | null;
};

function metricHrefForId(
  id: string,
  peerId: string,
  label: string
): string | null {
  const key = `${id} ${label}`.toLowerCase();
  if (
    key.includes("task") ||
    key.includes("taken") ||
    key.includes("completed") ||
    key.includes("afgerond")
  ) {
    return `/team/${peerId}/done`;
  }
  if (key.includes("campaign") && (key.includes("active") || key.includes("actief"))) {
    return `/team/${peerId}/work`;
  }
  if (key.includes("approv") || key.includes("goedgekeur")) {
    return `/team/${peerId}/waiting`;
  }
  if (id.includes("active-campaign")) return `/team/${peerId}/work`;
  if (id.includes("tasks-completed")) return `/team/${peerId}/done`;
  return null;
}

export type V17ResultsViewModel = {
  title: string;
  summaryLine: string | null;
  metrics: V17MetricCardModel[];
  unavailableMessage: string | null;
  connectionsHref: string | null;
  connectionsCta: string | null;
};

const BLOCKED_METRIC_IDS = new Set(["time_saved", "tasks_automated", "hours_saved"]);

function localizeMetricLabel(id: string, label: string, locale: MarketingCampaignLocale): string {
  if (locale !== "nl") return label;
  const lower = label.toLowerCase();
  if (lower.includes("time saved") || lower.includes("hours saved")) return "";
  if (lower.includes("tasks automated")) return "";
  if (id.includes("task") || lower.includes("task")) return "Taken afgerond";
  if (lower.includes("campaign") && lower.includes("active")) return "Campagnes actief";
  if (lower.includes("approved")) return "Onderdelen goedgekeurd";
  if (lower.includes("completed")) return "Campagnes afgerond";
  if (lower.includes("published")) return "Publicaties";
  return label;
}

export function buildV17ResultsViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  localePreference?: string | null;
  searchParams?: URLSearchParams;
}): V17ResultsViewModel {
  const locale = resolveCustomerLocalePreference(input.localePreference) as MarketingCampaignLocale;
  const copy = getV17PeerCopy(locale);
  const filters = parsePerformanceFilters(input.searchParams ?? new URLSearchParams());
  const vm = buildMarketingPerformanceViewModel({ ...input.domainInput, filters });

  const peerId = input.domainInput.peerId;
  const scheduled = new Set<string>();
  const metrics: V17MetricCardModel[] = vm.executiveMetrics
    .filter((m) => m.status !== "setup_required" && m.value != null && m.value !== "—")
    .filter((m) => !BLOCKED_METRIC_IDS.has(m.id))
    .slice(0, 4)
    .map((m) => {
      const label = localizeMetricLabel(m.id, m.label, locale);
      return {
        id: m.id,
        value: String(m.value),
        label,
        href: metricHrefForId(m.id, peerId, label),
      };
    })
    .filter((m) => m.label);

  const activeCampaigns = input.domainInput.projects.filter((p) => {
    const status = deriveProjectStatus(p, input.domainInput.workUnits, input.domainInput.drafts, scheduled);
    return !["completed", "archived", "monitoring_results"].includes(status);
  }).length;

  if (metrics.length === 0 && activeCampaigns > 0) {
    metrics.push({
      id: "active-campaigns",
      value: String(activeCampaigns),
      label: locale === "nl" ? "Campagnes actief" : "Active campaigns",
      href: `/team/${peerId}/work`,
    });
  }

  const completedTasks = input.domainInput.activityFeed?.filter((a) =>
    /completed|approved|published|resolved/i.test(a.activityType ?? "")
  ).length;

  if (metrics.length < 2 && completedTasks && completedTasks > 0) {
    metrics.unshift({
      id: "tasks-completed",
      value: String(completedTasks),
      label: locale === "nl" ? "Taken afgerond" : "Tasks completed",
      href: `/team/${peerId}/done`,
    });
  }

  const hasData = metrics.length > 0;
  const summaryLine =
    hasData && completedTasks
      ? locale === "nl"
        ? `Deze maand zijn ${completedTasks} marketingtaken afgerond.`
        : `${completedTasks} marketing tasks completed this month.`
      : hasData && metrics[0]
        ? locale === "nl"
          ? `Er zijn ${metrics[0].value} ${metrics[0].label.toLowerCase()}.`
          : `${metrics[0].value} ${metrics[0].label.toLowerCase()}.`
        : null;

  return {
    title: copy.resultsTitle,
    summaryLine,
    metrics: metrics.slice(0, 4),
    unavailableMessage: hasData ? null : copy.resultsUnavailable,
    connectionsHref: hasData ? null : getConnectionsHref(input.domainInput.peerId),
    connectionsCta: hasData ? null : copy.connectionsCta,
  };
}
