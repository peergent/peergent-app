import type { HomeViewModel } from "@/lib/home/types";
import type { HomePeerWorkspaceSnapshot } from "@/lib/home/types";
import type { WorkforceSummary } from "@/lib/home/workforce-summary-types";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { deriveProjectStatus } from "@/lib/peer-experience/marketing/projects/project-engine";

export type GroundedMetric = {
  id: string;
  label: string;
  value: string | number;
  source: "internal" | "integration";
  confidence: "measured" | "estimated";
  trend?: number[];
  href?: string;
};

function totalTasksCompleted(summary: WorkforceSummary): number {
  return (
    summary.completedTasks +
    summary.marketingTasksCompleted +
    summary.supportTicketsResolved
  );
}

function countCampaignSignals(snapshots: HomePeerWorkspaceSnapshot[]): {
  activeCampaigns: number;
  approvedParts: number;
  completedCampaigns: number;
} {
  let activeCampaigns = 0;
  let approvedParts = 0;
  let completedCampaigns = 0;

  for (const snapshot of snapshots) {
    const ws = snapshot.workspace;
    const workUnits = ws.workUnits ?? [];
    const drafts = ws.drafts ?? [];
    const scheduled = new Set<string>();

    for (const project of ws.projects ?? []) {
      const status = deriveProjectStatus(project, workUnits, drafts, scheduled);
      if (["completed", "archived", "monitoring_results"].includes(status)) {
        completedCampaigns += 1;
      } else if (!["planning"].includes(status)) {
        activeCampaigns += 1;
      }
    }

    for (const draft of drafts) {
      if (draft.status === "approved" || draft.status === "ready_to_publish") {
        approvedParts += 1;
      }
    }
  }

  return { activeCampaigns, approvedParts, completedCampaigns };
}

export function buildGroundedWeeklyMetrics(input: {
  viewModel: HomeViewModel | null;
  marketingSnapshots: HomePeerWorkspaceSnapshot[];
  pendingApprovals: number;
  locale: MarketingCampaignLocale;
  primaryMarketingPeerId?: string;
}): { metrics: GroundedMetric[]; showSection: boolean } {
  const nl = input.locale === "nl";
  const summary = input.viewModel?.workforceSummary;
  const signals = countCampaignSignals(input.marketingSnapshots);
  const metrics: GroundedMetric[] = [];

  if (summary) {
    const tasks = totalTasksCompleted(summary);
    if (tasks > 0) {
      metrics.push({
        id: "tasks-completed",
        label: nl ? "Taken afgerond" : "Tasks completed",
        value: tasks,
        source: "internal",
        confidence: "measured",
        href: input.primaryMarketingPeerId
          ? `/team/${input.primaryMarketingPeerId}/done`
          : "/home",
      });
    }
  }

  if (input.pendingApprovals > 0) {
    metrics.push({
      id: "pending-approvals",
      label: nl ? "Open goedkeuringen" : "Pending approvals",
      value: input.pendingApprovals,
      source: "internal",
      confidence: "measured",
      href: "/inbox",
    });
  }

  if (signals.activeCampaigns > 0) {
    metrics.push({
      id: "active-campaigns",
      label: nl ? "Campagnes actief" : "Active campaigns",
      value: signals.activeCampaigns,
      source: "internal",
      confidence: "measured",
      href: input.primaryMarketingPeerId
        ? `/team/${input.primaryMarketingPeerId}/work`
        : undefined,
    });
  }

  if (signals.approvedParts > 0) {
    metrics.push({
      id: "approved-parts",
      label: nl ? "Onderdelen goedgekeurd" : "Parts approved",
      value: signals.approvedParts,
      source: "internal",
      confidence: "measured",
      href: input.primaryMarketingPeerId
        ? `/team/${input.primaryMarketingPeerId}/done`
        : undefined,
    });
  }

  if (signals.completedCampaigns > 0 && metrics.length < 4) {
    metrics.push({
      id: "completed-campaigns",
      label: nl ? "Campagnes afgerond" : "Campaigns completed",
      value: signals.completedCampaigns,
      source: "internal",
      confidence: "measured",
      href: input.primaryMarketingPeerId
        ? `/team/${input.primaryMarketingPeerId}/work`
        : undefined,
    });
  }

  if (summary && summary.meetingsBooked > 0 && metrics.length < 4) {
    metrics.push({
      id: "meetings-booked",
      label: nl ? "Meetings ingepland" : "Meetings booked",
      value: summary.meetingsBooked,
      source: "internal",
      confidence: "measured",
    });
  }

  if (summary && summary.leadsGenerated > 0 && metrics.length < 4) {
    metrics.push({
      id: "leads-added",
      label: nl ? "Leads toegevoegd" : "Leads added",
      value: summary.leadsGenerated,
      source: "internal",
      confidence: "measured",
    });
  }

  if (summary && summary.supportTicketsResolved > 0 && metrics.length < 4) {
    metrics.push({
      id: "tickets-resolved",
      label: nl ? "Tickets opgelost" : "Tickets resolved",
      value: summary.supportTicketsResolved,
      source: "internal",
      confidence: "measured",
    });
  }

  const unique = metrics.slice(0, 4);
  return {
    metrics: unique,
    showSection: unique.length >= 2,
  };
}
