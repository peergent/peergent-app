import { resolveMarketingCampaignLocale, type MarketingCampaignLocale } from "./marketing-campaign-copy";

export type V17CampaignCopy = {
  backToCampaigns: string;
  backToCampaign: string;
  waitingForYou: (count: number) => string;
  waitingSummary: (count: number) => string;
  reviewCta: string;
  viewCta: string;
  progressTitle: string;
  progressParts: (done: number, total: number) => string;
  currentPhase: string;
  nextStep: string;
  deliverablesTitle: string;
  completedTitle: string;
  viewHistory: string;
  detailsTitle: string;
  openInspector: string;
  reviewPreparedBy: string;
  reviewPrevious: string;
  reviewNext: string;
  reviewPosition: (current: number, total: number) => string;
  sectionExecutiveSummary: string;
  sectionPositioning: string;
  sectionMessagingPillars: string;
  sectionRecommendedChannels: string;
  sectionCtaGuidance: string;
  sectionCampaignConcept: string;
  sectionTone: string;
  sectionVisualDirection: string;
  stateReadyForReview: string;
  stateApproved: string;
  stateInProgress: string;
  statePreparing: string;
  stateCompleted: string;
  stateBlocked: string;
};

const nl: V17CampaignCopy = {
  backToCampaigns: "← Terug naar campagnes",
  backToCampaign: "← Terug naar campagne",
  waitingForYou: (n) => `Wacht op jou — ${n}`,
  waitingSummary: (n) =>
    n === 1
      ? "1 campagneonderdeel staat klaar voor beoordeling."
      : `${n} campagneonderdelen staan klaar voor beoordeling.`,
  reviewCta: "Beoordelen",
  viewCta: "Bekijken",
  progressTitle: "Voortgang",
  progressParts: (done, total) => `${done} van ${total} onderdelen afgerond`,
  currentPhase: "Huidige fase",
  nextStep: "Volgende stap",
  deliverablesTitle: "Campagne-output",
  completedTitle: "Afgerond",
  viewHistory: "Bekijk geschiedenis ›",
  detailsTitle: "Campagnedetails",
  openInspector: "Open inspector",
  reviewPreparedBy: "Voorbereid door Marketing Peer",
  reviewPrevious: "Vorige",
  reviewNext: "Volgende",
  reviewPosition: (c, t) => `Beoordeling ${c} van ${t}`,
  sectionExecutiveSummary: "Samenvatting",
  sectionPositioning: "Positionering",
  sectionMessagingPillars: "Kernboodschappen",
  sectionRecommendedChannels: "Aanbevolen kanalen",
  sectionCtaGuidance: "Call-to-action",
  sectionCampaignConcept: "Campagneconcept",
  sectionTone: "Tone of voice",
  sectionVisualDirection: "Visuele richting",
  stateReadyForReview: "Klaar voor beoordeling",
  stateApproved: "Goedgekeurd",
  stateInProgress: "In voorbereiding",
  statePreparing: "In voorbereiding",
  stateCompleted: "Afgerond",
  stateBlocked: "Geblokkeerd",
};

const en: V17CampaignCopy = {
  backToCampaigns: "← Back to campaigns",
  backToCampaign: "← Back to campaign",
  waitingForYou: (n) => `Waiting for you — ${n}`,
  waitingSummary: (n) =>
    n === 1 ? "1 campaign item is ready for review." : `${n} campaign items are ready for review.`,
  reviewCta: "Review",
  viewCta: "View",
  progressTitle: "Progress",
  progressParts: (done, total) => `${done} of ${total} parts complete`,
  currentPhase: "Current phase",
  nextStep: "Next step",
  deliverablesTitle: "Campaign outputs",
  completedTitle: "Completed",
  viewHistory: "View history ›",
  detailsTitle: "Campaign details",
  openInspector: "Open inspector",
  reviewPreparedBy: "Prepared by Marketing Peer",
  reviewPrevious: "Previous",
  reviewNext: "Next",
  reviewPosition: (c, t) => `Review ${c} of ${t}`,
  sectionExecutiveSummary: "Executive summary",
  sectionPositioning: "Positioning",
  sectionMessagingPillars: "Messaging pillars",
  sectionRecommendedChannels: "Recommended channels",
  sectionCtaGuidance: "CTA guidance",
  sectionCampaignConcept: "Campaign concept",
  sectionTone: "Tone of voice",
  sectionVisualDirection: "Visual direction",
  stateReadyForReview: "Ready for review",
  stateApproved: "Approved",
  stateInProgress: "In progress",
  statePreparing: "Preparing",
  stateCompleted: "Completed",
  stateBlocked: "Blocked",
};

export function getV17CampaignCopy(localePreference?: string | null): V17CampaignCopy {
  const locale: MarketingCampaignLocale = resolveMarketingCampaignLocale(localePreference);
  return locale === "nl" ? nl : en;
}
