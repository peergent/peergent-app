import { PERFORMANCE_PAGE_SECTIONS } from "@/lib/metrics/types";
import { resolvePeerPerformance } from "@/lib/metrics/resolve-peer-performance";
import type { MarketingPerformanceFilters } from "../domain/marketing-peer-types";
import { getPerformanceHref } from "../navigation/marketing-peer-links";
import { humanChannelLabel } from "../publish-preview-formatters";
import { buildMarketingResultMetrics } from "./build-marketing-result-metrics";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

export type MarketingPerformanceViewModel = {
  filters: MarketingPerformanceFilters;
  executiveMetrics: ReturnType<typeof buildMarketingResultMetrics>;
  sections: typeof PERFORMANCE_PAGE_SECTIONS;
  groundedMetrics: ReturnType<typeof resolvePeerPerformance>["metrics"];
  emptyMessage: string | null;
  hasTrendData: boolean;
  filterLabels: {
    contentId?: string;
    channel?: string;
    period?: string;
    view?: string;
  };
  contentScope: {
    contentId: string | null;
    title: string | null;
    channel: string | null;
    clearFiltersHref: string;
    setupMessage: string | null;
  };
  insightsView: boolean;
};

export function buildMarketingPerformanceViewModel(
  input: MarketingPeerDomainInput & { filters?: MarketingPerformanceFilters }
): MarketingPerformanceViewModel {
  const filters = input.filters ?? {};
  const performance = resolvePeerPerformance({
    peerId: input.peerId,
    drafts: input.drafts,
    connections: input.connections,
    storedMetrics: input.storedMetrics,
  });

  const scopedDraft = filters.contentId
    ? input.drafts.find((d) => d.id === filters.contentId)
    : undefined;

  let setupMessage: string | null = null;
  if (scopedDraft) {
    if (scopedDraft.status !== "published") {
      setupMessage = "This content has not been published yet. Performance appears after publication.";
    } else if ((input.storedMetrics ?? []).length === 0) {
      setupMessage =
        "Performance for this content will appear after the channel is connected and data syncs.";
    }
  }

  return {
    filters,
    executiveMetrics: buildMarketingResultMetrics(input),
    sections: PERFORMANCE_PAGE_SECTIONS,
    groundedMetrics: performance.metrics,
    emptyMessage: scopedDraft ? setupMessage : performance.emptyMessage,
    hasTrendData: performance.hasTrendData,
    filterLabels: {
      contentId: filters.contentId,
      channel: filters.channel,
      period: filters.period ?? "This month",
      view: filters.view,
    },
    contentScope: {
      contentId: filters.contentId ?? null,
      title: scopedDraft?.title ?? null,
      channel: scopedDraft ? humanChannelLabel(scopedDraft) : filters.channel ?? null,
      clearFiltersHref: getPerformanceHref(input.peerId),
      setupMessage,
    },
    insightsView: filters.view === "insights",
  };
}

export function parsePerformanceFilters(
  searchParams: URLSearchParams
): MarketingPerformanceFilters {
  return {
    contentId: searchParams.get("contentId") ?? undefined,
    campaignId: searchParams.get("campaignId") ?? undefined,
    channel: searchParams.get("channel") ?? undefined,
    period: searchParams.get("period") ?? undefined,
    view: searchParams.get("view") ?? undefined,
  };
}
