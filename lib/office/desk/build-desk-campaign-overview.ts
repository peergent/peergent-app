import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import { resolveProjectIdForDraft } from "@/lib/office/attribution";
import { officeHref } from "@/lib/office/links";
import { workflowBasedStatusLabel } from "@/lib/office/campaign/campaign-workflow-status";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { executionModeFromApprovalMode } from "@/lib/office/campaign/workflow-types";
import {
  campaignResultsHref,
  formatDurationRange,
  formatRunningStatus,
  resolveCampaignDuration,
} from "@/lib/office/campaign/campaign-duration";

export type DeskCampaignRow = {
  id: string;
  name: string;
  statusLabel: string;
  isLive: boolean;
  runningLabel: string | null;
  dateRangeLabel: string | null;
  runningStatusLabel: string | null;
  startDateLabel: string | null;
  endDateLabel: string | null;
  daysRemaining: number | null;
  href: string;
  quickActionLabel: string | null;
};

export type DeskCampaignOverview = {
  needsApproval: DeskCampaignRow[];
  live: DeskCampaignRow[];
  scheduled: DeskCampaignRow[];
  recentlyCompleted: DeskCampaignRow[];
};

function fmtDate(iso: string | undefined, locale?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function buildDeskCampaignOverview(input: {
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  isDemo?: boolean;
}): DeskCampaignOverview {
  const nl = input.locale === "nl";
  const overlay = readDemoCampaignOverlay(input.domainInput);
  const peerId = input.domainInput.peerId;
  const isDemo = input.isDemo ?? peerId === "demo";

  const needsApproval: DeskCampaignRow[] = [];
  const live: DeskCampaignRow[] = [];
  const scheduled: DeskCampaignRow[] = [];
  const recentlyCompleted: DeskCampaignRow[] = [];

  for (const project of input.domainInput.projects) {
    if (project.origin !== "campaign_wizard" && !overlay.demoCampaignContexts?.[project.id]) continue;

    const drafts = input.domainInput.drafts.filter(
      (d) => resolveProjectIdForDraft(d, input.domainInput.workUnits) === project.id
    );
    const pending = drafts.filter((d) => d.status === "ready_for_review");
    const published = drafts.some((d) => d.status === "published");
    const scheduleRecord = overlay.demoCampaignSchedule?.[project.id];
    const publishedRecord = overlay.demoCampaignPublished?.[project.id];

    const ctx =
      overlay.demoCampaignContexts?.[project.id] ??
      buildCampaignContext({ project, domainInput: input.domainInput, locale: input.locale });

    const workflow = buildCampaignWorkflowViewModel({
      peerId,
      project,
      domainInput: input.domainInput,
      locale: input.locale,
      isDemo,
    });
    const activeStep = workflow.steps.find((s) => s.state === "active");
    const statusLabel =
      workflowBasedStatusLabel({
        activeStepId: activeStep?.id,
        campaignContext: ctx,
        executionMode: executionModeFromApprovalMode(project.campaignSetup?.approvalMode),
        pendingApprovalCount: pending.length,
        locale: input.locale,
        lifecyclePublished: Boolean(publishedRecord || published),
        lifecycleScheduled: Boolean(scheduleRecord),
      }) ?? (nl ? "In voorbereiding" : "In preparation");

    const isLiveCampaign = Boolean(publishedRecord || published);
    const duration = isLiveCampaign
      ? resolveCampaignDuration({
          preset: ctx.durationPreset,
          startDate: ctx.startDate,
          endDate: ctx.endDate,
          durationDays: ctx.durationDays,
          publishedAt: publishedRecord?.publishedAt ?? null,
        })
      : null;

    const row: DeskCampaignRow = {
      id: project.id,
      name: project.title,
      statusLabel,
      isLive: isLiveCampaign,
      runningLabel: isLiveCampaign ? (nl ? "Actief" : "Running") : null,
      dateRangeLabel: duration ? formatDurationRange(duration, input.locale) : null,
      runningStatusLabel: duration ? formatRunningStatus(duration, input.locale) : null,
      startDateLabel: fmtDate(publishedRecord?.publishedAt ?? scheduleRecord?.scheduledAt, input.locale),
      endDateLabel: duration?.endDate ? fmtDate(duration.endDate, input.locale) : null,
      daysRemaining: duration?.remainingDays ?? null,
      href: isLiveCampaign
        ? campaignResultsHref(peerId, project.id)
        : `${officeHref(peerId, "work")}/campaigns/${project.id}`,
      quickActionLabel: null,
    };

    if (pending.length > 0) {
      row.quickActionLabel = nl
        ? `Beoordeel ${pending.length} onderdeel${pending.length > 1 ? "en" : ""}`
        : `Review ${pending.length} item${pending.length > 1 ? "s" : ""}`;
      needsApproval.push(row);
    } else if (isLiveCampaign) {
      row.quickActionLabel = nl ? "Bekijk resultaten" : "View results";
      live.push(row);
    } else if (scheduleRecord) {
      row.startDateLabel = fmtDate(scheduleRecord.scheduledAt, input.locale);
      row.quickActionLabel = nl ? "Bekijk planning" : "View schedule";
      scheduled.push(row);
    } else if (
      workflow.approvalCenter.count === 0 &&
      drafts.some((d) => d.status === "approved" || d.status === "published")
    ) {
      recentlyCompleted.push(row);
    } else if (activeStep) {
      needsApproval.push({
        ...row,
        quickActionLabel:
          activeStep.id === "strategy_determined"
            ? nl
              ? "Beoordeel strategie"
              : "Review strategy"
            : nl
              ? "Open campagne"
              : "Open campaign",
      });
    }
  }

  return {
    needsApproval: needsApproval.slice(0, 5),
    live: live.slice(0, 5),
    scheduled: scheduled.slice(0, 5),
    recentlyCompleted: recentlyCompleted.slice(0, 3),
  };
}
