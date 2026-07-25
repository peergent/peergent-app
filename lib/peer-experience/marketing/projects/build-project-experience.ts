import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { WorkLifecycleEvent } from "@/lib/peer-workflow/work-lifecycle";
import { buildApprovalDeliverable } from "../approval/build-approval-deliverable";
import { buildContentPerformanceSummary } from "../view-models/build-content-performance-summary";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import { formatRelativeTime } from "../emma-narrative";
import { getResponsibilityHref } from "../navigation/marketing-peer-links";
import { MARKETING_PROJECT_ORIGIN_LABELS } from "../responsibilities/types";
import {
  campaignTypeLabel,
  deriveProjectProgress,
  deriveProjectStatus,
  primaryWorkUnitForProject,
  projectStatusLabel,
  workUnitsForProject,
} from "./project-engine";
import type { MarketingProject, MarketingProjectStatus } from "./types";
import type {
  MarketingProjectPhase,
  ProjectConversationEntry,
  ProjectDecision,
  ProjectExperienceViewModel,
  ProjectHeroViewModel,
  ProjectLearningInfo,
  ProjectMonitoringInfo,
  ProjectNextStepViewModel,
  ProjectPublishingInfo,
  ProjectQuestion,
  ProjectSidebarViewModel,
  ProjectTimelineEntry,
} from "./project-experience-types";
import { MARKETING_PROJECT_PHASE_LABELS } from "./project-experience-types";

const PHASE_ORDER: MarketingProjectPhase[] = [
  "planning",
  "researching",
  "creating",
  "review",
  "publishing",
  "monitoring",
  "learning",
  "completed",
];

function scheduledDraftIds(input: MarketingPeerDomainInput): Set<string> {
  const ids = new Set<string>();
  for (const [draftId, overlay] of Object.entries(input.approvalOverlays ?? {})) {
    if (overlay?.publishing?.scheduledAt) ids.add(draftId);
  }
  return ids;
}

function formatTimelineTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatScheduleLabels(iso: string): { dateLabel: string; timeLabel: string } {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dateLabel = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  if (date.toDateString() === today.toDateString()) dateLabel = "Today";
  if (date.toDateString() === tomorrow.toDateString()) dateLabel = "Tomorrow";

  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { dateLabel, timeLabel };
}

function emmaVoiceForEvent(
  event: WorkLifecycleEvent,
  unit: WorkUnit,
  peerName: string
): string {
  switch (event) {
    case "task_requested":
      return "I started working on your campaign.";
    case "understanding_started":
      return "I'm learning what you need from this campaign.";
    case "planning_started":
      return "I'm planning the approach for this campaign.";
    case "creation_started":
      return unit.needsVisual
        ? "I'm generating visual concepts for this campaign."
        : "I'm writing the content now.";
    case "review_ready":
      return "I've prepared everything for your review.";
    case "approved":
      return "Thanks — I've noted your approval.";
    case "scheduled":
      return "I've scheduled this for publication.";
    case "published":
      return "I published your campaign.";
    case "monitoring_started":
      return "I've started analysing performance.";
    case "optimization_started":
      return "I'm looking for ways to improve results.";
    case "paused":
      return "I've paused here until you say otherwise.";
    case "resumed":
      return "I'm back on this campaign.";
    case "cancelled":
      return "This campaign was archived.";
    default:
      return `${peerName} updated progress on this campaign.`;
  }
}

function derivePhase(
  status: MarketingProjectStatus,
  unit: WorkUnit | null
): MarketingProjectPhase {
  if (unit?.status === "monitoring" || unit?.status === "optimizing") return "monitoring";
  if (status === "archived" || status === "completed") return "completed";
  if (status === "monitoring_results") return "monitoring";
  if (status === "publishing" || status === "scheduled") return "publishing";
  if (status === "waiting_for_review") return "review";
  if (status === "preparing") return "creating";
  if (status === "planning") {
    if (unit?.status === "understanding") return "researching";
    return "planning";
  }
  return "planning";
}

function isProjectLive(
  input: MarketingPeerDomainInput,
  projectId: string,
  unit: WorkUnit | null
): boolean {
  if (!input.generating || !unit) return false;
  if (input.activeWorkUnitId && input.activeWorkUnitId === unit.id) return true;
  return unit.projectId === projectId && !unit.paused && !unit.cancelled;
}

function deriveCurrentActivity(
  input: MarketingPeerDomainInput,
  project: MarketingProject,
  status: MarketingProjectStatus,
  phase: MarketingProjectPhase,
  unit: WorkUnit | null,
  drafts: MarketingContentDraft[]
): { activity: string; kind: ProjectHeroViewModel["activityKind"]; isLive: boolean } {
  const live = isProjectLive(input, project.id, unit);

  if (live) {
    switch (input.generating) {
      case "understanding":
        return {
          activity: `${input.peerName} is getting oriented with your business context.`,
          kind: "thinking",
          isLive: true,
        };
      case "strategy":
        return {
          activity: `${input.peerName} is building your marketing strategy.`,
          kind: "thinking",
          isLive: true,
        };
      case "plan":
        return {
          activity: `${input.peerName} is planning your campaign.`,
          kind: "thinking",
          isLive: true,
        };
      case "draft":
        if (unit?.needsVisual) {
          return {
            activity: `${input.peerName} is currently generating carousel visuals.`,
            kind: "working",
            isLive: true,
          };
        }
        return {
          activity: input.generatingActivity
            ? `${input.peerName} is creating your ${input.generatingActivity.toLowerCase()}.`
            : `${input.peerName} is writing the content.`,
          kind: "working",
          isLive: true,
        };
      case "publication":
        return {
          activity: `${input.peerName} is preparing publication.`,
          kind: "working",
          isLive: true,
        };
      default:
        break;
    }
  }

  if (unit?.paused) {
    return {
      activity: `${input.peerName} is paused until you resume this campaign.`,
      kind: "waiting",
      isLive: false,
    };
  }

  switch (phase) {
    case "review":
      return {
        activity: `${input.peerName} has finished the draft and is waiting for your review.`,
        kind: "waiting",
        isLive: false,
      };
    case "publishing":
      return {
        activity: `${input.peerName} will automatically publish this campaign at the scheduled time.`,
        kind: "waiting",
        isLive: false,
      };
    case "monitoring":
      return {
        activity: `${input.peerName} is collecting early performance signals.`,
        kind: "learning",
        isLive: false,
      };
    case "learning":
      return {
        activity: `${input.peerName} is learning from this campaign's results.`,
        kind: "learning",
        isLive: false,
      };
    case "creating":
      return {
        activity: unit?.needsVisual
          ? `${input.peerName} is preparing visuals and copy.`
          : `${input.peerName} is creating the deliverable.`,
        kind: "working",
        isLive: false,
      };
    case "researching":
      return {
        activity: `${input.peerName} is researching the best approach for this campaign.`,
        kind: "thinking",
        isLive: false,
      };
    case "completed":
      return {
        activity: `${input.peerName} has completed this assignment.`,
        kind: "idle",
        isLive: false,
      };
    default:
      return {
        activity: `${input.peerName} is planning this campaign.`,
        kind: "thinking",
        isLive: false,
      };
  }
}

function deriveEstimatedCompletion(
  unit: WorkUnit | null,
  isLive: boolean,
  phase: MarketingProjectPhase
): string | undefined {
  if (unit?.estimatedCompletionAt) {
    const eta = new Date(unit.estimatedCompletionAt);
    const mins = Math.max(1, Math.round((eta.getTime() - Date.now()) / 60000));
    if (mins <= 60) return `${mins} minute${mins === 1 ? "" : "s"}`;
    return eta.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  if (isLive && (phase === "creating" || phase === "researching" || phase === "planning")) {
    return "A few minutes";
  }
  if (phase === "review") return "When you approve";
  if (phase === "publishing") return "At scheduled time";
  return undefined;
}

function deriveNextStep(
  input: MarketingPeerDomainInput,
  status: MarketingProjectStatus,
  phase: MarketingProjectPhase,
  unit: WorkUnit | null,
  drafts: MarketingContentDraft[]
): ProjectNextStepViewModel {
  if (unit?.paused) {
    return {
      label: "Resume work on this campaign",
      blocked: true,
      blockerReason: "Paused by you",
    };
  }

  if (phase === "review") {
    const draft =
      (unit?.draftId ? drafts.find((d) => d.id === unit.draftId) : undefined) ??
      drafts.find((d) => d.status === "ready_for_review");
    if (draft) {
      const overlay = input.approvalOverlays?.[draft.id];
      const deliverable = buildApprovalDeliverable({
        draft,
        workUnit: unit,
        overlay,
        connections: input.connections,
        peerName: input.peerName,
      });
      if (!deliverable.account.connected) {
        return {
          label: "Review and approve",
          blocked: true,
          blockerReason: `Waiting for ${deliverable.account.name} connection`,
        };
      }
      return { label: "Review and approve", blocked: false };
    }
  }

  if (phase === "publishing") {
    const publishDraft =
      (unit?.draftId ? drafts.find((d) => d.id === unit.draftId) : undefined) ??
      drafts.find((d) => d.status === "ready_to_publish");
    const publishOverlay = publishDraft
      ? input.approvalOverlays?.[publishDraft.id]
      : undefined;
    if (publishOverlay?.publishing?.scheduledAt) {
      const { timeLabel } = formatScheduleLabels(publishOverlay.publishing.scheduledAt);
      return {
        label: `Publish at ${timeLabel}`,
        blocked: false,
      };
    }
  }

  switch (phase) {
    case "planning":
      return { label: "Finish campaign plan", blocked: false };
    case "researching":
      return { label: "Complete audience and channel research", blocked: false };
    case "creating":
      return {
        label: unit?.needsVisual ? "Generate image and caption" : "Generate content",
        blocked: false,
      };
    case "monitoring":
      return { label: "Collect analytics", blocked: false };
    case "learning":
      return { label: "Generate recommendations", blocked: false };
    case "completed":
      return { label: "Campaign complete", blocked: false };
    default:
      return { label: "Continue campaign work", blocked: false };
  }
}

function buildEmmaTimeline(
  project: MarketingProject,
  workUnits: WorkUnit[],
  peerName: string
): ProjectTimelineEntry[] {
  const entries: ProjectTimelineEntry[] = [
    {
      id: `${project.id}-started`,
      at: project.createdAt,
      timeLabel: formatTimelineTime(project.createdAt),
      message: "I started working on your campaign.",
      kind: "milestone",
    },
  ];

  for (const unit of workUnitsForProject(project.id, workUnits)) {
    for (const event of unit.eventLog) {
      entries.push({
        id: event.id,
        at: event.at,
        timeLabel: formatTimelineTime(event.at),
        message: emmaVoiceForEvent(event.event, unit, peerName),
        kind:
          event.event === "review_ready" || event.event === "approved"
            ? "review"
            : event.event === "published" || event.event === "scheduled"
              ? "publish"
              : event.event === "monitoring_started"
                ? "performance"
                : "update",
        isEmmaUpdate: event.event !== "task_requested",
      });
    }
  }

  entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return entries;
}

function buildConversation(
  timeline: ProjectTimelineEntry[],
  questions: ProjectQuestion[],
  decisions: ProjectDecision[]
): ProjectConversationEntry[] {
  const fromTimeline: ProjectConversationEntry[] = timeline.map((entry) => ({
    id: `conv-${entry.id}`,
    at: entry.at,
    timeLabel: entry.timeLabel,
    message: entry.message,
    kind:
      entry.kind === "review"
        ? "waiting"
        : entry.kind === "publish"
          ? "published"
          : entry.isEmmaUpdate
            ? "update"
            : "progress",
  }));

  const fromQuestions: ProjectConversationEntry[] = questions.map((q) => ({
    id: `conv-q-${q.id}`,
    at: new Date().toISOString(),
    timeLabel: "Now",
    message: q.prompt,
    kind: "question",
  }));

  const fromDecisions: ProjectConversationEntry[] = decisions.map((d) => ({
    id: `conv-d-${d.id}`,
    at: new Date().toISOString(),
    timeLabel: "Recently",
    message: d.summary,
    kind: "decision",
  }));

  return [...fromTimeline, ...fromDecisions, ...fromQuestions].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );
}

function deriveQuestions(
  input: MarketingPeerDomainInput,
  drafts: MarketingContentDraft[],
  phase: MarketingProjectPhase
): ProjectQuestion[] {
  if (phase !== "review") return [];

  const questions: ProjectQuestion[] = [];
  for (const draft of drafts.filter((d) => d.status === "ready_for_review")) {
    const overlay = input.approvalOverlays?.[draft.id];
    const deliverable = buildApprovalDeliverable({
      draft,
      workUnit: input.workUnits.find((u) => u.draftId === draft.id) ?? null,
      overlay,
      connections: input.connections,
      peerName: input.peerName,
    });
    if (deliverable.media.length > 1) {
      questions.push({
        id: `q-media-${draft.id}`,
        prompt: "Which image do you prefer?",
        context: `${deliverable.media.length} options prepared`,
      });
    }
    if (overlay?.publishing?.scheduledAt) {
      const { dateLabel, timeLabel } = formatScheduleLabels(overlay.publishing.scheduledAt);
      questions.push({
        id: `q-schedule-${draft.id}`,
        prompt: `Should I schedule this for ${dateLabel} at ${timeLabel}?`,
      });
    }
  }
  return questions;
}

function deriveEmmaUpdates(
  input: MarketingPeerDomainInput,
  drafts: MarketingContentDraft[]
): ProjectTimelineEntry[] {
  const updates: ProjectTimelineEntry[] = [];
  const now = new Date().toISOString();

  for (const draft of drafts) {
    const overlay = input.approvalOverlays?.[draft.id];
    const deliverable = buildApprovalDeliverable({
      draft,
      workUnit: input.workUnits.find((u) => u.draftId === draft.id) ?? null,
      overlay,
      connections: input.connections,
      peerName: input.peerName,
    });

    if (!deliverable.account.connected && draft.status === "ready_for_review") {
      updates.push({
        id: `update-conn-${draft.id}`,
        at: draft.generatedAt,
        timeLabel: formatTimelineTime(draft.generatedAt),
        message: `I detected that your ${deliverable.account.name} account is not connected yet.`,
        kind: "update",
        isEmmaUpdate: true,
      });
    }

    if (deliverable.media.length > 1) {
      updates.push({
        id: `update-media-${draft.id}`,
        at: draft.generatedAt,
        timeLabel: formatTimelineTime(draft.generatedAt),
        message: `I prepared ${deliverable.media.length} image options.`,
        kind: "update",
        isEmmaUpdate: true,
      });
    }

    for (const warning of draft.warnings.slice(0, 1)) {
      updates.push({
        id: `update-warn-${draft.id}`,
        at: now,
        timeLabel: formatTimelineTime(now),
        message: warning,
        kind: "update",
        isEmmaUpdate: true,
      });
    }
  }

  return updates;
}

function buildPhaseIndicators(
  phase: MarketingProjectPhase
): ProjectExperienceViewModel["phases"] {
  const currentIdx = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER.map((id, idx) => ({
    id,
    label: MARKETING_PROJECT_PHASE_LABELS[id],
    complete: idx < currentIdx,
    current: id === phase,
  }));
}

export type BuildProjectExperienceInput = MarketingPeerDomainInput & {
  project: MarketingProject;
  reviewHref?: string;
  performanceHref: string;
  contentItems: Array<{ id: string; title: string; href: string; status: string }>;
};

export function buildProjectExperience(
  input: BuildProjectExperienceInput
): ProjectExperienceViewModel {
  const { project } = input;
  const scheduled = scheduledDraftIds(input);
  const status = deriveProjectStatus(
    project,
    input.workUnits,
    input.drafts,
    scheduled
  );
  const progress = deriveProjectProgress(project, input.workUnits, status);
  const unit = primaryWorkUnitForProject(project.id, input.workUnits);
  const units = workUnitsForProject(project.id, input.workUnits);
  const draftIds = new Set(units.map((u) => u.draftId).filter(Boolean) as string[]);
  const projectDrafts = input.drafts.filter((d) => draftIds.has(d.id));

  let effectivePhase = derivePhase(status, unit);
  const publishedDraft =
    projectDrafts.find((d) => d.status === "published") ??
    (unit?.draftId
      ? input.drafts.find((d) => d.id === unit.draftId && d.status === "published")
      : undefined);
  if (publishedDraft && (effectivePhase === "monitoring" || status === "monitoring_results")) {
    const perf = buildContentPerformanceSummary(input, publishedDraft.id, true);
    if (perf.hasLiveData) {
      effectivePhase = "learning";
    }
  }
  if (status === "completed") effectivePhase = "completed";

  const { activity, kind: activityKind, isLive } = deriveCurrentActivity(
    input,
    project,
    status,
    effectivePhase,
    unit,
    projectDrafts
  );

  const priority: ProjectHeroViewModel["priority"] =
    effectivePhase === "review"
      ? "needs_you"
      : effectivePhase === "publishing"
        ? "scheduled"
        : effectivePhase === "completed"
          ? "complete"
          : "normal";

  const heroMessage =
    effectivePhase === "review"
      ? `${input.peerName} has completed everything.`
      : activity;

  const hero: ProjectHeroViewModel = {
    title: project.title,
    goal: project.goal,
    phase: effectivePhase,
    phaseLabel: MARKETING_PROJECT_PHASE_LABELS[effectivePhase],
    progress,
    currentActivity: activity,
    activityKind,
    isLive,
    estimatedCompletion: deriveEstimatedCompletion(unit, isLive, effectivePhase),
    priority,
    statusLabel: projectStatusLabel(status),
    primaryCta:
      effectivePhase === "review" && input.reviewHref
        ? { label: "Review now", href: input.reviewHref }
        : undefined,
    heroMessage,
  };

  const nextStep = deriveNextStep(
    input,
    status,
    effectivePhase,
    unit,
    projectDrafts
  );

  const baseTimeline = buildEmmaTimeline(project, input.workUnits, input.peerName);
  const emmaUpdates = deriveEmmaUpdates(input, projectDrafts);
  const timeline = [...baseTimeline, ...emmaUpdates].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  const questions = deriveQuestions(input, projectDrafts, effectivePhase);
  const decisions: ProjectDecision[] = [];
  const conversation = buildConversation(timeline, questions, decisions);

  let publishing: ProjectPublishingInfo | undefined;
  const scheduledDraft = projectDrafts.find(
    (d) => d.status === "ready_to_publish" || scheduled.has(d.id)
  );
  const schedOverlay = scheduledDraft
    ? input.approvalOverlays?.[scheduledDraft.id]
    : undefined;
  if (
    (effectivePhase === "publishing" || schedOverlay?.publishing?.scheduledAt) &&
    schedOverlay?.publishing?.scheduledAt
  ) {
    const { dateLabel, timeLabel } = formatScheduleLabels(
      schedOverlay.publishing.scheduledAt
    );
    publishing = {
      scheduledAt: schedOverlay.publishing.scheduledAt,
      scheduledDateLabel: dateLabel,
      scheduledTimeLabel: timeLabel,
      channel: scheduledDraft
        ? buildApprovalDeliverable({
            draft: scheduledDraft,
            workUnit: unit,
            overlay: schedOverlay,
            connections: input.connections,
            peerName: input.peerName,
          }).account.name
        : "Channel",
      message: `${input.peerName} will automatically publish this campaign.`,
    };
  }

  let monitoring: ProjectMonitoringInfo | undefined;
  if (effectivePhase === "monitoring" && publishedDraft) {
    const perf = buildContentPerformanceSummary(input, publishedDraft.id, true);
    monitoring = {
      message: `${input.peerName} is collecting early performance signals.`,
      dataUnavailableReason: perf.emptyMessage,
      hasLiveData: perf.hasLiveData,
    };
  }

  let learning: ProjectLearningInfo | undefined;
  if (effectivePhase === "learning" && publishedDraft) {
    const perf = buildContentPerformanceSummary(input, publishedDraft.id, true);
    learning = {
      summary: perf.hasLiveData
        ? "Early performance data is coming in."
        : "I'm waiting for channel analytics to sync before drawing conclusions.",
      whatWorked: perf.hasLiveData
        ? "Published content is being measured — check Performance for live metrics."
        : undefined,
      whatToImprove: perf.hasLiveData ? undefined : "Connect analytics to unlock learning insights.",
      hasSufficientData: perf.hasLiveData,
    };
  }

  const reviewStatus =
    effectivePhase === "review"
      ? "Waiting for your approval"
      : projectDrafts.some((d) => d.status === "approved")
        ? "Approved"
        : "Not required yet";

  const publishingStatus = publishing
    ? `Scheduled · ${publishing.scheduledDateLabel} ${publishing.scheduledTimeLabel}`
    : publishedDraft
      ? "Published"
      : "Not scheduled";

  const performanceStatus = publishedDraft
    ? monitoring?.hasLiveData || learning?.hasSufficientData
      ? "Collecting data"
      : "Waiting for channel sync"
    : "After publish";

  const linkedResponsibility = project.responsibilityId
    ? input.responsibilities.find((r) => r.id === project.responsibilityId)
    : undefined;
  const originLabel = MARKETING_PROJECT_ORIGIN_LABELS[project.origin ?? "manual_assignment"];

  const sidebar: ProjectSidebarViewModel = {
    goal: project.goal,
    campaignTypeLabel: campaignTypeLabel(project.campaignType),
    statusLabel: projectStatusLabel(status),
    progress,
    phaseLabel: MARKETING_PROJECT_PHASE_LABELS[effectivePhase],
    dueLabel: unit?.estimatedCompletionAt
      ? formatRelativeTime(unit.estimatedCompletionAt)
      : publishing?.scheduledDateLabel,
    reviewStatus,
    publishingStatus,
    performanceStatus,
    originLabel,
    responsibilityTitle: linkedResponsibility?.title,
    responsibilityHref: linkedResponsibility
      ? getResponsibilityHref(input.peerId, linkedResponsibility.id)
      : undefined,
    relatedContent: input.contentItems.map((c) => ({
      id: c.id,
      title: c.title,
      href: c.href,
    })),
  };

  return {
    hero,
    phases: buildPhaseIndicators(effectivePhase),
    nextStep,
    conversation,
    timeline,
    questions,
    decisions,
    publishing,
    monitoring,
    learning,
    sidebar,
    emptyStates: {
      content: projectDrafts.length
        ? ""
        : `${input.peerName} hasn't generated content for this campaign yet. Content will appear here once creation begins.`,
      timeline: timeline.length
        ? ""
        : `${input.peerName} will report progress here as work begins.`,
      performance: publishedDraft
        ? monitoring?.dataUnavailableReason ??
          "Performance data appears after channels sync."
        : "Performance tracking starts after publication.",
    },
  };
}
