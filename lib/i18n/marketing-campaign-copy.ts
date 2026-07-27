export type MarketingCampaignLocale = "en" | "nl";

export type MarketingCampaignCopy = {
  campaignReviewCompleteBanner: string;
  statusWaitingReview: string;
  statusWorking: string;
  statusPrepared: string;
  statusSetupRequired: string;
  statusReadyToStart: string;
  statusNeedsAttention: string;
  summaryWaitingReview: (count: number) => string;
  summaryWorking: string;
  summaryPrepared: string;
  summarySetup: string;
  summaryReadyToStart: string;
  reviewPrimaryCta: (count: number) => string;
  continueSetup: string;
  startCampaign: string;
  preparationProgress: (prepared: number, total: number) => string;
  campaignPhaseLabel: string;
  currentPhaseExplanation: (phaseLabel: string) => string;
  needsAttentionTitle: string;
  nothingNeedsAttention: string;
  preparedWorkTitle: string;
  preparedWorkEmpty: string;
  activityTitle: string;
  activityCurrentFocus: string;
  activityLatest: string;
  activityNext: string;
  activityPeerWorking: string;
  deliverableApproved: (deliverableType: string) => string;
  peerPreparingNext: string;
  publishDestinationsTitle: string;
  publishComingSoon: string;
  campaignProgressTitle: string;
  phaseStateComplete: string;
  phaseStateCurrent: string;
  phaseStateUpcoming: string;
  phaseStateNotAvailable: string;
  phaseSetup: string;
  phaseStrategy: string;
  phaseCreative: string;
  phaseContent: string;
  phaseReview: string;
  phasePublish: string;
  phaseMeasure: string;
  publishingNotAvailableYet: string;
  moreInformation: string;
  campaignDetails: string;
  audienceLabel: (value: string) => string;
  channelsLabel: (value: string) => string;
  approvalsLabel: (value: string) => string;
  backToProjects: string;
  technicalDetailsDev: string;
  badgeReadyForReview: string;
  badgeApproved: string;
  badgeChangesRequested: string;
  badgeRejected: string;
  badgeUpdating: string;
  badgePrepared: string;
  badgeInProgress: string;
  badgeAwaitingReview: string;
  viewDeliverable: string;
  reviewDeliverable: string;
  versionLabel: (version: number) => string;
  updatedRelative: (label: string) => string;
  historyAndDetails: string;
  versionHistory: string;
  timeline: string;
  compareVersions: string;
  feedbackHistory: string;
  noFeedbackYet: string;
  previousLabel: string;
  currentLabel: string;
  reviewBackToCampaign: string;
  reviewPreparedBy: string;
  reviewPosition: (current: number, total: number) => string;
  reviewQueueSummary: (total: number) => string;
  reviewPrevious: string;
  reviewNext: string;
  reviewNotAvailable: string;
  reviewActionsLoading: string;
  approve: string;
  requestChanges: string;
  reject: string;
  confirmPreparedWork: string;
  letPeerRevise: string;
  returnToCampaign: string;
  readyForYourReview: string;
  itemsRemaining: (count: number) => string;
  approvedStatus: string;
  projectSearchPlaceholder: string;
  projectSearchEmpty: string;
  relativeJustNow: string;
  relativeHoursAgo: (hours: number) => string;
  relativeYesterday: string;
  relativeDaysAgo: (days: number) => string;
  presenceWorking: string;
  presenceWaitingForYou: string;
  presenceCaughtUp: string;
  presencePreparing: string;
  presenceThinking: string;
  presenceNeedsReview: string;
  waitingOnYouTitle: string;
  workingNowTitle: string;
  workingNowCurrently: (label: string) => string;
  workingNowLatestPrefix: string;
  workingNowNextPrefix: string;
  narrativePreparingCampaign: (campaignTitle: string) => string;
  narrativeWaitingForYou: (count: number) => string;
  narrativeWorkingOn: (label: string) => string;
  narrativeCaughtUp: string;
  narrativeNeedsSetup: string;
  narrativeReadyWhenYouAre: string;
  narrativeThinking: string;
  engagementPreparationLabel: string;
  engagementPreparationValue: (prepared: number, total: number) => string;
  engagementCurrentLabel: string;
  engagementNextLabel: string;
  preparedReadyTitle: string;
  peerRoleMarketing: string;
  peerWorkingOnArtifact: (artifactLabel: string) => string;
};

const en: MarketingCampaignCopy = {
  campaignReviewCompleteBanner: "Campaign approved. Marketing Peer is continuing automatically.",
  statusWaitingReview: "Waiting for your review",
  statusWorking: "Marketing Peer is working",
  statusPrepared: "Campaign prepared",
  statusSetupRequired: "Setup required",
  statusReadyToStart: "Ready to start",
  statusNeedsAttention: "Needs attention",
  summaryWaitingReview: (count) =>
    count === 1
      ? "Marketing Peer prepared 1 item for you."
      : `Marketing Peer prepared ${count} items for you.`,
  summaryWorking: "Marketing Peer is preparing your campaign.",
  summaryPrepared: "Everything Marketing Peer can prepare right now is ready.",
  summarySetup: "Finish setup so Marketing Peer can begin preparing your campaign.",
  summaryReadyToStart: "Your campaign is ready for Marketing Peer to begin.",
  reviewPrimaryCta: (count) => (count === 1 ? "Review 1 item" : `Review ${count} items`),
  continueSetup: "Continue setup",
  startCampaign: "Start campaign",
  preparationProgress: (prepared, total) => `Preparation: ${prepared} of ${total} ready`,
  campaignPhaseLabel: "Campaign phase",
  currentPhaseExplanation: (phaseLabel) => `Marketing Peer is focused on ${phaseLabel.toLowerCase()}.`,
  needsAttentionTitle: "Needs your attention",
  nothingNeedsAttention: "Nothing needs your attention right now.",
  preparedWorkTitle: "Prepared work",
  preparedWorkEmpty: "Prepared deliverables will appear here.",
  activityTitle: "Marketing Peer activity",
  activityCurrentFocus: "Current focus",
  activityLatest: "Latest update",
  activityNext: "Next expected step",
  activityPeerWorking: "Marketing Peer is preparing the next deliverable",
  deliverableApproved: (type) => `${type} approved`,
  peerPreparingNext: "Marketing Peer is preparing the next item",
  publishDestinationsTitle: "Future publish destinations",
  publishComingSoon: "coming soon",
  campaignProgressTitle: "Campaign progress",
  phaseStateComplete: "Complete",
  phaseStateCurrent: "Current",
  phaseStateUpcoming: "Upcoming",
  phaseStateNotAvailable: "Not available yet",
  phaseSetup: "Setup",
  phaseStrategy: "Strategy",
  phaseCreative: "Creative",
  phaseContent: "Content",
  phaseReview: "Review",
  phasePublish: "Publish",
  phaseMeasure: "Measure",
  publishingNotAvailableYet: "Publishing is not available yet.",
  moreInformation: "More information",
  campaignDetails: "Campaign details",
  audienceLabel: (value) => `Audience: ${value}`,
  channelsLabel: (value) => `Channels: ${value}`,
  approvalsLabel: (value) => `Approvals: ${value}`,
  backToProjects: "Back to projects",
  technicalDetailsDev: "Technical details (development)",
  badgeReadyForReview: "Ready for review",
  badgeApproved: "Approved",
  badgeChangesRequested: "Changes requested",
  badgeRejected: "Rejected",
  badgeUpdating: "Updating",
  badgePrepared: "Prepared",
  badgeInProgress: "In progress",
  badgeAwaitingReview: "Awaiting review",
  viewDeliverable: "View",
  reviewDeliverable: "Review",
  versionLabel: (version) => `Version ${version}`,
  updatedRelative: (label) => `Updated ${label}`,
  historyAndDetails: "History and details",
  versionHistory: "Version history",
  timeline: "Timeline",
  compareVersions: "Compare versions",
  feedbackHistory: "Feedback history",
  noFeedbackYet: "No customer feedback recorded yet.",
  previousLabel: "Previous",
  currentLabel: "Current",
  reviewBackToCampaign: "Back to campaign",
  reviewPreparedBy: "Prepared by Marketing Peer",
  reviewPosition: (current, total) => `Review ${current} of ${total}`,
  reviewQueueSummary: (total) => `Review queue · ${total} items`,
  reviewPrevious: "Previous",
  reviewNext: "Next",
  reviewNotAvailable: "This review item is not available yet.",
  reviewActionsLoading: "Review actions are still loading. Try again in a moment.",
  approve: "Approve",
  requestChanges: "Request changes",
  reject: "Reject",
  confirmPreparedWork: "Confirm prepared work",
  letPeerRevise: "Let Marketing Peer revise this item",
  returnToCampaign: "Return to campaign",
  readyForYourReview: "Ready for your review",
  itemsRemaining: (count) =>
    count === 1 ? "1 item remaining" : `${count} items remaining`,
  approvedStatus: "Approved",
  projectSearchPlaceholder: "Search campaigns",
  projectSearchEmpty: "No campaigns match your search.",
  relativeJustNow: "Just now",
  relativeHoursAgo: (hours) => `${hours}h ago`,
  relativeYesterday: "Yesterday",
  relativeDaysAgo: (days) => `${days}d ago`,
  presenceWorking: "Working",
  presenceWaitingForYou: "Waiting for you",
  presenceCaughtUp: "Caught up",
  presencePreparing: "Preparing",
  presenceThinking: "Thinking",
  presenceNeedsReview: "Needs your review",
  waitingOnYouTitle: "Waiting on you",
  workingNowTitle: "Working now",
  workingNowCurrently: (label) => `Currently working on ${label.toLowerCase()}.`,
  workingNowLatestPrefix: "Latest completed",
  workingNowNextPrefix: "Next",
  narrativePreparingCampaign: (title) => `I'm preparing your ${title} campaign.`,
  narrativeWaitingForYou: (count) =>
    count === 1
      ? "I've finished something and I'm waiting for your decision."
      : `I've prepared ${count} items and I'm waiting for your decision.`,
  narrativeWorkingOn: (label) => `I'm currently working on the ${label.toLowerCase()}.`,
  narrativeCaughtUp: "I've completed everything I can for now.",
  narrativeNeedsSetup: "I need a little more setup before I can begin.",
  narrativeReadyWhenYouAre: "I'm ready to begin whenever you are.",
  narrativeThinking: "I'm thinking through the next step for your campaign.",
  engagementPreparationLabel: "Preparation",
  engagementPreparationValue: (prepared, total) => `${prepared} of ${total} ready`,
  engagementCurrentLabel: "Current stage",
  engagementNextLabel: "What's next",
  preparedReadyTitle: "Ready to view",
  peerRoleMarketing: "Marketing Peer",
  peerWorkingOnArtifact: (artifactLabel) => `Currently writing the ${artifactLabel.toLowerCase()}.`,
};

const nl: MarketingCampaignCopy = {
  campaignReviewCompleteBanner:
    "Campagne goedgekeurd. Marketing Peer gaat automatisch verder.",
  statusWaitingReview: "Wacht op jouw beoordeling",
  statusWorking: "Marketing Peer is aan het werk",
  statusPrepared: "Campagne voorbereid",
  statusSetupRequired: "Instellen vereist",
  statusReadyToStart: "Klaar om te starten",
  statusNeedsAttention: "Heeft aandacht nodig",
  summaryWaitingReview: (count) =>
    count === 1
      ? "Marketing Peer heeft 1 onderdeel voor je klaargezet."
      : `Marketing Peer heeft ${count} onderdelen voor je klaargezet.`,
  summaryWorking: "Marketing Peer werkt aan je campagne.",
  summaryPrepared: "Alles wat Marketing Peer nu kan voorbereiden is klaar.",
  summarySetup: "Rond de instelling af zodat Marketing Peer kan beginnen.",
  summaryReadyToStart: "Je campagne is klaar om te starten met Marketing Peer.",
  reviewPrimaryCta: (count) =>
    count === 1 ? "Bekijk 1 onderdeel" : `Bekijk ${count} onderdelen`,
  continueSetup: "Instelling voortzetten",
  startCampaign: "Campagne starten",
  preparationProgress: (prepared, total) => `Voorbereiding: ${prepared} van ${total} klaar`,
  campaignPhaseLabel: "Campagnefase",
  currentPhaseExplanation: (phaseLabel) =>
    `Marketing Peer richt zich op ${phaseLabel.toLowerCase()}.`,
  needsAttentionTitle: "Heeft je aandacht nodig",
  nothingNeedsAttention: "Er is nu niets dat je aandacht nodig heeft.",
  preparedWorkTitle: "Voorbereid werk",
  preparedWorkEmpty: "Voorbereide deliverables verschijnen hier.",
  activityTitle: "Activiteit Marketing Peer",
  activityCurrentFocus: "Huidige focus",
  activityLatest: "Laatste update",
  activityNext: "Volgende stap",
  activityPeerWorking: "Marketing Peer bereidt het volgende onderdeel voor",
  deliverableApproved: (type) => `${type} goedgekeurd`,
  peerPreparingNext: "Marketing Peer bereidt het volgende onderdeel voor",
  publishDestinationsTitle: "Toekomstige publicatiekanalen",
  publishComingSoon: "binnenkort beschikbaar",
  campaignProgressTitle: "Campagnevoortgang",
  phaseStateComplete: "Afgerond",
  phaseStateCurrent: "Huidig",
  phaseStateUpcoming: "Komt nog",
  phaseStateNotAvailable: "Nog niet beschikbaar",
  phaseSetup: "Instellen",
  phaseStrategy: "Strategie",
  phaseCreative: "Creatief",
  phaseContent: "Content",
  phaseReview: "Beoordeling",
  phasePublish: "Publiceren",
  phaseMeasure: "Meten",
  publishingNotAvailableYet: "Publiceren is nog niet beschikbaar.",
  moreInformation: "Meer informatie",
  campaignDetails: "Campagnedetails",
  audienceLabel: (value) => `Doelgroep: ${value}`,
  channelsLabel: (value) => `Kanalen: ${value}`,
  approvalsLabel: (value) => `Goedkeuring: ${value}`,
  backToProjects: "Terug naar projecten",
  technicalDetailsDev: "Technische details (ontwikkeling)",
  badgeReadyForReview: "Klaar voor beoordeling",
  badgeApproved: "Goedgekeurd",
  badgeChangesRequested: "Wijzigingen gevraagd",
  badgeRejected: "Afgewezen",
  badgeUpdating: "Wordt bijgewerkt",
  badgePrepared: "Voorbereid",
  badgeInProgress: "Bezig",
  badgeAwaitingReview: "Wacht op beoordeling",
  viewDeliverable: "Bekijken",
  reviewDeliverable: "Beoordelen",
  versionLabel: (version) => `Versie ${version}`,
  updatedRelative: (label) => `Bijgewerkt ${label}`,
  historyAndDetails: "Geschiedenis en details",
  versionHistory: "Versiegeschiedenis",
  timeline: "Tijdlijn",
  compareVersions: "Versies vergelijken",
  feedbackHistory: "Feedbackgeschiedenis",
  noFeedbackYet: "Nog geen feedback vastgelegd.",
  previousLabel: "Vorige",
  currentLabel: "Huidig",
  reviewBackToCampaign: "Terug naar campagne",
  reviewPreparedBy: "Voorbereid door Marketing Peer",
  reviewPosition: (current, total) => `Beoordeling ${current} van ${total}`,
  reviewQueueSummary: (total) => `Beoordelingswachtrij · ${total} items`,
  reviewPrevious: "Vorige",
  reviewNext: "Volgende",
  reviewNotAvailable: "Dit beoordelingsitem is nog niet beschikbaar.",
  reviewActionsLoading: "Beoordelingsacties laden. Probeer het zo opnieuw.",
  approve: "Goedkeuren",
  requestChanges: "Wijzigingen vragen",
  reject: "Afwijzen",
  confirmPreparedWork: "Voorbereid werk bevestigen",
  letPeerRevise: "Laat Marketing Peer dit onderdeel herzien",
  returnToCampaign: "Terug naar campagne",
  readyForYourReview: "Klaar voor jouw beoordeling",
  itemsRemaining: (count) =>
    count === 1 ? "Nog 1 onderdeel" : `Nog ${count} onderdelen`,
  approvedStatus: "Goedgekeurd",
  projectSearchPlaceholder: "Campagnes zoeken",
  projectSearchEmpty: "Geen campagnes gevonden voor je zoekopdracht.",
  relativeJustNow: "Zojuist",
  relativeHoursAgo: (hours) => `${hours} u geleden`,
  relativeYesterday: "Gisteren",
  relativeDaysAgo: (days) => `${days} d geleden`,
  presenceWorking: "Bezig",
  presenceWaitingForYou: "Wacht op jou",
  presenceCaughtUp: "Alles bij",
  presencePreparing: "Voorbereiden",
  presenceThinking: "Nadenken",
  presenceNeedsReview: "Jouw beoordeling nodig",
  waitingOnYouTitle: "Wacht op jou",
  workingNowTitle: "Nu bezig",
  workingNowCurrently: (label) => `Bezig met ${label.toLowerCase()}.`,
  workingNowLatestPrefix: "Laatst afgerond",
  workingNowNextPrefix: "Daarna",
  narrativePreparingCampaign: (title) => `Ik bereid je ${title}-campagne voor.`,
  narrativeWaitingForYou: (count) =>
    count === 1
      ? "Ik heb iets afgerond en wacht op jouw beslissing."
      : `Ik heb ${count} onderdelen klaargezet en wacht op jouw beslissing.`,
  narrativeWorkingOn: (label) => `Ik werk nu aan ${label.toLowerCase()}.`,
  narrativeCaughtUp: "Ik heb alles afgerond wat ik nu kan.",
  narrativeNeedsSetup: "Ik heb nog wat instellingen nodig voordat ik kan beginnen.",
  narrativeReadyWhenYouAre: "Ik kan beginnen wanneer jij er klaar voor bent.",
  narrativeThinking: "Ik bedenk de volgende stap voor je campagne.",
  engagementPreparationLabel: "Voorbereiding",
  engagementPreparationValue: (prepared, total) => `${prepared} van ${total} klaar`,
  engagementCurrentLabel: "Huidige fase",
  engagementNextLabel: "Wat volgt",
  preparedReadyTitle: "Klaar om te bekijken",
  peerRoleMarketing: "Marketing Peer",
  peerWorkingOnArtifact: (artifactLabel) => `Bezig met ${artifactLabel.toLowerCase()}.`,
};

const COPY: Record<MarketingCampaignLocale, MarketingCampaignCopy> = { en, nl };

export function getMarketingCampaignCopy(
  locale: MarketingCampaignLocale = "en"
): MarketingCampaignCopy {
  return COPY[locale];
}

export function resolveMarketingCampaignLocale(value?: string | null): MarketingCampaignLocale {
  if (value === "nl") return "nl";
  return "en";
}

export function formatMarketingRelativeTime(
  iso: string,
  copy: MarketingCampaignCopy
): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return copy.relativeJustNow;
    if (hours < 24) return copy.relativeHoursAgo(hours);
    const days = Math.floor(hours / 24);
    if (days === 1) return copy.relativeYesterday;
    return copy.relativeDaysAgo(days);
  } catch {
    return "";
  }
}
