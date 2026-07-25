import type { Campaign, CampaignApprovalMode } from "@/lib/campaign";
import { assembleCampaign } from "@/lib/campaign";

import {
  buildLinkedContentItems,
  countBlockedItems,
  countPendingApprovals,
  formatCampaignTimelineSummary,
  getMarketingCampaignHref,
  mapCampaignWorkforce,
  MARKETING_PLAN_FALLBACK_CAMPAIGN_ID,
  resolveCampaignContentDraftIds,
  resolveCampaignCreativeBriefIds,
  sanitizeCustomerCampaignWarnings,
} from "./build-marketing-campaigns-view-model";
import type {
  MarketingCampaignDetailSource,
  MarketingCampaignDetailViewModel,
  MarketingCampaignNextAction,
} from "./marketing-campaign-types";
import {
  MARKETING_CAMPAIGN_STATUS_LABELS,
} from "./marketing-campaign-types";
import { getPerformanceHref, getReviewHref } from "../navigation/marketing-peer-links";

export function formatApprovalModeLabel(mode: CampaignApprovalMode): string {
  switch (mode) {
    case "no_approval_required":
      return "Automatic after generation";
    case "approval_before_generation":
      return "Approve before generation";
    case "blocked_manual_only":
      return "Manual execution only";
    default:
      return "Approve before publication";
  }
}

export function formatBudgetSummary(campaign: Campaign | undefined): string | undefined {
  const budget = campaign?.execution.budget;
  if (!budget?.allocated && budget?.allocated !== 0) {
    return undefined;
  }
  const currency = budget.currency ?? "USD";
  const spent =
    budget.spent !== undefined ? ` · ${currency} ${budget.spent.toLocaleString()} spent` : "";
  return `${currency} ${budget.allocated!.toLocaleString()} allocated${spent}`;
}

export function deriveMarketingCampaignNextAction(input: {
  peerId: string;
  campaignId: string;
  status: Campaign["execution"]["status"];
  approvalCount: number;
  blockedItemCount: number;
  draftIds: string[];
  drafts: readonly { id: string; status: string }[];
  planActivityCount: number;
  performanceKnown: boolean;
  hasPublishedContent: boolean;
}): MarketingCampaignNextAction {
  const reviewHref = getReviewHref(input.peerId);

  if (input.approvalCount > 0) {
    return {
      label: "Review approvals",
      reason: `${input.approvalCount} deliverable(s) need your review before publishing.`,
      href: reviewHref,
    };
  }

  if (input.status === "blocked" || input.blockedItemCount > 0) {
    return {
      label: "Resolve blocker",
      reason: "Work is blocked until you clear the outstanding issue.",
      href: getMarketingCampaignHref(input.peerId, input.campaignId),
    };
  }

  if (input.status === "planning" || input.status === "draft") {
    const missingCreative =
      input.planActivityCount > 0 && input.draftIds.length < input.planActivityCount;
    if (missingCreative) {
      return {
        label: "Generate missing creative",
        reason: "Some planned activities do not have draft content yet.",
        href: getMarketingCampaignHref(input.peerId, input.campaignId),
      };
    }
    return {
      label: "Continue planning",
      reason: "Strategy and plan are in place — keep shaping the campaign.",
      href: getMarketingCampaignHref(input.peerId, input.campaignId),
    };
  }

  const readyToPublish = input.drafts.some(
    (d) => input.draftIds.includes(d.id) && d.status === "ready_to_publish"
  );
  if (readyToPublish) {
    return {
      label: "Publish approved content",
      reason: "Approved content is ready to publish.",
      href: getReviewHref(input.peerId),
    };
  }

  if (input.hasPublishedContent && !input.performanceKnown) {
    return {
      label: "Inspect performance",
      reason: "Published content is live — performance will appear as channels sync.",
      href: getPerformanceHref(input.peerId, { campaignId: input.campaignId }),
    };
  }

  return {
    label: "Continue planning",
    reason: "No urgent action — keep the campaign moving forward.",
    href: getMarketingCampaignHref(input.peerId, input.campaignId),
  };
}

function buildDetailFromCampaign(
  campaign: Campaign,
  source: MarketingCampaignDetailSource,
  options: { progressKnown: boolean }
): MarketingCampaignDetailViewModel {
  const draftIds = resolveCampaignContentDraftIds(campaign.id, campaign, source);
  const drafts = source.drafts ?? [];
  const briefIds = resolveCampaignCreativeBriefIds(campaign.id, campaign, source);
  const approvalCount = countPendingApprovals(draftIds, drafts);
  const blockedItemCount = countBlockedItems(
    campaign,
    draftIds,
    drafts,
    source.workUnits ?? []
  );

  const explicitPerformance = source.performanceByCampaignId?.[campaign.id];
  const performanceKnown = Boolean(
    explicitPerformance?.summary ||
      explicitPerformance?.kpiLabels?.length ||
      campaign.performance.kpiPlaceholders.length
  );

  const performanceSummary =
    explicitPerformance?.summary ??
    (campaign.performance.kpiPlaceholders.length
      ? campaign.performance.kpiPlaceholders.map((k) => k.name).join(", ")
      : "Performance data not available yet.");

  const kpiLabels =
    explicitPerformance?.kpiLabels ??
    campaign.performance.kpiPlaceholders.map((k) => k.name);

  const recommendations = campaign.performance.recommendations.map((r) => ({
    id: r.id,
    summary: r.summary,
    priority: r.priority,
  }));

  const hasPublished = drafts.some(
    (d) => draftIds.includes(d.id) && d.status === "published"
  );

  const planActivityCount =
    source.selectedPlanActivities?.length ?? source.plan?.contentCalendar.length ?? 0;

  const warnings = sanitizeCustomerCampaignWarnings(
    source.warningsByCampaignId?.[campaign.id]
  );

  return {
    id: campaign.id,
    title: campaign.name,
    description: campaign.description,
    goal: {
      businessObjective: campaign.goal.businessObjective,
      marketingObjective: campaign.goal.marketingObjective,
      successMetrics: campaign.goal.successMetrics.map((m) => ({
        label: m.label,
        target: m.target,
      })),
    },
    status: campaign.execution.status,
    statusLabel: MARKETING_CAMPAIGN_STATUS_LABELS[campaign.execution.status],
    progress: campaign.performance.progress.percentComplete,
    progressKnown: options.progressKnown,
    audience: {
      targetAudience: campaign.audience.targetAudience,
      personas: campaign.audience.personas.map((p) => ({
        name: p.name,
        description: p.description,
      })),
      segments: campaign.audience.segments.map((s) => s.label),
    },
    channels: campaign.execution.channels.map((c) => c.label ?? c.channelId),
    timeline: {
      summary: formatCampaignTimelineSummary(campaign, source.plan),
      startDate: campaign.execution.timeline.startDate,
      endDate: campaign.execution.timeline.endDate,
      milestones: campaign.execution.timeline.milestones.map((m) => ({
        label: m.label,
        dueDate: m.dueDate,
      })),
    },
    budgetSummary: formatBudgetSummary(campaign),
    approvalModeLabel: formatApprovalModeLabel(campaign.execution.approvalMode),
    workforce: mapCampaignWorkforce(campaign),
    deliverableSummary:
      campaign.performance.progress.summary ??
      `${draftIds.length} content item(s) linked to this campaign.`,
    approvalQueue: {
      pendingCount: approvalCount,
      summary:
        approvalCount > 0
          ? `${approvalCount} item(s) waiting for review`
          : "No approvals pending",
      reviewHref: getReviewHref(source.peerId),
    },
    performance: {
      summary: performanceSummary,
      kpiLabels,
      performanceKnown,
      performanceHref: getPerformanceHref(source.peerId, { campaignId: campaign.id }),
    },
    recommendations,
    nextAction: deriveMarketingCampaignNextAction({
      peerId: source.peerId,
      campaignId: campaign.id,
      status: campaign.execution.status,
      approvalCount,
      blockedItemCount,
      draftIds,
      drafts,
      planActivityCount,
      performanceKnown,
      hasPublishedContent: hasPublished,
    }),
    activitySummary: campaign.execution.timeline.milestones.map((m) => ({
      id: m.id,
      label: m.label,
      at: m.dueDate,
    })),
    linkedContent: buildLinkedContentItems(source.peerId, draftIds, drafts),
    creativeBriefReferences: briefIds.map((id) => ({
      id,
      label: source.briefLabelsById?.[id] ?? `Creative brief ${id}`,
    })),
    warnings,
    lastUpdated: campaign.updatedAt,
    href: getMarketingCampaignHref(source.peerId, campaign.id),
  };
}

export function buildMarketingCampaignDetailViewModel(
  source: MarketingCampaignDetailSource
): MarketingCampaignDetailViewModel | null {
  const assembled = source.campaigns?.find((c) => c.id === source.campaignId);
  if (assembled) {
    return buildDetailFromCampaign(assembled, source, { progressKnown: true });
  }

  if (
    source.campaignId === MARKETING_PLAN_FALLBACK_CAMPAIGN_ID &&
    (source.plan || source.strategy)
  ) {
    const campaign = assembleCampaign({
      organizationId: source.organizationId ?? "unknown-org",
      campaignId: MARKETING_PLAN_FALLBACK_CAMPAIGN_ID,
      name: source.plan?.summary ?? source.strategy?.summary ?? "Marketing campaign",
      description: source.plan?.basedOnStrategySummary ?? source.strategy?.summary,
      strategy: source.strategy ?? undefined,
      plan: source.plan ?? undefined,
      selectedPlanActivities: source.selectedPlanActivities,
      assembledAt:
        source.plan?.generatedAt ??
        source.strategy?.generatedAt ??
        new Date(0).toISOString(),
    });
    const detail = buildDetailFromCampaign(campaign, source, { progressKnown: false });
    return {
      ...detail,
      recommendations: [],
      performance: {
        ...detail.performance,
        performanceKnown: Boolean(source.performanceByCampaignId?.[campaign.id]),
      },
    };
  }

  return null;
}
