import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import {
  getV17ResultsCopy,
  type V17ResultsCopy,
  type V17ResultsRangeId,
} from "@/lib/i18n/v17-results-copy";
import { resolveCustomerLocalePreference } from "@/lib/i18n/resolve-customer-locale-preference";
import { buildMarketingPerformanceViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-performance-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingResultMetric } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  getContentHref,
  getProjectHref,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { deriveProjectStatus } from "@/lib/peer-experience/marketing/projects/project-engine";
import { rotateInsights } from "@/lib/peer-experience/marketing/build-insights-engine";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";
import type { PeerAttentionItemViewModel } from "@/lib/peer-experience/marketing/colleague/peer-presence-types";
import { buildMarketingPeerAttentionItems } from "@/features/marketing-workspace/lib/build-peer-attention-items";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { sanitizeV17CustomerLine } from "./sanitize-v17-customer-text";

const COMPLETED_PROJECT_STATUSES = ["completed", "archived", "monitoring_results"];
const RANGE_IDS: V17ResultsRangeId[] = ["week", "month", "quarter", "all"];
const RANGE_DAYS: Record<V17ResultsRangeId, number | null> = {
  week: 7,
  month: 30,
  quarter: 90,
  all: null,
};
const PUBLISHING_GAP_THRESHOLD_DAYS = 8;
const MAX_INSIGHTS = 4;

export type V17ResultsKpiIcon = "completed" | "running" | "reach" | "leads";

export type V17ResultsKpi = {
  id: string;
  icon: V17ResultsKpiIcon;
  label: string;
  /** Null when no truthful value exists — render the unavailable state instead. */
  value: string | null;
  explanation: string;
  trend: { direction: "up" | "down" | "neutral"; label: string } | null;
  href: string | null;
  unavailable: { message: string; ctaLabel: string; ctaHref: string } | null;
};

export type V17ResultsDeliverableStatusTone =
  | "approved"
  | "scheduled"
  | "published"
  | "needs_approval"
  | "draft";

export type V17ResultsDeliverable = {
  id: string;
  title: string;
  platform: string;
  statusLabel: string;
  statusTone: V17ResultsDeliverableStatusTone;
  createdLabel: string;
  href: string | null;
};

export type V17ResultsActivityEntry = {
  id: string;
  label: string;
  timeLabel: string;
};

export type V17ResultsInsight = {
  id: string;
  observation: string;
  recommendation: string | null;
};

export type V17ResultsRangeOption = {
  id: V17ResultsRangeId;
  label: string;
  href: string;
  active: boolean;
};

export type V17ResultsViewModel = {
  peerId: string;
  title: string;
  subtitle: string;
  rangeAriaLabel: string;
  ranges: V17ResultsRangeOption[];
  kpis: V17ResultsKpi[];
  deliverables: V17ResultsDeliverable[];
  activity: V17ResultsActivityEntry[];
  insights: V17ResultsInsight[];
  attention: PeerAttentionItemViewModel[];
  /** Set only when the Peer has produced nothing at all yet. */
  onboarding: { headline: string; body: string; ctaLabel: string; ctaHref: string } | null;
  copy: V17ResultsCopy;
};

function resolveRange(searchParams?: URLSearchParams): V17ResultsRangeId {
  const raw = searchParams?.get("range");
  return RANGE_IDS.includes(raw as V17ResultsRangeId)
    ? (raw as V17ResultsRangeId)
    : "month";
}

function cutoffFor(range: V17ResultsRangeId): number | null {
  const days = RANGE_DAYS[range];
  return days == null ? null : Date.now() - days * 24 * 60 * 60 * 1000;
}

function withinRange(iso: string | undefined | null, cutoff: number | null): boolean {
  if (cutoff == null) return true;
  if (!iso) return false;
  const at = new Date(iso).getTime();
  return Number.isFinite(at) && at >= cutoff;
}

function campaignAudience(project: MarketingProject): string | null {
  const setup = project.campaignSetup;
  // `confirmedAudience` supersedes the wizard value once onboarding completes.
  const raw = setup?.confirmedAudience?.trim() || setup?.targetAudience?.trim();
  return raw ? raw : null;
}

/**
 * Turns an integration-backed metric into a KPI without ever inventing a value.
 * `setup_required` becomes an honest unavailable state naming the connection.
 */
function metricKpi(input: {
  metric: MarketingResultMetric | undefined;
  icon: V17ResultsKpiIcon;
  id: string;
  label: string;
  explanation: string;
  needsMessage: string;
  connectCta: string;
  connectionsHref: string;
}): V17ResultsKpi {
  const { metric } = input;
  const usable =
    metric != null &&
    metric.status !== "setup_required" &&
    metric.value != null &&
    metric.value !== "—" &&
    String(metric.value).trim() !== "";

  if (!usable) {
    return {
      id: input.id,
      icon: input.icon,
      label: input.label,
      value: null,
      explanation: input.explanation,
      trend: null,
      href: null,
      unavailable: {
        message: input.needsMessage,
        ctaLabel: input.connectCta,
        // Deliberately not `metric.setupCta.href`: the legacy metric points at
        // `?section=channels`, which the v17 Settings surface does not define.
        // Using the canonical v17 connections route avoids a dead end.
        ctaHref: input.connectionsHref,
      },
    };
  }

  return {
    id: input.id,
    icon: input.icon,
    label: input.label,
    value: `${metric.value}${metric.unit ?? ""}`,
    explanation: input.explanation,
    trend: metric.comparison
      ? {
          direction: metric.comparison.direction,
          label: `${metric.comparison.value > 0 ? "+" : ""}${metric.comparison.value}% ${metric.comparison.periodLabel}`,
        }
      : null,
    href: metric.performanceHref ?? null,
    unavailable: null,
  };
}

function deliverableStatus(
  status: string,
  copy: V17ResultsCopy
): { label: string; tone: V17ResultsDeliverableStatusTone } {
  switch (status) {
    case "published":
      return { label: copy.statusPublished, tone: "published" };
    case "ready_to_publish":
      return { label: copy.statusScheduled, tone: "scheduled" };
    case "approved":
      return { label: copy.statusApproved, tone: "approved" };
    case "ready_for_review":
      return { label: copy.statusNeedsApproval, tone: "needs_approval" };
    default:
      return { label: copy.statusDraft, tone: "draft" };
  }
}

function platformLabel(channel: string | undefined, contentType: string): string {
  const raw = (channel ?? contentType ?? "").replace(/[_-]+/g, " ").trim();
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Days since the most recent published item, or null when nothing is published. */
function daysSinceLastPublish(input: MarketingPeerDomainInput): number | null {
  const stamps = input.drafts
    .filter((d) => d.status === "published" && d.generatedAt)
    .map((d) => new Date(d.generatedAt).getTime())
    .filter((at) => Number.isFinite(at));
  if (stamps.length === 0) return null;
  const days = Math.floor((Date.now() - Math.max(...stamps)) / (24 * 60 * 60 * 1000));
  return days >= 0 ? days : null;
}

/** An audience shared by two or more live campaigns, or null. */
function overlappingAudience(input: MarketingPeerDomainInput): string | null {
  const counts = new Map<string, { label: string; count: number }>();
  for (const project of input.projects) {
    const status = deriveProjectStatus(project, input.workUnits, input.drafts, new Set());
    if (COMPLETED_PROJECT_STATUSES.includes(status)) continue;
    const audience = campaignAudience(project);
    if (!audience) continue;
    const key = audience.toLowerCase();
    const existing = counts.get(key);
    counts.set(key, { label: audience, count: (existing?.count ?? 0) + 1 });
  }
  for (const entry of counts.values()) {
    if (entry.count >= 2) return entry.label;
  }
  return null;
}

export function buildV17ResultsViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  localePreference?: string | null;
  searchParams?: URLSearchParams;
  attention?: PeerAttentionItemViewModel[];
}): V17ResultsViewModel {
  const locale = resolveCustomerLocalePreference(
    input.localePreference
  ) as MarketingCampaignLocale;
  const copy = getV17ResultsCopy(locale);
  const { domainInput } = input;
  const peerId = domainInput.peerId;

  const range = resolveRange(input.searchParams);
  const cutoff = cutoffFor(range);
  const connectionsHref = `/team/${peerId}/settings?section=connections`;

  const performance = buildMarketingPerformanceViewModel(domainInput);
  const metricById = new Map(performance.executiveMetrics.map((m) => [m.id, m]));

  // --- Section 1: exactly four KPIs -----------------------------------------
  const projectStatuses = domainInput.projects.map((project) => ({
    project,
    status: deriveProjectStatus(project, domainInput.workUnits, domainInput.drafts, new Set()),
  }));

  const completedCount = projectStatuses.filter(
    (entry) =>
      COMPLETED_PROJECT_STATUSES.includes(entry.status) &&
      withinRange(entry.project.updatedAt, cutoff)
  ).length;

  const runningCount = projectStatuses.filter(
    (entry) => !COMPLETED_PROJECT_STATUSES.includes(entry.status)
  ).length;

  const kpis: V17ResultsKpi[] = [
    {
      id: "campaigns-completed",
      icon: "completed",
      label: copy.kpiCompleted,
      value: String(completedCount),
      explanation: copy.kpiCompletedWhy(completedCount),
      trend: null,
      href: completedCount > 0 ? `/team/${peerId}/done` : null,
      unavailable: null,
    },
    {
      id: "campaigns-running",
      icon: "running",
      label: copy.kpiRunning,
      value: String(runningCount),
      explanation: copy.kpiRunningWhy(runningCount),
      trend: null,
      href: runningCount > 0 ? `/team/${peerId}/work` : null,
      unavailable: null,
    },
    metricKpi({
      metric: metricById.get("reach"),
      icon: "reach",
      id: "estimated-reach",
      label: copy.kpiReach,
      explanation: copy.kpiReachWhy,
      needsMessage: copy.reachNeeds,
      connectCta: copy.connectCta,
      connectionsHref,
    }),
    metricKpi({
      metric: metricById.get("leads"),
      icon: "leads",
      id: "qualified-leads",
      label: copy.kpiLeads,
      explanation: copy.kpiLeadsWhy,
      needsMessage: copy.leadsNeeds,
      connectCta: copy.connectCta,
      connectionsHref,
    }),
  ];

  // --- Section 2: latest deliverables ---------------------------------------
  const deliverables: V17ResultsDeliverable[] = [...domainInput.drafts]
    .filter((draft) => withinRange(draft.generatedAt, cutoff))
    .sort(
      (a, b) =>
        new Date(b.generatedAt ?? 0).getTime() - new Date(a.generatedAt ?? 0).getTime()
    )
    .slice(0, 6)
    .map((draft) => {
      const status = deliverableStatus(draft.status, copy);
      return {
        id: draft.id,
        title: sanitizeV17CustomerLine(draft.title, locale) || draft.title,
        platform: platformLabel(draft.channel, draft.contentType),
        statusLabel: status.label,
        statusTone: status.tone,
        createdLabel: draft.generatedAt ? formatRelativeTime(draft.generatedAt) : "",
        href: getContentHref(peerId, draft.id),
      };
    });

  // --- Section 3: peer activity timeline (newest first) ---------------------
  const activity: V17ResultsActivityEntry[] = [...(domainInput.activityFeed ?? [])]
    .filter((item) => withinRange(item.timestamp, cutoff))
    .sort(
      (a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
    )
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      label: sanitizeV17CustomerLine(item.description || item.title, locale) || item.title,
      timeLabel: item.timestamp ? formatRelativeTime(item.timestamp) : "",
    }))
    .filter((entry) => entry.label.trim() !== "");

  // --- Section 4: insights — observations only, never fabricated analytics --
  const insights: V17ResultsInsight[] = [];

  const publishGap = daysSinceLastPublish(domainInput);
  if (publishGap != null && publishGap >= PUBLISHING_GAP_THRESHOLD_DAYS) {
    insights.push({
      id: "insight-publish-gap",
      observation: copy.insightPublishingGap(publishGap),
      recommendation: copy.insightPublishingGapRec,
    });
  }

  const sharedAudience = overlappingAudience(domainInput);
  if (sharedAudience) {
    insights.push({
      id: "insight-shared-audience",
      observation: copy.insightDuplicateAudience(sharedAudience),
      recommendation: copy.insightDuplicateAudienceRec,
    });
  }

  // Reuse the existing rotation engine rather than duplicating its logic.
  // `candidate.source` is intentionally dropped: naming a channel here would
  // imply an active integration the customer may not actually have connected.
  const rotated = rotateInsights({
    strategy: domainInput.strategy,
    activityFeed: domainInput.activityFeed ?? [],
    rotation:
      domainInput.insightRotation ?? {
        dismissedIds: [],
        lastIndex: -1,
        lastRotatedAt: new Date(0).toISOString(),
      },
    maxVisible: 3,
  });

  for (const candidate of rotated.insights) {
    if (insights.length >= MAX_INSIGHTS) break;
    const observation =
      sanitizeV17CustomerLine(candidate.voice, locale) || candidate.voice;
    if (!observation.trim()) continue;
    insights.push({
      id: candidate.id,
      observation,
      recommendation: candidate.detail
        ? sanitizeV17CustomerLine(candidate.detail, locale) || candidate.detail
        : null,
    });
  }

  // --- Section 5: attention (reuses the shared attention builder) -----------
  const attention =
    input.attention ??
    buildMarketingPeerAttentionItems({
      domainInput,
      locale,
      primaryCtaLabel: getV17PeerCopy(locale).reviewCta,
    });

  // --- Empty state ----------------------------------------------------------
  const hasAnyWork = domainInput.projects.length > 0 || domainInput.drafts.length > 0;

  return {
    peerId,
    title: copy.title,
    subtitle: copy.subtitle,
    rangeAriaLabel: copy.rangeAriaLabel,
    ranges: RANGE_IDS.map((id) => ({
      id,
      label: copy.ranges[id],
      href: `/team/${peerId}/results?range=${id}`,
      active: id === range,
    })),
    kpis,
    deliverables,
    activity,
    insights,
    attention,
    onboarding: hasAnyWork
      ? null
      : {
          headline: copy.onboardingHeadline,
          body: copy.onboardingBody,
          ctaLabel: copy.onboardingCta,
          ctaHref: getProjectHref(peerId),
        },
    copy,
  };
}
