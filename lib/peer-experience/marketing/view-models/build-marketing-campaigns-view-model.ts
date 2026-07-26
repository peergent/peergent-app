import type { Campaign } from "@/lib/campaign";
import { CAMPAIGN_WORKFORCE_ROLE_LABELS } from "@/lib/campaign";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { ContentCalendarEntry, MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import {
  getContentHref,
  getMarketingCampaignHref,
  getReviewHref,
} from "../navigation/marketing-peer-links";
import { humanChannelLabel } from "../publish-preview-formatters";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";
import { deriveMarketingCampaignNextAction } from "./marketing-campaign-next-action";
import type { MarketingProject } from "../projects/types";
import {
  deriveProjectProgress,
  deriveProjectStatus,
} from "../projects/project-engine";
import {
  assembleCampaignForMarketingProject,
  enrichSourceWithProjectContentIds,
  projectActivitySummaryForCampaign,
  projectCampaignProgressKnown,
} from "./build-project-campaign-projection";
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

export { getMarketingCampaignHref } from "../navigation/marketing-peer-links";

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

export function buildMarketingCampaignViewModelSourceFromDomainInput(
  input: MarketingPeerDomainInput
): MarketingCampaignViewModelSource {
  return {
    peerId: input.peerId,
    organizationId: input.organizationId,
    peerName: input.peerName,
    strategy: input.strategy,
    plan: input.plan,
    selectedPlanActivities: input.plan?.contentCalendar,
    drafts: input.drafts,
    workUnits: input.workUnits,
    projects: input.projects,
    responsibilities: input.responsibilities,
  };
}

function resolveCampaignCardNavigation(
  source: MarketingCampaignViewModelSource,
  campaignId: string
): { href: string; linkEnabled: boolean } {
  if (campaignId === MARKETING_PLAN_FALLBACK_CAMPAIGN_ID) {
    return { href: "", linkEnabled: false };
  }
  const hasProject = (source.projects ?? []).some((project) => project.id === campaignId);
  if (!hasProject) {
    return { href: "", linkEnabled: false };
  }
  return {
    href: getMarketingCampaignHref(source.peerId, campaignId),
    linkEnabled: true,
  };
}

function buildCardNextAction(
  source: MarketingCampaignViewModelSource,
  input: {
    campaignId: string;
    status: Campaign["execution"]["status"];
    approvalCount: number;
    blockedItemCount: number;
    draftIds: string[];
    planActivityCount: number;
  }
): MarketingCampaignCardViewModel["nextAction"] {
  const drafts = source.drafts ?? [];
  const hasPublished = drafts.some(
    (d) => input.draftIds.includes(d.id) && d.status === "published"
  );
  return deriveMarketingCampaignNextAction({
    peerId: source.peerId,
    campaignId: input.campaignId,
    status: input.status,
    approvalCount: input.approvalCount,
    blockedItemCount: input.blockedItemCount,
    draftIds: input.draftIds,
    drafts,
    planActivityCount: input.planActivityCount,
    performanceKnown: false,
    hasPublishedContent: hasPublished,
  });
}

function campaignCardFromAssembled(
  campaign: Campaign,
  source: MarketingCampaignViewModelSource,
  overrides?: {
    progressKnown?: boolean;
    progress?: number;
    goal?: string;
    channels?: readonly string[];
  }
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
  const navigation = resolveCampaignCardNavigation(source, campaign.id);
  const planActivityCount =
    source.selectedPlanActivities?.length ?? source.plan?.contentCalendar.length ?? 0;

  const progressKnown = overrides?.progressKnown ?? true;
  const progress =
    overrides?.progress ?? campaign.performance.progress.percentComplete;
  const goal =
    overrides?.goal ??
    (campaign.goal.marketingObjective ||
      campaign.goal.businessObjective ||
      campaign.description ||
      "");
  const channels =
    overrides?.channels ??
    campaign.execution.channels.map((c) => c.label ?? c.channelId);

  return {
    id: campaign.id,
    title: campaign.name,
    description: campaign.description,
    status: campaign.execution.status,
    statusLabel: MARKETING_CAMPAIGN_STATUS_LABELS[campaign.execution.status],
    progress,
    progressKnown,
    goal,
    audienceSummary: campaign.audience.targetAudience,
    channels,
    timelineSummary: formatCampaignTimelineSummary(campaign, source.plan),
    approvalCount,
    generatedContentCount: draftIds.length,
    creativeBriefCount: briefIds.length,
    blockedItemCount,
    recommendationSummary: recommendation,
    assignedWorkforce: mapCampaignWorkforce(campaign),
    lastUpdated: campaign.updatedAt,
    href: navigation.href,
    linkEnabled: navigation.linkEnabled,
    nextAction: buildCardNextAction(source, {
      campaignId: campaign.id,
      status: campaign.execution.status,
      approvalCount,
      blockedItemCount,
      draftIds,
      planActivityCount,
    }),
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
    source.strategy?.campaignIdeas[0]?.name?.trim() ||
    concisePlanTitle(source) ||
    "Marketing campaign";

  const description = source.plan?.basedOnStrategySummary?.trim();

  const goal =
    source.strategy?.campaignIdeas[0]?.objective?.trim() ||
    source.plan?.objectives[0]?.title?.trim() ||
    concisePlanGoal(source) ||
    "";

  const audienceSummary =
    source.strategy?.targetAudiences.find((a) => a.priority === "primary")?.segment ??
    source.strategy?.targetAudiences[0]?.segment ??
    "";

  const channels = collectFallbackChannels(source.plan, source.selectedPlanActivities);
  const navigation = resolveCampaignCardNavigation(source, campaignId);
  const planActivityCount =
    source.selectedPlanActivities?.length ?? source.plan?.contentCalendar.length ?? 0;
  const approvalCount = countPendingApprovals(draftIds, drafts);
  const blockedItemCount = countBlockedItems(
    undefined,
    draftIds,
    drafts,
    source.workUnits ?? []
  );

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
    approvalCount,
    generatedContentCount: draftIds.length,
    creativeBriefCount: briefIds.length,
    blockedItemCount,
    recommendationSummary: undefined,
    assignedWorkforce: mapResponsibilityWorkforce(source),
    lastUpdated: source.plan?.generatedAt ?? source.strategy?.generatedAt ?? new Date(0).toISOString(),
    href: navigation.href,
    linkEnabled: navigation.linkEnabled,
    nextAction: buildCardNextAction(source, {
      campaignId,
      status,
      approvalCount,
      blockedItemCount,
      draftIds,
      planActivityCount,
    }),
  };
}

function concisePlanTitle(source: MarketingCampaignViewModelSource): string {
  const summary = source.plan?.summary?.trim();
  if (!summary) return "";
  return summary.length > 60 ? `${summary.slice(0, 59).trim()}…` : summary;
}

function concisePlanGoal(source: MarketingCampaignViewModelSource): string {
  const summary = source.plan?.summary?.trim();
  if (!summary) return "";
  return summary.length > 80 ? `${summary.slice(0, 79).trim()}…` : summary;
}

function buildProjectCampaignCards(
  source: MarketingCampaignViewModelSource
): MarketingCampaignCardViewModel[] {
  const projects = (source.projects ?? []).filter((p) => !p.archivedAt);
  return projects.map((project) => projectCampaignCard(project, source));
}

function projectCampaignCard(
  project: MarketingProject,
  source: MarketingCampaignViewModelSource
): MarketingCampaignCardViewModel {
  const enriched = enrichSourceWithProjectContentIds(source, project.id);
  const campaign = assembleCampaignForMarketingProject(project, enriched);
  const projectStatus = deriveProjectStatus(
    project,
    [...(source.workUnits ?? [])],
    [...(source.drafts ?? [])],
    new Set<string>()
  );
  const progress = deriveProjectProgress(
    project,
    [...(source.workUnits ?? [])],
    projectStatus
  );
  const draftIds = enriched.contentIdsByCampaignId?.[project.id] ?? [];
  const channels = channelsFromDraftIds(draftIds, source.drafts ?? []);

  return campaignCardFromAssembled(campaign, enriched, {
    progressKnown: projectCampaignProgressKnown(project, source.workUnits, progress),
    progress,
    goal: project.goal.trim(),
    channels,
  });
}

function channelsFromDraftIds(
  draftIds: readonly string[],
  drafts: readonly MarketingContentDraft[]
): string[] {
  const idSet = new Set(draftIds);
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const draft of drafts) {
    if (!idSet.has(draft.id)) continue;
    const label = humanChannelLabel(draft);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels;
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
    const projectCards = buildProjectCampaignCards(source);
    if (projectCards.length) {
      items.push(...projectCards);
    } else {
      const fallback = fallbackCampaignCard(source);
      if (fallback) {
        items.push(fallback);
      }
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
