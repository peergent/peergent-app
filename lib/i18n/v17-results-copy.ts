import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";

export type V17ResultsRangeId = "week" | "month" | "quarter" | "all";

export type V17ResultsCopy = {
  title: string;
  subtitle: string;
  rangeAriaLabel: string;
  ranges: Record<V17ResultsRangeId, string>;

  executiveSummary: string;
  latestDeliverables: string;
  peerActivity: string;
  insightsTitle: string;
  attentionTitle: string;

  kpiCompleted: string;
  kpiCompletedWhy: (count: number) => string;
  kpiRunning: string;
  kpiRunningWhy: (count: number) => string;
  kpiReach: string;
  kpiReachWhy: string;
  kpiLeads: string;
  kpiLeadsWhy: string;

  /** Shown instead of a number when no channel can supply the value yet. */
  notConnected: string;
  reachNeeds: string;
  leadsNeeds: string;
  connectCta: string;

  statusApproved: string;
  statusScheduled: string;
  statusPublished: string;
  statusNeedsApproval: string;
  statusDraft: string;

  recommendationLabel: string;
  viewAll: string;

  emptyDeliverables: string;
  emptyActivity: string;
  emptyInsights: string;

  onboardingHeadline: string;
  onboardingBody: string;
  onboardingCta: string;

  insightPublishingGap: (days: number) => string;
  insightPublishingGapRec: string;
  insightDuplicateAudience: (audience: string) => string;
  insightDuplicateAudienceRec: string;
};

const en: V17ResultsCopy = {
  title: "Marketing Results",
  subtitle: "See what your Marketing Peer has accomplished for your business.",
  rangeAriaLabel: "Date range",
  ranges: {
    week: "This week",
    month: "This month",
    quarter: "This quarter",
    all: "All time",
  },

  executiveSummary: "Executive summary",
  latestDeliverables: "Latest deliverables",
  peerActivity: "Peer activity",
  insightsTitle: "Insights from your Marketing Peer",
  attentionTitle: "Attention needed",

  kpiCompleted: "Campaigns completed",
  kpiCompletedWhy: (count) =>
    count === 1
      ? "Your Peer delivered one campaign in this period."
      : `Your Peer delivered ${count} campaigns in this period.`,
  kpiRunning: "Campaigns currently running",
  kpiRunningWhy: (count) =>
    count === 1
      ? "One campaign is in progress right now."
      : `${count} campaigns are in progress right now.`,
  kpiReach: "Estimated reach",
  kpiReachWhy: "How many people your campaigns put your business in front of.",
  kpiLeads: "Qualified leads generated",
  kpiLeadsWhy: "New potential customers your campaigns brought in.",

  notConnected: "Not connected yet",
  reachNeeds: "Connect an advertising or analytics channel to see reach here.",
  leadsNeeds: "Connect your CRM to see qualified leads here.",
  connectCta: "Set up connection",

  statusApproved: "Approved",
  statusScheduled: "Scheduled",
  statusPublished: "Published",
  statusNeedsApproval: "Needs approval",
  statusDraft: "Draft",

  recommendationLabel: "What I'd suggest",
  viewAll: "View all ›",

  emptyDeliverables: "Work your Peer produces will appear here.",
  emptyActivity: "Your Peer's activity will appear here as work progresses.",
  emptyInsights: "Your Peer is watching for patterns worth telling you about.",

  onboardingHeadline: "Your Marketing Peer is ready.",
  onboardingBody:
    "Create your first campaign to start generating marketing results.",
  onboardingCta: "Create first campaign",

  insightPublishingGap: (days) =>
    `Nothing has been published for ${days} days.`,
  insightPublishingGapRec:
    "Publishing regularly keeps your audience warm — consider approving what's waiting.",
  insightDuplicateAudience: (audience) =>
    `Two campaigns are targeting the same audience: ${audience}.`,
  insightDuplicateAudienceRec:
    "Consider splitting the audience so the campaigns don't compete with each other.",
};

const nl: V17ResultsCopy = {
  title: "Marketingresultaten",
  subtitle: "Bekijk wat je Marketing Peer voor je bedrijf heeft bereikt.",
  rangeAriaLabel: "Periode",
  ranges: {
    week: "Deze week",
    month: "Deze maand",
    quarter: "Dit kwartaal",
    all: "Alles",
  },

  executiveSummary: "Samenvatting",
  latestDeliverables: "Laatste opgeleverd werk",
  peerActivity: "Activiteit van je Peer",
  insightsTitle: "Inzichten van je Marketing Peer",
  attentionTitle: "Vraagt je aandacht",

  kpiCompleted: "Campagnes afgerond",
  kpiCompletedWhy: (count) =>
    count === 1
      ? "Je Peer heeft in deze periode één campagne opgeleverd."
      : `Je Peer heeft in deze periode ${count} campagnes opgeleverd.`,
  kpiRunning: "Campagnes nu actief",
  kpiRunningWhy: (count) =>
    count === 1
      ? "Er loopt op dit moment één campagne."
      : `Er lopen op dit moment ${count} campagnes.`,
  kpiReach: "Geschat bereik",
  kpiReachWhy: "Hoeveel mensen je campagnes met je bedrijf in contact brachten.",
  kpiLeads: "Gekwalificeerde leads",
  kpiLeadsWhy: "Nieuwe potentiële klanten die je campagnes opleverden.",

  notConnected: "Nog niet gekoppeld",
  reachNeeds: "Koppel een advertentie- of analyticskanaal om bereik hier te zien.",
  leadsNeeds: "Koppel je CRM om gekwalificeerde leads hier te zien.",
  connectCta: "Koppeling instellen",

  statusApproved: "Goedgekeurd",
  statusScheduled: "Ingepland",
  statusPublished: "Gepubliceerd",
  statusNeedsApproval: "Wacht op goedkeuring",
  statusDraft: "Concept",

  recommendationLabel: "Wat ik zou doen",
  viewAll: "Bekijk alles ›",

  emptyDeliverables: "Werk dat je Peer oplevert verschijnt hier.",
  emptyActivity: "De activiteit van je Peer verschijnt hier zodra werk vordert.",
  emptyInsights: "Je Peer let op patronen die het waard zijn om te melden.",

  onboardingHeadline: "Je Marketing Peer is klaar.",
  onboardingBody:
    "Maak je eerste campagne aan om marketingresultaten te genereren.",
  onboardingCta: "Eerste campagne maken",

  insightPublishingGap: (days) =>
    `Er is al ${days} dagen niets gepubliceerd.`,
  insightPublishingGapRec:
    "Regelmatig publiceren houdt je publiek warm — overweeg goed te keuren wat klaarstaat.",
  insightDuplicateAudience: (audience) =>
    `Twee campagnes richten zich op dezelfde doelgroep: ${audience}.`,
  insightDuplicateAudienceRec:
    "Overweeg de doelgroep te splitsen zodat de campagnes niet met elkaar concurreren.",
};

const COPY: Record<MarketingCampaignLocale, V17ResultsCopy> = { en, nl };

export function getV17ResultsCopy(
  localePreference?: string | null
): V17ResultsCopy {
  const locale: MarketingCampaignLocale =
    localePreference === "nl" || localePreference?.startsWith("nl") ? "nl" : "en";
  return COPY[locale];
}
