import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { WORK_LIFECYCLE_STAGES } from "@/lib/peer-workflow/work-lifecycle";
import type { UpcomingMarketingTask, MarketingResponsibilityType } from "../domain/marketing-peer-types";
import {
  getAutomationHref,
  getProjectHref,
  getProjectReviewHref,
  getReviewHref,
  getSettingsHref,
} from "../navigation/marketing-peer-links";
import { humanChannelLabel } from "../publish-preview-formatters";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import {
  deriveProjectNextStep,
  deriveProjectStatus,
  primaryWorkUnitForProject,
} from "../projects/project-engine";
import { findProjectIdForDraft } from "./build-marketing-project-detail-view-model";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

export type UpcomingWorkGroup = {
  dateLabel: string;
  items: UpcomingMarketingTask[];
};

const ORIGIN_LABELS: Record<UpcomingMarketingTask["origin"], string> = {
  automation: "Automatic",
  goal: "Goal-driven",
  manual: "Assigned by you",
  recommendation: "Recommended by Emma",
};

const POLICY_LABELS: Record<UpcomingMarketingTask["approvalPolicy"], string> = {
  prepare_only: "Prepare only",
  approval_required: "Approval required",
  fully_automatic: "Fully automatic",
};

const STATUS_LABELS: Record<UpcomingMarketingTask["status"], string> = {
  planned: "Planned",
  queued: "Queued",
  running: "Running",
  blocked: "Blocked",
};

function mapDeliverableToResponsibility(kind: string): MarketingResponsibilityType {
  const lower = kind.toLowerCase();
  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("newsletter") || lower.includes("email")) return "newsletter";
  if (lower.includes("blog")) return "blog";
  if (lower.includes("google")) return "google_ads";
  if (lower.includes("meta")) return "meta_ads";
  if (lower.includes("seo")) return "seo";
  return "analytics";
}

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanDateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  if (date > today && date <= nextWeek) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  if (date > nextWeek) return "Next week";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function channelLabelFromUnit(unit: WorkUnit): string {
  return unit.channel || unit.deliverableKind.replace(/_/g, " ");
}

function channelLabelFromDraft(draft: MarketingContentDraft): string {
  return humanChannelLabel(draft);
}

function scheduledDraftIds(input: MarketingPeerDomainInput): Set<string> {
  const ids = new Set<string>();
  for (const [draftId, overlay] of Object.entries(input.approvalOverlays ?? {})) {
    if (overlay?.publishing?.scheduledAt) ids.add(draftId);
  }
  return ids;
}

function taskFromProject(
  project: MarketingPeerDomainInput["projects"][number],
  input: MarketingPeerDomainInput
): UpcomingMarketingTask | null {
  const scheduled = scheduledDraftIds(input);
  const status = deriveProjectStatus(
    project,
    input.workUnits,
    input.drafts,
    scheduled
  );
  if (status === "completed" || status === "archived") return null;

  const primary = primaryWorkUnitForProject(project.id, input.workUnits);
  if (primary?.paused) {
    const plannedAt = primary.estimatedCompletionAt ?? primary.updatedAt;
    return {
      id: project.id,
      title: project.title,
      responsibility: mapDeliverableToResponsibility(primary.deliverableKind),
      channelLabel: channelLabelFromUnit(primary),
      plannedAt,
      timeLabel: formatTimeLabel(plannedAt),
      origin: primary.automationTrigger ? "automation" : "manual",
      originLabel: primary.automationTrigger ? ORIGIN_LABELS.automation : ORIGIN_LABELS.manual,
      approvalPolicy: status === "waiting_for_review" ? "approval_required" : "prepare_only",
      approvalPolicyLabel:
        status === "waiting_for_review"
          ? POLICY_LABELS.approval_required
          : POLICY_LABELS.prepare_only,
      status: "blocked",
      statusLabel: STATUS_LABELS.blocked,
      blockerReason: "Paused by you",
      projectId: project.id,
      href: getProjectHref(input.peerId, project.id),
    };
  }

  const plannedAt = primary?.estimatedCompletionAt ?? project.updatedAt;
  const overlay = primary?.draftId ? input.approvalOverlays?.[primary.draftId] : undefined;
  const finalPlanned = overlay?.publishing?.scheduledAt ?? plannedAt;
  const nextStep = deriveProjectNextStep(status, input.workUnits, project.id);

  return {
    id: project.id,
    title: project.title,
    responsibility: primary
      ? mapDeliverableToResponsibility(primary.deliverableKind)
      : "analytics",
    channelLabel: primary ? channelLabelFromUnit(primary) : project.title,
    plannedAt: finalPlanned,
    timeLabel: formatTimeLabel(finalPlanned),
    origin: primary?.automationTrigger ? "automation" : "manual",
    originLabel: primary?.automationTrigger ? ORIGIN_LABELS.automation : ORIGIN_LABELS.manual,
    approvalPolicy: status === "waiting_for_review" ? "approval_required" : "prepare_only",
    approvalPolicyLabel:
      status === "waiting_for_review"
        ? POLICY_LABELS.approval_required
        : POLICY_LABELS.prepare_only,
    status:
      status === "planning"
        ? "planned"
        : status === "preparing" || status === "publishing"
          ? "running"
          : "queued",
    statusLabel:
      status === "preparing" || status === "publishing"
        ? STATUS_LABELS.running
        : status === "planning"
          ? STATUS_LABELS.planned
          : STATUS_LABELS.queued,
    projectId: project.id,
    href: getProjectHref(input.peerId, project.id),
  };
}

function taskFromWorkUnit(unit: WorkUnit, input: MarketingPeerDomainInput): UpcomingMarketingTask | null {
  if (unit.cancelled) return null;
  if (unit.paused) {
    const plannedAt = unit.estimatedCompletionAt ?? unit.updatedAt;
    return {
      id: unit.id,
      title: unit.title,
      responsibility: mapDeliverableToResponsibility(unit.deliverableKind),
      channelLabel: channelLabelFromUnit(unit),
      plannedAt,
      timeLabel: formatTimeLabel(plannedAt),
      origin: unit.automationTrigger ? "automation" : "manual",
      originLabel: unit.automationTrigger ? ORIGIN_LABELS.automation : ORIGIN_LABELS.manual,
      approvalPolicy: unit.status === "review_ready" ? "approval_required" : "prepare_only",
      approvalPolicyLabel:
        unit.status === "review_ready" ? POLICY_LABELS.approval_required : POLICY_LABELS.prepare_only,
      status: "blocked",
      statusLabel: STATUS_LABELS.blocked,
      blockerReason: "Paused by you",
      workUnitId: unit.id,
      projectId: unit.projectId ?? undefined,
      href: unit.projectId
        ? getProjectHref(input.peerId, unit.projectId)
        : getProjectHref(input.peerId),
    };
  }
  if (unit.status === "published" || unit.status === "monitoring") return null;

  const plannedAt = unit.estimatedCompletionAt ?? unit.updatedAt;
  const overlay = unit.draftId ? input.approvalOverlays?.[unit.draftId] : undefined;
  const scheduledAt = overlay?.publishing?.scheduledAt;
  const finalPlanned = scheduledAt ?? plannedAt;

  return {
    id: unit.id,
    title: unit.title,
    responsibility: mapDeliverableToResponsibility(unit.deliverableKind),
    channelLabel: channelLabelFromUnit(unit),
    plannedAt: finalPlanned,
    timeLabel: formatTimeLabel(finalPlanned),
    origin: unit.automationTrigger ? "automation" : "manual",
    originLabel: unit.automationTrigger ? ORIGIN_LABELS.automation : ORIGIN_LABELS.manual,
    approvalPolicy: unit.status === "review_ready" ? "approval_required" : "prepare_only",
    approvalPolicyLabel:
      unit.status === "review_ready" ? POLICY_LABELS.approval_required : POLICY_LABELS.prepare_only,
    status:
      unit.status === "understanding" || unit.status === "planning"
        ? "planned"
        : unit.status === "creating"
          ? "running"
          : "queued",
    statusLabel:
      unit.status === "creating"
        ? STATUS_LABELS.running
        : unit.status === "understanding" || unit.status === "planning"
          ? STATUS_LABELS.planned
          : STATUS_LABELS.queued,
    workUnitId: unit.id,
    projectId: unit.projectId ?? undefined,
    href: unit.projectId
      ? getProjectHref(input.peerId, unit.projectId)
      : getProjectHref(input.peerId),
  };
}

export function buildUpcomingMarketingTasks(input: MarketingPeerDomainInput): UpcomingWorkGroup[] {
  const tasks: UpcomingMarketingTask[] = [];

  for (const project of input.projects) {
    const task = taskFromProject(project, input);
    if (task) tasks.push(task);
  }

  // Legacy fallback for work units not yet linked to a project
  for (const unit of input.workUnits.filter((u) => !u.projectId)) {
    const task = taskFromWorkUnit(unit, input);
    if (task) tasks.push(task);
  }

  for (const automation of input.automations.filter((a) => a.active)) {
    const unit = input.workUnits.find((u) => u.id === automation.workUnitId);
    tasks.push({
      id: automation.id,
      title: unit?.title ?? automation.triggerLabel ?? "Recurring marketing task",
      responsibility: unit
        ? mapDeliverableToResponsibility(unit.deliverableKind)
        : "analytics",
      channelLabel: unit ? channelLabelFromUnit(unit) : "Marketing",
      plannedAt: automation.createdAt,
      timeLabel: formatTimeLabel(automation.createdAt),
      origin: "automation",
      originLabel: ORIGIN_LABELS.automation,
      approvalPolicy: "approval_required",
      approvalPolicyLabel: POLICY_LABELS.approval_required,
      status: "planned",
      statusLabel: STATUS_LABELS.planned,
      automationId: automation.id,
      href: getAutomationHref(input.peerId, automation.id),
    });
  }

  for (const draft of input.drafts.filter((d) => d.status === "approved" || d.status === "ready_to_publish")) {
    const overlay = input.approvalOverlays?.[draft.id];
    if (!overlay?.publishing?.scheduledAt) continue;
    tasks.push({
      id: `sched-${draft.id}`,
      title: draft.title,
      responsibility: mapDeliverableToResponsibility(draft.channel ?? draft.contentType),
      channelLabel: channelLabelFromDraft(draft),
      plannedAt: overlay.publishing.scheduledAt,
      timeLabel: formatTimeLabel(overlay.publishing.scheduledAt),
      origin: "manual",
      originLabel: ORIGIN_LABELS.manual,
      approvalPolicy: "approval_required",
      approvalPolicyLabel: POLICY_LABELS.approval_required,
      status: "queued",
      statusLabel: STATUS_LABELS.queued,
      href: (() => {
        const projectId = findProjectIdForDraft(draft.id, input);
        return projectId
          ? getProjectReviewHref(input.peerId, projectId, draft.id)
          : getReviewHref(input.peerId, draft.id);
      })(),
    });
  }

  for (const channel of input.connections.filter((c) => c.status === "needs_reconnect")) {
    tasks.push({
      id: `blocked-${channel.id}`,
      title: `Reconnect ${channel.label}`,
      responsibility: "analytics",
      channelLabel: channel.label,
      plannedAt: new Date().toISOString(),
      timeLabel: "—",
      origin: "automation",
      originLabel: ORIGIN_LABELS.automation,
      approvalPolicy: "prepare_only",
      approvalPolicyLabel: POLICY_LABELS.prepare_only,
      status: "blocked",
      statusLabel: STATUS_LABELS.blocked,
      blockerReason: "Connection expired",
      href: getSettingsHref(input.peerId, "channels"),
    });
  }

  if (tasks.length === 0) return [];

  tasks.sort((a, b) => new Date(a.plannedAt).getTime() - new Date(b.plannedAt).getTime());

  const grouped = new Map<string, UpcomingMarketingTask[]>();
  for (const task of tasks.slice(0, 10)) {
    const label = humanDateLabel(task.plannedAt);
    const list = grouped.get(label) ?? [];
    list.push(task);
    grouped.set(label, list);
  }

  return [...grouped.entries()].map(([dateLabel, items]) => ({ dateLabel, items }));
}

export function mapWorkUnitStatusLabel(status: WorkUnit["status"]): string {
  switch (status) {
    case "understanding":
    case "planning":
      return "Preparing strategy";
    case "creating":
      return "Creating content";
    case "review_ready":
      return "Waiting for your review";
    case "approved":
      return "Approved";
    case "scheduled":
      return "Scheduled for publication";
    case "published":
      return "Published";
    case "monitoring":
      return "Tracking results";
    default:
      return "In progress";
  }
}

export function workUnitProgress(status: WorkUnit["status"]): number {
  const idx = WORK_LIFECYCLE_STAGES.indexOf(status);
  if (idx < 0) return 0;
  return Math.min(99, Math.round(((idx + 1) / WORK_LIFECYCLE_STAGES.length) * 100));
}
