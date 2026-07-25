import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import { hasAnalyticsConnection } from "@/lib/integrations/connection-store";
import type { MetricSnapshot } from "@/lib/metrics/types";
import type { MarketingBrainInsight } from "../domain/marketing-peer-types";
import {
  getKnowledgeHref,
  getProjectHref,
  getPerformanceHref,
  getPerformanceInsightsHref,
  getResponsibilityHref,
  getReviewHref,
} from "../navigation/marketing-peer-links";
import { campaignIdeaToVoice, seoOpportunityDetail, seoOpportunityToVoice } from "../emma-narrative";
import {
  buildResponsibilityPlanningItems,
  evaluateResponsibility,
} from "../responsibilities/evaluation-engine";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

const MAX_BRAIN_INSIGHTS = 4;

function hasQuantifiedEvidence(metric?: MetricSnapshot): boolean {
  if (!metric) return false;
  const numeric = parseFloat(String(metric.value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) && numeric !== 0;
}

function buildSetupInsights(input: MarketingPeerDomainInput): MarketingBrainInsight[] {
  const insights: MarketingBrainInsight[] = [];
  const hasInstagram = input.connections.some(
    (c) => c.id === "instagram" && c.status === "connected"
  );
  const hasAnalytics = hasAnalyticsConnection(input.connections);

  if (!hasInstagram) {
    insights.push({
      id: "brain-setup-instagram",
      category: "pattern",
      title: "Unlock format insights",
      observation:
        "Connect Instagram Insights so Emma can identify your best-performing formats and posting times.",
      businessImpact: "Emma needs channel data before recommending content shifts.",
      confidence: "high",
      status: "new",
      priority: 50,
      actions: [
        {
          id: "connect-instagram",
          label: "Connect Instagram",
          type: "view_evidence",
          href: getKnowledgeHref(input.peerId, "integrations"),
        },
      ],
    });
  }

  if (!hasAnalytics && input.strategy?.seoOpportunities.length) {
    insights.push({
      id: "brain-setup-seo",
      category: "seo",
      title: "Track SEO momentum",
      observation:
        "Connect Search Console so Emma can monitor keyword impressions and CTR changes over time.",
      businessImpact: "Without analytics, SEO opportunities stay qualitative only.",
      confidence: "medium",
      status: "new",
      priority: 45,
      actions: [
        {
          id: "connect-analytics",
          label: "Connect analytics",
          type: "open_performance",
          href: getPerformanceHref(input.peerId, { channel: "seo" }),
        },
      ],
    });
  }

  return insights;
}

function insightFromSeo(
  input: MarketingPeerDomainInput,
  topic: string,
  intent: string,
  index: number
): MarketingBrainInsight {
  return {
    id: `brain-seo-${index}`,
    category: "seo",
    title: `SEO opportunity: ${topic}`,
    observation: seoOpportunityToVoice(topic, intent),
    businessImpact: seoOpportunityDetail(intent) ?? "Improved organic visibility over time.",
    recommendation: {
      summary: "Prioritize content that targets this intent in your next blog or landing update.",
      expectedOutcome: "Stronger organic discovery for high-intent searches.",
    },
    evidence: {
      source: "Marketing strategy",
      period: "Current plan",
    },
    confidence: "medium",
    status: "new",
    priority: 70,
    actions: [
      {
        id: "view-seo",
        label: "View evidence",
        type: "open_performance",
        href: getPerformanceHref(input.peerId, { channel: "seo" }),
      },
      {
        id: "create-seo-work",
        label: "Create work",
        type: "create_work",
        href: getProjectHref(input.peerId),
      },
    ],
  };
}

function insightFromCampaign(
  input: MarketingPeerDomainInput,
  strategy: MarketingStrategy,
  index: number
): MarketingBrainInsight {
  const idea = strategy.campaignIdeas[index];
  if (!idea) {
    return {
      id: `brain-campaign-${index}`,
      category: "opportunity",
      title: "Campaign opportunity",
      observation: "A new campaign direction aligns with your current strategy.",
      confidence: "medium",
      status: "new",
      priority: 65,
      actions: [{ id: "create-work", label: "Create campaign", type: "create_work", href: getProjectHref(input.peerId) }],
    };
  }

  return {
    id: `brain-campaign-${index}`,
    category: "content",
    title: idea.name,
    observation: campaignIdeaToVoice(idea.name),
    businessImpact: idea.objective || "Stronger alignment with your marketing goals.",
    recommendation: {
      summary: idea.objective
        ? `Launch a focused campaign: ${idea.objective}`
        : "Turn this campaign idea into scheduled work.",
      expectedOutcome: "More coordinated content across channels.",
    },
    evidence: {
      source: "Marketing strategy",
      period: "Current strategy",
    },
    confidence: "medium",
    status: "new",
    priority: 75,
    actions: [
      {
        id: "apply-campaign",
        label: "Create campaign",
        type: "create_work",
        href: getProjectHref(input.peerId),
      },
      {
        id: "view-plan",
        label: "View evidence",
        type: "open_performance",
        href: getPerformanceHref(input.peerId),
      },
    ],
  };
}

function insightFromStoredMetric(
  input: MarketingPeerDomainInput,
  metric: MetricSnapshot
): MarketingBrainInsight | null {
  if (!hasQuantifiedEvidence(metric)) return null;

  return {
    id: `brain-metric-${metric.id}`,
    category: "pattern",
    title: metric.label,
    observation: `${metric.label} is currently ${metric.value} based on connected data.`,
    businessImpact: "Use this signal to adjust upcoming content and channel mix.",
    evidence: {
      source: "Connected integration",
      period: "Latest sync",
      currentValue: metric.value,
    },
    confidence: "high",
    status: "monitoring",
    priority: 85,
    actions: [
      {
        id: "view-metric",
        label: "View evidence",
        type: "open_performance",
        href: getPerformanceHref(input.peerId),
      },
    ],
  };
}

function insightNeedsApproval(input: MarketingPeerDomainInput): MarketingBrainInsight | null {
  const pending = input.drafts.filter((d) => d.status === "ready_for_review");
  if (pending.length === 0) return null;
  const draft = pending[0]!;
  return {
    id: `brain-approval-${draft.id}`,
    category: "optimization",
    title: "Review before publishing",
    observation: `${pending.length === 1 ? "One piece of content" : `${pending.length} items`} is ready for your review before Emma can publish.`,
    businessImpact: "Timely review keeps your publishing schedule on track.",
    status: "needs_approval",
    confidence: "high",
    priority: 100,
    actions: [
      {
        id: "review",
        label: "Review now",
        type: "review",
        href: getReviewHref(input.peerId, draft.id),
      },
    ],
  };
}

function insightFromResponsibilityPlanning(input: MarketingPeerDomainInput): MarketingBrainInsight[] {
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

  return planningItems.slice(0, 2).map((item, index) => ({
    id: `brain-responsibility-${item.responsibilityId}`,
    category: "optimization" as const,
    title: `${item.responsibilityTitle} plan`,
    observation: item.message,
    businessImpact: `Because ${item.responsibilityTitle} needs attention, Emma recommends creating work from this responsibility.`,
    confidence: "high" as const,
    status: "new" as const,
    priority: 85 - index,
    actions: [
      {
        id: `review-plan-${item.responsibilityId}`,
        label: "Review plan",
        type: "view_evidence" as const,
        href: item.href,
      },
    ],
  }));
}

function sortInsights(insights: MarketingBrainInsight[]): MarketingBrainInsight[] {
  return [...insights].sort((a, b) => b.priority - a.priority);
}

export function buildMarketingBrainInsights(input: MarketingPeerDomainInput): MarketingBrainInsight[] {
  const dismissed = new Set(input.insightRotation?.dismissedIds ?? []);
  const candidates: MarketingBrainInsight[] = [];

  const approvalInsight = insightNeedsApproval(input);
  if (approvalInsight) candidates.push(approvalInsight);

  candidates.push(...insightFromResponsibilityPlanning(input));

  for (const metric of input.storedMetrics ?? []) {
    if (metric.peerId !== input.peerId) continue;
    const insight = insightFromStoredMetric(input, metric);
    if (insight) candidates.push(insight);
  }

  for (const [index, opp] of (input.strategy?.seoOpportunities ?? []).slice(0, 3).entries()) {
    candidates.push(insightFromSeo(input, opp.topic, opp.intent, index));
  }

  for (let i = 0; i < Math.min(2, input.strategy?.campaignIdeas.length ?? 0); i++) {
    if (input.strategy) candidates.push(insightFromCampaign(input, input.strategy, i));
  }

  if (candidates.length < MAX_BRAIN_INSIGHTS) {
    candidates.push(...buildSetupInsights(input));
  }

  return sortInsights(candidates.filter((c) => !dismissed.has(c.id))).slice(0, MAX_BRAIN_INSIGHTS);
}

export function buildMarketingBrainInsightsViewAllHref(peerId: string): string {
  return getPerformanceInsightsHref(peerId);
}

/** Brain insights must never include raw activity feed events. */
export function isActivityFeedInsight(id: string): boolean {
  return id.startsWith("ins-feed-");
}
