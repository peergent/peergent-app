import type { ActivityFeedItem } from "@/lib/marketing-workspace/experience/types";
import type {
  BuildWorkforceSummaryInput,
  WorkforceSummary,
  WorkforceSummaryConfig,
} from "./workforce-summary-types";
import {
  activitySourcesFromMarketingSnapshots,
  resolveWorkforceSummaryConfig,
} from "./workforce-summary-types";

export { activitySourcesFromMarketingSnapshots } from "./workforce-summary-types";

/** Activity types that represent completed workforce output (not pending/setup noise) */
const ACCOMPLISHMENT_ACTIVITY_TYPES = new Set<string>([
  "conversation",
  "lead_qualified",
  "lead_generated",
  "lead_captured",
  "meeting_booked",
  "meeting_scheduled",
  "support_resolved",
  "ticket_resolved",
  "issue_resolved",
  "draft_generated",
  "draft_approved",
  "publication_prepared",
  "publication_ready",
  "published",
  "strategy_completed",
  "plan_completed",
  "invoice_prepared",
  "invoice_sent",
  "invoice_generated",
  "plan_scheduled",
  "schedule_updated",
  "roadmap_completed",
  "onboarding_completed",
  "hr_task_completed",
  "policy_updated",
  "operation_completed",
  "process_automated",
  "task_completed",
  "workflow_completed",
]);

const MARKETING_ACCOMPLISHMENTS = new Set<string>([
  "draft_generated",
  "draft_approved",
  "publication_prepared",
  "publication_ready",
  "published",
  "strategy_completed",
  "plan_completed",
]);

const LEAD_ACCOMPLISHMENTS = new Set<string>([
  "lead_qualified",
  "lead_generated",
  "lead_captured",
]);

const MEETING_ACCOMPLISHMENTS = new Set<string>(["meeting_booked", "meeting_scheduled"]);

const SUPPORT_ACCOMPLISHMENTS = new Set<string>([
  "support_resolved",
  "ticket_resolved",
  "issue_resolved",
]);

const INVOICE_ACCOMPLISHMENTS = new Set<string>([
  "invoice_prepared",
  "invoice_sent",
  "invoice_generated",
]);

const GENERIC_TASK_ACCOMPLISHMENTS = new Set<string>([
  "plan_scheduled",
  "schedule_updated",
  "roadmap_completed",
  "onboarding_completed",
  "hr_task_completed",
  "policy_updated",
  "operation_completed",
  "process_automated",
  "task_completed",
  "workflow_completed",
]);

function isSinceLastVisit(timestamp: string, lastVisitAt: string | null): boolean {
  if (!lastVisitAt) return true;
  return new Date(timestamp).getTime() > new Date(lastVisitAt).getTime();
}

function collectAccomplishments(
  sources: BuildWorkforceSummaryInput["activitySources"],
  lastVisitAt: string | null
): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];

  for (const source of sources) {
    for (const activity of source.activities) {
      if (!ACCOMPLISHMENT_ACTIVITY_TYPES.has(activity.activityType)) continue;
      if (!isSinceLastVisit(activity.timestamp, lastVisitAt)) continue;
      items.push(activity);
    }
  }

  return items;
}

function countByCategory(activities: ActivityFeedItem[]) {
  let conversationsHandled = 0;
  let leadsGenerated = 0;
  let meetingsBooked = 0;
  let supportTicketsResolved = 0;
  let marketingTasksCompleted = 0;
  let invoicesPrepared = 0;
  let completedTasks = 0;

  for (const activity of activities) {
    const type = activity.activityType as string;

    if (type === "conversation") {
      conversationsHandled += 1;
    } else if (LEAD_ACCOMPLISHMENTS.has(type)) {
      leadsGenerated += 1;
    } else if (MEETING_ACCOMPLISHMENTS.has(type)) {
      meetingsBooked += 1;
    } else if (SUPPORT_ACCOMPLISHMENTS.has(type)) {
      supportTicketsResolved += 1;
    } else if (MARKETING_ACCOMPLISHMENTS.has(type)) {
      marketingTasksCompleted += 1;
    } else if (INVOICE_ACCOMPLISHMENTS.has(type)) {
      invoicesPrepared += 1;
    } else if (GENERIC_TASK_ACCOMPLISHMENTS.has(type)) {
      completedTasks += 1;
    }
  }

  return {
    conversationsHandled,
    leadsGenerated,
    meetingsBooked,
    supportTicketsResolved,
    marketingTasksCompleted,
    invoicesPrepared,
    completedTasks,
  };
}

function minutesForActivity(activity: ActivityFeedItem, config: WorkforceSummaryConfig): number {
  return config.activityMinutes[activity.activityType] ?? config.defaultMinutes;
}

function deriveImpact(
  activities: ActivityFeedItem[],
  config: WorkforceSummaryConfig
): Pick<WorkforceSummary, "estimatedWorkingHoursSaved" | "estimatedBusinessValue"> {
  if (activities.length === 0) {
    return { estimatedWorkingHoursSaved: null, estimatedBusinessValue: null };
  }

  const totalMinutes = activities.reduce(
    (sum, activity) => sum + minutesForActivity(activity, config),
    0
  );

  const estimatedWorkingHoursSaved = Math.round((totalMinutes / 60) * 10) / 10;
  const estimatedBusinessValue = Math.round(estimatedWorkingHoursSaved * config.hourlyRateEur);

  return { estimatedWorkingHoursSaved, estimatedBusinessValue };
}

function buildSummaryLines(counts: ReturnType<typeof countByCategory>): string[] {
  const lines: string[] = [];

  if (counts.conversationsHandled > 0) {
    lines.push(
      counts.conversationsHandled === 1
        ? "handled 1 conversation"
        : `handled ${counts.conversationsHandled} conversations`
    );
  }
  if (counts.leadsGenerated > 0) {
    lines.push(
      counts.leadsGenerated === 1
        ? "generated 1 qualified lead"
        : `generated ${counts.leadsGenerated} qualified leads`
    );
  }
  if (counts.meetingsBooked > 0) {
    lines.push(
      counts.meetingsBooked === 1
        ? "booked 1 meeting"
        : `booked ${counts.meetingsBooked} meetings`
    );
  }
  if (counts.supportTicketsResolved > 0) {
    lines.push(
      counts.supportTicketsResolved === 1
        ? "resolved 1 support ticket"
        : `resolved ${counts.supportTicketsResolved} support tickets`
    );
  }
  if (counts.marketingTasksCompleted > 0) {
    lines.push(
      counts.marketingTasksCompleted === 1
        ? "completed 1 marketing task"
        : `completed ${counts.marketingTasksCompleted} marketing tasks`
    );
  }
  if (counts.invoicesPrepared > 0) {
    lines.push(
      counts.invoicesPrepared === 1
        ? "prepared 1 invoice"
        : `prepared ${counts.invoicesPrepared} invoices`
    );
  }
  if (counts.completedTasks > 0) {
    lines.push(
      counts.completedTasks === 1
        ? "completed 1 task"
        : `completed ${counts.completedTasks} tasks`
    );
  }

  return lines;
}

function countActivePeers(teamPulse: BuildWorkforceSummaryInput["teamPulse"]): number {
  return teamPulse.filter((peer) => peer.statusKind === "working").length;
}

export function emptyWorkforceSummary(): WorkforceSummary {
  return {
    conversationsHandled: 0,
    leadsGenerated: 0,
    meetingsBooked: 0,
    supportTicketsResolved: 0,
    marketingTasksCompleted: 0,
    invoicesPrepared: 0,
    completedTasks: 0,
    activePeers: 0,
    pendingApprovals: 0,
    estimatedWorkingHoursSaved: null,
    estimatedBusinessValue: null,
    summaryLines: [],
  };
}

export function buildWorkforceSummary(input: BuildWorkforceSummaryInput): WorkforceSummary {
  const config = resolveWorkforceSummaryConfig(input.config);
  const accomplishments = collectAccomplishments(input.activitySources, input.lastVisitAt);
  const counts = countByCategory(accomplishments);
  const impact = deriveImpact(accomplishments, config);

  return {
    ...counts,
    activePeers: countActivePeers(input.teamPulse),
    pendingApprovals: input.needsYou.length,
    ...impact,
    summaryLines: buildSummaryLines(counts),
  };
}

/** Document which activity types count toward the summary today */
export const WORKFORCE_ACCOMPLISHMENT_ACTIVITY_TYPES = [
  ...ACCOMPLISHMENT_ACTIVITY_TYPES,
] as const;
