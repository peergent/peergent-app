import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { ActivityFeedItem } from "@/lib/marketing-workspace";
import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import { resolveMarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
import type { IntegrationConnection } from "@/lib/integrations/types";
import { loadIntegrationConnections } from "@/lib/integrations/connection-store";
import { resolvePeerPerformance } from "@/lib/metrics/resolve-peer-performance";
import type { MetricSnapshot } from "@/lib/metrics/types";
import type { PublicationPackage } from "@/lib/peer-workflow";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { DeliverableViewModel, PrimaryAction } from "../types";
import {
  accomplishmentToVoice,
  activityFeedToVoice,
  formatRelativeTime,
  greetingForHour,
} from "./emma-narrative";
import {
  buildApprovalDeliverable,
  resolveApprovalConnectionState,
} from "./approval/build-approval-deliverable";
import type { ApprovalDeliverableOverlay } from "./approval/approval-overlay";
import { buildCurrentWorkFromWorkUnits } from "./build-current-work-from-units";
import {
  resolveMissionControlCta,
  resolveMissionPerformanceSummary,
} from "./build-mission-cta";
import {
  dismissInsight,
  rotateInsights,
  type InsightRotationState,
} from "./build-insights-engine";
import { humanChannelLabel } from "./publish-preview-formatters";
import { buildEmmaRationaleBullets } from "./build-emma-rationale";
import { resolveCurrentWork } from "./resolve-current-work";
import type {
  EmmaConnectedChannelsViewModel,
  EmmaCurrentWorkViewModel,
  EmmaDeskAction,
  EmmaExecutiveBriefViewModel,
  EmmaInsightItem,
  EmmaMissionKpi,
  EmmaMissionOverviewViewModel,
  EmmaNarrativeLine,
  EmmaNeedsApprovalViewModel,
  EmmaPreviewKind,
  EmmaPreviewViewModel,
  EmmaRecentlyFinishedViewModel,
  EmmaResultsViewModel,
  EmmaWorkspaceViewModel,
} from "./emma-workspace-types";

export type BuildEmmaWorkspaceViewModelInput = {
  peerId: string;
  userName: string;
  peerName: string;
  campaignTitle: string | null;
  generating: GeneratingActivity | null;
  generatingActivity?: string | null;
  understanding: MarketingUnderstanding | null;
  drafts: MarketingContentDraft[];
  plan: MarketingPlan | null;
  strategy: MarketingStrategy | null;
  publicationPackages?: PublicationPackage[];
  deliverable: DeliverableViewModel;
  primaryAction: PrimaryAction | null;
  activityFeed: ActivityFeedItem[];
  delegationTaskTitle?: string | null;
  delegationNeedsVisual?: boolean;
  workUnits?: WorkUnit[];
  connections?: IntegrationConnection[];
  insightRotation?: InsightRotationState;
  storedMetrics?: MetricSnapshot[];
  organizationId?: string;
  selectedWorkUnitId?: string | null;
  approvalOverlays?: Record<string, ApprovalDeliverableOverlay>;
};

function countPublishedByType(
  drafts: MarketingContentDraft[],
  matcher: (draft: MarketingContentDraft) => boolean
): number {
  return drafts.filter((d) => d.status === "published" && matcher(d)).length;
}

function countDraftsByType(
  drafts: MarketingContentDraft[],
  matcher: (draft: MarketingContentDraft) => boolean
): number {
  return drafts.filter(matcher).length;
}

function normalizeHighlight(text: string): string {
  return text
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/\bdraft approved\b/g, "approved")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildHighlights(
  drafts: MarketingContentDraft[],
  strategy: MarketingStrategy | null,
  activityFeed: ActivityFeedItem[]
): EmmaNarrativeLine[] {
  const lines: EmmaNarrativeLine[] = [];
  const seen = new Set<string>();
  let index = 0;

  const pushUnique = (text: string) => {
    const key = normalizeHighlight(text);
    if (seen.has(key)) return;
    seen.add(key);
    lines.push({ id: `hl-${index++}`, text });
  };

  const newsletterCount = countPublishedByType(drafts, (d) => d.contentType === "newsletter");
  if (newsletterCount > 0) {
    pushUnique(accomplishmentToVoice("newsletters", newsletterCount));
  }

  const linkedinCount = countPublishedByType(
    drafts,
    (d) =>
      d.contentType === "linkedin_post" ||
      Boolean(d.channel?.toLowerCase().includes("linkedin"))
  );
  if (linkedinCount > 0) {
    pushUnique(accomplishmentToVoice("LinkedIn posts", linkedinCount));
  }

  const instagramCount = countPublishedByType(
    drafts,
    (d) =>
      d.contentType === "social_media_post" ||
      Boolean(d.channel?.toLowerCase().includes("instagram"))
  );
  if (instagramCount > 0) {
    pushUnique(
      instagramCount === 1
        ? "Published an Instagram post"
        : `Published ${instagramCount} Instagram posts`
    );
  }

  const seoCount = strategy?.seoOpportunities.length ?? 0;
  if (seoCount > 0) {
    pushUnique(
      seoCount === 1 ? "Found an SEO opportunity" : `Found ${seoCount} SEO opportunities`
    );
  }

  const approvedCount = drafts.filter(
    (d) => d.status === "approved" || d.status === "ready_to_publish"
  ).length;
  if (approvedCount > 0) {
    pushUnique(
      approvedCount === 1
        ? "Approved and prepared 1 item for publishing"
        : `Approved and prepared ${approvedCount} items for publishing`
    );
  }

  const publishedCount = drafts.filter((d) => d.status === "published").length;
  if (publishedCount > 0) {
    pushUnique(
      publishedCount === 1 ? "Marked 1 item as published" : `Marked ${publishedCount} items as published`
    );
  }

  for (const item of activityFeed.slice(0, 4)) {
    if (lines.length >= 6) break;
    const voice = activityFeedToVoice(item.title);
    if (/draft approved/i.test(voice) && approvedCount > 0) continue;
    if (/marked as published/i.test(voice) && publishedCount > 0) continue;
    pushUnique(voice);
  }

  return lines.slice(0, 6);
}

function buildMissionKpis(
  drafts: MarketingContentDraft[],
  strategy: MarketingStrategy | null
): EmmaMissionKpi[] {
  const kpis: EmmaMissionKpi[] = [];

  const newsletterCount = Math.max(
    countPublishedByType(drafts, (d) => d.contentType === "newsletter"),
    countDraftsByType(drafts, (d) => d.contentType === "newsletter")
  );
  if (newsletterCount > 0) {
    kpis.push({
      id: "kpi-newsletters",
      value: newsletterCount,
      label: newsletterCount === 1 ? "newsletter" : "newsletters",
    });
  }

  const linkedinCount = Math.max(
    countPublishedByType(
      drafts,
      (d) =>
        d.contentType === "linkedin_post" ||
        Boolean(d.channel?.toLowerCase().includes("linkedin"))
    ),
    countDraftsByType(
      drafts,
      (d) =>
        d.contentType === "linkedin_post" ||
        Boolean(d.channel?.toLowerCase().includes("linkedin"))
    )
  );
  if (linkedinCount > 0) {
    kpis.push({
      id: "kpi-linkedin",
      value: linkedinCount,
      label: linkedinCount === 1 ? "LinkedIn post" : "LinkedIn posts",
    });
  }

  const seoCount = strategy?.seoOpportunities.length ?? 0;
  if (seoCount > 0) {
    kpis.push({
      id: "kpi-seo",
      value: seoCount,
      label: seoCount === 1 ? "SEO opportunity" : "SEO opportunities",
    });
  }

  return kpis;
}

function resolveCurrentFocus(input: BuildEmmaWorkspaceViewModelInput): string | null {
  if (input.generating) {
    if (input.campaignTitle) return input.campaignTitle;
    if (input.generating === "draft" && input.generatingActivity) {
      return input.generatingActivity;
    }
    switch (input.generating) {
      case "understanding":
        return "Learning your business context";
      case "strategy":
        return "Building marketing strategy";
      case "plan":
        return "Planning the campaign";
      case "publication":
        return input.generatingActivity ?? "Preparing for publication";
      default:
        return input.generatingActivity ?? null;
    }
  }
  const activeUnit = input.workUnits?.find(
    (u) => !u.cancelled && u.status !== "published" && u.status !== "monitoring"
  );
  if (activeUnit) return activeUnit.title;
  return input.campaignTitle ?? null;
}

function resolveEstimatedImpact(plan: MarketingPlan | null): string | null {
  const metric = plan?.successMetrics.find((m) => m.target.trim());
  if (metric) {
    return metric.metric ? `${metric.target} ${metric.metric}` : metric.target;
  }
  const outcome = plan?.expectedOutcomes.find((o) => o.timeframe);
  if (outcome?.timeframe) {
    return `${outcome.outcome} within ${outcome.timeframe}`;
  }
  return null;
}

function buildCurrentWork(input: BuildEmmaWorkspaceViewModelInput): EmmaCurrentWorkViewModel {
  if (input.workUnits && input.workUnits.length > 0) {
    return buildCurrentWorkFromWorkUnits(input.workUnits, input.selectedWorkUnitId ?? null);
  }
  const legacy = resolveCurrentWork({
    campaignTitle: input.campaignTitle,
    generating: input.generating,
    generatingActivity: input.generatingActivity,
    understanding: input.understanding,
    strategy: input.strategy,
    plan: input.plan,
    drafts: input.drafts,
    publicationPackages: input.publicationPackages,
    delegationTaskTitle: input.delegationTaskTitle,
    delegationNeedsVisual: input.delegationNeedsVisual,
  });
  return {
    ...legacy,
    primaryTask: null,
    queue: [],
    selectedWorkUnitId: null,
  };
}

function pickApprovalDraft(
  drafts: MarketingContentDraft[],
  workUnits?: WorkUnit[],
  selectedWorkUnitId?: string | null
): MarketingContentDraft | null {
  if (selectedWorkUnitId && workUnits) {
    const selected = workUnits.find((u) => u.id === selectedWorkUnitId);
    if (selected?.draftId) {
      const linked = drafts.find((d) => d.id === selected.draftId);
      if (linked) return linked;
    }
  }

  const reviewReadyUnit = workUnits?.find((u) => u.status === "review_ready" && u.draftId);
  if (reviewReadyUnit?.draftId) {
    const linked = drafts.find((d) => d.id === reviewReadyUnit.draftId);
    if (linked) return linked;
  }
  return (
    drafts.find((d) => d.status === "draft" || d.status === "ready_for_review") ??
    drafts.find((d) => d.status === "ready_to_publish") ??
    drafts.find((d) => d.status === "approved") ??
    null
  );
}

function buildConnectedChannels(
  connections?: IntegrationConnection[],
  organizationId?: string
): EmmaConnectedChannelsViewModel {
  const resolved =
    connections ??
    (organizationId ? loadIntegrationConnections(organizationId) : []);
  return {
    channels: resolved.map((c) => ({
      id: c.id,
      label: c.label,
      status: c.status,
      settingsHref: c.settingsHref,
      accountName: c.status === "connected" ? c.label : null,
      lastSyncedLabel: c.lastSyncedAt
        ? new Date(c.lastSyncedAt).toLocaleDateString()
        : c.status === "connected"
          ? "Recently"
          : null,
      publishEnabled: c.status === "connected",
      analyticsEnabled:
        c.status === "connected" &&
        (c.id === "ga4" || c.id === "instagram" || c.id === "linkedin" || c.id === "meta"),
    })),
  };
}

function resolvePreviewKind(draft: MarketingContentDraft | null): EmmaPreviewKind {
  if (!draft) return "generic";
  const type = draft.contentType;
  const channel = (draft.channel ?? "").toLowerCase();
  if (type === "meta_ads_copy") return "meta_ad";
  if (type === "google_ads_copy") return "google_ad";
  if (type === "blog_article") return "blog";
  if (type === "newsletter") return "newsletter";
  if (channel.includes("mail") || channel.includes("email")) return "email";
  if (type === "linkedin_post" || channel.includes("linkedin")) return "linkedin";
  if (channel.includes("instagram") || type === "social_media_post") return "instagram";
  if (type === "website_article") return "landing_page";
  return "generic";
}

function buildPreviewForDraft(
  draft: MarketingContentDraft,
  authorName: string
): EmmaPreviewViewModel {
  return {
    kind: resolvePreviewKind(draft),
    title: draft.title,
    body: draft.body,
    channel: humanChannelLabel(draft),
    callToAction: draft.callToAction,
    authorName,
    hasContent: draft.body.trim().length > 0,
  };
}

function buildPreviewFromDeliverable(
  input: BuildEmmaWorkspaceViewModelInput
): EmmaPreviewViewModel {
  const deliverable = input.deliverable;

  if (deliverable.kind === "content") {
    const draft = input.drafts.find((d) => d.id === deliverable.draftId);
    if (draft) return buildPreviewForDraft(draft, input.peerName);
    return {
      kind: "generic",
      title: deliverable.title,
      body: deliverable.body,
      channel: deliverable.channel,
      callToAction: deliverable.callToAction,
      authorName: input.peerName,
      hasContent: deliverable.body.trim().length > 0,
    };
  }

  if (deliverable.kind === "publish-preview") {
    const draft = input.drafts.find((d) => d.id === deliverable.draftId);
    return {
      kind: resolvePreviewKind(draft ?? null),
      title: deliverable.previewTitle,
      body: deliverable.previewBody,
      channel: deliverable.channel,
      authorName: input.peerName,
      hasContent: deliverable.previewBody.trim().length > 0,
    };
  }

  return {
    kind: "generic",
    title: "",
    body: "",
    channel: "",
    authorName: input.peerName,
    hasContent: false,
  };
}

function approvalLabelsForStatus(status: MarketingContentDraft["status"]): {
  action: EmmaDeskAction;
  primaryLabel: string;
  secondaryLabel: string;
} {
  if (status === "published") {
    return {
      action: "view_live",
      primaryLabel: "View live post",
      secondaryLabel: "Give feedback",
    };
  }
  if (status === "ready_to_publish") {
    return {
      action: "publish",
      primaryLabel: "Publish now",
      secondaryLabel: "Give feedback",
    };
  }
  if (status === "approved") {
    return {
      action: "schedule",
      primaryLabel: "Schedule",
      secondaryLabel: "Give feedback",
    };
  }
  return {
    action: "approve",
    primaryLabel: "Approve",
    secondaryLabel: "Give feedback",
  };
}

function buildNeedsApproval(input: BuildEmmaWorkspaceViewModelInput): EmmaNeedsApprovalViewModel {
  const draft = pickApprovalDraft(input.drafts, input.workUnits, input.selectedWorkUnitId);
  const selectedUnit = input.selectedWorkUnitId
    ? input.workUnits?.find((u) => u.id === input.selectedWorkUnitId)
    : input.workUnits?.find((u) => u.draftId === draft?.id);

  const connections =
    input.connections ??
    (input.organizationId ? loadIntegrationConnections(input.organizationId) : []);

  if (!draft) {
    return {
      hasItem: false,
      emptyMessage: "Emma doesn't need your approval right now.",
      emptySupportingMessage:
        "She'll place finished work here when it's ready for review.",
      subtitle: "Your review helps Emma publish with confidence.",
      draftId: null,
      title: null,
      channel: null,
      deliverable: null,
      connection: null,
      preview: buildPreviewFromDeliverable(input),
      rationaleHeading: "Why Emma chose this",
      rationale: [],
      rationalePreview: "",
      hasMoreRationale: false,
      primaryAction: null,
      primaryLabel: null,
      secondaryLabel: null,
      status: null,
      selectedTaskTitle: null,
    };
  }

  const overlay = input.approvalOverlays?.[draft.id];
  const deliverable = buildApprovalDeliverable({
    draft,
    workUnit: selectedUnit ?? null,
    overlay,
    connections,
    peerName: input.peerName,
  });
  const connection = resolveApprovalConnectionState(deliverable.account);

  const { action, primaryLabel, secondaryLabel } = approvalLabelsForStatus(draft.status);
  const rationale = buildEmmaRationaleBullets(draft);
  const rationalePreview = rationale[0] ?? "";

  return {
    hasItem: true,
    emptyMessage: "",
    emptySupportingMessage: "",
    subtitle: "Review exactly what Emma will publish.",
    draftId: draft.id,
    title: draft.title,
    channel: humanChannelLabel(draft),
    deliverable,
    connection,
    preview: buildPreviewForDraft(draft, input.peerName),
    rationaleHeading: "Why Emma chose this",
    rationale,
    rationalePreview,
    hasMoreRationale: rationale.length > 1,
    primaryAction: action,
    primaryLabel,
    secondaryLabel,
    status: draft.status,
    selectedTaskTitle: selectedUnit?.title ?? draft.title,
  };
}

function humanFinishedStatus(draft: MarketingContentDraft): string {
  if (draft.contentType === "newsletter") return "Sent";
  if (draft.contentType === "blog_article") return "Live";
  if (draft.contentType.includes("seo") || draft.title.toLowerCase().includes("seo")) return "Completed";
  if (draft.contentType === "website_article") return "Live";
  return "Published";
}

function buildRecentlyFinished(
  input: BuildEmmaWorkspaceViewModelInput
): EmmaRecentlyFinishedViewModel {
  const published = input.drafts
    .filter((d) => d.status === "published")
    .slice(0, 4)
    .map((draft, index) => ({
      id: `fin-${index}`,
      draftId: draft.id,
      title: draft.title,
      platform: humanChannelLabel(draft),
      timeLabel: formatRelativeTime(draft.generatedAt),
      status: humanFinishedStatus(draft),
      performanceLabel: null,
    }));

  if (published.length === 0) {
    return {
      hasItems: false,
      emptyMessage: "Nothing completed yet. Assign work above to get Emma started.",
      viewAllLabel: "",
      items: [],
    };
  }

  return {
    hasItems: true,
    emptyMessage: "",
    viewAllLabel: "",
    items: published,
  };
}

function buildResults(input: BuildEmmaWorkspaceViewModelInput): EmmaResultsViewModel {
  const performance = resolvePeerPerformance({
    peerId: input.peerId,
    drafts: input.drafts,
    connections:
      input.connections ??
      (input.organizationId ? loadIntegrationConnections(input.organizationId) : []),
    storedMetrics: input.storedMetrics,
  });

  return {
    metrics: resolveMissionPerformanceSummary(performance.metrics).map((m) => ({
      id: m.id,
      label: m.label,
      value: m.value,
    })),
    emptyMessage:
      performance.emptyMessage ??
      "Results appear here after Emma publishes work and your channels are connected.",
    fullPerformanceHref: `/team/${input.peerId}/performance`,
    fullPerformanceLabel: "See full results",
  };
}

function buildInsights(input: BuildEmmaWorkspaceViewModelInput): {
  hasInsights: boolean;
  emptyMessage: string;
  viewAllLabel: string;
  insights: EmmaInsightItem[];
  rotation: InsightRotationState;
} {
  const rotation = input.insightRotation ?? {
    dismissedIds: [],
    lastIndex: -1,
    lastRotatedAt: new Date(0).toISOString(),
  };
  const rotated = rotateInsights({
    strategy: input.strategy,
    activityFeed: input.activityFeed,
    rotation,
    maxVisible: 3,
  });

  if (rotated.insights.length === 0) {
    return {
      hasInsights: false,
      emptyMessage: "Emma is watching for opportunities.",
      viewAllLabel: "",
      insights: [],
      rotation: rotated.rotation,
    };
  }

  return {
    hasInsights: true,
    emptyMessage: "",
    viewAllLabel: "",
    insights: rotated.insights,
    rotation: rotated.rotation,
  };
}

export function buildExecutiveBrief(input: BuildEmmaWorkspaceViewModelInput): EmmaExecutiveBriefViewModel {
  return {
    greeting: greetingForHour(new Date().getHours()),
    userName: input.userName,
    intro: "Here's what Emma did while you were away.",
    highlights: buildHighlights(input.drafts, input.strategy, input.activityFeed),
  };
}

function buildMissionOverview(input: BuildEmmaWorkspaceViewModelInput): EmmaMissionOverviewViewModel {
  const greeting = greetingForHour(new Date().getHours()).toLowerCase();
  const focus = resolveMarketingWorkflowFocus({
    generating: input.generating,
    generatingActivity: input.generatingActivity,
    understanding: input.understanding,
    strategy: input.strategy,
    plan: input.plan,
    drafts: input.drafts,
    publicationPackages: input.publicationPackages,
  });
  const performance = resolvePeerPerformance({
    peerId: input.peerId,
    drafts: input.drafts,
    connections:
      input.connections ??
      (input.organizationId ? loadIntegrationConnections(input.organizationId) : []),
    storedMetrics: input.storedMetrics,
  });
  const summaryMetrics = resolveMissionPerformanceSummary(performance.metrics);
  const activeUnit =
    input.workUnits?.find((u) => u.id === input.selectedWorkUnitId) ??
    input.workUnits?.find(
      (u) => !u.cancelled && u.status !== "published" && u.status !== "monitoring"
    ) ??
    null;
  const approvalDraft = pickApprovalDraft(
    input.drafts,
    input.workUnits,
    input.selectedWorkUnitId
  );
  const missionCta = resolveMissionControlCta({
    activeWorkUnit: activeUnit,
    approvalDraft,
    peerId: input.peerId,
  });
  const inProgress =
    Boolean(input.generating) ||
    focus.kind === "write_next" ||
    focus.kind === "draft_review" ||
    focus.kind === "draft_approved" ||
    focus.kind === "ready_to_publish" ||
    focus.kind === "strategy_complete" ||
    focus.kind === "ready_for_strategy";

  return {
    peerName: input.peerName,
    roleLabel: "MARKETING PEER",
    sectionSubtitle: `${greeting.charAt(0).toUpperCase()}${greeting.slice(1)}. Here's what ${input.peerName} has been up to.`,
    kpis: buildMissionKpis(input.drafts, input.strategy),
    performanceMetrics: summaryMetrics.map((m) => ({
      id: m.id,
      label: m.label,
      value: m.value,
      grounded: true,
    })),
    performanceEmptyMessage: performance.emptyMessage,
    performanceLinkLabel: "View full performance",
    performanceLinkHref: `/team/${input.peerId}/performance`,
    currentFocus: resolveCurrentFocus(input),
    inProgress,
    estimatedImpact: resolveEstimatedImpact(input.plan),
    missionCta,
  };
}

export function buildEmmaWorkspaceViewModel(
  input: BuildEmmaWorkspaceViewModelInput
): EmmaWorkspaceViewModel {
  const insightResult = buildInsights(input);
  return {
    executiveBrief: buildExecutiveBrief(input),
    missionOverview: buildMissionOverview(input),
    currentWork: buildCurrentWork(input),
    needsApproval: buildNeedsApproval(input),
    recentlyFinished: buildRecentlyFinished(input),
    results: buildResults(input),
    insights: {
      hasInsights: insightResult.hasInsights,
      emptyMessage: insightResult.emptyMessage,
      viewAllLabel: insightResult.viewAllLabel,
      insights: insightResult.insights,
    },
    delegation: {
      promptLabel: "What should Emma work on?",
      emptyPrompt: "What should Emma work on?",
      placeholder: "Describe the work — e.g. Instagram campaign with image and caption…",
    },
    connectedChannels: buildConnectedChannels(input.connections, input.organizationId),
    primaryAction: input.primaryAction,
  };
}

export { dismissInsight };
export type { InsightRotationState };
