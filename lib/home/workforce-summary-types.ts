import type { ActivityFeedItem } from "@/lib/marketing-workspace/experience/types";
import type { HomeNeedsYouItem, HomePeerWorkspaceSnapshot, HomeTeamPulseItem } from "./types";

/** Minutes saved per completed activity type — configurable, not fabricated counts */
export type WorkforceSummaryConfig = {
  activityMinutes: Readonly<Record<string, number>>;
  defaultMinutes: number;
  hourlyRateEur: number;
};

export const DEFAULT_WORKFORCE_SUMMARY_CONFIG: WorkforceSummaryConfig = {
  activityMinutes: {
    conversation: 8,
    draft_generated: 45,
    draft_approved: 45,
    publication_prepared: 45,
    publication_ready: 45,
    published: 45,
    strategy_completed: 90,
    plan_completed: 90,
    lead_qualified: 12,
    lead_generated: 12,
    lead_captured: 12,
    meeting_booked: 10,
    meeting_scheduled: 10,
    support_resolved: 8,
    ticket_resolved: 8,
    issue_resolved: 8,
    invoice_prepared: 15,
    invoice_sent: 15,
    invoice_generated: 15,
    plan_scheduled: 30,
    schedule_updated: 20,
    roadmap_completed: 45,
    onboarding_completed: 25,
    hr_task_completed: 20,
    policy_updated: 15,
    operation_completed: 30,
    process_automated: 25,
    task_completed: 30,
    workflow_completed: 30,
  },
  defaultMinutes: 20,
  hourlyRateEur: 75,
};

export type WorkforceSummary = {
  conversationsHandled: number;
  leadsGenerated: number;
  meetingsBooked: number;
  supportTicketsResolved: number;
  marketingTasksCompleted: number;
  invoicesPrepared: number;
  completedTasks: number;
  activePeers: number;
  pendingApprovals: number;
  /** Derived from real completed activities × configurable minute weights; null when none */
  estimatedWorkingHoursSaved: number | null;
  /** estimatedWorkingHoursSaved × hourlyRateEur; null when no accomplishments */
  estimatedBusinessValue: number | null;
  /** Pre-formatted accomplishment bullets for non-zero counts only */
  summaryLines: string[];
};

export type WorkforceActivitySource = {
  peerId: string;
  peerRole: string;
  activities: ActivityFeedItem[];
};

export type BuildWorkforceSummaryInput = {
  activitySources: WorkforceActivitySource[];
  lastVisitAt: string | null;
  teamPulse: HomeTeamPulseItem[];
  needsYou: HomeNeedsYouItem[];
  config?: Partial<WorkforceSummaryConfig>;
};

export function activitySourcesFromMarketingSnapshots(
  snapshots: HomePeerWorkspaceSnapshot[]
): WorkforceActivitySource[] {
  return snapshots.map(({ peer, workspace }) => ({
    peerId: peer.id,
    peerRole: peer.role,
    activities: workspace.activityFeed ?? [],
  }));
}

export function resolveWorkforceSummaryConfig(
  partial?: Partial<WorkforceSummaryConfig>
): WorkforceSummaryConfig {
  if (!partial) return DEFAULT_WORKFORCE_SUMMARY_CONFIG;
  return {
    ...DEFAULT_WORKFORCE_SUMMARY_CONFIG,
    ...partial,
    activityMinutes: {
      ...DEFAULT_WORKFORCE_SUMMARY_CONFIG.activityMinutes,
      ...partial.activityMinutes,
    },
  };
}
