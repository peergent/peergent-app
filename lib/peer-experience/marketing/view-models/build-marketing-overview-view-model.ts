import { getPerformanceHref, getProjectHref, getResponsibilityHref, getReviewHref } from "../navigation/marketing-peer-links";
import type { MarketingOverviewViewModel } from "./marketing-overview-types";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";
import {
  buildMarketingActivities,
  buildMarketingApprovalQueue,
} from "./build-marketing-activity-mappers";
import {
  buildMarketingBrainInsights,
  buildMarketingBrainInsightsViewAllHref,
} from "./build-marketing-brain-insights";
import { buildMarketingMorningBrief } from "./build-marketing-morning-brief";
import { buildMarketingResultMetrics } from "./build-marketing-result-metrics";
import { buildUpcomingMarketingTasks } from "./build-marketing-upcoming-work";
import {
  buildResponsibilityPlanningItems,
  evaluateResponsibility,
} from "../responsibilities/evaluation-engine";
import { MARKETING_RESPONSIBILITY_HEALTH_LABELS } from "../responsibilities/types";

export type { MarketingOverviewViewModel } from "./marketing-overview-types";

export function buildMarketingOverviewViewModel(
  input: MarketingPeerDomainInput
): MarketingOverviewViewModel {
  const approvalItems = buildMarketingApprovalQueue(input);
  const brainInsights = buildMarketingBrainInsights(input);
  const upcomingGroups = buildUpcomingMarketingTasks(input);
  const activities = buildMarketingActivities(input);
  const morningBrief = buildMarketingMorningBrief(input);

  const enabledResponsibilities = input.responsibilities.filter((r) => r.enabled);
  const evaluations = input.responsibilities.map((responsibility) =>
    evaluateResponsibility({
      responsibility,
      projects: input.projects,
      plan: input.plan,
      connections: input.connections,
      peerName: input.peerName,
    })
  );
  const planningItems = buildResponsibilityPlanningItems(
    input.responsibilities,
    evaluations,
    input.peerId,
    (responsibilityId) => getResponsibilityHref(input.peerId, responsibilityId)
  );

  return {
    morningBrief,
    responsibilities: {
      ownedCount: enabledResponsibilities.length,
      items: enabledResponsibilities.slice(0, 4).map((responsibility) => {
        const evaluation = evaluations.find((e) => e.responsibilityId === responsibility.id)!;
        return {
          id: responsibility.id,
          title: responsibility.title,
          goal: responsibility.goal,
          healthLabel: MARKETING_RESPONSIBILITY_HEALTH_LABELS[evaluation.health],
          href: getResponsibilityHref(input.peerId, responsibility.id),
        };
      }),
      viewAllHref: getResponsibilityHref(input.peerId),
      viewAllLabel: "View all responsibilities",
      emptyMessage: `${input.peerName} has no active responsibilities yet. Configure what she owns.`,
    },
    planning: {
      items: planningItems.slice(0, 3),
      emptyMessage: `${input.peerName} has no pending plans. She evaluates responsibilities continuously.`,
    },
    results: {
      metrics: buildMarketingResultMetrics(input),
      periodLabel: "This month",
      performanceHref: getPerformanceHref(input.peerId, { period: "month" }),
      performanceCtaLabel: "View full performance",
    },
    brain: {
      insights: brainInsights,
      emptyMessage: `${input.peerName} is monitoring your channels. Insights appear when strategy and connected data are available.`,
      viewAllHref: buildMarketingBrainInsightsViewAllHref(input.peerId),
      viewAllLabel: "View all insights",
    },
    attention: {
      items: approvalItems,
      emptyMessage: "Emma doesn't need anything from you right now.",
      emptySupportingMessage:
        "She'll continue working and notify you when a decision is needed.",
      viewAllHref: getReviewHref(input.peerId),
      viewAllLabel: "View all reviews",
    },
    upcoming: {
      groups: upcomingGroups,
      emptyMessage: "No upcoming work scheduled yet.",
      viewAllHref: getProjectHref(input.peerId),
      viewAllLabel: "View all work",
    },
    activity: {
      items: activities,
      emptyMessage: "Activity will appear here as Emma completes work.",
    },
  };
}
