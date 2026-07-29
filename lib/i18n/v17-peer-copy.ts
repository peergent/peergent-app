import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";

export type V17PeerCopy = {
  reviewCta: string;
  approveCta: string;
  viewCta: string;
  viewAllAttention: (count: number) => string;
  viewAllCompleted: string;
  todayWaitingHeading: (count: number) => string;
  todayDoneHeading: string;
  todayNextHeading: string;
  workTitle: string;
  workSubtitle: string;
  workMetaFallback: (updated?: string) => string;
  resultsTitle: string;
  resultsUnavailable: string;
  connectionsCta: string;
  settingsTitle: string;
  settingsBrand: string;
  settingsBrandDesc: string;
  settingsCompany: string;
  settingsCompanyDesc: string;
  settingsConnections: string;
  settingsConnectionsDesc: string;
  settingsResponsibilities: string;
  settingsResponsibilitiesDesc: string;
  settingsAutonomy: string;
  settingsAutonomyDesc: string;
  settingsApprovals: string;
  settingsApprovalsDesc: string;
  settingsNotifications: string;
  settingsNotificationsDesc: string;
  settingsAdvanced: string;
  settingsAdvancedDesc: string;
  navToday: string;
  navWork: string;
  navResults: string;
  navSettings: string;
  peerEyebrow: string;
  assignWork: string;
  pause: string;
};

const nl: V17PeerCopy = {
  reviewCta: "Beoordelen",
  approveCta: "Goedkeuren",
  viewCta: "Bekijken",
  viewAllAttention: (n) => `Bekijk alle ${n} ›`,
  viewAllCompleted: "Bekijk alles ›",
  todayWaitingHeading: (n) => (n > 0 ? `Wacht op jou — ${n}` : "Wacht op jou"),
  todayDoneHeading: "Vandaag gedaan",
  todayNextHeading: "Hierna",
  workTitle: "Werk",
  workSubtitle: "Alle campagnes van deze Peer.",
  workMetaFallback: () => "Recent bijgewerkt",
  resultsTitle: "Resultaten",
  resultsUnavailable: "Koppel je marketingkanalen om hier de impact van campagnes te zien.",
  connectionsCta: "Koppelingen",
  settingsTitle: "Instellingen",
  settingsBrand: "Merkkennis",
  settingsBrandDesc: "Tone of voice, kleuren, claims en beeldstijl",
  settingsCompany: "Bedrijfskennis",
  settingsCompanyDesc: "Context over je bedrijf en doelgroep",
  settingsConnections: "Koppelingen",
  settingsConnectionsDesc: "Advertentie-, e-mail- en analytics-kanalen",
  settingsResponsibilities: "Verantwoordelijkheden",
  settingsResponsibilitiesDesc: "Welke campagnes en kanalen",
  settingsAutonomy: "Zelfstandigheid",
  settingsAutonomyDesc: "Wat mag zonder jouw goedkeuring",
  settingsApprovals: "Goedkeuringen",
  settingsApprovalsDesc: "Wanneer ik je eerst vraag",
  settingsNotifications: "Meldingen",
  settingsNotificationsDesc: "Wanneer je een seintje krijgt",
  settingsAdvanced: "Geavanceerd",
  settingsAdvancedDesc: "Extra instellingen voor power users",
  navToday: "Vandaag",
  navWork: "Werk",
  navResults: "Resultaten",
  navSettings: "Instellingen",
  peerEyebrow: "Peer",
  assignWork: "Werk toewijzen",
  pause: "Pauzeren",
};

const en: V17PeerCopy = {
  reviewCta: "Review",
  approveCta: "Approve",
  viewCta: "View",
  viewAllAttention: (n) => `View all ${n} ›`,
  viewAllCompleted: "View all ›",
  todayWaitingHeading: (n) => (n > 0 ? `Waiting for you — ${n}` : "Waiting for you"),
  todayDoneHeading: "Completed today",
  todayNextHeading: "Next",
  workTitle: "Work",
  workSubtitle: "All campaigns for this Peer.",
  workMetaFallback: () => "Recently updated",
  resultsTitle: "Results",
  resultsUnavailable: "Connect your marketing channels to see campaign impact here.",
  connectionsCta: "Connections",
  settingsTitle: "Settings",
  settingsBrand: "Brand knowledge",
  settingsBrandDesc: "Tone of voice, colors, claims, and visual style",
  settingsCompany: "Company knowledge",
  settingsCompanyDesc: "Context about your business and audience",
  settingsConnections: "Connections",
  settingsConnectionsDesc: "Ads, email, and analytics channels",
  settingsResponsibilities: "Responsibilities",
  settingsResponsibilitiesDesc: "Which campaigns and channels",
  settingsAutonomy: "Autonomy",
  settingsAutonomyDesc: "What can run without your approval",
  settingsApprovals: "Approvals",
  settingsApprovalsDesc: "When to ask you first",
  settingsNotifications: "Notifications",
  settingsNotificationsDesc: "When you get a nudge",
  settingsAdvanced: "Advanced",
  settingsAdvancedDesc: "Extra settings for power users",
  navToday: "Today",
  navWork: "Work",
  navResults: "Results",
  navSettings: "Settings",
  peerEyebrow: "Peer",
  assignWork: "Assign work",
  pause: "Pause",
};

export function getV17PeerCopy(localePreference?: string | null): V17PeerCopy {
  const locale: MarketingCampaignLocale =
    localePreference === "nl" || localePreference?.startsWith("nl") ? "nl" : "en";
  return locale === "nl" ? nl : en;
}
