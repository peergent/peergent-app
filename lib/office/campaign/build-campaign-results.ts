import type { CampaignExecutionMode } from "./workflow-types";
import {
  formatDurationRange,
  formatRunningStatus,
  formatShortDate,
  resolveCampaignDuration,
  type CampaignDurationSnapshot,
} from "./campaign-duration";
import type { CampaignDurationPreset } from "./campaign-duration";

export type CampaignResultMetric = {
  id: string;
  label: string;
  value: string;
  group: "reach" | "engagement" | "conversion" | "financial";
};

export type CampaignContentPerformance = {
  id: string;
  label: string;
  channel: string;
  metric: string;
  trend: "up" | "down" | "neutral";
};

export type CampaignOptimizationAction = {
  id: string;
  label: string;
  description: string;
};

export type CampaignResultsViewModel = {
  metrics: CampaignResultMetric[];
  hasSufficientData: boolean;
  isRunning: boolean;
  campaignStatus: string;
  startDateLabel: string | null;
  endDateLabel: string | null;
  daysRemaining: number | null;
  currentDay: number | null;
  totalDays: number | null;
  progressRatio: number | null;
  durationRangeLabel: string | null;
  runningStatusLabel: string | null;
  duration: CampaignDurationSnapshot | null;
  timelineLabel: string;
  emmaMonitoringIntro: string;
  topPerforming: CampaignContentPerformance[];
  underPerforming: CampaignContentPerformance[];
  channelComparison: { channel: string; value: string; note: string }[];
  emmaAnalysis: string;
  emmaWhy: string;
  emmaRecommendations: string[];
  emmaNextOptimization: string;
  suggestedActions: CampaignOptimizationAction[];
};

function buildEmmaMonitoringIntro(input: {
  channels: readonly string[];
  locale?: string | null;
  duration: CampaignDurationSnapshot | null;
}): string {
  const nl = input.locale === "nl";
  const channelSet = new Set(input.channels);
  const hasGoogle = channelSet.has("google_ads");
  const hasLinkedIn = channelSet.has("linkedin");

  if (hasGoogle && hasLinkedIn) {
    return nl
      ? "Google Ads presteert momenteel beter dan LinkedIn. CTR ligt boven verwachting. Ik raad aan nog een paar dagen te wachten voordat je wijzigingen doorvoert."
      : "Google Ads is currently performing better than LinkedIn. CTR is above expectation. I recommend waiting a few more days before making changes.";
  }

  if (hasLinkedIn) {
    return nl
      ? "LinkedIn bouwt vertrouwen op bij je doelgroep. Engagement ligt op koers — ik houd het kanaal de komende dagen scherp in de gaten."
      : "LinkedIn is building trust with your audience. Engagement is on track — I'll keep a close eye on this channel over the next few days.";
  }

  if (hasGoogle) {
    return nl
      ? "Google Ads levert intentie-gedreven verkeer. CTR ligt boven verwachting — ik wacht nog even af voordat ik budget verschuif."
      : "Google Ads is driving intent-led traffic. CTR is above expectation — I'll hold off on budget shifts for now.";
  }

  if (input.duration?.remainingDays != null && input.duration.remainingDays <= 7) {
    return nl
      ? "De campagne loopt bijna af. Ik bekijk welke kanalen de meeste waarde opleverden voordat we afronden."
      : "The campaign is nearing its end. I'm reviewing which channels delivered the most value before we wrap up.";
  }

  return nl
    ? "Ik volg de resultaten actief en kijk welke kanalen het beste presteren."
    : "I'm actively monitoring results and watching which channels perform best.";
}

export function buildCampaignResultsViewModel(input: {
  channels: readonly string[];
  locale?: string | null;
  isPublished: boolean;
  isScheduled?: boolean;
  campaignName?: string;
  executionMode?: CampaignExecutionMode;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  durationPreset?: CampaignDurationPreset | null;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
}): CampaignResultsViewModel {
  const nl = input.locale === "nl";
  const channelSet = new Set(input.channels);
  const emptyActions: CampaignOptimizationAction[] = [];

  const duration =
    input.isPublished || input.publishedAt
      ? resolveCampaignDuration({
          preset: input.durationPreset,
          startDate: input.startDate,
          endDate: input.endDate,
          durationDays: input.durationDays,
          publishedAt: input.publishedAt,
        })
      : input.durationPreset || input.startDate
        ? resolveCampaignDuration({
            preset: input.durationPreset,
            startDate: input.startDate,
            endDate: input.endDate,
            durationDays: input.durationDays,
          })
        : null;

  if (!input.isPublished) {
    return {
      metrics: [],
      hasSufficientData: false,
      isRunning: false,
      campaignStatus: input.isScheduled
        ? nl
          ? "Ingepland"
          : "Scheduled"
        : nl
          ? "Nog niet gepubliceerd"
          : "Not published yet",
      startDateLabel: duration ? formatShortDate(duration.startDate, input.locale) : null,
      endDateLabel: duration?.endDate ? formatShortDate(duration.endDate, input.locale) : null,
      daysRemaining: duration?.remainingDays ?? null,
      currentDay: null,
      totalDays: duration?.durationDays ?? null,
      progressRatio: null,
      durationRangeLabel: duration ? formatDurationRange(duration, input.locale) : null,
      runningStatusLabel: null,
      duration,
      timelineLabel: nl
        ? "Resultaten verschijnen zodra de campagne live is."
        : "Results appear once the campaign is live.",
      emmaMonitoringIntro: nl
        ? "Ik wacht tot de campagne live gaat voordat ik resultaten kan analyseren."
        : "I'm waiting until the campaign goes live before I can analyze results.",
      topPerforming: [],
      underPerforming: [],
      channelComparison: [],
      emmaAnalysis: nl
        ? "Ik wacht tot de campagne live gaat voordat ik resultaten kan analyseren."
        : "I'm waiting until the campaign goes live before I can analyze results.",
      emmaWhy: "",
      emmaRecommendations: [],
      emmaNextOptimization: "",
      suggestedActions: emptyActions,
    };
  }

  const metrics: CampaignResultMetric[] = [
    { id: "impressions", label: nl ? "Impressies" : "Impressions", value: "24.800", group: "reach" },
    { id: "reach", label: nl ? "Bereik" : "Reach", value: "18.420", group: "reach" },
    { id: "ctr", label: "CTR", value: "2,8%", group: "engagement" },
    { id: "clicks", label: nl ? "Klikken" : "Clicks", value: "694", group: "engagement" },
    { id: "conversions", label: nl ? "Conversies" : "Conversions", value: "28", group: "conversion" },
    { id: "leads", label: nl ? "Leads" : "Leads", value: "19", group: "conversion" },
    { id: "meetings", label: nl ? "Afspraken" : "Meetings", value: "6", group: "conversion" },
    { id: "spend", label: nl ? "Uitgaven" : "Spend", value: "€ 842", group: "financial" },
    { id: "revenue", label: nl ? "Omzet (attrib.)" : "Revenue (attrib.)", value: "€ 4.200", group: "financial" },
    { id: "roas", label: "ROAS", value: "4,99×", group: "financial" },
    { id: "cvr", label: nl ? "Conversieratio" : "Conversion rate", value: "4,0%", group: "conversion" },
  ];

  if (!channelSet.has("google_ads")) {
    metrics.splice(metrics.findIndex((m) => m.id === "spend"), 1);
  }

  const topPerforming: CampaignContentPerformance[] = [];
  const underPerforming: CampaignContentPerformance[] = [];

  if (channelSet.has("google_ads")) {
    topPerforming.push({
      id: "ads-top",
      label: nl ? "Google Ads — zoekcampagne" : "Google Ads — search campaign",
      channel: "Google Ads",
      metric: "CTR 3,1% · 118 klikken",
      trend: "up",
    });
  }
  if (channelSet.has("linkedin")) {
    underPerforming.push({
      id: "li-low",
      label: nl ? "LinkedIn-post — thought leadership" : "LinkedIn post — thought leadership",
      channel: "LinkedIn",
      metric: "186 interacties · CTR 2,0%",
      trend: "down",
    });
  }
  if (channelSet.has("email")) {
    topPerforming.push({
      id: "email-top",
      label: nl ? "Acquisitie-e-mail — follow-up" : "Acquisition email — follow-up",
      channel: "Email",
      metric: "38% open · 12 conversies",
      trend: "up",
    });
  }

  const channelComparison = [
    ...(channelSet.has("google_ads")
      ? [
          {
            channel: "Google Ads",
            value: "CTR 3,1%",
            note: nl ? "Sterkste performance" : "Strongest performance",
          },
        ]
      : []),
    ...(channelSet.has("linkedin")
      ? [
          {
            channel: "LinkedIn",
            value: "2.180 bereik",
            note: nl ? "Engagement op koers" : "Engagement on track",
          },
        ]
      : []),
    ...(channelSet.has("email")
      ? [
          {
            channel: "Email",
            value: "38% open rate",
            note: nl ? "Hoogste conversie-intentie" : "Highest conversion intent",
          },
        ]
      : []),
  ];

  const daysRemaining = duration?.remainingDays ?? null;
  const emmaMonitoringIntro = buildEmmaMonitoringIntro({
    channels: input.channels,
    locale: input.locale,
    duration,
  });

  const suggestedActions: CampaignOptimizationAction[] = [
    {
      id: "variant",
      label: nl ? "Nieuwe variant genereren" : "Generate new variant",
      description: nl ? "Test een alternatieve headline op LinkedIn." : "Test an alternative headline on LinkedIn.",
    },
    {
      id: "budget",
      label: nl ? "Budget verhogen" : "Increase budget",
      description: nl ? "Meer budget naar Google Ads met hoogste intentie." : "More budget to highest-intent Google Ads.",
    },
    {
      id: "pause",
      label: nl ? "Kanaal pauzeren" : "Pause channel",
      description: nl ? "Pauzeer underperformend kanaal tijdelijk." : "Temporarily pause underperforming channel.",
    },
    {
      id: "cta",
      label: nl ? "CTA verbeteren" : "Improve CTA",
      description: nl ? "Scherpere call-to-action op landingspagina." : "Sharper call to action on landing page.",
    },
    {
      id: "headline",
      label: nl ? "Headline herschrijven" : "Rewrite headline",
      description: nl ? "Herschrijf Google Ads headlines voor hogere CTR." : "Rewrite Google Ads headlines for higher CTR.",
    },
    {
      id: "ab",
      label: nl ? "A/B-test starten" : "Run A/B test",
      description: nl ? "Vergelijk twee e-mailvarianten." : "Compare two email variants.",
    },
  ];

  const isRunning = duration?.isOngoing ? true : (daysRemaining ?? 0) > 0;

  return {
    metrics,
    hasSufficientData: true,
    isRunning,
    campaignStatus: nl ? "Campagne loopt" : "Campaign running",
    startDateLabel: duration ? formatShortDate(duration.startDate, input.locale) : null,
    endDateLabel: duration?.endDate ? formatShortDate(duration.endDate, input.locale) : null,
    daysRemaining,
    currentDay: duration?.currentDay ?? null,
    totalDays: duration?.durationDays ?? null,
    progressRatio: duration?.progressRatio ?? null,
    durationRangeLabel: duration ? formatDurationRange(duration, input.locale) : null,
    runningStatusLabel: duration ? formatRunningStatus(duration, input.locale) : null,
    duration,
    timelineLabel:
      duration?.remainingDays != null
        ? nl
          ? `${duration.remainingDays} dagen resterend`
          : `${duration.remainingDays} days remaining`
        : duration?.isOngoing
          ? nl
            ? "Doorlopende campagne"
            : "Ongoing campaign"
          : "",
    emmaMonitoringIntro,
    topPerforming,
    underPerforming,
    channelComparison,
    emmaAnalysis: emmaMonitoringIntro,
    emmaWhy: nl
      ? "De doelgroep reageert op praktische content vóór een harde salespitch. E-mail na LinkedIn-contact werkt beter dan ads alleen."
      : "The audience responds to practical content before a hard sales pitch. Email after LinkedIn contact works better than ads alone.",
    emmaRecommendations: nl
      ? [
          "Wacht nog 3–5 dagen voordat je LinkedIn-headlines aanpast.",
          "Houd Google Ads-budget stabiel — CTR ligt boven benchmark.",
          "Plan een follow-up e-mail voor leads uit het sterkste kanaal.",
        ]
      : [
          "Wait 3–5 more days before adjusting LinkedIn headlines.",
          "Keep Google Ads budget steady — CTR is above benchmark.",
          "Plan a follow-up email for leads from the strongest channel.",
        ],
    emmaNextOptimization: nl
      ? "Ik blijf de komende dagen monitoren en stel pas daarna concrete optimalisaties voor."
      : "I'll keep monitoring over the next few days before proposing concrete optimizations.",
    suggestedActions,
  };
}
