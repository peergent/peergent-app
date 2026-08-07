import {
  buildCommandCenterViewModel,
  CC_ACTIVITY_VISIBLE_LIMIT,
  sortActivityNewestFirst,
} from "@/lib/home/build-command-center-view-model";
import type { HandoffState } from "@/lib/home/handoff-types";
import type {
  HomeMovementItem,
  HomePeerWorkspaceSnapshot,
  HomeTeamPulseItem,
  HomeViewModel,
} from "@/lib/home/types";
import type { WorkforceActivitySource } from "@/lib/home/workforce-summary-types";
import type { WorkforceSummary } from "@/lib/home/workforce-summary-types";
import { buildGroundedWeeklyMetrics } from "@/lib/customer-v17/build-grounded-weekly-metrics";
import {
  canonicalCustomerPeerLabel,
  customerPeerRoleBucket,
  CUSTOMER_PEER_RAIL_ORDER,
} from "@/lib/customer-v17/select-canonical-customer-peers";
import { v17AccentForServiceKey, v17ServiceKeyFromPeer } from "@/lib/customer-v17/peer-accent";
import { sanitizeV17CustomerLine } from "@/lib/customer-v17/sanitize-v17-customer-text";
import type { HqServiceKey } from "@/lib/hq/hq-service-key";
import type { HomeCopy } from "@/lib/i18n";
import { resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import type { PeerRow } from "@/lib/peer-display";
import { dedupeTeamPulseByPeerId } from "@/lib/hq/hq-peers";

export const CC_HOME_KPI_MAX = 4;
export const CC_HOME_ATTENTION_MAX = 3;
export const CC_HOME_ACTIVITY_MAX = CC_ACTIVITY_VISIBLE_LIMIT;
export const CC_HOME_CHART_MAX = 1;

export type CommandCenterKpiItem = {
  id: string;
  label: string;
  value: string;
  methodology?: string | null;
  href?: string | null;
  hero: boolean;
  dataSource: "workforce-summary" | "campaign-signals" | "inbox" | "demo";
  liveCapable: boolean;
};

export type CommandCenterAttentionItem = {
  id: string;
  title: string;
  unblocks: string;
  primaryLabel: string;
  href: string;
  ageLabel?: string | null;
  peerId: string;
};

export type CommandCenterRecommendation = {
  peerLabel: string;
  recommendation: string;
  impact?: string | null;
  primaryLabel: string;
  href: string;
  accentVar: string;
  impactMetrics?: readonly { id: string; label: string }[];
};

export type CommandCenterBriefingBullet = {
  id: string;
  text: string;
  accentVar: string;
};

export type CommandCenterPeerBrief = {
  id: string;
  role: string;
  line: string;
  accentVar: string;
};

export type CommandCenterWorkforceBriefing = {
  intro: string;
  accomplishments: CommandCenterBriefingBullet[];
  peerBriefs: CommandCenterPeerBrief[];
  viewAllLabel: string;
  viewAllHref: string;
};

export type CommandCenterPulseItem = {
  id: string;
  name: string;
  role: string;
  statusLine: string;
  tone: "working" | "waiting" | "live" | "idle";
  accentVar: string;
};

export type CommandCenterChartBand = {
  title: string;
  promise: string;
  insight: string;
  points: readonly { at: string; value: number }[];
  label: string;
  metricValue: string;
  metricDelta: string | null;
  metricDeltaPositive: boolean;
  dataSource: "activity-feed" | "workforce-summary" | "demo";
  liveCapable: boolean;
};

export type CommandCenterActivityItem = {
  id: string;
  title: string;
  description?: string | null;
  timeLabel: string;
  datetime: string;
  href: string;
  accentVar: string;
};

export type CommandCenterBands = {
  header: {
    greeting: string;
    supporting: string;
  };
  kpis: CommandCenterKpiItem[];
  attention: CommandCenterAttentionItem[];
  attentionViewAllHref: string;
  recommendation: CommandCenterRecommendation | null;
  workforceBriefing: CommandCenterWorkforceBriefing | null;
  showAutomationChip: boolean;
  chart: CommandCenterChartBand | null;
  activity: CommandCenterActivityItem[];
  activityLabel: string;
};

const WORKFLOW_TERMS =
  /\b(workflow|brain|capability|retry|step id|orchestrat|pipeline|agent runtime)\b/i;

function totalTasksCompleted(summary: WorkforceSummary): number {
  return (
    summary.completedTasks +
    summary.marketingTasksCompleted +
    summary.supportTicketsResolved
  );
}

function formatHours(hours: number): string {
  return `${hours}h`;
}

function formatRevenue(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function chartDeltaFromPoints(
  points: readonly { at: string; value: number }[]
): { delta: string | null; positive: boolean } {
  if (points.length < 4) return { delta: null, positive: true };
  const mid = Math.floor(points.length / 2);
  const firstHalf = points.slice(0, mid).reduce((sum, point) => sum + point.value, 0);
  const secondHalf = points.slice(mid).reduce((sum, point) => sum + point.value, 0);
  if (firstHalf === 0) return { delta: null, positive: secondHalf >= 0 };
  const pct = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  return {
    delta: `${pct >= 0 ? "+" : ""}${pct}%`,
    positive: pct >= 0,
  };
}

function buildWorkforceBriefing(input: {
  summary: WorkforceSummary | undefined;
  teamPulse: HomeTeamPulseItem[];
  locale: ReturnType<typeof resolveMarketingCampaignLocale>;
  viewAllHref: string;
  isDemo: boolean;
}): CommandCenterWorkforceBriefing | null {
  const nl = input.locale === "nl";

  if (input.isDemo) {
    return {
      intro: nl
        ? "Terwijl jij weg was heeft jouw workforce afgerond:"
        : "While you were away your workforce completed:",
      accomplishments: [
        {
          id: "campaigns",
          text: nl ? "18 campagnes gegenereerd" : "18 campaigns generated",
          accentVar: v17AccentForServiceKey("marketing"),
        },
        {
          id: "leads",
          text: nl ? "28 gekwalificeerde leads" : "28 qualified leads",
          accentVar: v17AccentForServiceKey("sales"),
        },
        {
          id: "meetings",
          text: nl ? "6 afspraken ingepland" : "6 appointments scheduled",
          accentVar: v17AccentForServiceKey("operations"),
        },
        {
          id: "support",
          text: nl ? "42 klantvragen opgelost" : "42 customer questions resolved",
          accentVar: v17AccentForServiceKey("support"),
        },
        {
          id: "revenue",
          text: nl ? "€12.430 omzet beïnvloed" : "€12,430 revenue influenced",
          accentVar: v17AccentForServiceKey("marketing"),
        },
      ],
      peerBriefs: [
        {
          id: "marketing",
          role: nl ? "Marketing" : "Marketing",
          line: nl
            ? "LinkedIn-campagne presteert boven verwachting."
            : "LinkedIn campaign is outperforming expectations.",
          accentVar: v17AccentForServiceKey("marketing"),
        },
        {
          id: "sales",
          role: nl ? "Sales" : "Sales",
          line: nl ? "8 gekwalificeerde leads wachten." : "8 qualified leads are waiting.",
          accentVar: v17AccentForServiceKey("sales"),
        },
        {
          id: "support",
          role: nl ? "Support" : "Support",
          line: nl ? "Inbox geleegd." : "Inbox cleared.",
          accentVar: v17AccentForServiceKey("support"),
        },
        {
          id: "planner",
          role: nl ? "Planner" : "Planner",
          line: nl ? "Afspraken bevestigd." : "Appointments confirmed.",
          accentVar: v17AccentForServiceKey("operations"),
        },
      ],
      viewAllLabel: nl ? "Bekijk volledige briefing" : "View full briefing",
      viewAllHref: input.viewAllHref,
    };
  }

  const summary = input.summary;
  const accomplishments: CommandCenterBriefingBullet[] = [];

  if (summary) {
    if (summary.marketingTasksCompleted > 0) {
      accomplishments.push({
        id: "marketing-tasks",
        text: nl
          ? `${summary.marketingTasksCompleted} marketingtaken afgerond`
          : `completed ${summary.marketingTasksCompleted} marketing tasks`,
        accentVar: v17AccentForServiceKey("marketing"),
      });
    }
    if (summary.conversationsHandled > 0) {
      accomplishments.push({
        id: "conversations",
        text: nl
          ? `${summary.conversationsHandled} gesprekken afgehandeld`
          : `handled ${summary.conversationsHandled} conversations`,
        accentVar: v17AccentForServiceKey("support"),
      });
    }
    if (summary.meetingsBooked > 0) {
      accomplishments.push({
        id: "meetings",
        text: nl
          ? `${summary.meetingsBooked} afspraken ingepland`
          : `booked ${summary.meetingsBooked} meetings`,
        accentVar: v17AccentForServiceKey("operations"),
      });
    }
    if (summary.supportTicketsResolved > 0) {
      accomplishments.push({
        id: "support",
        text: nl
          ? `${summary.supportTicketsResolved} supportverzoeken opgelost`
          : `resolved ${summary.supportTicketsResolved} support requests`,
        accentVar: v17AccentForServiceKey("support"),
      });
    }
    if (summary.leadsGenerated > 0) {
      accomplishments.push({
        id: "leads",
        text: nl
          ? `${summary.leadsGenerated} leads gegenereerd`
          : `generated ${summary.leadsGenerated} leads`,
        accentVar: v17AccentForServiceKey("sales"),
      });
    }
    if (summary.estimatedBusinessValue != null && summary.estimatedBusinessValue > 0) {
      accomplishments.push({
        id: "revenue",
        text: nl
          ? `${formatRevenue(summary.estimatedBusinessValue)} omzet beïnvloed`
          : `influenced ${formatRevenue(summary.estimatedBusinessValue)} revenue`,
        accentVar: v17AccentForServiceKey("marketing"),
      });
    }
  }

  const peerBriefs = buildWorkforcePulse(input.teamPulse, input.locale).map((peer) => ({
    id: peer.id,
    role: peer.role,
    line: peer.statusLine,
    accentVar: peer.accentVar,
  }));

  if (accomplishments.length === 0 && peerBriefs.length === 0) return null;

  return {
    intro: nl
      ? "Terwijl jij weg was heeft jouw workforce afgerond:"
      : "While you were away your workforce completed:",
    accomplishments,
    peerBriefs,
    viewAllLabel: nl ? "Bekijk volledige briefing" : "View full briefing",
    viewAllHref: input.viewAllHref,
  };
}

function buildDemoKpis(nl: boolean): CommandCenterKpiItem[] {
  return [
    {
      id: "demo-revenue",
      label: nl ? "Beïnvloede omzet" : "Revenue influenced",
      value: "€12.430",
      methodology: nl ? "+17% vs vorige 7 dagen" : "+17% vs last 7 days",
      hero: true,
      dataSource: "demo",
      liveCapable: false,
    },
    {
      id: "demo-hours",
      label: nl ? "Tijd bespaard" : "Time saved",
      value: "34u",
      methodology: nl ? "+21% vs vorige 7 dagen" : "+21% vs last 7 days",
      hero: false,
      dataSource: "demo",
      liveCapable: false,
    },
    {
      id: "demo-campaigns",
      label: nl ? "Campagnes actief" : "Campaigns running",
      value: "6",
      methodology: nl ? "+2 vs vorige 7 dagen" : "+2 vs last 7 days",
      hero: false,
      dataSource: "demo",
      liveCapable: false,
    },
    {
      id: "demo-leads",
      label: nl ? "Gekwalificeerde leads" : "Qualified leads",
      value: "28",
      methodology: nl ? "+12% vs vorige 7 dagen" : "+12% vs last 7 days",
      hero: false,
      dataSource: "demo",
      liveCapable: false,
    },
  ];
}

function buildLiveKpis(input: {
  viewModel: HomeViewModel | null;
  marketingSnapshots: HomePeerWorkspaceSnapshot[];
  pendingApprovals: number;
  locale: ReturnType<typeof resolveMarketingCampaignLocale>;
  primaryMarketingPeerId?: string;
}): CommandCenterKpiItem[] {
  const nl = input.locale === "nl";
  const summary = input.viewModel?.workforceSummary;
  const grounded = buildGroundedWeeklyMetrics({
    viewModel: input.viewModel,
    marketingSnapshots: input.marketingSnapshots,
    pendingApprovals: input.pendingApprovals,
    locale: input.locale,
    primaryMarketingPeerId: input.primaryMarketingPeerId,
  });

  const items: CommandCenterKpiItem[] = [];
  const seen = new Set<string>();

  const push = (item: CommandCenterKpiItem) => {
    if (items.length >= CC_HOME_KPI_MAX || seen.has(item.id)) return;
    seen.add(item.id);
    items.push(item);
  };

  if (summary && summary.estimatedBusinessValue != null && summary.estimatedBusinessValue > 0) {
    push({
      id: "revenue-influenced",
      label: nl ? "Beïnvloede omzet" : "Revenue influenced",
      value: formatRevenue(summary.estimatedBusinessValue),
      methodology: nl ? "geschat · workforce activiteit" : "estimated · workforce activity",
      hero: true,
      dataSource: "workforce-summary",
      liveCapable: true,
    });
  }

  if (summary && summary.estimatedWorkingHoursSaved != null && summary.estimatedWorkingHoursSaved > 0) {
    push({
      id: "time-saved",
      label: nl ? "Tijd bespaard" : "Time saved",
      value: formatHours(summary.estimatedWorkingHoursSaved),
      methodology: nl ? "deze periode" : "this period",
      hero: items.length === 0,
      dataSource: "workforce-summary",
      liveCapable: true,
    });
  }

  if (summary) {
    const tasks = totalTasksCompleted(summary);
    if (tasks > 0) {
      push({
        id: "tasks-completed",
        label: nl ? "Taken afgerond" : "Tasks completed",
        value: String(tasks),
        methodology: nl ? "deze periode" : "this period",
        hero: items.length === 0,
        dataSource: "workforce-summary",
        liveCapable: true,
      });
    }
  }

  for (const metric of grounded.metrics) {
    if (items.length >= CC_HOME_KPI_MAX) break;
    push({
      id: metric.id,
      label: metric.label,
      value: String(metric.value),
      methodology:
        metric.confidence === "estimated"
          ? nl
            ? "geschat"
            : "estimated"
          : undefined,
      href: metric.href,
      hero: items.length === 0,
      dataSource: metric.id.includes("campaign") ? "campaign-signals" : "workforce-summary",
      liveCapable: true,
    });
  }

  if (input.pendingApprovals > 0 && items.length < CC_HOME_KPI_MAX) {
    push({
      id: "pending-approvals",
      label: nl ? "Open beslissingen" : "Decisions pending",
      value: String(input.pendingApprovals),
      href: "/inbox",
      hero: items.length === 0,
      dataSource: "inbox",
      liveCapable: true,
    });
  }

  if (items.length > 0 && !items.some((item) => item.hero)) {
    items[0]!.hero = true;
  }

  return items;
}

function buildAttentionItems(
  viewModel: HomeViewModel | null,
  copy: HomeCopy,
  formatRelativeTime: (iso: string) => string,
  locale: ReturnType<typeof resolveMarketingCampaignLocale>
): CommandCenterAttentionItem[] {
  const nl = locale === "nl";
  const needsYou = viewModel?.needsYou ?? [];

  return needsYou.slice(0, CC_HOME_ATTENTION_MAX).map((item) => {
    const title =
      item.subtitle && item.subtitle !== item.peerName ? item.subtitle : item.title;
    const unblocks =
      item.context?.trim() ||
      (nl
        ? `${item.peerName} wacht op jouw beslissing.`
        : `${item.peerName} is waiting for your decision.`);

    return {
      id: item.id,
      title: sanitizeV17CustomerLine(title, locale),
      unblocks: sanitizeV17CustomerLine(unblocks, locale),
      primaryLabel: item.title.includes(copy.needsYouItems.reviewDraft)
        ? copy.needsYouItems.reviewDraft
        : nl
          ? "Bekijk"
          : "Review",
      href: item.href,
      ageLabel: item.timestamp ? formatRelativeTime(item.timestamp) : null,
      peerId: item.peerId,
    };
  });
}

function buildRecommendation(input: {
  viewModel: HomeViewModel | null;
  locale: ReturnType<typeof resolveMarketingCampaignLocale>;
  marketingSnapshots: HomePeerWorkspaceSnapshot[];
}): CommandCenterRecommendation | null {
  const { viewModel, locale, marketingSnapshots } = input;
  if (!viewModel || viewModel.needsYou.length > 0) return null;

  const nl = locale === "nl";
  const marketingPeer = marketingSnapshots[0]?.peer;
  const peerLabel = marketingPeer
    ? `${marketingPeer.name} · ${marketingPeer.role}`
    : nl
      ? "Marketing"
      : "Marketing";

  const accentVar = v17AccentForServiceKey("marketing");

  if (
    viewModel.contextHealth.available &&
    viewModel.contextHealth.gapLabel &&
    viewModel.contextHealth.improveHref
  ) {
    return {
      peerLabel,
      recommendation: viewModel.contextHealth.gapLabel,
      impact: nl
        ? "Betere context helpt je team sneller en gerichter te werken."
        : "Better context helps your team work faster and more precisely.",
      primaryLabel: nl ? "Context verbeteren" : "Improve context",
      href: viewModel.contextHealth.improveHref,
      accentVar,
    };
  }

  const suggested = viewModel.suggestedStart;
  if (!suggested || suggested.href === "/team") return null;
  if (/open workspace|view team|bekijk team/i.test(suggested.ctaLabel)) return null;

  return {
    peerLabel,
    recommendation: suggested.headline,
    impact: suggested.detail,
    primaryLabel: suggested.ctaLabel,
    href: suggested.href,
    accentVar,
  };
}

function pulseTone(item: HomeTeamPulseItem): CommandCenterPulseItem["tone"] {
  switch (item.statusKind) {
    case "working":
      return "working";
    case "waiting":
    case "blocked":
      return "waiting";
    case "idle":
    case "paused":
    default:
      return "idle";
  }
}

function buildWorkforcePulse(
  teamPulse: HomeTeamPulseItem[],
  locale: ReturnType<typeof resolveMarketingCampaignLocale>
): CommandCenterPulseItem[] {
  const nl = locale === "nl";
  const localeTag = nl ? "nl" : "en";
  const deduped = dedupeTeamPulseByPeerId(teamPulse);

  const order = new Map(CUSTOMER_PEER_RAIL_ORDER.map((role, index) => [role, index]));

  return [...deduped]
    .sort((a, b) => {
      const bucketA = customerPeerRoleBucket(a.role);
      const bucketB = customerPeerRoleBucket(b.role);
      const ia = bucketA !== "Custom" ? order.get(bucketA) ?? 99 : 99;
      const ib = bucketB !== "Custom" ? order.get(bucketB) ?? 99 : 99;
      return ia - ib;
    })
    .slice(0, 5)
    .map((item) => {
      const bucket = customerPeerRoleBucket(item.role);
      const name =
        bucket !== "Custom"
          ? canonicalCustomerPeerLabel(bucket, localeTag)
          : item.name;
      const serviceKey = v17ServiceKeyFromPeer({ role: item.role, name: item.name });
      const statusLine = sanitizeV17CustomerLine(
        item.detail?.trim() || item.statusLabel,
        locale
      );

      return {
        id: item.peerId,
        name,
        role: bucket !== "Custom" ? bucket : item.role,
        statusLine,
        tone: pulseTone(item),
        accentVar: v17AccentForServiceKey(serviceKey),
      };
    });
}

function buildChartFromActivity(
  movement: HomeMovementItem[],
  locale: ReturnType<typeof resolveMarketingCampaignLocale>
): CommandCenterChartBand | null {
  if (movement.length < 2) return null;

  const nl = locale === "nl";
  const now = new Date();
  const dayKeys: string[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    dayKeys.push(day.toISOString().slice(0, 10));
  }

  const counts = new Map<string, number>(dayKeys.map((key) => [key, 0]));

  for (const item of movement) {
    const key = item.timestamp.slice(0, 10);
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points = dayKeys.map((at) => ({ at, value: counts.get(at) ?? 0 }));
  const nonZeroDays = points.filter((point) => point.value > 0).length;
  const total = points.reduce((sum, point) => sum + point.value, 0);

  if (total < 2 || nonZeroDays < 2) return null;

  const firstHalf = points.slice(0, 4).reduce((sum, point) => sum + point.value, 0);
  const secondHalf = points.slice(3).reduce((sum, point) => sum + point.value, 0);
  const insight =
    secondHalf > firstHalf
      ? nl
        ? "Activiteit neemt toe — je team versnelt."
        : "Activity is picking up — your team is accelerating."
      : secondHalf < firstHalf
        ? nl
          ? "Rustigere dagen — normaal tussen piekmomenten."
          : "Quieter days — normal between peak moments."
        : nl
          ? "Stabiel tempo deze week."
          : "Steady pace this week.";

  const { delta, positive } = chartDeltaFromPoints(points);

  return {
    title: nl ? "Werk afgerond" : "Work completed",
    promise: nl ? "Laatste 7 dagen" : "Last 7 days",
    insight,
    points,
    label: nl ? "Activiteiten per dag" : "Activities per day",
    metricValue: String(total),
    metricDelta: delta,
    metricDeltaPositive: positive,
    dataSource: "activity-feed",
    liveCapable: true,
  };
}

function buildActivityItems(input: {
  viewModel: HomeViewModel | null;
  legacyActivity: ReturnType<typeof buildCommandCenterViewModel>["activity"];
  formatRelativeTime: (iso: string) => string;
  locale: ReturnType<typeof resolveMarketingCampaignLocale>;
}): CommandCenterActivityItem[] {
  const movementSource =
    input.viewModel && input.viewModel.recentMovement.length > 0
      ? sortActivityNewestFirst(input.viewModel.recentMovement)
      : [];

  const fromMovement = movementSource.slice(0, CC_HOME_ACTIVITY_MAX).map((item) => {
    const serviceKey = v17ServiceKeyFromPeer({ role: item.peerName, name: item.peerName });
    const title = sanitizeV17CustomerLine(item.title, input.locale);
    const description = sanitizeV17CustomerLine(item.description, input.locale);

    return {
      id: item.id,
      title: `${item.peerName} — ${title}`,
      description: description && description !== title ? description : null,
      timeLabel: input.formatRelativeTime(item.timestamp),
      datetime: item.timestamp,
      href: item.href,
      accentVar: v17AccentForServiceKey(serviceKey),
    };
  });

  if (fromMovement.length > 0) return fromMovement;

  return input.legacyActivity.slice(0, CC_HOME_ACTIVITY_MAX).map((item) => ({
    id: item.id,
    title: `${item.agentLabel} — ${sanitizeV17CustomerLine(item.text, input.locale)}`,
    description: null,
    timeLabel: item.timeLabel,
    datetime: item.timestamp,
    href: item.href,
    accentVar: v17AccentForServiceKey(item.serviceKey as HqServiceKey),
  }));
}

function buildDemoChart(nl: boolean): CommandCenterChartBand {
  const points = [
    { at: nl ? "1 aug" : "Aug 1", value: 8200 },
    { at: nl ? "2 aug" : "Aug 2", value: 9100 },
    { at: nl ? "3 aug" : "Aug 3", value: 9800 },
    { at: nl ? "4 aug" : "Aug 4", value: 10200 },
    { at: nl ? "5 aug" : "Aug 5", value: 10800 },
    { at: nl ? "6 aug" : "Aug 6", value: 11500 },
    { at: nl ? "7 aug" : "Aug 7", value: 12430 },
  ];
  const { delta, positive } = chartDeltaFromPoints(points);

  return {
    title: nl ? "Beïnvloede omzet" : "Revenue influenced",
    promise: nl ? "Laatste 7 dagen" : "Last 7 days",
    insight: nl
      ? "Sterke groei in campagnes en leadgeneratie heeft je omzet een boost gegeven."
      : "Strong campaign and lead generation growth gave your revenue a boost.",
    points,
    label: nl ? "Omzet" : "Revenue",
    metricValue: "€12.430",
    metricDelta: delta ?? "+17%",
    metricDeltaPositive: positive,
    dataSource: "demo",
    liveCapable: false,
  };
}

function buildDemoActivity(nl: boolean): CommandCenterActivityItem[] {
  return [
    {
      id: "demo-a1",
      title: nl ? "Emma — Nieuwe LinkedIn campagne gepubliceerd" : "Emma — New LinkedIn campaign published",
      description: nl ? "Zomeractie" : "Summer campaign",
      timeLabel: nl ? "3 min geleden" : "3 min ago",
      datetime: new Date().toISOString(),
      href: "/inbox",
      accentVar: v17AccentForServiceKey("marketing"),
    },
    {
      id: "demo-a2",
      title: nl ? "Sales — Lead gekwalificeerd" : "Sales — Lead qualified",
      timeLabel: nl ? "8 min geleden" : "8 min ago",
      datetime: new Date().toISOString(),
      href: "/inbox",
      accentVar: v17AccentForServiceKey("sales"),
    },
    {
      id: "demo-a3",
      title: nl ? "Support — 3 klantvragen opgelost" : "Support — 3 customer questions resolved",
      timeLabel: nl ? "14 min geleden" : "14 min ago",
      datetime: new Date().toISOString(),
      href: "/inbox",
      accentVar: v17AccentForServiceKey("support"),
    },
    {
      id: "demo-a4",
      title: nl ? "Planner — 2 afspraken bevestigd" : "Planner — 2 appointments confirmed",
      timeLabel: nl ? "22 min geleden" : "22 min ago",
      datetime: new Date().toISOString(),
      href: "/inbox",
      accentVar: v17AccentForServiceKey("operations"),
    },
    {
      id: "demo-a5",
      title: nl ? "Finance — Factuur verstuurd" : "Finance — Invoice sent",
      timeLabel: nl ? "31 min geleden" : "31 min ago",
      datetime: new Date().toISOString(),
      href: "/inbox",
      accentVar: v17AccentForServiceKey("finance"),
    },
    {
      id: "demo-a6",
      title: nl ? "Analytics — Rapport gegenereerd" : "Analytics — Report generated",
      timeLabel: nl ? "45 min geleden" : "45 min ago",
      datetime: new Date().toISOString(),
      href: "/inbox",
      accentVar: "var(--pg-v13-purple-accent, #7c3aed)",
    },
  ];
}

export function buildCommandCenterBands(input: {
  viewModel: HomeViewModel | null;
  handoff: HandoffState;
  copy: HomeCopy;
  activitySources: WorkforceActivitySource[];
  formatRelativeTime: (iso: string) => string;
  localePreference?: string | null;
  canonicalPeers?: PeerRow[];
  marketingSnapshots?: HomePeerWorkspaceSnapshot[];
  isDemo?: boolean;
}): CommandCenterBands {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const nl = locale === "nl";
  const legacy = buildCommandCenterViewModel(input);
  const viewModel = input.viewModel;
  const marketingSnapshots = input.marketingSnapshots ?? [];
  const primaryMarketingPeerId =
    input.canonicalPeers?.find((peer) => customerPeerRoleBucket(peer.role) === "Marketing")
      ?.id ?? input.canonicalPeers?.[0]?.id;

  const greeting =
    viewModel?.narrative.greeting ??
    input.handoff.personalGreeting ??
    input.copy.narratives.welcome;

  const supporting = nl
    ? "Terwijl jij weg was heeft jouw workforce hard gewerkt."
    : "While you were away your workforce worked hard.";

  const kpis = input.isDemo
    ? buildDemoKpis(nl)
    : buildLiveKpis({
        viewModel,
        marketingSnapshots,
        pendingApprovals: legacy.approvals.pendingCount,
        locale,
        primaryMarketingPeerId,
      });

  const attention = input.isDemo
    ? [
        {
          id: "demo-attention-1",
          title: nl ? "Campagneplan zomeractie goedkeuren" : "Approve summer campaign plan",
          unblocks: nl
            ? "Emma kan dan publiceren en meten."
            : "Emma can then publish and measure.",
          primaryLabel: nl ? "Bekijk" : "Review",
          href: "/inbox",
          ageLabel: nl ? "2 uur geleden" : "2 hours ago",
          peerId: "demo",
        },
        {
          id: "demo-attention-2",
          title: nl ? "LinkedIn-budgetvoorstel bevestigen" : "Confirm LinkedIn budget proposal",
          unblocks: nl
            ? "Sales kan leads opvolgen."
            : "Sales can follow up on leads.",
          primaryLabel: nl ? "Bekijk" : "Review",
          href: "/inbox",
          ageLabel: nl ? "4 uur geleden" : "4 hours ago",
          peerId: "demo",
        },
        {
          id: "demo-attention-3",
          title: nl ? "Support-antwoord goedkeuren" : "Approve support response",
          unblocks: nl
            ? "Klant krijgt vandaag nog antwoord."
            : "Customer gets an answer today.",
          primaryLabel: nl ? "Bekijk" : "Review",
          href: "/inbox",
          ageLabel: nl ? "6 uur geleden" : "6 hours ago",
          peerId: "demo",
        },
      ]
    : buildAttentionItems(viewModel, input.copy, input.formatRelativeTime, locale);

  const recommendation = input.isDemo
    ? {
        peerLabel: "Emma · Marketing",
        recommendation: nl
          ? "Verhoog LinkedIn budget met 20%"
          : "Increase LinkedIn budget by 20%",
        impact: nl
          ? "LinkedIn presteert boven verwachting — meer bereik met hetzelfde tempo."
          : "LinkedIn is outperforming — more reach at the same pace.",
        impactMetrics: [
          {
            id: "revenue",
            label: nl ? "+€2.340 extra omzet" : "+€2,340 extra revenue",
          },
          {
            id: "leads",
            label: nl ? "+14 extra leads" : "+14 extra leads",
          },
          {
            id: "roas",
            label: nl ? "+21% ROAS verbetering" : "+21% ROAS improvement",
          },
        ],
        primaryLabel: nl ? "Bekijk aanbeveling" : "View recommendation",
        href: "/inbox",
        accentVar: v17AccentForServiceKey("marketing"),
      }
    : buildRecommendation({ viewModel, locale, marketingSnapshots });

  const workforceBriefing = buildWorkforceBriefing({
    summary: viewModel?.workforceSummary,
    teamPulse: viewModel?.teamPulse ?? [],
    locale,
    viewAllHref: legacy.approvals.viewAllHref,
    isDemo: input.isDemo ?? false,
  });

  const movement =
    viewModel && viewModel.recentMovement.length > 0
      ? viewModel.recentMovement
      : legacy.activity.map((item) => ({
          id: item.id,
          title: item.text,
          description: "",
          peerName: item.agentLabel,
          timestamp: item.timestamp,
          href: item.href,
        }));

  const chartBase = input.isDemo
    ? buildDemoChart(nl)
    : buildChartFromActivity(movement, locale);

  const heroKpi = kpis.find((kpi) => kpi.hero) ?? kpis[0];
  const chart =
    chartBase && heroKpi
      ? {
          ...chartBase,
          title: heroKpi.label,
          metricValue: heroKpi.value,
          metricDelta:
            chartBase.metricDelta ??
            (heroKpi.methodology?.match(/[+-]?\d[\d.,]*%/)?.[0] ?? null),
          metricDeltaPositive:
            chartBase.metricDeltaPositive ??
            !heroKpi.methodology?.includes("-"),
        }
      : chartBase;

  const activity = input.isDemo
    ? buildDemoActivity(nl)
    : buildActivityItems({
        viewModel,
        legacyActivity: legacy.activity,
        formatRelativeTime: input.formatRelativeTime,
        locale,
      });

  return {
    header: { greeting, supporting },
    kpis,
    attention,
    attentionViewAllHref: legacy.approvals.viewAllHref,
    recommendation,
    workforceBriefing,
    showAutomationChip: input.handoff.companyActivity.activeCount > 0,
    chart,
    activity,
    activityLabel: nl ? "Live activiteit" : "Live activity",
  };
}

export function commandCenterBandsContainForbiddenTerms(bands: CommandCenterBands): boolean {
  const corpus = [
    bands.header.greeting,
    bands.header.supporting,
    ...bands.kpis.map((k) => `${k.label} ${k.value}`),
    ...bands.attention.map((a) => `${a.title} ${a.unblocks}`),
    bands.recommendation?.recommendation ?? "",
    ...((bands.workforceBriefing?.peerBriefs ?? []).map((p) => p.line)),
    ...((bands.workforceBriefing?.accomplishments ?? []).map((a) => a.text)),
    bands.chart?.insight ?? "",
    ...bands.activity.map((a) => `${a.title} ${a.description ?? ""}`),
  ].join(" ");

  return WORKFLOW_TERMS.test(corpus);
}

export function commandCenterBandsUseFabricatedLiveMetrics(
  bands: CommandCenterBands,
  isDemo: boolean
): boolean {
  if (isDemo) return false;
  return bands.kpis.some((kpi) => kpi.dataSource === "demo");
}
