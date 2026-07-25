import type { HomeNeedsYouItem, HomeTeamPulseItem } from "@/lib/home/types";
import type {
  WorkforceActivitySource,
  WorkforceSummary,
} from "@/lib/home/workforce-summary-types";
import {
  buildHqServiceCards,
  countRecognizedColleagues,
  type HqServiceCard,
} from "./aggregate-hq-services";
import { hqGridColumnCount } from "./hq-peers";
import type { HqInitialTemporal } from "./hq-temporal";

export type { HqServiceCard, HqServiceStatusKind } from "./aggregate-hq-services";
export type { HqServiceKey } from "./hq-service-key";

/** @deprecated HQ renders service cards, not individual peers. */
export type HqPeerIconKind =
  | "sales"
  | "marketing"
  | "finance"
  | "support"
  | "operations"
  | "default";

export type HqExecutiveSummary = {
  tasksCompleted: number;
  timeSavedLabel: string | null;
  revenueLabel: string | null;
  pendingApprovals: number;
};

export type HqLandingViewModel = {
  initialDateTime: string;
  initialDateLabel: string;
  greetingName: string;
  greetingTime: string;
  subhead: string;
  services: HqServiceCard[];
  serviceCount: number;
  colleagueCount: number;
  gridColumns: number;
  executive: HqExecutiveSummary;
};

function formatTimeSaved(hours: number | null): string | null {
  if (hours == null || hours <= 0) return null;
  return `${hours}h`;
}

function formatRevenue(value: number | null): string | null {
  if (value == null || value <= 0) return null;
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function tasksCompletedTotal(summary: WorkforceSummary): number {
  return (
    summary.completedTasks +
    summary.marketingTasksCompleted +
    summary.leadsGenerated +
    summary.supportTicketsResolved +
    summary.invoicesPrepared
  );
}

function buildSubhead(input: {
  colleagueCount: number;
  serviceCount: number;
  tasksCompleted: number;
}): string {
  const { colleagueCount, serviceCount, tasksCompleted } = input;

  if (serviceCount === 0) {
    return "Your workforce is ready to be configured.";
  }

  const colleaguePart =
    colleagueCount === 1
      ? "1 digital colleague active"
      : `${colleagueCount} digital colleagues active`;

  const servicePart =
    serviceCount === 1 ? "1 service" : `${serviceCount} services`;

  const tasksPart =
    tasksCompleted === 1
      ? "1 task completed while you were away."
      : `${tasksCompleted} tasks completed while you were away.`;

  return `${colleaguePart} across ${servicePart}. ${tasksPart}`;
}

export function buildHqLandingViewModel(input: {
  firstName?: string;
  teamPulse: HomeTeamPulseItem[];
  workforceSummary: WorkforceSummary;
  activitySources: WorkforceActivitySource[];
  needsYou: HomeNeedsYouItem[];
  temporal: HqInitialTemporal;
}): HqLandingViewModel {
  const firstName = input.firstName?.trim() || "there";
  const services = buildHqServiceCards({
    teamPulse: input.teamPulse,
    activitySources: input.activitySources,
    workforceSummary: input.workforceSummary,
    needsYou: input.needsYou,
  });
  const colleagueCount = countRecognizedColleagues(input.teamPulse);
  const tasksCompleted = tasksCompletedTotal(input.workforceSummary);

  return {
    initialDateTime: input.temporal.initialDateTime,
    initialDateLabel: input.temporal.initialDateLabel,
    greetingName: firstName,
    greetingTime: input.temporal.initialGreeting,
    subhead: buildSubhead({
      colleagueCount,
      serviceCount: services.length,
      tasksCompleted,
    }),
    services,
    serviceCount: services.length,
    colleagueCount,
    gridColumns: hqGridColumnCount(services.length),
    executive: {
      tasksCompleted,
      timeSavedLabel: formatTimeSaved(input.workforceSummary.estimatedWorkingHoursSaved),
      revenueLabel: formatRevenue(input.workforceSummary.estimatedBusinessValue),
      pendingApprovals: input.needsYou.length,
    },
  };
}
