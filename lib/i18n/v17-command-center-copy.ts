import { resolveMarketingCampaignLocale, type MarketingCampaignLocale } from "./marketing-campaign-copy";

export type V17CommandCenterCopy = {
  eyebrow: string;
  title: string;
  supporting: string;
  workingNow: string;
  completedToday: string;
  waitingForYou: string;
  performanceTitle: string;
  weeklyImpact: string;
  statusActive: string;
  statusIdle: string;
  viewLabel: string;
  reviewLabel: string;
  approveLabel: string;
  viewAllWaiting: string;
  tasksThisWeek: (count: number) => string;
  performanceUnavailable: string;
  metricTasksCompleted: string;
  metricApprovalsPending: string;
  workingNowEmpty: string;
  completedTodayEmpty: string;
  noScoreLabel: string;
  tasksThisWeekLabel: (count: number) => string;
  navHq: string;
  navCommandCenter: string;
  navPeers: string;
  peerEyebrow: string;
};

const nl: V17CommandCenterCopy = {
  eyebrow: "Live overzicht",
  title: "Command Center",
  supporting:
    "Alles waar je team aan werkt, wat aandacht nodig heeft en de impact ervan — uitgelegd, niet geraden.",
  workingNow: "Nu bezig",
  completedToday: "Vandaag afgerond",
  waitingForYou: "Wacht op jou",
  performanceTitle: "Prestaties per Peer — deze week",
  weeklyImpact: "Deze week onderbouwd",
  statusActive: "actief",
  statusIdle: "standby",
  viewLabel: "Bekijk",
  reviewLabel: "Beoordelen",
  approveLabel: "Goedkeuren",
  viewAllWaiting: "Bekijk alles",
  tasksThisWeek: (count) =>
    count === 1 ? "1 taak deze week" : `${count} taken deze week`,
  performanceUnavailable: "Nog geen betrouwbare meting",
  metricTasksCompleted: "Taken afgerond",
  metricApprovalsPending: "Open goedkeuringen",
  workingNowEmpty: "Geen actieve werkzaamheden op dit moment.",
  completedTodayEmpty: "Nog niets afgerond vandaag.",
  noScoreLabel: "Nog geen score",
  tasksThisWeekLabel: (count) => (count === 1 ? "taak deze week" : "taken deze week"),
  navHq: "HQ",
  navCommandCenter: "Command Center",
  navPeers: "Peers",
  peerEyebrow: "Peer",
};

const en: V17CommandCenterCopy = {
  eyebrow: "Live overview",
  title: "Command Center",
  supporting:
    "Everything your team is working on, what needs your attention, and its impact — explained, not guessed.",
  workingNow: "Working now",
  completedToday: "Completed today",
  waitingForYou: "Waiting for you",
  performanceTitle: "Peer performance — this week",
  weeklyImpact: "Grounded this week",
  statusActive: "active",
  statusIdle: "idle",
  viewLabel: "View",
  reviewLabel: "Review",
  approveLabel: "Approve",
  viewAllWaiting: "View all",
  tasksThisWeek: (count) =>
    count === 1 ? "1 task this week" : `${count} tasks this week`,
  performanceUnavailable: "No reliable metric yet",
  metricTasksCompleted: "Tasks completed",
  metricApprovalsPending: "Pending approvals",
  workingNowEmpty: "No active work right now.",
  completedTodayEmpty: "Nothing completed today yet.",
  noScoreLabel: "No score yet",
  tasksThisWeekLabel: (count) => (count === 1 ? "task this week" : "tasks this week"),
  navHq: "HQ",
  navCommandCenter: "Command Center",
  navPeers: "Peers",
  peerEyebrow: "Peer",
};

export function getV17CommandCenterCopy(localePreference?: string | null): V17CommandCenterCopy {
  const locale: MarketingCampaignLocale = resolveMarketingCampaignLocale(localePreference);
  return locale === "nl" ? nl : en;
}
