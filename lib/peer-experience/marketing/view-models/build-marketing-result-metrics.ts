import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import { hasAnalyticsConnection } from "@/lib/integrations/connection-store";
import { resolvePeerPerformance } from "@/lib/metrics/resolve-peer-performance";
import type { MarketingResultMetric } from "../domain/marketing-peer-types";
import {
  getIntegrationsHref,
  getPerformanceHref,
  getSettingsHref,
} from "../navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

const EXECUTIVE_METRIC_DEFS: Array<{
  id: string;
  label: string;
  source: MarketingResultMetric["source"];
  peerEngineKey?: string;
  integrationKeys?: string[];
}> = [
  { id: "reach", label: "Reach", source: "unavailable", integrationKeys: ["reach", "impressions"] },
  { id: "leads", label: "Leads Generated", source: "crm", integrationKeys: ["leads", "lead"] },
  { id: "revenue", label: "Revenue Influenced", source: "crm", integrationKeys: ["revenue"] },
  { id: "roi", label: "Marketing ROI", source: "google_analytics", integrationKeys: ["roi"] },
  { id: "time-saved", label: "Time Saved", source: "peer_engine", peerEngineKey: "time-saved" },
  {
    id: "tasks-automated",
    label: "Tasks Automated",
    source: "peer_engine",
    peerEngineKey: "tasks-automated",
  },
];

function setupMetric(
  def: (typeof EXECUTIVE_METRIC_DEFS)[number],
  input: MarketingPeerDomainInput,
  setupMessage: string,
  ctaLabel: string,
  settingsSection?: string
): MarketingResultMetric {
  return {
    id: def.id,
    label: def.label,
    value: "—",
    source: def.source,
    status: "setup_required",
    setupMessage,
    setupCta: {
      label: ctaLabel,
      href: settingsSection ? getSettingsHref(input.peerId, settingsSection) : getIntegrationsHref(),
    },
  };
}

function countCompletedTasks(input: MarketingPeerDomainInput): number {
  const completedUnits = input.workUnits.filter(
    (u) => u.status === "published" || u.status === "monitoring"
  ).length;
  const publishedDrafts = input.drafts.filter((d) => d.status === "published").length;
  return completedUnits + publishedDrafts;
}

function countAutomatedExecutions(input: MarketingPeerDomainInput): number {
  const fromAutomations = input.automations.filter((a) => a.active).length;
  const fromUnits = input.workUnits.filter((u) => u.automationTrigger && !u.cancelled).length;
  return Math.max(fromAutomations, fromUnits);
}

function formatTimeSaved(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function findIntegrationMetric(
  performance: ReturnType<typeof resolvePeerPerformance>,
  keys: string[]
) {
  return performance.metrics.find(
    (m) =>
      m.source === "integration" &&
      keys.some((k) => m.label.toLowerCase().includes(k))
  );
}

export function buildMarketingResultMetrics(
  input: MarketingPeerDomainInput
): MarketingResultMetric[] {
  const performance = resolvePeerPerformance({
    peerId: input.peerId,
    drafts: input.drafts,
    connections: input.connections,
    storedMetrics: input.storedMetrics,
  });

  const hasAnalytics = hasAnalyticsConnection(input.connections);
  const perfHref = (channel?: string) =>
    getPerformanceHref(input.peerId, { channel, period: "month" });

  return EXECUTIVE_METRIC_DEFS.map((def) => {
    if (def.peerEngineKey === "time-saved") {
      const completed = countCompletedTasks(input);
      const minutes = completed * 45;
      if (completed === 0) {
        return {
          id: def.id,
          label: def.label,
          value: "0h",
          source: "peer_engine",
          status: "estimated",
          estimatedNote: "Estimated from completed work once Emma finishes tasks.",
        };
      }
      return {
        id: def.id,
        label: def.label,
        value: formatTimeSaved(minutes),
        source: "peer_engine",
        status: "estimated",
        sourceLabel: "Peergent estimate",
        estimatedNote: `Estimated from ${completed} completed task${completed === 1 ? "" : "s"}`,
      };
    }

    if (def.peerEngineKey === "tasks-automated") {
      const count = countAutomatedExecutions(input);
      if (count === 0) {
        return {
          id: def.id,
          label: def.label,
          value: 0,
          source: "peer_engine",
          status: "estimated",
          estimatedNote: "Based on executed WorkUnits once automations run.",
        };
      }
      return {
        id: def.id,
        label: def.label,
        value: count,
        source: "peer_engine",
        status: "live",
        sourceLabel: "Peergent WorkUnits",
        estimatedNote: "Based on executed WorkUnits",
      };
    }

    const integrationMatch = def.integrationKeys
      ? findIntegrationMetric(performance, def.integrationKeys)
      : undefined;

    if (integrationMatch) {
      return {
        id: def.id,
        label: def.label,
        value: integrationMatch.value,
        source: def.source === "unavailable" ? "peer_engine" : def.source,
        status: "live",
        sourceLabel: "Connected integration",
        performanceHref: perfHref(def.id === "reach" ? undefined : def.id),
      };
    }

    switch (def.id) {
      case "reach":
        return setupMetric(
          def,
          input,
          "Connect analytics to measure total reach.",
          "Connect analytics",
          "channels"
        );
      case "leads":
        return setupMetric(
          def,
          input,
          "Connect your CRM to attribute generated leads.",
          "Connect CRM",
          "channels"
        );
      case "revenue":
        return setupMetric(
          def,
          input,
          "Connect analytics and CRM to enable attribution.",
          "Set up attribution",
          "channels"
        );
      case "roi":
        return setupMetric(
          def,
          input,
          "Requires campaign cost and revenue data.",
          "Configure ROI tracking",
          "channels"
        );
      default:
        return setupMetric(
          def,
          input,
          hasAnalytics
            ? "Connect your marketing channels to unlock this metric."
            : "Connect Google Analytics and your CRM to see this metric.",
          "Connect analytics",
          "channels"
        );
    }
  });
}

export function pickApprovalDrafts(drafts: MarketingContentDraft[]): MarketingContentDraft[] {
  return drafts.filter((d) => d.status === "ready_for_review" || d.status === "draft");
}
