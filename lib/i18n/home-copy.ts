export type HomeUiCopy = {
  morningBriefing: string;
  agentAction: string;
  needsYourAttention: string;
  currentlyWorking: string;
  seeAllPeers: string;
  openWorkspace: string;
  open: string;
  completedBy: (peerName: string) => string;
  workforceWorking: string;
  colleaguesActiveSingle: string;
  colleaguesActiveMultiple: (count: number) => string;
  activeBadgeSingle: string;
  activeBadgeMultiple: (count: number) => string;
  decisionSingleMorning: string;
  primaryStatusWaitingReview: string;
  primaryStatusNeededToContinue: string;
  primaryStatusInProgress: string;
  primaryStatusReadyForReview: string;
  relativeJustNow: string;
  relativeHoursAgo: (hours: number) => string;
  relativeYesterday: string;
  relativeDaysAgo: (days: number) => string;
};

export type HomeLocale = "en" | "nl";

export type HomeCopy = {
  pageTitle: string;
  needsYou: string;
  needsYouViewAll: string;
  suggestedStartLabel: string;
  teamPulse: string;
  teamPulseViewTeam: string;
  recentMovement: string;
  recentMovementEmpty: string;
  contextHealth: string;
  contextHealthImprove: string;
  activeWorkstreams: string;
  activeWorkstreamsEmpty: string;
  loadingNarrative: string;
  errorTitle: string;
  errorRetry: string;
  emptyPeersTitle: string;
  emptyPeersBody: string;
  emptyPeersCta: string;
  allCaughtUp: string;
  allCaughtUpBody: string;
  contextNotLoaded: string;
  contextNotLoadedBody: string;
  openKnowledge: string;
  estReviewMinutes: string;
  ui: HomeUiCopy;
  narratives: {
    needsYouSingle: (peerName: string, itemTitle: string) => string;
    needsYouMultiple: (count: number) => string;
    whileAway: (summary: string) => string;
    calm: (peerName: string) => string;
    welcome: string;
    welcomeBody: string;
  };
  needsYouItems: {
    reviewDraft: string;
    confirmPublication: string;
    preparePublication: string;
    improveContext: string;
    createStrategy: string;
    buildPlan: string;
  };
  teamStatus: {
    waitingForYou: string;
    working: string;
    idle: string;
    paused: string;
    monitoring: string;
    campaignComplete: string;
  };
};

const enUi: HomeUiCopy = {
  morningBriefing: "Morning briefing",
  agentAction: "Agent Action",
  needsYourAttention: "Needs your attention",
  currentlyWorking: "Currently working",
  seeAllPeers: "See all your peers",
  openWorkspace: "Open workspace",
  open: "Open",
  completedBy: (peerName) => `Completed by ${peerName}`,
  workforceWorking: "Your workforce is working —",
  colleaguesActiveSingle: "1 colleague is active right now.",
  colleaguesActiveMultiple: (count) => `${count} colleagues are active right now.`,
  activeBadgeSingle: "1 active",
  activeBadgeMultiple: (count) => `${count} active`,
  decisionSingleMorning: "You only have one decision to make this morning.",
  primaryStatusWaitingReview: "Waiting for your review",
  primaryStatusNeededToContinue: "Needed to continue",
  primaryStatusInProgress: "In progress",
  primaryStatusReadyForReview: "Ready for your review",
  relativeJustNow: "Just now",
  relativeHoursAgo: (hours) => `${hours}h ago`,
  relativeYesterday: "Yesterday",
  relativeDaysAgo: (days) => `${days}d ago`,
};

const nlUi: HomeUiCopy = {
  morningBriefing: "Ochtendbriefing",
  agentAction: "Agentactie",
  needsYourAttention: "Heeft je aandacht nodig",
  currentlyWorking: "Nu bezig",
  seeAllPeers: "Bekijk al je collega's",
  openWorkspace: "Open workspace",
  open: "Openen",
  completedBy: (peerName) => `Afgerond door ${peerName}`,
  workforceWorking: "Je workforce is aan het werk —",
  colleaguesActiveSingle: "1 collega is nu actief.",
  colleaguesActiveMultiple: (count) => `${count} collega's zijn nu actief.`,
  activeBadgeSingle: "1 actief",
  activeBadgeMultiple: (count) => `${count} actief`,
  decisionSingleMorning: "Je hoeft vanochtend maar één beslissing te nemen.",
  primaryStatusWaitingReview: "Wacht op je review",
  primaryStatusNeededToContinue: "Nodig om verder te gaan",
  primaryStatusInProgress: "Bezig",
  primaryStatusReadyForReview: "Klaar voor je review",
  relativeJustNow: "Zojuist",
  relativeHoursAgo: (hours) => `${hours} u geleden`,
  relativeYesterday: "Gisteren",
  relativeDaysAgo: (days) => `${days} d geleden`,
};

const en: HomeCopy = {
  pageTitle: "Command Center",
  needsYou: "Needs you",
  needsYouViewAll: "View all",
  suggestedStartLabel: "Suggested start",
  teamPulse: "Team pulse",
  teamPulseViewTeam: "View team",
  recentMovement: "Recent movement",
  recentMovementEmpty: "No recent activity yet. Work will show up here as your team progresses.",
  contextHealth: "Business context",
  contextHealthImprove: "Improve",
  activeWorkstreams: "Active workstreams",
  activeWorkstreamsEmpty: "No active campaigns yet.",
  loadingNarrative: "Preparing your morning…",
  errorTitle: "Couldn't load Home",
  errorRetry: "Try again",
  emptyPeersTitle: "Build your AI team",
  emptyPeersBody: "Hire your first colleague to get started.",
  emptyPeersCta: "Get started",
  allCaughtUp: "All caught up",
  allCaughtUpBody: "Nothing needs you right now. Your team is moving forward.",
  contextNotLoaded: "Business context not loaded yet",
  contextNotLoadedBody: "Import your company knowledge so Maya can work with full context.",
  openKnowledge: "Open company profile",
  estReviewMinutes: "Est. 2 min",
  ui: enUi,
  narratives: {
    needsYouSingle: (peerName, itemTitle) =>
      `${peerName} needs you — ${itemTitle.toLowerCase()}.`,
    needsYouMultiple: (count) =>
      `${count} items need your attention today.`,
    whileAway: (summary) => `While you were away, ${summary}`,
    calm: (peerName) =>
      `${peerName} is on track. Nothing needs you right now.`,
    welcome: "Welcome to Peergent",
    welcomeBody: "Let's set up your company and meet your first colleague.",
  },
  needsYouItems: {
    reviewDraft: "Review content",
    confirmPublication: "Confirm publication",
    preparePublication: "Prepare to publish",
    improveContext: "Improve business context",
    createStrategy: "Review marketing strategy",
    buildPlan: "Review campaign plan",
  },
  teamStatus: {
    waitingForYou: "Waiting for you",
    working: "Working",
    idle: "Ready",
    paused: "Paused",
    monitoring: "Monitoring campaign",
    campaignComplete: "Campaign complete",
  },
};

const nl: HomeCopy = {
  pageTitle: "Command Center",
  needsYou: "Heeft je nodig",
  needsYouViewAll: "Alles bekijken",
  suggestedStartLabel: "Aanbevolen start",
  teamPulse: "Teamoverzicht",
  teamPulseViewTeam: "Bekijk team",
  recentMovement: "Recente activiteit",
  recentMovementEmpty:
    "Nog geen recente activiteit. Werk verschijnt hier zodra je team verder gaat.",
  contextHealth: "Bedrijfscontext",
  contextHealthImprove: "Verbeteren",
  activeWorkstreams: "Actieve workstreams",
  activeWorkstreamsEmpty: "Nog geen actieve campagnes.",
  loadingNarrative: "Je ochtend wordt klaargezet…",
  errorTitle: "Home laden mislukt",
  errorRetry: "Opnieuw proberen",
  emptyPeersTitle: "Bouw je AI-team",
  emptyPeersBody: "Neem je eerste collega aan om te beginnen.",
  emptyPeersCta: "Aan de slag",
  allCaughtUp: "Alles bijgewerkt",
  allCaughtUpBody: "Er is nu niets dat je aandacht nodig heeft. Je team gaat verder.",
  contextNotLoaded: "Bedrijfscontext nog niet geladen",
  contextNotLoadedBody:
    "Importeer je bedrijfskennis zodat Maya met volledige context kan werken.",
  openKnowledge: "Open bedrijfsprofiel",
  estReviewMinutes: "Ca. 2 min",
  ui: nlUi,
  narratives: {
    needsYouSingle: (peerName, itemTitle) =>
      `${peerName} heeft je nodig — ${itemTitle.toLowerCase()}.`,
    needsYouMultiple: (count) => `${count} items hebben vandaag je aandacht nodig.`,
    whileAway: (summary) => `Terwijl je weg was, ${summary}`,
    calm: (peerName) =>
      `${peerName} loopt op schema. Er is nu niets dat je nodig hebt.`,
    welcome: "Welkom bij Peergent",
    welcomeBody: "Laten we je bedrijf opzetten en je eerste collega ontmoeten.",
  },
  needsYouItems: {
    reviewDraft: "Content bekijken",
    confirmPublication: "Publicatie bevestigen",
    preparePublication: "Klaarmaken om te publiceren",
    improveContext: "Bedrijfscontext verbeteren",
    createStrategy: "Marketingstrategie bekijken",
    buildPlan: "Campagneplan bekijken",
  },
  teamStatus: {
    waitingForYou: "Wacht op je",
    working: "Bezig",
    idle: "Klaar",
    paused: "Gepauzeerd",
    monitoring: "Campagne volgen",
    campaignComplete: "Campagne afgerond",
  },
};

const COPY: Record<HomeLocale, HomeCopy> = { en, nl };

export function getHomeCopy(locale: HomeLocale = "en"): HomeCopy {
  return COPY[locale];
}

export function resolveHomeLocale(value?: string | null): HomeLocale {
  if (value === "nl") return "nl";
  return "en";
}
