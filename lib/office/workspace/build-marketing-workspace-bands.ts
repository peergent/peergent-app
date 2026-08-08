import { resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { buildMarketingDeskBriefing } from "@/lib/office/desk/build-marketing-briefing";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildDeskCampaignOverview } from "@/lib/office/desk/build-desk-campaign-overview";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";
import { officeCampaignHref, officeHref, toOfficeHref } from "@/lib/office/links";
import { buildMarketingMarketViewModel } from "@/lib/office/market/build-marketing-market";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import type { WorkItem } from "@/lib/office/work/types";
import { buildDeduplicatedCompletedOutcomes } from "@/lib/peer-experience/marketing/colleague/build-deduplicated-outcomes";
import { buildMarketingActivities } from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  MarketingChartMetricId,
  MarketingChartMetricOption,
  MarketingWorkspaceActivityBand,
  MarketingWorkspaceApprovalItem,
  MarketingWorkspaceBands,
  MarketingWorkspaceCampaignCard,
  MarketingWorkspaceContentPreview,
  MarketingWorkspaceContentPreviewKind,
  MarketingWorkspaceInsightItem,
  MarketingWorkspaceKpiItem,
  MarketingWorkspacePerformanceBand,
  MarketingWorkspaceResultsBand,
} from "./types";

export const MW_KPIS_MAX = 4;
export const MW_INSIGHTS_MAX = 5;
export const MW_CAMPAIGNS_MAX = 4;
export const MW_CONTENT_MAX = 4;
export const MW_APPROVALS_MAX = 3;
export const MW_ACTIVITY_MAX = 8;
export const MW_RESULTS_MAX = 4;

const WORKFLOW_TERMS =
  /\b(workflow|brain|capability|retry|step id|orchestrat|pipeline|agent runtime)\b/i;

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

function demoChartPoints(nl: boolean, scale: number): { at: string; value: number }[] {
  const labels = nl
    ? ["4 jul", "11 jul", "18 jul", "25 jul", "1 aug"]
    : ["Jul 4", "Jul 11", "Jul 18", "Jul 25", "Aug 1"];
  const base = [0.74, 0.82, 0.88, 0.94, 1].map((m) => Math.round(scale * m));
  return labels.map((at, index) => ({ at, value: base[index] ?? scale }));
}

function buildDemoPerformanceMetrics(nl: boolean): MarketingChartMetricOption[] {
  const mk = (
    id: MarketingChartMetricId,
    label: string,
    heroValue: string,
    chartLabel: string,
    scale: number,
    insight: string,
    valueFormat: MarketingChartMetricOption["valueFormat"],
    delta = "+14%"
  ): MarketingChartMetricOption => ({
    id,
    label,
    heroValue,
    delta,
    deltaPositive: !delta.startsWith("-"),
    chartLabel,
    points: demoChartPoints(nl, scale),
    insight,
    valueFormat,
  });

  return [
    mk(
      "revenue",
      nl ? "Beïnvloede omzet" : "Revenue influenced",
      "€ 18.420",
      nl ? "Omzet" : "Revenue",
      18420,
      nl
        ? "LinkedIn dreef 62% van leads deze maand — sterker dan Meta in jouw segment."
        : "LinkedIn drove 62% of leads this month — stronger than Meta in your segment.",
      "currency"
    ),
    mk(
      "leads",
      nl ? "Gekwalificeerde leads" : "Qualified leads",
      "63",
      nl ? "Leads" : "Leads",
      63,
      nl
        ? "Leadvolume steeg 18% t.o.v. vorige maand — vooral via Google Ads."
        : "Lead volume rose 18% vs last month — mostly via Google Ads.",
      "number",
      "+18%"
    ),
    mk(
      "traffic",
      nl ? "Websiteverkeer" : "Website traffic",
      "18.420",
      nl ? "Bezoekers" : "Visitors",
      18420,
      nl
        ? "Organisch verkeer groeit gestaag na de SEO-updates van vorige week."
        : "Organic traffic is growing steadily after last week's SEO updates.",
      "number",
      "+9%"
    ),
    mk(
      "roas",
      "ROAS",
      "3,2×",
      "ROAS",
      32,
      nl
        ? "Google Ads ROAS ligt 23% boven LinkedIn over de laatste 14 dagen."
        : "Google Ads ROAS is 23% above LinkedIn over the last 14 days.",
      "multiplier",
      "+23%"
    ),
    mk(
      "ctr",
      "CTR",
      "4,1%",
      "CTR",
      41,
      nl
        ? "CTR op search-campagnes blijft boven branchegemiddelde."
        : "Search campaign CTR remains above industry average.",
      "percent",
      "+6%"
    ),
    mk(
      "cpc",
      "CPC",
      "€ 1,94",
      "CPC",
      194,
      nl
        ? "CPC daalde licht terwijl conversies stabiel bleven."
        : "CPC dipped slightly while conversions held steady.",
      "currency",
      "-4%"
    ),
  ];
}

function buildDemoKpis(nl: boolean): MarketingWorkspaceKpiItem[] {
  return [
    {
      id: "revenue-influenced",
      label: nl ? "Beïnvloede omzet" : "Revenue influenced",
      value: "€ 18.420",
      methodology: nl ? "+14% vs vorige maand" : "+14% vs last month",
      hero: true,
      accent: "var(--pg-peer-marketing)",
    },
    {
      id: "leads-added",
      label: nl ? "Gekwalificeerde leads" : "Qualified leads",
      value: "63",
      methodology: nl ? "+18% vs vorige maand" : "+18% vs last month",
      accent: "var(--pg-action-primary)",
    },
    {
      id: "active-campaigns",
      label: nl ? "Campagnes live" : "Campaigns live",
      value: "3",
      methodology: nl ? "2 wachten op goedkeuring" : "2 awaiting approval",
      accent: "var(--pg-v13-purple-accent, #7c3aed)",
    },
    {
      id: "demo-roas",
      label: "ROAS",
      value: "3,2×",
      methodology: nl ? "Google Ads account" : "Google Ads account",
      accent: "var(--pg-peer-marketing)",
    },
  ];
}

function buildDemoInsights(nl: boolean): MarketingWorkspaceInsightItem[] {
  return [
    {
      id: "ins-ads",
      text: nl
        ? "Google Ads-efficiëntie steeg 18% — CPC daalde terwijl conversies stabiel bleven."
        : "Google Ads efficiency rose 18% — CPC fell while conversions held steady.",
      tone: "positive",
    },
    {
      id: "ins-seo",
      text: nl
        ? "SEO-pagina's won gemiddeld 12 posities op doelzoektermen."
        : "SEO pages gained an average of 12 positions on target keywords.",
      tone: "positive",
    },
    {
      id: "ins-linkedin",
      text: nl
        ? "LinkedIn-engagement vertraagt — overweeg andere formats of frequentie."
        : "LinkedIn engagement is slowing — consider different formats or cadence.",
      tone: "negative",
    },
    {
      id: "ins-meta",
      text: nl
        ? "Meta-budget kan 15% omlaag zonder leadverlies op basis van ROAS-spreiding."
        : "Meta budget could drop 15% without lead loss based on ROAS spread.",
      tone: "opportunity",
    },
    {
      id: "ins-competitor",
      text: nl
        ? "Concurrent X lanceerde een nieuwe campagne rond snelle onboarding."
        : "Competitor X launched a new campaign around fast onboarding.",
      tone: "neutral",
    },
  ];
}

function buildDemoCampaigns(nl: boolean, peerId: string): MarketingWorkspaceCampaignCard[] {
  return [
    {
      id: "demo-camp-linkedin",
      name: nl ? "LinkedIn Q2 Groei" : "LinkedIn Q2 Growth",
      statusLabel: "LIVE",
      progressLabel: nl ? "3 posts deze week" : "3 posts this week",
      channelLabel: "LinkedIn",
      budgetLabel: nl ? "€ 840 / maand" : "€840 / month",
      impactLabel: nl ? "+847 impressies vandaag" : "+847 impressions today",
      needsApproval: false,
      isLive: true,
      href: officeHref(peerId, "work"),
    },
    {
      id: "demo-camp-ads",
      name: nl ? "Google Ads — Search" : "Google Ads — Search",
      statusLabel: nl ? "In progress" : "In progress",
      progressLabel: nl ? "Keyword expansion" : "Keyword expansion",
      channelLabel: "Google Ads",
      budgetLabel: nl ? "€ 1.840 spend" : "€1,840 spend",
      impactLabel: nl ? "ROAS 3,2×" : "ROAS 3.2×",
      needsApproval: false,
      isLive: false,
      href: officeHref(peerId, "work"),
    },
    {
      id: "camp-heatpump",
      name: nl ? "AI-werkplek lanceren" : "Launch AI workspace awareness",
      statusLabel: nl ? "Wacht op goedkeuring" : "Awaiting approval",
      progressLabel: nl ? "3 deliverables klaar" : "3 deliverables ready",
      channelLabel: "LinkedIn · Email · Blog",
      budgetLabel: null,
      impactLabel: nl ? "Verwachte reach: 12k" : "Expected reach: 12k",
      needsApproval: true,
      isLive: false,
      href: officeCampaignHref(peerId, "camp-heatpump"),
    },
  ];
}

function buildOverviewSummary(input: {
  nl: boolean;
  revenueValue: string | null;
  leadInsight: string | null;
  approvalCount: number;
}): string {
  const parts: string[] = [];

  if (input.revenueValue) {
    parts.push(
      input.nl
        ? `Marketing genereerde ${input.revenueValue} deze maand.`
        : `Marketing generated ${input.revenueValue} this month.`
    );
  }

  if (input.leadInsight) {
    parts.push(input.leadInsight);
  }

  if (input.approvalCount === 1) {
    parts.push(input.nl ? "Eén goedkeuring wacht." : "One approval is waiting.");
  } else if (input.approvalCount > 1) {
    parts.push(
      input.nl
        ? `${input.approvalCount} goedkeuringen wachten.`
        : `${input.approvalCount} approvals are waiting.`
    );
  }

  if (parts.length === 0) {
    return input.nl
      ? "Marketing draait — er zijn vandaag nog geen urgente acties."
      : "Marketing is running — no urgent actions today.";
  }

  return parts.slice(0, 3).join(" ");
}

function buildKpisFromBriefing(input: {
  briefing: ReturnType<typeof buildMarketingDeskBriefing>;
  performance: ReturnType<typeof buildMarketingPerformanceViewModelForOffice>;
  work: ReturnType<typeof buildMarketingWorkViewModel>;
  nl: boolean;
  isDemo: boolean;
  peerId: string;
}): MarketingWorkspaceKpiItem[] {
  if (input.isDemo) return buildDemoKpis(input.nl);

  const items: MarketingWorkspaceKpiItem[] = [];
  const outcomeKpis = input.briefing.kpis.filter((k) => k.emphasis === "outcome");

  for (const [index, kpi] of outcomeKpis.slice(0, 2).entries()) {
    items.push({
      id: kpi.id,
      label: kpi.label,
      value: kpi.value,
      methodology: kpi.delta?.label ?? kpi.methodology,
      hero: index === 0,
      accent: "var(--pg-peer-marketing)",
      href: officeHref(input.peerId, "performance"),
    });
  }

  const liveCount = input.work.groups
    .flatMap((g) => g.items)
    .filter((item) => item.bucket === "running" || item.bucket === "scheduled").length;

  if (input.work.groups.flatMap((g) => g.items).length > 0) {
    items.push({
      id: "active-campaigns",
      label: input.nl ? "Campagnes actief" : "Active campaigns",
      value: String(input.work.groups.flatMap((g) => g.items).length),
      methodology:
        liveCount > 0
          ? input.nl
            ? `${liveCount} live of onderweg`
            : `${liveCount} live or in progress`
          : null,
      accent: "var(--pg-v13-purple-accent, #7c3aed)",
      href: officeHref(input.peerId, "work"),
    });
  }

  for (const metric of input.performance.metrics.slice(0, MW_KPIS_MAX - items.length)) {
    items.push({
      id: metric.id,
      label: metric.label,
      value: metric.value,
      methodology: metric.comparison?.label ?? metric.methodology,
      accent: "var(--pg-action-primary)",
      href: officeHref(input.peerId, "performance"),
    });
  }

  return items.slice(0, MW_KPIS_MAX);
}

function buildLivePerformanceMetrics(input: {
  briefing: ReturnType<typeof buildMarketingDeskBriefing>;
  performance: ReturnType<typeof buildMarketingPerformanceViewModelForOffice>;
  nl: boolean;
}): MarketingChartMetricOption[] {
  const hero = input.briefing.executive.primaryKpi ?? input.briefing.kpis[0];
  const trend = input.performance.trend;
  const topSignal = [...input.performance.signals].sort((a, b) => b.magnitude - a.magnitude)[0];

  if (!hero) return [];

  const points = trend?.points ?? [];
  const { delta, positive } = chartDeltaFromPoints(points);

  return [
    {
      id: "revenue",
      label: hero.label,
      heroValue: hero.value,
      delta: hero.delta?.label?.match(/[+-]?\d[\d.,]*%/)?.[0] ?? delta,
      deltaPositive: hero.delta ? hero.delta.upIsGood : positive,
      chartLabel: trend?.label ?? hero.label,
      points,
      insight: topSignal?.interpretation ?? null,
      valueFormat:
        /revenue|omzet/i.test(hero.label) ? "currency" : "number",
    },
  ];
}

function insightToneFromText(text: string): MarketingWorkspaceInsightItem["tone"] {
  const lower = text.toLowerCase();
  if (/\b(increase|rose|gained|stronger|better|effici|steeg|won|hoger)\b/.test(lower)) {
    return "positive";
  }
  if (/\b(slow|decline|drop|reduce|daalde|vertraag|lower|worse)\b/.test(lower)) {
    return "negative";
  }
  if (/\b(consider|could|should|overweeg|kan|opportunity|budget)\b/.test(lower)) {
    return "opportunity";
  }
  return "neutral";
}

function buildInsights(input: {
  performance: ReturnType<typeof buildMarketingPerformanceViewModelForOffice>;
  market: ReturnType<typeof buildMarketingMarketViewModel>;
  nl: boolean;
  isDemo: boolean;
}): MarketingWorkspaceInsightItem[] | null {
  if (input.isDemo) {
    return buildDemoInsights(input.nl).slice(0, MW_INSIGHTS_MAX);
  }

  const items: MarketingWorkspaceInsightItem[] = [];

  for (const signal of [...input.performance.signals]
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 3)) {
    const text = signal.interpretation || signal.fact;
    items.push({
      id: signal.id,
      text,
      tone: insightToneFromText(text),
    });
  }

  if (input.market.interpretation?.text) {
    items.push({
      id: "market-interpretation",
      text: input.market.interpretation.text,
      tone: "neutral",
    });
  }

  for (const observation of [...input.market.inferences, ...input.market.observedFacts].slice(
    0,
    2
  )) {
    items.push({
      id: observation.id,
      text: observation.statement,
      tone: observation.evidence === "likely" ? "opportunity" : "neutral",
    });
  }

  return items.length > 0 ? items.slice(0, MW_INSIGHTS_MAX) : null;
}

function workItemToCampaignCard(item: WorkItem, nl: boolean): MarketingWorkspaceCampaignCard {
  const channel = item.channels.find((c) => c.connected) ?? item.channels[0];
  const isLive = item.bucket === "running" || item.stageLabel.toLowerCase().includes("live");

  return {
    id: item.id,
    name: item.name,
    statusLabel: isLive ? "LIVE" : item.stageLabel,
    progressLabel: [item.primaryText, item.secondaryText].filter(Boolean).join(" · ") || null,
    channelLabel: channel?.label ?? null,
    budgetLabel: null,
    impactLabel: item.expectedLabel,
    needsApproval: item.bucket === "attention",
    isLive,
    href: item.href,
  };
}

function deskRowToCampaignCard(
  row: import("@/lib/office/desk/build-desk-campaign-overview").DeskCampaignRow,
  nl: boolean
): MarketingWorkspaceCampaignCard {
  return {
    id: row.id,
    name: row.name,
    statusLabel: row.isLive ? "LIVE" : row.statusLabel,
    progressLabel: [row.runningLabel, row.runningStatusLabel, row.dateRangeLabel]
      .filter(Boolean)
      .join(" · ") || null,
    channelLabel: null,
    budgetLabel: null,
    impactLabel: row.daysRemaining != null
      ? nl
        ? `${row.daysRemaining} dagen resterend`
        : `${row.daysRemaining} days remaining`
      : null,
    needsApproval: Boolean(row.quickActionLabel?.toLowerCase().includes("review") ||
      row.quickActionLabel?.toLowerCase().includes("beoordeel")),
    isLive: row.isLive,
    href: row.href,
  };
}

function buildCampaignCards(input: {
  domainInput: MarketingPeerDomainInput;
  work: ReturnType<typeof buildMarketingWorkViewModel>;
  locale: "en" | "nl";
  isDemo: boolean;
  peerId: string;
}): MarketingWorkspaceCampaignCard[] {
  if (input.isDemo) {
    return buildDemoCampaigns(input.locale === "nl", input.peerId).slice(0, MW_CAMPAIGNS_MAX);
  }

  const overview = buildDeskCampaignOverview({
    domainInput: input.domainInput,
    locale: input.locale,
    isDemo: input.isDemo,
  });

  const cards: MarketingWorkspaceCampaignCard[] = [];
  const seen = new Set<string>();

  const push = (card: MarketingWorkspaceCampaignCard) => {
    if (seen.has(card.id) || cards.length >= MW_CAMPAIGNS_MAX) return;
    seen.add(card.id);
    cards.push(card);
  };

  for (const row of [...overview.live, ...overview.needsApproval, ...overview.scheduled]) {
    push(deskRowToCampaignCard(row, input.locale === "nl"));
  }

  for (const item of input.work.groups.flatMap((g) => g.items)) {
    push(workItemToCampaignCard(item, input.locale === "nl"));
  }

  return cards;
}

function contentKindForChannel(channelId: string | null): MarketingWorkspaceContentPreviewKind {
  switch (channelId) {
    case "linkedin":
      return "linkedin";
    case "instagram":
      return "instagram";
    case "email":
    case "newsletter":
      return "email";
    case "google_ads":
    case "meta_ads":
    case "meta":
      return "ads";
    case "blog":
      return "blog";
    default:
      return "display";
  }
}

function buildContentPreviews(input: {
  domainInput: MarketingPeerDomainInput;
  locale: "en" | "nl";
  peerId: string;
  isDemo: boolean;
}): MarketingWorkspaceContentPreview[] {
  const content = buildMarketingContentViewModel({
    domainInput: input.domainInput,
    peerName: "Emma",
    peerRole: "Marketing",
    localePreference: input.locale,
    searchParams: new URLSearchParams("state=all"),
  });

  const items = content.groups
    .flatMap((group) => group.items)
    .filter((item) => item.preview && item.preview.trim().length > 0)
    .sort((a, b) => (b.sortAt ?? "").localeCompare(a.sortAt ?? ""))
    .slice(0, MW_CONTENT_MAX)
    .map((item) => ({
      id: item.id,
      kind: contentKindForChannel(item.channelId),
      channelLabel: item.channelLabel ?? item.channelId ?? "Content",
      title: item.title,
      preview: item.preview ?? "",
      statusLabel: item.statusLabel,
      href: item.href,
    }));

  if (items.length > 0 || !input.isDemo) return items;

  const nl = input.locale === "nl";
  return input.domainInput.drafts.slice(0, MW_CONTENT_MAX).map((draft) => ({
    id: draft.id,
    kind: contentKindForChannel(draft.channel ?? null),
    channelLabel: draft.channel === "linkedin" ? "LinkedIn" : draft.channel ?? "Content",
    title: draft.title,
    preview: draft.body.slice(0, 160).trim(),
    statusLabel:
      draft.status === "ready_for_review"
        ? nl
          ? "Wacht op goedkeuring"
          : "Awaiting approval"
        : draft.status,
    href: officeHref(input.peerId, "content"),
  }));
}

function buildActivityFeed(input: {
  domainInput: MarketingPeerDomainInput;
  locale: "en" | "nl";
  peerId: string;
}): MarketingWorkspaceActivityBand["items"] {
  const activities = buildMarketingActivities(input.domainInput);
  const feed = input.domainInput.activityFeed ?? [];

  const fromActivities = activities.slice(0, MW_ACTIVITY_MAX).map((activity) => ({
    id: activity.id,
    timestamp: activity.occurredAt,
    timeLabel: activity.timeLabel,
    message: activity.title,
    href: activity.target.href ? toOfficeHref(input.peerId, activity.target.href) : null,
  }));

  if (fromActivities.length >= 3) return fromActivities.slice(0, MW_ACTIVITY_MAX);

  const fromFeed = feed.slice(0, MW_ACTIVITY_MAX).map((item) => ({
    id: item.id,
    timestamp: item.timestamp,
    timeLabel: new Date(item.timestamp).toLocaleTimeString(input.locale === "nl" ? "nl-NL" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    message: item.title,
    href: null,
  }));

  return [...fromActivities, ...fromFeed].slice(0, MW_ACTIVITY_MAX);
}

function buildResults(input: {
  domainInput: MarketingPeerDomainInput;
  locale: "en" | "nl";
  peerId: string;
  now?: Date;
  isDemo: boolean;
}): MarketingWorkspaceResultsBand["items"] {
  const outcomes = buildDeduplicatedCompletedOutcomes({
    domainInput: input.domainInput,
    locale: input.locale,
    now: input.now,
  }).filter((o) => o.group === "today");

  if (outcomes.length > 0) {
    return outcomes.slice(0, MW_RESULTS_MAX).map((o) => ({
      id: o.id,
      label: o.title,
      impactLabel: o.summary ?? null,
      href: o.href ? toOfficeHref(input.peerId, o.href) : null,
    }));
  }

  if (!input.isDemo) return [];

  const nl = input.locale === "nl";
  return [
    {
      id: "demo-result-1",
      label: nl ? "Campagnestrategie goedgekeurd" : "Campaign strategy approved",
      impactLabel: nl ? "Beïnvloedde € 1,2k pipeline" : "Influenced €1.2k pipeline",
      href: officeHref(input.peerId, "work"),
    },
    {
      id: "demo-result-2",
      label: nl ? "3 LinkedIn posts gepubliceerd" : "3 LinkedIn posts published",
      impactLabel: nl ? "847 impressies" : "847 impressions",
      href: officeHref(input.peerId, "content"),
    },
  ];
}

export function marketingWorkspaceBandsContainForbiddenTerms(
  bands: MarketingWorkspaceBands
): boolean {
  const corpus = [
    bands.overview.summary,
    ...bands.kpis.items.map((k) => `${k.label} ${k.value}`),
    ...(bands.performance?.metrics.flatMap((m) => [m.insight ?? "", m.label]) ?? []),
    ...(bands.insights?.items.map((i) => i.text) ?? []),
    ...(bands.campaigns?.items.map(
      (c) => `${c.name} ${c.statusLabel} ${c.progressLabel ?? ""}`
    ) ?? []),
    ...(bands.content?.items.map((c) => `${c.title} ${c.preview}`) ?? []),
    ...(bands.approvals?.items.map((a) => `${a.title} ${a.unblocks}`) ?? []),
    bands.recommendation?.headline ?? "",
    ...(bands.activity?.items.map((a) => a.message) ?? []),
    ...(bands.results?.items.map((r) => `${r.label} ${r.impactLabel ?? ""}`) ?? []),
  ].join(" ");

  return WORKFLOW_TERMS.test(corpus);
}

export function buildMarketingWorkspaceBands(input: {
  domainInput: MarketingPeerDomainInput;
  peerName: string;
  peerRole: string;
  localePreference?: string | null;
  isDemo?: boolean;
  now?: Date;
}): MarketingWorkspaceBands {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const nl = locale === "nl";
  const peerId = input.domainInput.peerId;
  const isDemo = input.isDemo ?? peerId === "demo";

  const desk = buildMarketingDeskViewModel({
    domainInput: input.domainInput,
    peerName: input.peerName,
    peerRole: input.peerRole,
    localePreference: input.localePreference,
    now: input.now,
  });

  const briefing = buildMarketingDeskBriefing({
    domainInput: input.domainInput,
    peerName: input.peerName,
    peerRole: input.peerRole,
    localePreference: input.localePreference,
    desk,
    now: input.now,
  });

  const work = buildMarketingWorkViewModel({
    domainInput: input.domainInput,
    peerName: input.peerName,
    peerRole: input.peerRole,
    localePreference: input.localePreference,
  });

  const performance = buildMarketingPerformanceViewModelForOffice({
    domainInput: input.domainInput,
    peerName: input.peerName,
    peerRole: input.peerRole,
    localePreference: input.localePreference,
    now: input.now,
  });

  const market = buildMarketingMarketViewModel({
    domainInput: input.domainInput,
    peerName: input.peerName,
    peerRole: input.peerRole,
    localePreference: input.localePreference,
    now: input.now,
  });

  const kpis = buildKpisFromBriefing({ briefing, performance, work, nl, isDemo, peerId });
  const revenueKpi = kpis.find((k) => /revenue|omzet/i.test(k.label));
  const topSignal = [...performance.signals].sort((a, b) => b.magnitude - a.magnitude)[0];

  const overview = {
    summary: buildOverviewSummary({
      nl,
      revenueValue: revenueKpi?.value ?? (isDemo ? "€ 18.420" : null),
      leadInsight: isDemo
        ? nl
          ? "Google Ads presteert 23% beter dan LinkedIn."
          : "Google Ads is outperforming LinkedIn by 23%."
        : topSignal?.interpretation ?? null,
      approvalCount: desk.decisions.length,
    }),
  };

  const performanceBand: MarketingWorkspacePerformanceBand | null = isDemo
    ? {
        periodLabel: nl ? "Laatste 30 dagen" : "Last 30 days",
        metrics: buildDemoPerformanceMetrics(nl),
        defaultMetricId: "revenue",
      }
    : (() => {
        const metrics = buildLivePerformanceMetrics({ briefing, performance, nl });
        if (metrics.length === 0) return null;
        return {
          periodLabel:
            briefing.executive.periodLabel ?? (nl ? "Laatste 30 dagen" : "Last 30 days"),
          metrics,
          defaultMetricId: "revenue" as const,
        };
      })();

  const insightsItems = buildInsights({ performance, market, nl, isDemo });
  const insights = insightsItems
    ? {
        title: nl ? "Marketing inzichten" : "Marketing insights",
        items: insightsItems,
      }
    : null;

  const campaignCards = buildCampaignCards({
    domainInput: input.domainInput,
    work,
    locale,
    isDemo,
    peerId,
  });

  const campaigns =
    campaignCards.length > 0
      ? {
          title: nl ? "Actieve campagnes" : "Active campaigns",
          items: campaignCards,
          viewAllHref: officeHref(peerId, "work"),
        }
      : null;

  const contentItems = buildContentPreviews({
    domainInput: input.domainInput,
    locale,
    peerId,
    isDemo,
  });

  const content =
    contentItems.length > 0
      ? {
          title: nl ? "Content preview" : "Content preview",
          items: contentItems,
          viewAllHref: officeHref(peerId, "content"),
        }
      : null;

  const visibleApprovals = desk.decisions.slice(0, MW_APPROVALS_MAX);
  const approvals =
    visibleApprovals.length > 0
      ? {
          items: visibleApprovals as MarketingWorkspaceApprovalItem[],
          totalCount: desk.decisions.length,
          overflowLabel:
            desk.decisions.length > MW_APPROVALS_MAX
              ? nl
                ? `Nog ${desk.decisions.length - MW_APPROVALS_MAX} in Inbox`
                : `${desk.decisions.length - MW_APPROVALS_MAX} more in Inbox`
              : null,
          overflowHref: "/inbox",
        }
      : null;

  const recommendation =
    desk.decisions.length > 0
      ? null
      : briefing.executive.recommendation && topSignal?.recommendation
        ? {
            headline: topSignal.recommendation,
            impact: topSignal.fact ?? briefing.executive.interpretationFact,
            primaryLabel: nl ? "Bekijk aanbeveling" : "View recommendation",
            href: officeHref(peerId, "performance"),
            impactMetrics: isDemo
              ? [
                  {
                    id: "roas",
                    label: nl ? "+21% ROAS verbetering" : "+21% ROAS improvement",
                  },
                ]
              : undefined,
          }
        : isDemo && !approvals
          ? {
              headline: nl
                ? "Verhoog Google Ads-budget met 15%"
                : "Increase Google Ads budget by 15%",
              impact: nl
                ? "ROAS is 23% hoger op Google Ads dan LinkedIn over 14 dagen."
                : "ROAS is 23% higher on Google Ads than LinkedIn over 14 days.",
              primaryLabel: nl ? "Bekijk aanbeveling" : "View recommendation",
              href: officeHref(peerId, "performance"),
              impactMetrics: [
                {
                  id: "leads",
                  label: nl ? "+14 extra leads verwacht" : "+14 extra leads expected",
                },
              ],
            }
          : null;

  const activityItems = buildActivityFeed({
    domainInput: input.domainInput,
    locale,
    peerId,
  });

  const activity =
    activityItems.length > 0
      ? {
          title: nl ? "Live activiteit" : "Live activity",
          items: activityItems,
        }
      : null;

  const resultItems = buildResults({
    domainInput: input.domainInput,
    locale,
    peerId,
    now: input.now,
    isDemo,
  });

  const results =
    resultItems.length > 0
      ? {
          title: nl ? "Resultaten vandaag" : "Today's results",
          items: resultItems,
        }
      : null;

  return {
    overview,
    kpis: { items: kpis },
    performance: performanceBand,
    insights,
    campaigns,
    content,
    approvals,
    recommendation,
    activity,
    results,
  };
}
