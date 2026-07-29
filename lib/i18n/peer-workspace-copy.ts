import {
  resolveMarketingCampaignLocale,
  type MarketingCampaignLocale,
} from "./marketing-campaign-copy";

export type PeerWorkspaceCopy = {
  navToday: string;
  navWorkingOn: string;
  navWaitingForMe: string;
  navDone: string;
  navWork: string;
  navResults: string;
  navSettings: string;
  waitingEmptyTitle: string;
  waitingEmptySupport: string;
  doneToday: string;
  doneYesterday: string;
  doneThisWeek: string;
  doneOlder: string;
  doneEmpty: string;
  viewWork: string;
  openCampaign: string;
  resultsConnectChannels: string;
  settingsHowPeerWorks: string;
  settingsKnowledgeBrand: string;
  settingsConnections: string;
  settingsApprovalsAutonomy: string;
  settingsNotifications: string;
  settingsAdvanced: string;
  presenceBlocked: string;
  presenceNeedsHelp: string;
  narrativeBlockedKnowledge: string;
  narrativeNeedsHelp: string;
  narrativeNeedsHelpFor: (workTitle: string) => string;
  needsHelpCta: string;
  workingOnNext: string;
  workingOnUpcoming: string;
  workingOnNowLabel: string;
  caughtUpHeadline: string;
  caughtUpBody: string;
  sectionViewResult: string;
  updatedPrefix: string;
  waitingSectionPurpose: string;
  doneSectionPurpose: string;
  attentionPrimaryCta: string;
  breadcrumbTeam: string;
};

/**
 * Copy keys whose value is a plain string, so they can be rendered directly.
 * Excludes templated entries like `narrativeNeedsHelpFor`, which must be called.
 */
export type PeerWorkspaceCopyTextKey = {
  [K in keyof PeerWorkspaceCopy]: PeerWorkspaceCopy[K] extends string ? K : never;
}[keyof PeerWorkspaceCopy];

const en: PeerWorkspaceCopy = {
  navToday: "Today",
  navWorkingOn: "Working on",
  navWaitingForMe: "Waiting for me",
  navDone: "Done",
  navWork: "Work",
  navResults: "Results",
  navSettings: "Settings",
  waitingEmptyTitle: "I don't need anything from you right now.",
  waitingEmptySupport: "I'll let you know when a decision is needed.",
  doneToday: "Today",
  doneYesterday: "Yesterday",
  doneThisWeek: "Earlier this week",
  doneOlder: "Older",
  doneEmpty: "Completed outcomes will appear here as your Marketing Peer delivers work.",
  viewWork: "View work",
  openCampaign: "Open campaign",
  resultsConnectChannels:
    "Connect your marketing channels to see campaign impact here.",
  settingsHowPeerWorks: "How this Peer works",
  settingsKnowledgeBrand: "Knowledge and brand",
  settingsConnections: "Connections",
  settingsApprovalsAutonomy: "Approvals and autonomy",
  settingsNotifications: "Notifications",
  settingsAdvanced: "Advanced",
  presenceBlocked: "Blocked",
  presenceNeedsHelp: "Needs help",
  narrativeBlockedKnowledge:
    "I need a bit more business context before I can continue confidently.",
  narrativeNeedsHelp:
    "Something didn't finish as expected. Nothing is lost — I've paused until you take a look.",
  narrativeNeedsHelpFor: (workTitle: string) =>
    `I couldn't finish ${workTitle}. Nothing is lost — I've paused and kept your work safe until you take a look.`,
  needsHelpCta: "See what happened",
  workingOnNext: "What happens next",
  workingOnUpcoming: "Up next",
  workingOnNowLabel: "Current focus",
  caughtUpHeadline: "All caught up",
  caughtUpBody: "Everything planned for now is complete. I'll let you know when there's new progress.",
  sectionViewResult: "View result",
  updatedPrefix: "Updated",
  waitingSectionPurpose: "Decisions only you can make for this Peer.",
  doneSectionPurpose: "Outcomes your Marketing Peer has delivered.",
  attentionPrimaryCta: "Review",
  breadcrumbTeam: "Team",
};

const nl: PeerWorkspaceCopy = {
  navToday: "Vandaag",
  navWorkingOn: "Bezig met",
  navWaitingForMe: "Wacht op mij",
  navDone: "Afgerond",
  navWork: "Werk",
  navResults: "Resultaten",
  navSettings: "Instellingen",
  waitingEmptyTitle: "Ik heb op dit moment niets van je nodig.",
  waitingEmptySupport: "Ik laat het weten zodra ik een beslissing nodig heb.",
  doneToday: "Vandaag",
  doneYesterday: "Gisteren",
  doneThisWeek: "Eerder deze week",
  doneOlder: "Ouder",
  doneEmpty:
    "Afgerond werk verschijnt hier zodra je Marketing Peer resultaten oplevert.",
  viewWork: "Bekijk werk",
  openCampaign: "Open campagne",
  resultsConnectChannels:
    "Koppel je marketingkanalen om hier de impact van campagnes te zien.",
  settingsHowPeerWorks: "Hoe deze Peer werkt",
  settingsKnowledgeBrand: "Kennis en merk",
  settingsConnections: "Koppelingen",
  settingsApprovalsAutonomy: "Goedkeuringen en autonomie",
  settingsNotifications: "Meldingen",
  settingsAdvanced: "Geavanceerd",
  presenceBlocked: "Geblokkeerd",
  presenceNeedsHelp: "Hulp nodig",
  narrativeBlockedKnowledge:
    "Ik heb nog wat bedrijfscontext nodig voordat ik zelfverzekerd verder kan.",
  narrativeNeedsHelp:
    "Iets is niet afgerond zoals verwacht. Er is niets verloren — ik heb gepauzeerd tot je kijkt.",
  narrativeNeedsHelpFor: (workTitle: string) =>
    `Ik kon ${workTitle} niet afronden. Er is niets verloren — ik heb gepauzeerd en je werk veilig bewaard tot je kijkt.`,
  needsHelpCta: "Bekijk wat er gebeurde",
  workingOnNext: "Wat er daarna gebeurt",
  workingOnUpcoming: "Hierna",
  workingOnNowLabel: "Nu bezig",
  caughtUpHeadline: "Alles is bijgewerkt",
  caughtUpBody:
    "Alles wat voor nu gepland stond is afgerond. Ik laat het weten zodra er nieuwe voortgang is.",
  sectionViewResult: "Bekijk resultaat",
  updatedPrefix: "Bijgewerkt",
  waitingSectionPurpose: "Beslissingen die alleen jij kunt nemen voor deze Peer.",
  doneSectionPurpose: "Resultaten die je Marketing Peer heeft opgeleverd.",
  attentionPrimaryCta: "Beoordelen",
  breadcrumbTeam: "Team",
};

const COPY: Record<MarketingCampaignLocale, PeerWorkspaceCopy> = { en, nl };

export function getPeerWorkspaceCopy(
  localePreference?: string | null
): PeerWorkspaceCopy {
  const locale = resolveMarketingCampaignLocale(localePreference);
  return COPY[locale];
}
