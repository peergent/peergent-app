import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { IntegrationConnection } from "@/lib/integrations/types";
import { hasAnalyticsConnection } from "@/lib/integrations/connection-store";
import type { MetricSnapshot } from "./types";

export type ResolvedPerformanceMetric = {
  id: string;
  label: string;
  value: string;
  grounded: boolean;
  source: "integration" | "operational";
};

export type PeerPerformanceSnapshot = {
  metrics: ResolvedPerformanceMetric[];
  emptyMessage: string | null;
  hasTrendData: boolean;
};

export function resolvePeerPerformance(input: {
  peerId: string;
  drafts: MarketingContentDraft[];
  connections: IntegrationConnection[];
  storedMetrics?: MetricSnapshot[];
}): PeerPerformanceSnapshot {
  const operational: ResolvedPerformanceMetric[] = [];
  const published = input.drafts.filter((d) => d.status === "published");
  const pendingReview = input.drafts.filter(
    (d) => d.status === "draft" || d.status === "ready_for_review"
  );

  if (published.length > 0) {
    operational.push({
      id: "content-published",
      label: "Content published",
      value: String(published.length),
      grounded: true,
      source: "operational",
    });
  }

  if (pendingReview.length > 0) {
    operational.push({
      id: "awaiting-approval",
      label: "Awaiting approval",
      value: String(pendingReview.length),
      grounded: true,
      source: "operational",
    });
  }

  const integrationMetrics = (input.storedMetrics ?? [])
    .filter((m) => m.peerId === input.peerId)
    .map((m) => ({
      id: m.id,
      label: m.label,
      value: m.value,
      grounded: true,
      source: "integration" as const,
    }));

  const metrics = [...integrationMetrics, ...operational];

  if (!hasAnalyticsConnection(input.connections) && integrationMetrics.length === 0) {
    return {
      metrics: operational,
      emptyMessage: "Performance data becomes available after connecting your channels.",
      hasTrendData: false,
    };
  }

  return {
    metrics,
    emptyMessage: operational.length === 0 && integrationMetrics.length === 0
      ? "Performance data becomes available after connecting your channels."
      : null,
    hasTrendData: integrationMetrics.length > 0,
  };
}
