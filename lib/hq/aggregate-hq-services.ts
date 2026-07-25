import type { HomeNeedsYouItem, HomeTeamPulseItem } from "@/lib/home/types";
import type {
  WorkforceActivitySource,
  WorkforceSummary,
} from "@/lib/home/workforce-summary-types";
import { dedupeTeamPulseByPeerId } from "./hq-peers";
import {
  getHqServiceKey,
  HQ_SERVICE_LABELS,
  sortServiceKeys,
  type HqServiceKey,
} from "./hq-service-key";

export type HqServiceStatusKind =
  | "needs_attention"
  | "working"
  | "monitoring"
  | "ready"
  | "idle";

export type HqServiceCard = {
  serviceKey: HqServiceKey;
  label: string;
  href: string;
  peerCount: number;
  activePeerCount: number;
  statusKind: HqServiceStatusKind;
  statusLabel: string;
  activity: string;
  colleagueLine: string;
  metric: string | null;
  peerIds: string[];
  arcVariant: "high" | "low";
};

const STATUS_PRIORITY: HqServiceStatusKind[] = [
  "needs_attention",
  "working",
  "monitoring",
  "ready",
  "idle",
];

const STATUS_LABELS: Record<HqServiceStatusKind, string> = {
  needs_attention: "Needs attention",
  working: "Working",
  monitoring: "Monitoring",
  ready: "Ready",
  idle: "Idle",
};

const HQ_ARC_BY_SERVICE: Record<HqServiceKey, "high" | "low"> = {
  sales: "high",
  marketing: "low",
  finance: "low",
  support: "high",
  operations: "low",
};

const LEAD_TYPES = new Set([
  "lead_qualified",
  "lead_generated",
  "lead_captured",
]);
const MEETING_TYPES = new Set(["meeting_booked", "meeting_scheduled"]);
const MARKETING_TYPES = new Set([
  "draft_generated",
  "draft_approved",
  "publication_prepared",
  "publication_ready",
  "published",
  "strategy_completed",
  "plan_completed",
]);
const SUPPORT_TYPES = new Set([
  "support_resolved",
  "ticket_resolved",
  "issue_resolved",
]);
const INVOICE_TYPES = new Set([
  "invoice_prepared",
  "invoice_sent",
  "invoice_generated",
]);
const OPS_TYPES = new Set([
  "plan_scheduled",
  "schedule_updated",
  "operation_completed",
  "task_completed",
  "workflow_completed",
]);

const SETUP_DETAIL = "Open this colleague's workspace to continue setup.";

const SERVICE_ACTIVITY_FALLBACK: Record<HqServiceKey, string> = {
  sales: "Calling leads and booking meetings",
  marketing: "Preparing campaigns and content",
  finance: "Monitoring cash flow",
  support: "Resolving customer conversations",
  operations: "Planning schedules and operations",
};

type ActivityCounts = {
  leads: number;
  meetings: number;
  marketing: number;
  support: number;
  invoices: number;
  operations: number;
};

function mapPeerToServiceStatus(item: HomeTeamPulseItem): HqServiceStatusKind {
  if (item.statusKind === "blocked" || item.statusKind === "waiting") {
    return "needs_attention";
  }
  if (item.statusKind === "working") return "working";
  if (item.statusLabel.toLowerCase().includes("monitor")) return "monitoring";
  if (item.statusKind === "paused") return "idle";
  if (item.statusKind === "idle") return "ready";
  return "ready";
}

function aggregateServiceStatus(items: HomeTeamPulseItem[]): HqServiceStatusKind {
  const mapped = items.map(mapPeerToServiceStatus);
  for (const status of STATUS_PRIORITY) {
    if (mapped.includes(status)) return status;
  }
  return "idle";
}

function isActivePeer(item: HomeTeamPulseItem): boolean {
  return item.statusKind !== "paused";
}

function pickPrimaryPeerItem(items: HomeTeamPulseItem[]): HomeTeamPulseItem {
  const attention = items.find(
    (item) => item.statusKind === "waiting" || item.statusKind === "blocked"
  );
  if (attention) return attention;

  const working = items.find((item) => item.statusKind === "working");
  if (working) return working;

  return items[0]!;
}

function truncate(text: string, max = 72): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function isGenericSetupDetail(detail: string): boolean {
  const trimmed = detail.trim();
  return !trimmed || trimmed === SETUP_DETAIL || trimmed.includes("continue setup");
}

function countActivitiesForPeers(
  peerIds: string[],
  sources: WorkforceActivitySource[]
): ActivityCounts {
  const totals: ActivityCounts = {
    leads: 0,
    meetings: 0,
    marketing: 0,
    support: 0,
    invoices: 0,
    operations: 0,
  };

  for (const peerId of peerIds) {
    const source = sources.find((entry) => entry.peerId === peerId);
    if (!source) continue;

    for (const activity of source.activities) {
      const type = activity.activityType;
      if (LEAD_TYPES.has(type)) totals.leads += 1;
      else if (MEETING_TYPES.has(type)) totals.meetings += 1;
      else if (MARKETING_TYPES.has(type)) totals.marketing += 1;
      else if (SUPPORT_TYPES.has(type)) totals.support += 1;
      else if (INVOICE_TYPES.has(type)) totals.invoices += 1;
      else if (OPS_TYPES.has(type)) totals.operations += 1;
    }
  }

  return totals;
}

function serviceMetric(
  serviceKey: HqServiceKey,
  peerIds: string[],
  sources: WorkforceActivitySource[],
  summary: WorkforceSummary
): string | null {
  const counts = countActivitiesForPeers(peerIds, sources);

  switch (serviceKey) {
    case "sales": {
      if (counts.leads > 0) {
        return counts.leads === 1 ? "1 lead qualified" : `${counts.leads} leads qualified`;
      }
      if (counts.meetings > 0) {
        return counts.meetings === 1 ? "1 meeting booked" : `${counts.meetings} meetings booked`;
      }
      return null;
    }
    case "marketing": {
      if (counts.marketing > 0) {
        return counts.marketing === 1
          ? "1 task completed"
          : `${counts.marketing} tasks completed`;
      }
      return summary.marketingTasksCompleted > 0
        ? `${summary.marketingTasksCompleted} tasks completed`
        : null;
    }
    case "finance": {
      if (counts.invoices > 0) {
        return counts.invoices === 1
          ? "1 invoice prepared"
          : `${counts.invoices} invoices prepared`;
      }
      return summary.invoicesPrepared > 0 ? `${summary.invoicesPrepared} invoices prepared` : null;
    }
    case "support": {
      if (counts.support > 0) {
        return counts.support === 1
          ? "1 conversation resolved"
          : `${counts.support} conversations resolved`;
      }
      return summary.supportTicketsResolved > 0
        ? `${summary.supportTicketsResolved} conversations resolved`
        : null;
    }
    case "operations": {
      if (counts.operations > 0) {
        return counts.operations === 1 ? "1 task completed" : `${counts.operations} tasks completed`;
      }
      return null;
    }
    default:
      return null;
  }
}

function selectServiceActivity(
  serviceKey: HqServiceKey,
  items: HomeTeamPulseItem[],
  needsYou: HomeNeedsYouItem[]
): string {
  const peerIds = new Set(items.map((item) => item.peerId));
  const serviceNeedsYou = needsYou.filter((item) => peerIds.has(item.peerId));

  if (serviceNeedsYou.length === 1) {
    const item = serviceNeedsYou[0]!;
    return truncate(item.subtitle || item.title);
  }

  if (serviceNeedsYou.length > 1) {
    return `${serviceNeedsYou.length} items need your approval`;
  }

  const attention = items.find(
    (item) => item.statusKind === "waiting" || item.statusKind === "blocked"
  );
  if (attention && !isGenericSetupDetail(attention.detail)) {
    return truncate(attention.detail);
  }

  const working = items.find((item) => item.statusKind === "working");
  if (working && !isGenericSetupDetail(working.detail)) {
    return truncate(working.detail);
  }

  const monitoring = items.find((item) =>
    item.statusLabel.toLowerCase().includes("monitor")
  );
  if (monitoring && !isGenericSetupDetail(monitoring.detail)) {
    return truncate(monitoring.detail);
  }

  return SERVICE_ACTIVITY_FALLBACK[serviceKey];
}

function colleagueLine(activePeerCount: number): string {
  return activePeerCount === 1
    ? "1 colleague active"
    : `${activePeerCount} colleagues active`;
}

function arcVariantForService(serviceKey: HqServiceKey, index: number, total: number): "high" | "low" {
  const byService = HQ_ARC_BY_SERVICE[serviceKey];
  if (total <= 4) return byService;
  return index % 2 === 0 ? "high" : "low";
}

export function groupTeamPulseByService(
  teamPulse: HomeTeamPulseItem[]
): Map<HqServiceKey, HomeTeamPulseItem[]> {
  const groups = new Map<HqServiceKey, HomeTeamPulseItem[]>();

  for (const item of dedupeTeamPulseByPeerId(teamPulse)) {
    const serviceKey = getHqServiceKey({ role: item.role, name: item.name });
    if (!serviceKey) continue;

    const existing = groups.get(serviceKey) ?? [];
    existing.push(item);
    groups.set(serviceKey, existing);
  }

  return groups;
}

export function buildHqServiceCards(input: {
  teamPulse: HomeTeamPulseItem[];
  activitySources: WorkforceActivitySource[];
  workforceSummary: WorkforceSummary;
  needsYou: HomeNeedsYouItem[];
}): HqServiceCard[] {
  const groups = groupTeamPulseByService(input.teamPulse);
  const orderedKeys = sortServiceKeys([...groups.keys()]);

  return orderedKeys.map((serviceKey, index) => {
    const items = groups.get(serviceKey) ?? [];
    const peerIds = items.map((item) => item.peerId);
    const activePeerCount = items.filter(isActivePeer).length;
    const peerCount = items.length;
    const statusKind = aggregateServiceStatus(items);
    const primary = pickPrimaryPeerItem(items);

    return {
      serviceKey,
      label: HQ_SERVICE_LABELS[serviceKey],
      href: primary.href,
      peerCount,
      activePeerCount,
      statusKind,
      statusLabel: STATUS_LABELS[statusKind],
      activity: selectServiceActivity(serviceKey, items, input.needsYou),
      colleagueLine: colleagueLine(activePeerCount),
      metric: serviceMetric(
        serviceKey,
        peerIds,
        input.activitySources,
        input.workforceSummary
      ),
      peerIds,
      arcVariant: arcVariantForService(serviceKey, index, orderedKeys.length),
    };
  });
}

export function countRecognizedColleagues(teamPulse: HomeTeamPulseItem[]): number {
  return dedupeTeamPulseByPeerId(teamPulse).filter((item) =>
    getHqServiceKey({ role: item.role, name: item.name })
  ).length;
}
