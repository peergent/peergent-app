import type { Campaign } from "@/lib/campaign";
import { CAMPAIGN_WORKFORCE_ROLE_LABELS } from "@/lib/campaign";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { ContentCalendarEntry, MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import {
  getContentHref,
  getPerformanceHref,
  getProjectHref,
  getReviewHref,
} from "../navigation/marketing-peer-links";
import { humanChannelLabel } from "../publish-preview-formatters";
import type {
  MarketingCampaignCardViewModel,
  MarketingCampaignsViewModel,
  MarketingCampaignViewModelSource,
  MarketingCampaignWorkforceItem,
} from "./marketing-campaign-types";
import {
  MARKETING_CAMPAIGN_STATUS_LABELS,
  MARKETING_CAMPAIGN_WORKER_STATUS_LABELS,
} from "./marketing-campaign-types";

export const MARKETING_PLAN_FALLBACK_CAMPAIGN_ID = "marketing-plan-campaign";

const INTERNAL_WARNING_PATTERNS = [
  /assembly/i,
  /trace/i,
  /token/i,
  /prompt/i,
  /context package/i,
  /marketing decision record/i,
  /creative brief engine/i,
  /evidence/i,
];

export function getMarketingCampaignHref(peerId: string, campaignId: string): string {
  return getProjectHref(peerId, campaignId);
}

export function sanitizeCustomerCampaignWarnings(
  warnings: readonly string[] | undefined
): string[] {
  if (!warnings?.length) {
    return [];
  }
  return warnings.filter(
    (warning) =>
      warning.trim().length > 0 &&
      !INTERNAL_WARNING_PATTERNS.some((pattern) => pattern.test(warning))
  );
}

export function resolveCampaignContentDraftIds(
  campaignId: string,
  campaign: Campaign | undefined,
  source: MarketingCampaignViewModelSource
): string[] {
  const explicit = source.contentIdsByCampaignId?.[campaignId];
  if (explicit?.length) {
    return [...explicit];
  }
  if (campaign?.references.generatedContentIds.length) {
    return [...campaign.references.generatedContentIds];
  }
  const activities = source.selectedPlanActivities ?? source.plan?.contentCalendar ?? [];
  const activityTitles = new Set(activities.map((a) => a.title));
  return (source.drafts ?? [])
    .filter((draft) => activityTitles.has(draft.planActivityReference))
    .map((draft) => draft.id);
}

export function resolveCampaignCreativeBriefIds(
  campaignId: string,
  campaign: Campaign | undefined,
  source: MarketingCampaignViewModelSource
): string[] {
  const explicit = source.creativeBriefIdsByCampaignId?.[campaignId];
  if (explicit?.length) {
    return [...explicit];
  }
  return campaign?.references.creativeBriefIds ? [...campaign.references.creativeBriefIds] : [];
}

export function countPendingApprovals(draftIds: string[], drafts: readonly MarketingContentDraft[]): number {
  const idSet = new Set(draftIds);
  return drafts.filter((d) => idSet.has(d.id) && d.status === "ready_for_review").length;
}

export function countBlockedItems(
  campaign: Campaign | undefined,
  draftIds: string[],
  drafts: readonly MarketingContentDraft[],
  workUnits: readonly WorkUnit[]
): number {
  let count = campaign?.execution.status === "blocked" ? 1 : 0;
  const idSet = new Set(draftIds);
  count += drafts.filter((d) => idSet.has(d.id) && d.status === "rejected").length;
  count += workUnits.filter((u) => u.paused && u.draftId && idSet.has(u.draftId)).length;
  return count;
}

export function formatCampaignTimelineSummary(campaign: Campaign | undefined, plan?: MarketingPlan | null): string {
  if (campaign?.execution.timeline.startDate || campaign?.execution.timeline.endDate) {
    const start = campaign.execution.timeline.startDate ?? "TBD";
    const end = campaign.execution.timeline.endDate ?? "TBD";
    return `${start} → ${end}`;
  }
  const planCampaigns = plan?.campaigns ?? [];
  if (planCampaigns.length > 0) {
    const startWeek = Math.min(...planCampaigns.map((c) => c.startWeek));
    const endWeek = Math.max(...planCampaigns.map((c) => c.endWeek));
    return `Weeks ${startWeek}–${endWeek}`;
  }
  if (campaign?.execution.timeline.milestones.length) {
    return `${campaign.execution.timeline.milestones.length} milestones`;
  }
  return "Timeline not set";
}

export function mapCampaignWorkforce(campaign: Campaign | undefined): MarketingCampaignWorkforceItem[] {
  if (!campaign?.workforce.workers.length) {
    return [];
  }
  return campaign.workforce.workers.map((worker) => ({
    roleLabel: worker.displayName || CAMPAIGN_WORKFORCE_ROLE_LABELS[worker.role],
    statusLabel: MARKETING_CAMPAIGN_WORKER_STATUS_LABELS[worker.status],
    responsibility: worker.responsibility,
    completion: worker.completion,
    completionKnown: true,
  }));
}

export function fallbackCampaignStatus(
  source: MarketingCampaignViewModelSource
): Campaign["execution"]["status"] {
  if (source.plan || source.strategy) {
    return "planning";
  }
  return "draft";
}

export function fallbackCampaignProgress(): { progress: number; progressKnown: boolean } {
  return { progress: 0, progressKnown: false };
}

function campaignCardFromAssembled(
  campaign: Campaign,
  source: MarketingCampaignViewModelSource
): MarketingCampaignCardViewModel {
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
  const recommendation = campaign.performance.recommendations[0]?.summary;

  return {
    id: campaign.id,
    title: campaign.name,
    description: campaign.description,
    status: campaign.execution.status,
    statusLabel: MARKETING_CAMPAIGN_STATUS_LABELS[campaign.execution.status],
    progress: campaign.performance.progress.percentComplete,
    progressKnown: true,
    goal: campaign.goal.marketingObjective || campaign.goal.businessObjective,
    audienceSummary: campaign.audience.targetAudience,
    channels: campaign.execution.channels.map((c) => c.label ?? c.channelId),
    timelineSummary: formatCampaignTimelineSummary(campaign, source.plan),
    approvalCount,
    generatedContentCount: draftIds.length,
    creativeBriefCount: briefIds.length,
    blockedItemCount,
    recommendationSummary: recommendation,
    assignedWorkforce: mapCampaignWorkforce(campaign),
    lastUpdated: campaign.updatedAt,
    href: getMarketingCampaignHref(source.peerId, campaign.id),
  };
}

function fallbackCampaignCard(source: MarketingCampaignViewModelSource): MarketingCampaignCardViewModel | null {
  if (!source.plan && !source.strategy) {
    return null;
  }

  const campaignId = MARKETING_PLAN_FALLBACK_CAMPAIGN_ID;
  const draftIds = resolveCampaignContentDraftIds(campaignId, undefined, source);
  const drafts = source.drafts ?? [];
  const briefIds = resolveCampaignCreativeBriefIds(campaignId, undefined, source);
  const status = fallbackCampaignStatus(source);
  const { progress, progressKnown } = fallbackCampaignProgress();

  const title =
    source.plan?.summary?.trim() ||
    source.strategy?.campaignIdeas[0]?.name?.trim() ||
    "Marketing campaign";

  const description =
    source.plan?.basedOnStrategySummary?.trim() || source.strategy?.summary?.trim();

  const goal =
    source.strategy?.summary?.trim() ||
    source.plan?.summary?.trim() ||
    "";

  const audienceSummary =
    source.strategy?.targetAudiences.find((a) => a.priority === "primary")?.segment ??
    source.strategy?.targetAudiences[0]?.segment ??
    "";

  const channels = collectFallbackChannels(source.plan, source.selectedPlanActivities);

  return {
    id: campaignId,
    title,
    description,
    status,
    statusLabel: MARKETING_CAMPAIGN_STATUS_LABELS[status],
    progress,
    progressKnown,
    goal,
    audienceSummary,
    channels,
    timelineSummary: formatCampaignTimelineSummary(undefined, source.plan),
    approvalCount: countPendingApprovals(draftIds, drafts),
    generatedContentCount: draftIds.length,
    creativeBriefCount: briefIds.length,
    blockedItemCount: countBlockedItems(undefined, draftIds, drafts, source.workUnits ?? []),
    recommendationSummary: undefined,
    assignedWorkforce: mapResponsibilityWorkforce(source),
    lastUpdated: source.plan?.generatedAt ?? source.strategy?.generatedAt ?? new Date(0).toISOString(),
    href: getMarketingCampaignHref(source.peerId, campaignId),
  };
}

function collectFallbackChannels(
  plan: MarketingPlan | null | undefined,
  activities: readonly ContentCalendarEntry[] | undefined
): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  const add = (label: string | undefined) => {
    const trimmed = label?.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    labels.push(trimmed);
  };
  for (const activity of activities ?? []) {
    add(activity.channel);
  }
  for (const campaign of plan?.campaigns ?? []) {
    for (const channel of campaign.channels) {
      add(channel);
    }
  }
  return labels;
}

function mapResponsibilityWorkforce(
  source: MarketingCampaignViewModelSource
): MarketingCampaignWorkforceItem[] {
  const responsibilities = source.responsibilities ?? [];
  return responsibilities
    .filter((r) => r.enabled)
    .slice(0, 6)
    .map((r) => ({
      roleLabel: r.title,
      statusLabel: r.status === "disabled" ? "Unavailable" : "Assigned",
      responsibility: r.goal,
      completion: 0,
      completionKnown: false,
    }));
}

export function buildMarketingCampaignsViewModel(
  source: MarketingCampaignViewModelSource
): MarketingCampaignsViewModel {
  const peerName = source.peerName ?? "Your marketing peer";
  const items: MarketingCampaignCardViewModel[] = [];

  if (source.campaigns?.length) {
    for (const campaign of source.campaigns) {
      items.push(campaignCardFromAssembled(campaign, source));
    }
  } else {
    const fallback = fallbackCampaignCard(source);
    if (fallback) {
      items.push(fallback);
    }
  }

  return {
    items,
    emptyMessage:
      items.length === 0
        ? `${peerName} has no campaigns to show yet.`
        : "",
  };
}

export function contentDraftStatusLabel(draft: MarketingContentDraft): string {
  switch (draft.status) {
    case "ready_for_review":
      return "Needs review";
    case "approved":
      return "Approved";
    case "ready_to_publish":
      return "Ready to publish";
    case "published":
      return "Published";
    case "rejected":
      return "Rejected";
    default:
      return "Draft";
  }
}

export function buildLinkedContentItems(
  peerId: string,
  draftIds: string[],
  drafts: readonly MarketingContentDraft[]
): import("./marketing-campaign-types").MarketingCampaignLinkedContentItem[] {
  const idSet = new Set(draftIds);
  return drafts
    .filter((d) => idSet.has(d.id))
    .map((draft) => ({
      id: draft.id,
      title: draft.title,
      channelLabel: humanChannelLabel(draft),
      statusLabel: contentDraftStatusLabel(draft),
      href: getContentHref(peerId, draft.id),
    }));
}
