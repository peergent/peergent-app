import { resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { resolveWorkspaceBrainOutput } from "@/lib/brain/output";
import {
  applyBrainBulletsToMetrics,
  mapWorkspaceSlicesFromBrain,
} from "@/lib/office/brain-output";
import { buildMarketingDeskBriefing } from "@/lib/office/desk/build-marketing-briefing";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildDeskCampaignOverview } from "@/lib/office/desk/build-desk-campaign-overview";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";
import { officeCampaignHref, officeHref, toOfficeHref } from "@/lib/office/links";
import { buildMarketingMarketViewModel } from "@/lib/office/market/build-marketing-market";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import type { WorkItem } from "@/lib/office/work/types";
import { buildMarketingActivities } from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  MarketingChartMetricId,
  MarketingChartMetricOption,
  MarketingCampaignStatus,
  MarketingCampaignThumbnailKind,
  MarketingWorkspaceActivityBand,
  MarketingWorkspaceApprovalItem,
  MarketingWorkspaceBands,
  MarketingWorkspaceBiBullet,
  MarketingWorkspaceBusinessIntelligenceBand,
  MarketingWorkspaceCampaignCard,
  MarketingWorkspaceContentPreview,
  MarketingWorkspaceContentPreviewKind,
  MarketingWorkspaceKpiItem,
  MarketingWorkspaceOverviewPart,
  MarketingWorkspacePerformanceBand,
} from "./types";

export const MW_KPIS_MAX = 4;
export const MW_CAMPAIGNS_MAX = 3;
export const MW_CONTENT_MAX = 4;
export const MW_APPROVALS_MAX = 3;
export const MW_ACTIVITY_MAX = 8;

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
    bullets: readonly MarketingWorkspaceBiBullet[],
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
    bullets,
    valueFormat,
  });

  return [
    mk(
      "revenue",
      nl ? "Omzet" : "Revenue",
      "€ 18.420",
      nl ? "Omzet" : "Revenue",
      18420,
      nl
        ? "LinkedIn dreef 62% van leads deze maand — sterker dan Meta in jouw segment."
        : "LinkedIn drove 62% of leads this month — stronger than Meta in your segment.",
      [
        { id: "rev-1", text: nl ? "Omzet steeg 14% t.o.v. vorige maand." : "Revenue rose 14% vs last month.", tone: "positive" },
        { id: "rev-2", text: nl ? "Google Ads levert de meeste gekwalificeerde leads." : "Google Ads drives the strongest qualified lead flow.", tone: "positive" },
        { id: "rev-3", text: nl ? "LinkedIn engagement daalde 9%." : "LinkedIn engagement dropped 9%.", tone: "attention" },
        { id: "rev-4", text: nl ? "Organische SEO groeit na de juli-update." : "Organic SEO continues growing after the July update.", tone: "positive" },
        { id: "rev-5", text: nl ? "Aanbeveling: verhoog Google Ads-budget met €250/dag." : "Recommendation: increase Google Ads budget by €250/day.", tone: "recommendation" },
      ],
      "currency"
    ),
    mk(
      "leads",
      nl ? "Leads" : "Leads",
      "63",
      nl ? "Leads" : "Leads",
      63,
      nl
        ? "Leadvolume steeg 18% t.o.v. vorige maand — vooral via Google Ads."
        : "Lead volume rose 18% vs last month — mostly via Google Ads.",
      [
        { id: "lead-1", text: nl ? "Google Ads genereerde 18% meer gekwalificeerde leads dan vorige week." : "Google Ads generated 18% more qualified leads than last week.", tone: "positive" },
        { id: "lead-2", text: nl ? "LinkedIn-leads converteren 12% beter dan Meta." : "LinkedIn leads convert 12% better than Meta.", tone: "positive" },
        { id: "lead-3", text: nl ? "Formulier-conversie op landingspagina stabiel." : "Landing page form conversion held steady.", tone: "neutral" },
        { id: "lead-4", text: nl ? "Aanbeveling: schaal top-of-funnel op Google Ads." : "Recommendation: scale top-of-funnel on Google Ads.", tone: "recommendation" },
      ],
      "number",
      "+18%"
    ),
    mk(
      "traffic",
      nl ? "Verkeer" : "Traffic",
      "18.420",
      nl ? "Bezoekers" : "Visitors",
      18420,
      nl
        ? "Organisch verkeer groeit gestaag na de SEO-updates van vorige week."
        : "Organic traffic is growing steadily after last week's SEO updates.",
      [
        { id: "tr-1", text: nl ? "Organisch verkeer +9% week-op-week." : "Organic traffic up 9% week-over-week.", tone: "positive" },
        { id: "tr-2", text: nl ? "Vier doelpagina's won posities na SEO-update." : "Four target pages gained rank after the SEO update.", tone: "positive" },
        { id: "tr-3", text: nl ? "Betaald verkeer stabiel ondanks budgetshift." : "Paid traffic stable despite budget shift.", tone: "neutral" },
        { id: "tr-4", text: nl ? "Aanbeveling: versterk SEO op hoog-intent pagina's." : "Recommendation: strengthen SEO on high-intent pages.", tone: "recommendation" },
      ],
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
      [
        { id: "roas-1", text: nl ? "Google Ads ROAS 23% boven LinkedIn." : "Google Ads ROAS 23% above LinkedIn.", tone: "positive" },
        { id: "roas-2", text: nl ? "Search-campagnes presteren boven accountgemiddelde." : "Search campaigns outperform account average.", tone: "positive" },
        { id: "roas-3", text: nl ? "Meta ROAS daalde licht — monitor 48 uur." : "Meta ROAS dipped slightly — monitor for 48 hours.", tone: "attention" },
        { id: "roas-4", text: nl ? "Aanbeveling: verschuif 15% budget naar Google Ads." : "Recommendation: shift 15% budget to Google Ads.", tone: "recommendation" },
      ],
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
      [
        { id: "ctr-1", text: nl ? "Search CTR +6% boven branchegemiddelde." : "Search CTR 6% above industry average.", tone: "positive" },
        { id: "ctr-2", text: nl ? "LinkedIn CTR stabiel ondanks lagere frequentie." : "LinkedIn CTR stable despite lower cadence.", tone: "neutral" },
        { id: "ctr-3", text: nl ? "Display CTR onder verwachting op retargeting." : "Display CTR below expectation on retargeting.", tone: "attention" },
        { id: "ctr-4", text: nl ? "Aanbeveling: test nieuwe LinkedIn-hooks." : "Recommendation: test new LinkedIn hooks.", tone: "recommendation" },
      ],
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
      [
        { id: "cpc-1", text: nl ? "CPC daalde 4% terwijl conversies stabiel bleven." : "CPC fell 4% while conversions held steady.", tone: "positive" },
        { id: "cpc-2", text: nl ? "Concurrent X biedt agressiever op onboarding-termen." : "Competitor X bids more aggressively on onboarding terms.", tone: "attention" },
        { id: "cpc-3", text: nl ? "Branded CPC onveranderd." : "Branded CPC unchanged.", tone: "neutral" },
        { id: "cpc-4", text: nl ? "Aanbeveling: verlaag biedingen op lage-intent zoektermen." : "Recommendation: reduce bids on low-intent search terms.", tone: "recommendation" },
      ],
      "currency",
      "-4%"
    ),
    mk(
      "spend",
      nl ? "Spend" : "Spend",
      "€ 4.280",
      nl ? "Spend" : "Spend",
      4280,
      nl
        ? "Spend daalde licht terwijl conversies stabiel bleven."
        : "Spend dipped slightly while conversions held steady.",
      [
        { id: "spend-1", text: nl ? "Spend daalde 4% terwijl output stabiel bleef." : "Spend dipped 4% while output held steady.", tone: "positive" },
        { id: "spend-2", text: nl ? "Google Ads kreeg 62% van totale spend." : "Google Ads received 62% of total spend.", tone: "neutral" },
        { id: "spend-3", text: nl ? "Budget voor Q2-campagne 78% benut." : "Q2 campaign budget 78% utilized.", tone: "neutral" },
        { id: "spend-4", text: nl ? "Aanbeveling: heralloceer €250/dag naar best presterende campagne." : "Recommendation: reallocate €250/day to top-performing campaign.", tone: "recommendation" },
      ],
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
      href: officeHref("demo", "performance"),
    },
    {
      id: "leads-added",
      label: nl ? "Gekwalificeerde leads" : "Qualified leads",
      value: "63",
      methodology: nl ? "+18% vs vorige maand" : "+18% vs last month",
      accent: "var(--pg-action-primary)",
      href: officeHref("demo", "performance"),
    },
    {
      id: "active-campaigns",
      label: nl ? "Live campagnes" : "Live campaigns",
      value: "3",
      methodology: nl ? "2 wachten op goedkeuring" : "2 awaiting approval",
      accent: "var(--pg-v13-purple-accent, #7c3aed)",
      href: officeHref("demo", "work"),
    },
    {
      id: "demo-roas",
      label: "ROAS",
      value: "3,2×",
      methodology: nl ? "€ 1.840 spend deze maand" : "€1,840 spend this month",
      accent: "var(--pg-peer-marketing)",
      href: officeHref("demo", "performance"),
    },
  ];
}

function buildDemoBusinessIntelligence(nl: boolean): MarketingWorkspaceBusinessIntelligenceBand {
  return {
    eyebrow: nl ? "Business intelligence" : "Business intelligence",
    title: nl ? "Wat je moet weten" : "What you should know",
    href: officeHref("demo", "performance"),
  };
}

function buildDemoActivity(nl: boolean): MarketingWorkspaceActivityBand {
  return {
    title: nl ? "Recente activiteit" : "Recent activity",
    items: [
      {
        id: "act-ads-publish",
        timestamp: new Date(Date.now() - 3 * 60_000).toISOString(),
        timeLabel: nl ? "3 minuten geleden" : "3 minutes ago",
        title: nl ? "Google Ads-campagne gepubliceerd" : "Google Ads campaign published",
        subtitle: nl ? "Budget verhoogd met €120." : "Budget increased by €120.",
        tone: "success",
        href: null,
      },
      {
        id: "act-linkedin",
        timestamp: new Date(Date.now() - 11 * 60_000).toISOString(),
        timeLabel: nl ? "11 minuten geleden" : "11 minutes ago",
        title: nl ? "LinkedIn-post bereikte 12.000 impressies" : "LinkedIn post reached 12,000 impressions",
        subtitle: nl ? "Best presterende content vandaag." : "Top performing content today.",
        tone: "insight",
        href: null,
      },
      {
        id: "act-competitor",
        timestamp: new Date(Date.now() - 31 * 60_000).toISOString(),
        timeLabel: nl ? "31 minuten geleden" : "31 minutes ago",
        title: nl ? "Concurrent lanceerde nieuwe campagne" : "Competitor launched new campaign",
        subtitle: nl ? "Mogelijke CPC-stijging verwacht." : "Potential CPC increase expected.",
        tone: "attention",
        href: null,
      },
      {
        id: "act-seo",
        timestamp: new Date(Date.now() - 2 * 3600_000).toISOString(),
        timeLabel: nl ? "2 uur geleden" : "2 hours ago",
        title: nl ? "SEO-pagina's stegen gemiddeld 12 posities" : "SEO pages gained an average of 12 positions",
        subtitle: nl ? "Organisch verkeer groeit gestaag." : "Organic traffic growing steadily.",
        tone: "success",
        href: null,
      },
    ],
    emptyMessage: null,
  };
}

function buildDemoCampaigns(nl: boolean, peerId: string): MarketingWorkspaceCampaignCard[] {
  return [
    {
      id: "demo-camp-linkedin",
      name: nl ? "LinkedIn Q2 Groei" : "LinkedIn Q2 Growth",
      status: "live",
      channelLabel: "LinkedIn",
      channelsSubtitle: null,
      thumbnailKind: "linkedin",
      previewHeadline: nl ? "Q2-groei: AI-werkplek voor founders" : "Q2 growth: AI workspace for founders",
      previewBody: nl
        ? "We helpen teams sneller groeien met een AI-collega die marketing écht draait — niet alleen suggesties geeft."
        : "We help teams grow faster with an AI colleague that actually runs marketing — not just suggestions.",
      previewMeta: nl ? "Jouw bedrijf · 2 uur geleden" : "Your company · 2h ago",
      budgetLabel: nl ? "€ 840 / maand" : "€840/mo",
      revenueLabel: nl ? "€ 2,1k" : "€2.1k",
      roasLabel: null,
      leadsLabel: "12",
      progressPercent: 75,
      progressCaption: nl ? "3 posts deze week" : "3 posts this week",
      milestoneLabel: nl ? "Volgende: performance read maandag" : "Next: performance read Monday",
      milestoneAttention: false,
      href: officeHref(peerId, "work"),
    },
    {
      id: "demo-camp-ads",
      name: nl ? "Google Ads — Search" : "Google Ads — Search",
      status: "optimizing",
      channelLabel: "Google Ads",
      channelsSubtitle: null,
      thumbnailKind: "google_ads",
      previewHeadline: nl ? "AI Marketing Platform — Gratis demo" : "AI Marketing Platform — Free demo",
      previewBody: nl
        ? "Automatiseer campagnes, content en rapportage. Start vandaag met 14 dagen proefperiode."
        : "Automate campaigns, content, and reporting. Start your 14-day trial today.",
      previewMeta: "example.com",
      budgetLabel: nl ? "€ 1.840 spend" : "€1,840 spend",
      revenueLabel: null,
      roasLabel: "3,2×",
      leadsLabel: "21",
      progressPercent: 60,
      progressCaption: nl ? "Keyword expansion actief" : "Keyword expansion running",
      milestoneLabel: nl ? "Volgende: bid adjustment auto" : "Next: bid adjustment auto",
      milestoneAttention: false,
      href: officeHref(peerId, "work"),
    },
    {
      id: "camp-heatpump",
      name: nl ? "AI-werkplek lanceren" : "Launch AI workspace awareness",
      status: "waiting",
      channelLabel: nl ? "Multi-channel" : "Multi-channel",
      channelsSubtitle: "LinkedIn · Email · Blog",
      thumbnailKind: "multi",
      previewHeadline: nl ? "Lanceer je AI-werkplek" : "Launch your AI workspace",
      previewBody: nl
        ? "LinkedIn · Email · Blog — drie deliverables klaar voor publicatie zodra jij goedkeurt."
        : "LinkedIn · Email · Blog — three deliverables ready to publish once you approve.",
      previewMeta: nl ? "3 kanalen" : "3 channels",
      budgetLabel: null,
      revenueLabel: null,
      roasLabel: null,
      leadsLabel: null,
      progressPercent: 30,
      progressCaption: nl ? "3 assets klaar" : "3 assets ready",
      milestoneLabel: nl ? "Wacht op jouw goedkeuring" : "Awaiting your approval",
      milestoneAttention: true,
      href: officeCampaignHref(peerId, "camp-heatpump"),
    },
  ];
}

function buildOverviewParts(input: {
  nl: boolean;
  revenueValue: string | null;
  leadInsight: string | null;
  approvalCount: number;
  hasPerformance: boolean;
  peerId: string;
}): MarketingWorkspaceOverviewPart[] {
  const parts: MarketingWorkspaceOverviewPart[] = [];

  if (input.revenueValue) {
    parts.push({
      text: input.nl
        ? `Marketing genereerde ${input.revenueValue} deze maand`
        : `Marketing generated ${input.revenueValue} this month`,
    });
  } else if (!input.hasPerformance) {
    return [
      {
        text: input.nl
          ? "Marketing draait. Koppel analytics om omzetbijdrage te zien"
          : "Marketing is running. Connect analytics to see revenue contribution",
      },
    ];
  }

  if (input.leadInsight) {
    parts.push({ text: input.leadInsight });
  }

  if (input.approvalCount === 1) {
    parts.push({
      text: input.nl ? "Eén goedkeuring wacht" : "One approval waiting",
      attention: true,
    });
  } else if (input.approvalCount > 1) {
    parts.push({
      text: input.nl
        ? `${input.approvalCount} goedkeuringen wachten`
        : `${input.approvalCount} approvals waiting`,
      attention: true,
    });
  }

  if (parts.length === 0) {
    return [
      {
        text: input.nl
          ? "Marketing draait — er zijn vandaag nog geen urgente acties"
          : "Marketing is running — no urgent actions today",
      },
    ];
  }

  return parts.slice(0, 3);
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
      label: input.nl ? "Live campagnes" : "Live campaigns",
      value: String(liveCount || input.work.groups.flatMap((g) => g.items).length),
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
    if (/spend|cpc/i.test(metric.label)) continue;
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
      label: input.nl ? "Omzet" : "Revenue",
      heroValue: hero.value,
      delta: hero.delta?.label?.match(/[+-]?\d[\d.,]*%/)?.[0] ?? delta,
      deltaPositive: hero.delta ? hero.delta.upIsGood : positive,
      chartLabel: trend?.label ?? hero.label,
      points,
      insight: topSignal?.interpretation ?? null,
      bullets: topSignal
        ? [
            {
              id: "live-1",
              text: topSignal.interpretation || topSignal.fact,
              tone: "neutral" as const,
            },
          ]
        : [],
      valueFormat: /revenue|omzet/i.test(hero.label) ? "currency" : "number",
    },
  ];
}

function buildBusinessIntelligence(input: {
  performance: ReturnType<typeof buildMarketingPerformanceViewModelForOffice>;
  market: ReturnType<typeof buildMarketingMarketViewModel>;
  nl: boolean;
  isDemo: boolean;
  peerId: string;
}): MarketingWorkspaceBusinessIntelligenceBand | null {
  if (input.isDemo) return buildDemoBusinessIntelligence(input.nl);

  return {
    eyebrow: input.nl ? "Business intelligence" : "Business intelligence",
    title: input.nl ? "Wat je moet weten" : "What you should know",
    href: officeHref(input.peerId, "performance"),
  };
}

function campaignStatusFromWork(item: WorkItem): MarketingCampaignStatus {
  if (item.bucket === "attention") return "waiting";
  if (item.bucket === "scheduled") return "scheduled";
  if (item.bucket === "running" || item.stageLabel.toLowerCase().includes("live")) return "live";
  return "optimizing";
}

function thumbnailFromChannel(channelId: string | null | undefined): MarketingCampaignThumbnailKind {
  switch (channelId) {
    case "linkedin":
      return "linkedin";
    case "google_ads":
      return "google_ads";
    case "email":
    case "newsletter":
      return "email";
    default:
      return "display";
  }
}

function workItemToCampaignCard(item: WorkItem, nl: boolean): MarketingWorkspaceCampaignCard {
  const channel = item.channels.find((c) => c.connected) ?? item.channels[0];
  const status = campaignStatusFromWork(item);

  return {
    id: item.id,
    name: item.name,
    status,
    channelLabel: channel?.label ?? (nl ? "Campagne" : "Campaign"),
    channelsSubtitle: item.channels.length > 1
      ? item.channels.map((c) => c.label).join(" · ")
      : null,
    thumbnailKind: thumbnailFromChannel(channel?.id),
    previewHeadline: item.name,
    previewBody: item.primaryText ?? item.secondaryText ?? null,
    previewMeta: channel?.label ?? null,
    budgetLabel: null,
    revenueLabel: null,
    roasLabel: null,
    leadsLabel: item.expectedLabel?.match(/\d+/)?.[0] ?? null,
    progressPercent: status === "waiting" ? 30 : status === "live" ? 75 : 50,
    progressCaption: [item.primaryText, item.secondaryText].filter(Boolean).join(" · ") || null,
    milestoneLabel: item.expectedLabel ?? item.stageLabel,
    milestoneAttention: status === "waiting",
    href: item.href,
  };
}

function deskRowToCampaignCard(
  row: import("@/lib/office/desk/build-desk-campaign-overview").DeskCampaignRow,
  nl: boolean
): MarketingWorkspaceCampaignCard {
  const status: MarketingCampaignStatus = row.isLive
    ? "live"
    : row.quickActionLabel?.toLowerCase().includes("review") ||
        row.quickActionLabel?.toLowerCase().includes("beoordeel")
      ? "waiting"
      : row.statusLabel.toLowerCase().includes("schedul")
        ? "scheduled"
        : "optimizing";

  return {
    id: row.id,
    name: row.name,
    status,
    channelLabel: row.name.includes("LinkedIn")
      ? "LinkedIn"
      : row.name.includes("Google")
        ? "Google Ads"
        : nl
          ? "Campagne"
          : "Campaign",
    channelsSubtitle: null,
    thumbnailKind: row.name.includes("Google") ? "google_ads" : "linkedin",
    previewHeadline: row.name,
    previewBody: row.runningLabel ?? row.statusLabel,
    previewMeta: row.dateRangeLabel,
    budgetLabel: null,
    revenueLabel: null,
    roasLabel: null,
    leadsLabel: null,
    progressPercent:
      status === "waiting" ? 30 : row.isLive ? 75 : row.daysRemaining != null ? 60 : null,
    progressCaption:
      [row.runningLabel, row.runningStatusLabel, row.dateRangeLabel].filter(Boolean).join(" · ") ||
      null,
    milestoneLabel:
      status === "waiting"
        ? nl
          ? "Wacht op jouw goedkeuring"
          : "Awaiting your approval"
        : row.daysRemaining != null
          ? nl
            ? `${row.daysRemaining} dagen resterend`
            : `${row.daysRemaining} days remaining`
          : row.statusLabel,
    milestoneAttention: status === "waiting",
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

function statusToneFromLabel(label: string): MarketingWorkspaceContentPreview["statusTone"] {
  const lower = label.toLowerCase();
  if (lower.includes("live") || lower.includes("published")) return "live";
  if (lower.includes("schedul")) return "scheduled";
  if (lower.includes("review") || lower.includes("goedkeur") || lower.includes("await")) {
    return "review";
  }
  return "draft";
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
      statusTone: statusToneFromLabel(item.statusLabel),
      performanceWhisper: null,
      href: item.href,
    }));

  if (items.length > 0 || !input.isDemo) return items;

  const nl = input.locale === "nl";
  return input.domainInput.drafts.slice(0, MW_CONTENT_MAX).map((draft, index) => ({
    id: draft.id,
    kind: contentKindForChannel(draft.channel ?? null),
    channelLabel: draft.channel === "linkedin" ? "LinkedIn" : draft.channel ?? "Content",
    title: draft.title,
    preview: draft.body.slice(0, 160).trim(),
    statusLabel:
      draft.status === "ready_for_review"
        ? nl
          ? "Wacht op goedkeuring"
          : "Awaiting review"
        : draft.status,
    statusTone: draft.status === "ready_for_review" ? ("review" as const) : ("draft" as const),
    performanceWhisper: index === 0 ? (nl ? "847 impressies" : "847 impressions") : null,
    href: officeHref(input.peerId, "content"),
  }));
}

function buildActivityFeed(input: {
  domainInput: MarketingPeerDomainInput;
  locale: "en" | "nl";
  peerId: string;
  isDemo: boolean;
}): MarketingWorkspaceActivityBand {
  const nl = input.locale === "nl";
  if (input.isDemo) return buildDemoActivity(nl);

  const activities = buildMarketingActivities(input.domainInput);
  const feed = input.domainInput.activityFeed ?? [];

  const fromActivities = activities.slice(0, MW_ACTIVITY_MAX).map((activity) => ({
    id: activity.id,
    timestamp: activity.occurredAt,
    timeLabel: activity.timeLabel,
    title: activity.title,
    subtitle: activity.title,
    tone: "neutral" as const,
    href: activity.target.href ? toOfficeHref(input.peerId, activity.target.href) : null,
  }));

  const merged =
    fromActivities.length >= 3
      ? fromActivities.slice(0, MW_ACTIVITY_MAX)
      : [
          ...fromActivities,
          ...feed.slice(0, MW_ACTIVITY_MAX).map((item) => ({
            id: item.id,
            timestamp: item.timestamp,
            timeLabel: new Date(item.timestamp).toLocaleTimeString(
              nl ? "nl-NL" : "en-GB",
              { hour: "2-digit", minute: "2-digit" }
            ),
            title: item.title,
            subtitle: item.title,
            tone: "neutral" as const,
            href: null,
          })),
        ].slice(0, MW_ACTIVITY_MAX);

  return {
    title: nl ? "Recente activiteit" : "Recent activity",
    items: merged,
    emptyMessage:
      merged.length === 0
        ? nl
          ? "Rustige week — activiteit verschijnt hier zodra campagnes bewegen."
          : "Quiet week — activity will appear here as campaigns move."
        : null,
  };
}

export function marketingWorkspaceBandsContainForbiddenTerms(
  bands: MarketingWorkspaceBands
): boolean {
  const corpus = [
    ...bands.overview.parts.map((p) => p.text),
    ...bands.kpis.items.map((k) => `${k.label} ${k.value}`),
    ...(bands.performance?.metrics.flatMap((m) => [
      m.insight ?? "",
      m.label,
      ...m.bullets.map((b) => b.text),
    ]) ?? []),
    ...(bands.campaigns?.items.map(
      (c) => `${c.name} ${c.milestoneLabel} ${c.progressCaption ?? ""}`
    ) ?? []),
    ...(bands.content?.items.map((c) => `${c.title} ${c.preview}`) ?? []),
    ...(bands.approvals?.items.map((a) => `${a.title} ${a.unblocks}`) ?? []),
    bands.recommendation?.headline ?? "",
    ...(bands.activity?.items.map((a) => `${a.title} ${a.subtitle}`) ?? []),
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
    parts: buildOverviewParts({
      nl,
      revenueValue: revenueKpi?.value ?? (isDemo ? "€ 18.420" : null),
      leadInsight: isDemo
        ? nl
          ? "Google Ads presteert 23% beter dan LinkedIn"
          : "Google Ads is outperforming LinkedIn by 23%"
        : topSignal?.interpretation ?? null,
      approvalCount: desk.decisions.length,
      hasPerformance: Boolean(revenueKpi),
      peerId,
    }),
  };

  const performanceBand: MarketingWorkspacePerformanceBand | null = isDemo
    ? {
        periodLabel: nl ? "Laatste 30 dagen" : "Last 30 days",
        title: nl ? "Performance" : "Performance",
        metrics: buildDemoPerformanceMetrics(nl),
        defaultMetricId: "revenue",
      }
    : (() => {
        const metrics = buildLivePerformanceMetrics({ briefing, performance, nl });
        if (metrics.length === 0) return null;
        return {
          periodLabel:
            briefing.executive.periodLabel ?? (nl ? "Laatste 30 dagen" : "Last 30 days"),
          title: nl ? "Performance" : "Performance",
          metrics,
          defaultMetricId: "revenue" as const,
        };
      })();

  const workspaceBrain = resolveWorkspaceBrainOutput({
    domainInput: input.domainInput,
    locale: input.localePreference,
    isDemo,
    now: input.now,
  });

  const campaignCardsRaw = buildCampaignCards({
    domainInput: input.domainInput,
    work,
    locale,
    isDemo,
    peerId,
  });

  const brainSlices = workspaceBrain
    ? mapWorkspaceSlicesFromBrain({
        brain: workspaceBrain,
        nl,
        performanceHref: officeHref(peerId, "performance"),
        existingCampaignCards: campaignCardsRaw,
      })
    : null;

  const performanceWithBrain =
    performanceBand && brainSlices
      ? {
          ...performanceBand,
          metrics: applyBrainBulletsToMetrics(
            performanceBand.metrics,
            brainSlices.biBulletsByMetric,
            brainSlices.defaultBiBullets
          ),
        }
      : performanceBand;

  const businessIntelligence = buildBusinessIntelligence({
    performance,
    market,
    nl,
    isDemo,
    peerId,
  });

  const campaignCards = brainSlices?.campaignCards.length
    ? brainSlices.campaignCards
    : campaignCardsRaw;

  const campaigns =
    campaignCards.length > 0
      ? {
          title: nl ? "Live campagnes" : "Live campaigns",
          items: [...campaignCards],
          viewAllHref: officeHref(peerId, "work"),
          emptyMessage: null,
          emptyLinkLabel: null,
          emptyLinkHref: null,
        }
      : {
          title: nl ? "Live campagnes" : "Live campaigns",
          items: [],
          viewAllHref: officeHref(peerId, "work"),
          emptyMessage: nl
            ? "Nog geen campagnes live. Start er een vanuit Work."
            : "No campaigns live yet. Start one from Work.",
          emptyLinkLabel: nl ? "Naar Work" : "Go to Work",
          emptyLinkHref: officeHref(peerId, "work"),
        };

  const contentItems = buildContentPreviews({
    domainInput: input.domainInput,
    locale,
    peerId,
    isDemo,
  });

  const content =
    contentItems.length > 0
      ? {
          title: nl ? "Content klaar om te publiceren" : "Content ready to publish",
          items: contentItems,
          viewAllHref: officeHref(peerId, "content"),
        }
      : null;

  const visibleApprovals = desk.decisions.slice(0, MW_APPROVALS_MAX);
  const brainApprovalsRaw = brainSlices?.approvals;
  const brainApprovals =
    brainApprovalsRaw && desk.decisions.length > 0
      ? brainApprovalsRaw
      : null;

  const approvals =
    brainApprovals ??
    (visibleApprovals.length > 0
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
      : null);

  const recommendation =
    brainApprovals || desk.decisions.length > 0
      ? null
      : brainSlices?.recommendation ??
        (briefing.executive.recommendation && topSignal?.recommendation
        ? {
            headline: topSignal.recommendation,
            impact: topSignal.fact ?? briefing.executive.interpretationFact,
            primaryLabel: nl ? "Bekijk aanbeveling" : "View recommendation",
            href: officeHref(peerId, "performance"),
            impactMetrics: undefined,
          }
        : null);

  const activityFromBrain = brainSlices?.activity ?? null;
  const activityLegacy = buildActivityFeed({
    domainInput: input.domainInput,
    locale,
    peerId,
    isDemo,
  });
  const activity = activityFromBrain ?? activityLegacy;

  return {
    overview,
    kpis: { items: kpis },
    performance: performanceWithBrain,
    businessIntelligence,
    campaigns,
    content,
    approvals,
    recommendation,
    activity: activity.items.length > 0 || activity.emptyMessage ? activity : null,
  };
}
