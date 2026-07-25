import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { ActivityFeedItem } from "@/lib/marketing-workspace";
import type { EmmaInsightItem } from "./emma-workspace-types";
import { campaignIdeaToVoice, seoOpportunityDetail, seoOpportunityToVoice } from "./emma-narrative";

export type InsightCandidate = EmmaInsightItem & {
  source: string;
  impact: string | null;
  estimatedValue: string | null;
  dismissible: boolean;
};

export type InsightRotationState = {
  dismissedIds: string[];
  lastIndex: number;
  lastRotatedAt: string;
};

function buildCandidates(
  strategy: MarketingStrategy | null,
  activityFeed: ActivityFeedItem[]
): InsightCandidate[] {
  const candidates: InsightCandidate[] = [];
  let index = 0;

  for (const opp of strategy?.seoOpportunities.slice(0, 3) ?? []) {
    candidates.push({
      id: `ins-seo-${index++}`,
      voice: seoOpportunityToVoice(opp.topic, opp.intent),
      detail: seoOpportunityDetail(opp.intent),
      savingsLabel: null,
      actionLabel: "Review",
      source: "Search Console",
      impact: "Improved organic visibility",
      estimatedValue: null,
      dismissible: true,
    });
  }

  for (const idea of strategy?.campaignIdeas.slice(0, 2) ?? []) {
    candidates.push({
      id: `ins-campaign-${index++}`,
      voice: campaignIdeaToVoice(idea.name),
      detail: idea.objective || null,
      savingsLabel: null,
      actionLabel: "Apply",
      source: "Strategy",
      impact: idea.objective || "Stronger campaign alignment",
      estimatedValue: null,
      dismissible: true,
    });
  }

  for (const item of activityFeed.slice(0, 3)) {
    candidates.push({
      id: `ins-feed-${item.id}`,
      voice: item.description || item.title,
      detail: null,
      savingsLabel: null,
      actionLabel: "Review",
      source: "Activity",
      impact: null,
      estimatedValue: null,
      dismissible: true,
    });
  }

  return candidates;
}

export function rotateInsights(input: {
  strategy: MarketingStrategy | null;
  activityFeed: ActivityFeedItem[];
  rotation: InsightRotationState;
  maxVisible?: number;
}): {
  insights: EmmaInsightItem[];
  rotation: InsightRotationState;
} {
  const maxVisible = input.maxVisible ?? 3;
  const candidates = buildCandidates(input.strategy, input.activityFeed).filter(
    (c) => !input.rotation.dismissedIds.includes(c.id)
  );

  if (candidates.length === 0) {
    return {
      insights: [],
      rotation: input.rotation,
    };
  }

  const start =
    candidates.length <= maxVisible ? 0 : (input.rotation.lastIndex + 1) % candidates.length;

  const selected: InsightCandidate[] = [];
  for (let i = 0; i < Math.min(maxVisible, candidates.length); i++) {
    selected.push(candidates[(start + i) % candidates.length]!);
  }

  return {
    insights: selected.map(({ dismissible: _d, ...item }) => item),
    rotation: {
      dismissedIds: input.rotation.dismissedIds,
      lastIndex: start,
      lastRotatedAt: new Date().toISOString(),
    },
  };
}

export function dismissInsight(
  rotation: InsightRotationState,
  insightId: string
): InsightRotationState {
  if (rotation.dismissedIds.includes(insightId)) return rotation;
  return {
    ...rotation,
    dismissedIds: [...rotation.dismissedIds, insightId],
  };
}
