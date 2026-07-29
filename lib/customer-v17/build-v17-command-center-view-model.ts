import {
  buildCommandCenterViewModel,
  CC_FLAT_SPARKLINE,
  CC_MISSING_VALUE,
  type CcServicePerformance,
  type CommandCenterViewModel,
} from "@/lib/home/build-command-center-view-model";
import type { HandoffState } from "@/lib/home/handoff-types";
import type { HomePeerWorkspaceSnapshot, HomeTeamPulseItem, HomeViewModel } from "@/lib/home/types";
import type { WorkforceActivitySource } from "@/lib/home/workforce-summary-types";
import type { WorkforceSummary } from "@/lib/home/workforce-summary-types";
import type { HomeCopy } from "@/lib/i18n";
import { getV17CommandCenterCopy } from "@/lib/i18n/v17-command-center-copy";
import { dedupeTeamPulseByPeerId } from "@/lib/hq/hq-peers";
import { getHqServiceKey } from "@/lib/hq/hq-service-key";
import { buildV17CommandCenterAttention } from "./build-v17-cc-attention";
import { sanitizePulseDetail } from "./build-peer-work-briefing";
import { resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { sanitizeV17CustomerLine } from "./sanitize-v17-customer-text";
import { v17ServiceKeyFromPeer } from "@/lib/customer-v17/peer-accent";
import type { HqServiceKey } from "@/lib/hq/hq-service-key";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import type { PeerRow } from "@/lib/peer-display";
import {
  buildGroundedWeeklyMetrics,
  type GroundedMetric,
} from "./build-grounded-weekly-metrics";
import {
  canonicalCustomerPeerLabel,
  customerPeerRoleBucket,
  CUSTOMER_PEER_RAIL_ORDER,
  type CustomerPeerRoleBucket,
} from "./select-canonical-customer-peers";

export type { GroundedMetric };

/** Approved v17 section order (desktop). */
export const V17_COMMAND_CENTER_LAYOUT_SECTIONS = [
  "header",
  "working-now",
  "completed-today",
  "waiting-for-you",
  "peer-performance",
  "weekly-impact",
] as const;

export type V17WorkingNowRow = {
  id: string;
  peerId: string;
  peerLabel: string;
  description: string;
  statusLabel: string;
  href: string;
  serviceKey: HqServiceKey;
};

export type V17CompletedTodayRow = {
  id: string;
  peerLabel: string;
  summary: string;
  href: string;
  serviceKey: HqServiceKey;
};

export type V17AttentionItem = {
  id: string;
  title: string;
  context: string;
  readiness: string;
  reviewHref: string;
  approveHref: string | null;
  serviceKey: HqServiceKey;
  peerId: string;
};

export type V17PeerPerformanceCard = {
  id: string;
  peerId: string;
  label: string;
  serviceKey: HqServiceKey;
  tasksThisWeek: number;
  performancePct: number | null;
  sparkValues: number[];
  sparkMuted: boolean;
  resultsHref: string;
};

export type V17WeeklyImpact = {
  metrics: GroundedMetric[];
  showSection: boolean;
};

export type V17CommandCenterViewModel = {
  workingNow: V17WorkingNowRow[];
  completedToday: V17CompletedTodayRow[];
  attention: ReturnType<typeof buildV17CommandCenterAttention>;
  performance: V17PeerPerformanceCard[];
  weeklyImpact: V17WeeklyImpact;
  legacy: CommandCenterViewModel;
};

function isToday(iso: string, now = new Date()): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function activeProjectTitle(snapshot: HomePeerWorkspaceSnapshot | undefined): string | null {
  if (!snapshot) return null;
  const projects = snapshot.workspace.projects ?? [];
  return projects[0]?.title?.trim() ?? null;
}

function workingRowsFromPulse(
  pulse: HomeTeamPulseItem[],
  canonicalPeers: PeerRow[],
  snapshots: HomePeerWorkspaceSnapshot[],
  copy: ReturnType<typeof getV17CommandCenterCopy>,
  locale: MarketingCampaignLocale
): V17WorkingNowRow[] {
  const deduped = dedupeTeamPulseByPeerId(pulse);
  const rowsByPeerId = new Map<string, V17WorkingNowRow>();
  const localeTag = locale === "nl" ? "nl" : "en";

  for (const item of deduped) {
    if (item.statusKind !== "working" && item.statusKind !== "blocked") continue;
    const bucket = customerPeerRoleBucket(item.role);
    const peerLabel =
      bucket !== "Custom"
        ? canonicalCustomerPeerLabel(bucket, localeTag)
        : item.name;
    const description = sanitizePulseDetail(item.detail?.trim() || item.statusLabel, locale);
    const activity =
      description ||
      (locale === "nl" ? "werkzaamheden voorbereiden" : "preparing work");
    const serviceKey = v17ServiceKeyFromPeer({ role: item.role, name: item.name });
    rowsByPeerId.set(item.peerId, {
      id: `working-${item.peerId}`,
      peerId: item.peerId,
      peerLabel,
      description: activity,
      statusLabel: copy.statusActive,
      href: item.href || `/team/${item.peerId}`,
      serviceKey,
    });
  }

  for (const peer of canonicalPeers) {
    if (rowsByPeerId.has(peer.id)) continue;
    const pulseItem = deduped.find((p) => p.peerId === peer.id);
    if (pulseItem?.statusKind === "paused") continue;
    const snapshot = snapshots.find((s) => s.peer.id === peer.id);
    const bucket = customerPeerRoleBucket(peer.role);
    if (bucket === "Custom") continue;
    const peerLabel = canonicalCustomerPeerLabel(bucket, localeTag);
    const projectName = activeProjectTitle(snapshot);
    let description: string | null = null;
    if (pulseItem?.detail?.trim()) {
      description = sanitizePulseDetail(pulseItem.detail, locale);
    } else if (projectName) {
      description =
        locale === "nl"
          ? `${projectName} — voorbereiden`
          : `${projectName} — preparing`;
    } else if (pulseItem?.statusKind === "working" || pulseItem?.statusKind === "blocked") {
      description = locale === "nl" ? "actieve werkzaamheden" : "active work";
    }
    if (!description) continue;
    rowsByPeerId.set(peer.id, {
      id: `working-${peer.id}`,
      peerId: peer.id,
      peerLabel,
      description,
      statusLabel: copy.statusActive,
      href: pulseItem?.href ?? `/team/${peer.id}`,
      serviceKey: v17ServiceKeyFromPeer({ role: peer.role, name: peer.name }),
    });
  }

  const order = new Map(CUSTOMER_PEER_RAIL_ORDER.map((r, i) => [r, i]));
  return [...rowsByPeerId.values()].sort((a, b) => {
    const bucketA = customerPeerRoleBucket(
      canonicalPeers.find((p) => p.id === a.peerId)?.role ?? a.peerLabel
    );
    const bucketB = customerPeerRoleBucket(
      canonicalPeers.find((p) => p.id === b.peerId)?.role ?? b.peerLabel
    );
    const ia = bucketA !== "Custom" ? order.get(bucketA) ?? 99 : 99;
    const ib = bucketB !== "Custom" ? order.get(bucketB) ?? 99 : 99;
    return ia - ib;
  });
}

function completedFallbackFromSummary(
  summary: WorkforceSummary,
  canonicalPeers: PeerRow[],
  locale: MarketingCampaignLocale
): V17CompletedTodayRow[] {
  const localeTag = locale === "nl" ? "nl" : "en";
  const rows: V17CompletedTodayRow[] = [];

  const push = (
    bucket: CustomerPeerRoleBucket,
    count: number,
    nlText: string,
    enText: string
  ) => {
    if (count <= 0) return;
    const peer = canonicalPeers.find((p) => customerPeerRoleBucket(p.role) === bucket);
    rows.push({
      id: `completed-fallback-${bucket}`,
      peerLabel: canonicalCustomerPeerLabel(bucket, localeTag),
      summary: locale === "nl" ? nlText : enText,
      href: peer ? `/team/${peer.id}` : "/home",
      serviceKey: v17ServiceKeyFromPeer({ role: bucket, name: bucket }),
    });
  };

  push(
    "Marketing",
    summary.marketingTasksCompleted,
    `${summary.marketingTasksCompleted} marketingtaken afgerond`,
    `${summary.marketingTasksCompleted} marketing tasks completed`
  );
  const salesCount = summary.leadsGenerated + summary.meetingsBooked;
  push(
    "Sales",
    salesCount,
    `${salesCount} salesacties afgerond`,
    `${salesCount} sales actions completed`
  );
  push(
    "Support",
    summary.supportTicketsResolved,
    `${summary.supportTicketsResolved} supporttickets afgehandeld`,
    `${summary.supportTicketsResolved} support tickets resolved`
  );
  push(
    "Planning",
    summary.completedTasks,
    "planning bijgewerkt",
    "planning updated"
  );

  return rows;
}

function aggregateCompletedToday(
  viewModel: HomeViewModel | null,
  legacy: CommandCenterViewModel,
  locale: MarketingCampaignLocale,
  canonicalPeers: PeerRow[]
): V17CompletedTodayRow[] {
  const movement =
    viewModel && viewModel.awayMovement.length > 0
      ? viewModel.awayMovement
      : (viewModel?.recentMovement ?? []);
  const todayItems = movement.filter((m) => isToday(m.timestamp));
  const byPeer = new Map<string, { peerName: string; texts: string[]; href: string }>();

  for (const item of todayItems) {
    const key = item.peerName;
    const existing = byPeer.get(key);
    const text = sanitizeV17CustomerLine(item.title?.trim() || item.description?.trim() || "", locale);
    if (!text) continue;
    if (existing) {
      if (!existing.texts.includes(text)) existing.texts.push(text);
    } else {
      byPeer.set(key, { peerName: item.peerName, texts: [text], href: item.href });
    }
  }

  if (byPeer.size === 0) {
    for (const activity of legacy.activity) {
      if (!isToday(activity.timestamp)) continue;
      const key = activity.agentLabel;
      const existing = byPeer.get(key);
      const text = sanitizeV17CustomerLine(activity.text?.trim() || "", locale);
      if (!text) continue;
      if (existing) {
        if (!existing.texts.includes(text)) existing.texts.push(text);
      } else {
        byPeer.set(key, { peerName: activity.agentLabel, texts: [text], href: activity.href });
      }
    }
  }

  const mapped = [...byPeer.entries()].map(([peerName, group], index) => {
    const pulse = viewModel?.teamPulse.find((p) => p.name === peerName);
    const summary =
      group.texts.length <= 2
        ? group.texts.join(" · ")
        : `${group.texts.slice(0, 2).join(" · ")} +${group.texts.length - 2}`;
    return {
      id: `completed-${peerName}-${index}`,
      peerLabel: peerName,
      summary,
      href: pulse?.href ?? group.href ?? `/team`,
      serviceKey: v17ServiceKeyFromPeer({ role: pulse?.role, name: peerName }),
    };
  });

  if (mapped.length > 0) return mapped;

  const summary = viewModel?.workforceSummary;
  if (summary) {
    return completedFallbackFromSummary(summary, canonicalPeers, locale);
  }

  return mapped;
}

function mapPerformanceCards(
  services: CcServicePerformance[],
  canonicalPeers: PeerRow[],
  locale: MarketingCampaignLocale
): V17PeerPerformanceCard[] {
  const localeTag = locale === "nl" ? "nl" : "en";
  const seen = new Set<HqServiceKey>();
  const cards: V17PeerPerformanceCard[] = [];

  for (const service of services) {
    if (seen.has(service.serviceKey)) continue;
    seen.add(service.serviceKey);
    const peerId = service.peerIds[0] ?? service.serviceKey;
    const canonical = canonicalPeers.find((p) => p.id === peerId);
    const bucket = canonical ? customerPeerRoleBucket(canonical.role) : null;
    const label =
      bucket && bucket !== "Custom"
        ? canonicalCustomerPeerLabel(bucket, localeTag)
        : service.label;
    const hasTasks = service.tasksThisWeek > 0;
    const performancePct =
      hasTasks && service.peerCount > 0 ? service.performancePct : null;
    cards.push({
      id: `perf-${service.serviceKey}`,
      peerId,
      label,
      serviceKey: service.serviceKey,
      tasksThisWeek: service.tasksThisWeek,
      performancePct,
      sparkValues: service.sparkValues.length ? service.sparkValues : [...CC_FLAT_SPARKLINE.slice(0, 8)],
      sparkMuted: service.sparkMuted,
      resultsHref: `/team/${peerId}/results`,
    });
  }

  return cards.slice(0, 3);
}

export function buildV17CommandCenterViewModel(input: {
  viewModel: HomeViewModel | null;
  handoff: HandoffState;
  copy: HomeCopy;
  activitySources: WorkforceActivitySource[];
  formatRelativeTime: (iso: string) => string;
  localePreference?: string | null;
  canonicalPeers?: PeerRow[];
  marketingSnapshots?: HomePeerWorkspaceSnapshot[];
}): V17CommandCenterViewModel {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const v17Copy = getV17CommandCenterCopy(input.localePreference);
  const peerCopy = getV17PeerCopy(input.localePreference);
  const legacy = buildCommandCenterViewModel(input);
  const canonicalPeers = input.canonicalPeers ?? [];
  const snapshots = input.marketingSnapshots ?? [];

  const pulse = input.viewModel?.teamPulse ?? [];
  const workingNow = workingRowsFromPulse(pulse, canonicalPeers, snapshots, v17Copy, locale);
  const completedToday = aggregateCompletedToday(
    input.viewModel,
    legacy,
    locale,
    canonicalPeers
  );

  const needsYou = input.viewModel?.needsYou ?? [];
  const attention = buildV17CommandCenterAttention({
    items: needsYou,
    locale,
    reviewCta: peerCopy.reviewCta,
    viewCta: peerCopy.viewCta,
    approveCta: peerCopy.approveCta,
    serviceKeyFor: (item) =>
      getHqServiceKey({
        role: input.viewModel?.teamPulse.find((p) => p.peerId === item.peerId)?.role ?? item.peerName,
        name: item.peerName,
      }) ?? "operations",
  });

  const performance = mapPerformanceCards(legacy.services, canonicalPeers, locale);

  const pendingApprovals = legacy.approvals.pendingCount;
  const primaryMarketingPeerId =
    canonicalPeers.find((p) => customerPeerRoleBucket(p.role) === "Marketing")?.id ??
    canonicalPeers[0]?.id;

  const grounded = buildGroundedWeeklyMetrics({
    viewModel: input.viewModel,
    marketingSnapshots: snapshots,
    pendingApprovals,
    locale,
    primaryMarketingPeerId,
  });

  const weeklyImpact: V17WeeklyImpact = {
    metrics: grounded.metrics,
    showSection: grounded.showSection,
  };

  return {
    workingNow,
    completedToday,
    attention,
    performance,
    weeklyImpact,
    legacy,
  };
}

export function v17PerformanceCardHref(card: V17PeerPerformanceCard): string {
  return card.resultsHref;
}
