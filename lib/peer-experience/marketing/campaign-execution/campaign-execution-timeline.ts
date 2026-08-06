import type { ActivityFeedItem, ActivityType } from "@/lib/marketing-workspace/experience/types";

import type { CampaignExecutionCorrelation } from "./campaign-execution-correlation";
import { formatCampaignExecutionCorrelation } from "./campaign-execution-correlation";

export type CampaignExecutionTimelineEventKind =
  | "campaign_started"
  | "research_complete"
  | "reasoning_complete"
  | "marketing_intelligence_complete"
  | "strategy_complete"
  | "planning_complete"
  | "creative_complete"
  | "validation_complete"
  | "scheduling_complete"
  | "campaign_approved"
  | "publication_started"
  | "publication_succeeded"
  | "publication_failed"
  | "publication_retried"
  | "memory_updated"
  | "campaign_completed";

export type CampaignExecutionTimelineEvent = {
  readonly id: string;
  readonly kind: CampaignExecutionTimelineEventKind;
  readonly at: string;
  readonly correlation: CampaignExecutionCorrelation;
  readonly detail?: string;
};

const TIMELINE_LABELS: Record<CampaignExecutionTimelineEventKind, string> = {
  campaign_started: "Campaign Started",
  research_complete: "Research Complete",
  reasoning_complete: "Reasoning Complete",
  marketing_intelligence_complete: "Marketing Intelligence Complete",
  strategy_complete: "Strategy Complete",
  planning_complete: "Planning Complete",
  creative_complete: "Creative Complete",
  validation_complete: "Validation Complete",
  scheduling_complete: "Scheduling Complete",
  campaign_approved: "Campaign Approved",
  publication_started: "Publication Started",
  publication_succeeded: "Publication Succeeded",
  publication_failed: "Publication Failed",
  publication_retried: "Publication Retried",
  memory_updated: "Memory Updated",
  campaign_completed: "Campaign Completed",
};

const TIMELINE_ACTIVITY_TYPE: Partial<Record<CampaignExecutionTimelineEventKind, ActivityType>> =
  {
    campaign_started: "campaign_execution_started",
    research_complete: "campaign_research_complete",
    reasoning_complete: "campaign_reasoning_complete",
    marketing_intelligence_complete: "campaign_marketing_intelligence_complete",
    strategy_complete: "campaign_strategy_complete",
    planning_complete: "campaign_planning_complete",
    creative_complete: "campaign_creative_complete",
    validation_complete: "campaign_validation_complete",
    scheduling_complete: "campaign_scheduling_complete",
    campaign_approved: "campaign_approved",
    publication_started: "campaign_publication_started",
    publication_succeeded: "campaign_publication_succeeded",
    publication_failed: "campaign_publication_failed",
    publication_retried: "campaign_publication_retried",
    memory_updated: "campaign_memory_updated",
    campaign_completed: "campaign_execution_completed",
  };

let timelineCounter = 0;

export function createCampaignExecutionTimelineEvent(input: {
  kind: CampaignExecutionTimelineEventKind;
  correlation: CampaignExecutionCorrelation;
  at?: string;
  detail?: string;
}): CampaignExecutionTimelineEvent {
  timelineCounter += 1;
  return {
    id: `cex-${timelineCounter.toString(36)}`,
    kind: input.kind,
    at: input.at ?? new Date().toISOString(),
    correlation: input.correlation,
    detail: input.detail,
  };
}

export function campaignExecutionTimelineEventLabel(
  kind: CampaignExecutionTimelineEventKind
): string {
  return TIMELINE_LABELS[kind];
}

export function timelineEventToActivityFeedItem(
  event: CampaignExecutionTimelineEvent
): ActivityFeedItem | null {
  const activityType = TIMELINE_ACTIVITY_TYPE[event.kind];
  if (!activityType) return null;

  const description = [formatCampaignExecutionCorrelation(event.correlation), event.detail]
    .filter(Boolean)
    .join("; ");

  return {
    id: event.id,
    timestamp: event.at,
    activityType,
    title: campaignExecutionTimelineEventLabel(event.kind),
    description,
    correlation: event.correlation,
  };
}

export function appendTimelineEvent(
  timeline: readonly CampaignExecutionTimelineEvent[],
  event: CampaignExecutionTimelineEvent
): CampaignExecutionTimelineEvent[] {
  const repeatableKinds: ReadonlySet<CampaignExecutionTimelineEventKind> = new Set([
    "publication_started",
    "publication_failed",
    "publication_retried",
  ]);
  if (!repeatableKinds.has(event.kind)) {
    const duplicate = timeline.some(
      (existing) =>
        existing.kind === event.kind &&
        existing.correlation.campaignRunId === event.correlation.campaignRunId
    );
    if (duplicate) return [...timeline];
  }
  return [...timeline, event];
}

export const EXECUTION_TIMELINE_ORDER: readonly CampaignExecutionTimelineEventKind[] = [
  "campaign_started",
  "research_complete",
  "reasoning_complete",
  "marketing_intelligence_complete",
  "strategy_complete",
  "planning_complete",
  "creative_complete",
  "validation_complete",
  "scheduling_complete",
  "campaign_approved",
  "publication_started",
  "publication_succeeded",
  "publication_failed",
  "publication_retried",
  "memory_updated",
  "campaign_completed",
];

export function compareTimelineEvents(
  a: CampaignExecutionTimelineEvent,
  b: CampaignExecutionTimelineEvent
): number {
  const orderA = EXECUTION_TIMELINE_ORDER.indexOf(a.kind);
  const orderB = EXECUTION_TIMELINE_ORDER.indexOf(b.kind);
  if (orderA !== orderB) return orderA - orderB;
  return Date.parse(a.at) - Date.parse(b.at);
}
