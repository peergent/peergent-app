import type { MarketingContentPerformanceMetric } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

const CONTENT_METRIC_KEYS = [
  { id: "reach", label: "Reach", keys: ["reach"] },
  { id: "impressions", label: "Impressions", keys: ["impression"] },
  { id: "engagement", label: "Engagement", keys: ["engagement"] },
  { id: "clicks", label: "Clicks", keys: ["click", "ctr"] },
  { id: "leads", label: "Leads", keys: ["lead"] },
  { id: "revenue", label: "Revenue influenced", keys: ["revenue"] },
  { id: "roi", label: "ROI", keys: ["roi"] },
];

export function buildContentPerformanceSummary(
  input: MarketingPeerDomainInput,
  contentId: string,
  isPublished: boolean
): {
  metrics: MarketingContentPerformanceMetric[];
  emptyMessage: string;
  hasLiveData: boolean;
} {
  if (!isPublished) {
    return {
      metrics: [],
      emptyMessage: "Performance will appear after this content is published.",
      hasLiveData: false,
    };
  }

  const stored = (input.storedMetrics ?? []).filter(
    (m) => m.peerId === input.peerId
  );

  if (stored.length === 0) {
    return {
      metrics: [],
      emptyMessage:
        "Performance will appear after the channel is connected and the content is published.",
      hasLiveData: false,
    };
  }

  const metrics: MarketingContentPerformanceMetric[] = CONTENT_METRIC_KEYS.map((def) => {
    const match = stored.find((m) =>
      def.keys.some((k) => m.metricKey.toLowerCase().includes(k) || m.label.toLowerCase().includes(k))
    );
    if (match) {
      return { id: def.id, label: def.label, value: match.value, status: "live" as const };
    }
    return { id: def.id, label: def.label, value: "—", status: "unavailable" as const };
  });

  const hasLiveData = metrics.some((m) => m.status === "live");

  return {
    metrics,
    emptyMessage: hasLiveData
      ? ""
      : "Performance will appear after the channel is connected and the content is published.",
    hasLiveData,
  };
}
