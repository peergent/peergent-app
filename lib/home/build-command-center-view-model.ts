import type { HandoffState } from "@/lib/home/handoff-types";
import type { HomeNeedsYouItem, HomeMovementItem, HomeViewModel } from "@/lib/home/types";
import type { WorkforceSummary } from "@/lib/home/workforce-summary-types";
import { buildHqServiceCards, type HqServiceCard } from "@/lib/hq/aggregate-hq-services";
import type { HqServiceKey } from "@/lib/hq/hq-service-key";
import type { HomeCopy } from "@/lib/i18n";
import { getHqServiceKey } from "@/lib/hq/hq-service-key";
import type { WorkforceActivitySource } from "@/lib/home/workforce-summary-types";

/** Central missing-data display for Command Center metrics. */
export const CC_MISSING_VALUE = "—";

export const CC_NEUTRAL_DELTA = "—";

export const CC_FLAT_SPARKLINE: number[] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

export const COMMAND_CENTER_KPI_IDS = ["tasks", "time", "revenue", "approvals"] as const;

export const COMMAND_CENTER_DESKTOP_SECTIONS = [
  "header",
  "intro",
  "kpis",
  "attention-activity",
  "agent-performance",
  "revenue-attribution",
] as const;

export const CC_APPROVALS_VISIBLE_LIMIT = 3;

export const CC_ACTIVITY_VISIBLE_LIMIT = 6;

export const CC_APPROVALS_VIEW_ALL_HREF = "/inbox";

const AGENT_PERFORMANCE_ORDER: HqServiceKey[] = [
  "sales",
  "marketing",
  "finance",
  "support",
  "operations",
];

export type CcMetricCard = {
  id: (typeof COMMAND_CENTER_KPI_IDS)[number];
  label: string;
  value: string;
  deltaLabel: string;
  deltaTone: "up" | "neutral" | "down";
  sparkValues: number[];
  sparkColor: "default" | "cyan" | "amber";
  sparkMuted: boolean;
};

export type CcApprovalItem = {
  id: string;
  title: string;
  reason: string;
  href: string;
  reviewHref: string;
  confidenceLabel: string | null;
  serviceKey: HqServiceCard["serviceKey"];
};

export type CcActivityItem = {
  id: string;
  agentLabel: string;
  text: string;
  timeLabel: string;
  href: string;
  serviceKey: HqServiceCard["serviceKey"];
  timestamp: string;
};

export type CcServicePerformance = HqServiceCard & {
  tasksThisWeek: number;
  performancePct: number;
  sparkValues: number[];
  sparkMuted: boolean;
};

export type CcRoiAttribution = {
  serviceKey: HqServiceCard["serviceKey"];
  label: string;
  percent: number;
};

export type CcApprovalsPanel = {
  items: CcApprovalItem[];
  pendingCount: number;
  viewAllHref: string;
};

export type CommandCenterViewModel = {
  metrics: CcMetricCard[];
  approvals: CcApprovalsPanel;
  activity: CcActivityItem[];
  services: CcServicePerformance[];
  roi: {
    valueLabel: string;
    deltaLabel: string | null;
    caption: string;
    chartValues: number[];
    chartMuted: boolean;
    attribution: CcRoiAttribution[];
  };
};

function totalTasksCompleted(summary: WorkforceSummary): number {
  return (
    summary.completedTasks +
    summary.marketingTasksCompleted +
    summary.leadsGenerated +
    summary.supportTicketsResolved +
    summary.invoicesPrepared +
    summary.conversationsHandled
  );
}

function formatHours(hours: number | null): string {
  if (hours == null || hours <= 0) return CC_MISSING_VALUE;
  return `${hours}h`;
}

function formatRevenue(value: number | null): string {
  if (value == null || value <= 0) return CC_MISSING_VALUE;
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function sparkFromScalar(value: number, points = 12): number[] {
  if (value <= 0) return [...CC_FLAT_SPARKLINE];
  const max = Math.max(value, 1);
  return Array.from({ length: points }, (_, index) =>
    Math.max(1, Math.round((max * (index + 1)) / points))
  );
}

function approvalConfidence(_item: HomeNeedsYouItem): string | null {
  return null;
}

function serviceKeyForNeedsYou(
  viewModel: HomeViewModel | null,
  item: HomeNeedsYouItem
): HqServiceCard["serviceKey"] {
  const pulse = viewModel?.teamPulse.find((peer) => peer.peerId === item.peerId);
  return (
    getHqServiceKey({
      role: pulse?.role ?? item.peerName,
      name: pulse?.name ?? item.peerName,
    }) ?? "operations"
  );
}

function serviceKeyForMovement(
  viewModel: HomeViewModel | null,
  item: HomeMovementItem
): HqServiceCard["serviceKey"] {
  const pulse = viewModel?.teamPulse.find(
    (peer) => peer.name === item.peerName || peer.peerId === item.id.split("-")[0]
  );
  return (
    getHqServiceKey({
      role: pulse?.role ?? item.peerName,
      name: pulse?.name ?? item.peerName,
    }) ?? "operations"
  );
}

export function dedupeApprovals(items: HomeNeedsYouItem[]): HomeNeedsYouItem[] {
  const seen = new Set<string>();
  const result: HomeNeedsYouItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result;
}

export function sortActivityNewestFirst(items: HomeMovementItem[]): HomeMovementItem[] {
  return [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function selectAgentPerformanceServices(
  services: CcServicePerformance[]
): CcServicePerformance[] {
  const byKey = new Map(services.map((service) => [service.serviceKey, service]));
  const withPeers = AGENT_PERFORMANCE_ORDER.map((key) => byKey.get(key)).filter(
    (service): service is CcServicePerformance => !!service && service.peerCount > 0
  );

  if (withPeers.length <= 4) return withPeers;

  const withoutOps = withPeers.filter((service) => service.serviceKey !== "operations");
  return withoutOps.length >= 4 ? withoutOps.slice(0, 4) : withPeers.slice(0, 4);
}

export function normalizeAttributionPercents(rows: CcRoiAttribution[]): CcRoiAttribution[] {
  if (rows.length === 0) return rows;
  const sum = rows.reduce((total, row) => total + row.percent, 0);
  if (sum === 100 || sum === 0) return rows;

  const adjusted = [...rows];
  const lastIndex = adjusted.length - 1;
  adjusted[lastIndex] = {
    ...adjusted[lastIndex]!,
    percent: adjusted[lastIndex]!.percent + (100 - sum),
  };
  return adjusted;
}

function serviceTasksThisWeek(
  service: HqServiceCard,
  sources: WorkforceActivitySource[]
): number {
  let count = 0;
  const peerSet = new Set(service.peerIds);

  for (const source of sources) {
    if (!peerSet.has(source.peerId)) continue;
    count += source.activities.length;
  }

  return count;
}

function servicePerformancePct(service: HqServiceCard): number {
  if (service.peerCount <= 0) return 0;
  const activeRatio = service.activePeerCount / service.peerCount;
  const statusBoost =
    service.statusKind === "working"
      ? 12
      : service.statusKind === "needs_attention"
        ? -8
        : service.statusKind === "monitoring"
          ? 4
          : 0;
  return Math.min(99, Math.max(40, Math.round(72 + activeRatio * 22 + statusBoost)));
}

function attributionFromServices(services: CcServicePerformance[]): CcRoiAttribution[] {
  const weights = services.map((service) => ({
    service,
    weight: Math.max(service.tasksThisWeek, service.activePeerCount, 1),
  }));
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0) || 1;

  const rows = weights.map(({ service, weight }) => ({
    serviceKey: service.serviceKey,
    label: service.label,
    percent: Math.round((weight / total) * 100),
  }));

  return normalizeAttributionPercents(rows);
}

function buildKpiMetrics(input: {
  summary: WorkforceSummary | undefined;
  needsYouCount: number;
}): CcMetricCard[] {
  const { summary, needsYouCount } = input;
  const tasksTotal = summary ? totalTasksCompleted(summary) : null;
  const hoursSaved = summary?.estimatedWorkingHoursSaved ?? null;
  const revenue = summary?.estimatedBusinessValue ?? null;

  const tasksValue =
    summary == null ? CC_MISSING_VALUE : String(tasksTotal ?? 0);
  const tasksSpark =
    summary == null || tasksTotal == null || tasksTotal <= 0
      ? CC_FLAT_SPARKLINE
      : sparkFromScalar(tasksTotal);

  const hoursMissing = hoursSaved == null || hoursSaved <= 0;
  const revenueMissing = revenue == null || revenue <= 0;

  return [
    {
      id: "tasks",
      label: "Tasks completed",
      value: tasksValue,
      deltaLabel: CC_NEUTRAL_DELTA,
      deltaTone: "neutral",
      sparkValues: tasksSpark,
      sparkColor: "default",
      sparkMuted: summary == null || tasksTotal == null || tasksTotal <= 0,
    },
    {
      id: "time",
      label: "Time saved",
      value: formatHours(hoursSaved),
      deltaLabel: CC_NEUTRAL_DELTA,
      deltaTone: "neutral",
      sparkValues: hoursMissing ? CC_FLAT_SPARKLINE : sparkFromScalar(hoursSaved),
      sparkColor: "default",
      sparkMuted: hoursMissing,
    },
    {
      id: "revenue",
      label: "Revenue influenced",
      value: formatRevenue(revenue),
      deltaLabel: CC_NEUTRAL_DELTA,
      deltaTone: "neutral",
      sparkValues: revenueMissing ? CC_FLAT_SPARKLINE : sparkFromScalar(revenue),
      sparkColor: "cyan",
      sparkMuted: revenueMissing,
    },
    {
      id: "approvals",
      label: "Approvals pending",
      value: String(needsYouCount),
      deltaLabel: needsYouCount > 0 ? `${needsYouCount} waiting` : CC_NEUTRAL_DELTA,
      deltaTone: "neutral",
      sparkValues:
        needsYouCount > 0 ? sparkFromScalar(needsYouCount) : CC_FLAT_SPARKLINE,
      sparkColor: "amber",
      sparkMuted: needsYouCount <= 0,
    },
  ];
}

export function buildCommandCenterViewModel(input: {
  viewModel: HomeViewModel | null;
  handoff: HandoffState;
  copy: HomeCopy;
  activitySources: WorkforceActivitySource[];
  formatRelativeTime: (iso: string) => string;
}): CommandCenterViewModel {
  const { viewModel, activitySources, formatRelativeTime } = input;
  const summary = viewModel?.workforceSummary;
  const needsYou = dedupeApprovals(viewModel?.needsYou ?? []);
  const movementSource =
    viewModel && viewModel.awayMovement.length > 0
      ? viewModel.awayMovement
      : (viewModel?.recentMovement ?? []);
  const movement = sortActivityNewestFirst(movementSource);

  const tasksTotal = summary ? totalTasksCompleted(summary) : 0;
  const revenue = summary?.estimatedBusinessValue ?? null;

  const servicesBase = viewModel
    ? buildHqServiceCards({
        teamPulse: viewModel.teamPulse,
        activitySources,
        workforceSummary: viewModel.workforceSummary,
        needsYou,
      })
    : [];

  const servicesAll: CcServicePerformance[] = servicesBase.map((service) => {
    const tasksThisWeek = serviceTasksThisWeek(service, activitySources);
    const hasTasks = tasksThisWeek > 0;
    return {
      ...service,
      tasksThisWeek,
      performancePct: servicePerformancePct(service),
      sparkValues: hasTasks
        ? sparkFromScalar(tasksThisWeek, 8)
        : [...CC_FLAT_SPARKLINE.slice(0, 8)],
      sparkMuted: !hasTasks,
    };
  });

  const services = selectAgentPerformanceServices(servicesAll);

  const metrics = buildKpiMetrics({ summary, needsYouCount: needsYou.length });

  const approvalItems: CcApprovalItem[] = needsYou.map((item) => ({
    id: item.id,
    title: item.subtitle && item.subtitle !== item.peerName ? item.subtitle : item.title,
    reason: `${item.peerName} · ${item.context ?? item.title}`,
    href: item.href,
    reviewHref: item.href,
    confidenceLabel: approvalConfidence(item),
    serviceKey: serviceKeyForNeedsYou(viewModel, item),
  }));

  const activity: CcActivityItem[] = movement.slice(0, CC_ACTIVITY_VISIBLE_LIMIT).map((item) => ({
    id: item.id,
    agentLabel: item.peerName,
    text: item.title,
    timeLabel: formatRelativeTime(item.timestamp),
    href: item.href,
    serviceKey: serviceKeyForMovement(viewModel, item),
    timestamp: item.timestamp,
  }));

  const attribution = attributionFromServices(servicesAll.length > 0 ? servicesAll : services);
  const attributedOutcomes = movement.length;
  const revenueMissing = revenue == null || revenue <= 0;

  return {
    metrics,
    approvals: {
      items: approvalItems.slice(0, CC_APPROVALS_VISIBLE_LIMIT),
      pendingCount: approvalItems.length,
      viewAllHref: CC_APPROVALS_VIEW_ALL_HREF,
    },
    activity,
    services,
    roi: {
      valueLabel: formatRevenue(revenue),
      deltaLabel: null,
      caption:
        attributedOutcomes > 0
          ? `Based on ${attributedOutcomes} attributed outcome${attributedOutcomes === 1 ? "" : "s"} · linear attribution`
          : "Based on workforce activity · linear attribution",
      chartValues: revenueMissing
        ? CC_FLAT_SPARKLINE
        : sparkFromScalar(revenue ?? tasksTotal, 16),
      chartMuted: revenueMissing,
      attribution,
    },
  };
}
