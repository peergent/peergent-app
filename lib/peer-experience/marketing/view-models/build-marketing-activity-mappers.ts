import type { ActivityFeedItem } from "@/lib/marketing-workspace";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import {
  getAutomationHref,
  getContentHref,
  getPerformanceHref,
  getProjectHref,
  getProjectReviewHref,
  getReviewHref,
  resolveWorkUnitProjectHref,
} from "../navigation/marketing-peer-links";
import type { MarketingActivity, MarketingApprovalQueueItem } from "../domain/marketing-peer-types";
import { buildApprovalDeliverable } from "../approval/build-approval-deliverable";
import { formatRelativeTime } from "../emma-narrative";
import { humanChannelLabel } from "../publish-preview-formatters";
import { findProjectIdForDraft } from "./build-marketing-project-detail-view-model";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

const ATTENTION_REASONS: Record<string, string> = {
  ready_for_review: "Content approval required",
  draft: "Content approval required",
};

function attentionReasonForDraft(draft: MarketingContentDraft, connected: boolean): string {
  if (!connected) return "Connection permission required";
  return ATTENTION_REASONS[draft.status] ?? "Content approval required";
}

function mapDraftToApprovalQueueItem(
  draft: MarketingContentDraft,
  input: MarketingPeerDomainInput
): MarketingApprovalQueueItem {
  const overlay = input.approvalOverlays?.[draft.id];
  const deliverable = buildApprovalDeliverable({
    draft,
    workUnit: input.workUnits.find((u) => u.draftId === draft.id) ?? null,
    overlay,
    connections: input.connections,
    peerName: input.peerName,
  });
  const thumb = deliverable.media[0]?.thumbnailUrl ?? deliverable.media[0]?.url;
  const scheduled = overlay?.publishing?.scheduledAt;

  const projectId = findProjectIdForDraft(draft.id, input);
  const project = projectId ? input.projects.find((p) => p.id === projectId) : undefined;

  const waitingLabel = draft.generatedAt
    ? `waiting ${formatRelativeTime(draft.generatedAt)}`
    : undefined;

  return {
    id: draft.id,
    draftId: draft.id,
    deliverableId: draft.id,
    channel: humanChannelLabel(draft),
    title: draft.title,
    thumbnailUrl: thumb || undefined,
    attentionReason:
      project?.title && waitingLabel
        ? `"${project.title}" · ${waitingLabel}`
        : waitingLabel ?? attentionReasonForDraft(draft, deliverable.account.connected),
    dueLabel: scheduled
      ? `Scheduled · ${new Date(scheduled).toLocaleDateString()}`
      : undefined,
    status: draft.status,
    reviewHref: projectId
      ? getProjectReviewHref(input.peerId, projectId, draft.id)
      : getReviewHref(input.peerId, draft.id),
    projectId: projectId ?? undefined,
    projectTitle: project?.title,
    projectHref: projectId ? getProjectHref(input.peerId, projectId) : undefined,
  };
}

/** Canonical decision queue — all items needing owner input. */
export function buildAllMarketingApprovalQueue(
  input: MarketingPeerDomainInput
): MarketingApprovalQueueItem[] {
  return input.drafts
    .filter((d) => d.status === "ready_for_review" || d.status === "draft")
    .map((draft) => mapDraftToApprovalQueueItem(draft, input));
}

export function buildMarketingApprovalQueue(
  input: MarketingPeerDomainInput
): MarketingApprovalQueueItem[] {
  return buildAllMarketingApprovalQueue(input).slice(0, 3);
}

const ACTIVITY_TYPE_LABELS: Record<MarketingActivity["type"], string> = {
  published: "Published",
  scheduled: "Scheduled",
  generated: "Generated",
  optimized: "Optimized",
  completed: "Completed",
  approved: "Approved",
  sent: "Sent",
  measured: "Measured",
};

const ACTIVITY_ACTION_LABELS: Record<MarketingActivity["type"], string> = {
  published: "Open Project",
  scheduled: "Open Project",
  generated: "Open Project",
  optimized: "View performance",
  completed: "Open Project",
  approved: "Open Project",
  sent: "Open Project",
  measured: "View performance",
};

function projectTarget(
  peerId: string,
  projectId: string,
  section?: string
): MarketingActivity["target"] {
  return {
    kind: "project",
    id: projectId,
    href: getProjectHref(peerId, projectId, section),
  };
}

function activityTarget(
  item: ActivityFeedItem,
  input: MarketingPeerDomainInput
): MarketingActivity["target"] {
  const { peerId, drafts, workUnits } = input;
  const relatedDraft = drafts.find(
    (d) =>
      d.title === item.relatedObject ||
      d.planActivityReference === item.relatedObject ||
      item.description.includes(d.title)
  );
  const relatedUnit = workUnits.find(
    (u) => u.title === item.relatedObject || u.planActivityReference === item.relatedObject
  );
  const relatedProject = relatedUnit?.projectId
    ? input.projects.find((p) => p.id === relatedUnit.projectId)
    : relatedDraft
      ? input.projects.find((p) => p.id === findProjectIdForDraft(relatedDraft.id, input))
      : input.projects.find((p) => p.title === item.relatedObject);

  if (relatedProject) {
    const section =
      item.activityType === "draft_approved" ||
      item.activityType === "waiting_approval" ||
      item.activityType === "draft_rejected"
        ? "reviews"
        : item.activityType === "published" || item.activityType === "publication_ready"
          ? "performance"
          : "overview";
    return projectTarget(peerId, relatedProject.id, section);
  }

  switch (item.activityType) {
    case "published":
    case "publication_ready":
    case "draft_generated":
      if (relatedDraft) {
        const projectId = findProjectIdForDraft(relatedDraft.id, input);
        if (projectId) return projectTarget(peerId, projectId, "content");
        return {
          kind: "content",
          id: relatedDraft.id,
          href: getContentHref(peerId, relatedDraft.id),
        };
      }
      return { kind: "content", href: getContentHref(peerId) };
    case "waiting_approval":
    case "draft_approved":
    case "draft_rejected":
      if (relatedDraft) {
        const projectId = findProjectIdForDraft(relatedDraft.id, input);
        if (projectId) return projectTarget(peerId, projectId, "reviews");
        return {
          kind: "review",
          id: relatedDraft.id,
          href: getReviewHref(peerId, relatedDraft.id),
        };
      }
      return { kind: "review", href: getReviewHref(peerId) };
    case "publication_prepared":
      if (relatedUnit) {
        return {
          kind: "project",
          id: relatedUnit.projectId ?? relatedUnit.id,
          href: resolveWorkUnitProjectHref(peerId, relatedUnit.id, workUnits),
        };
      }
      return { kind: "project", href: getProjectHref(peerId) };
    case "strategy_completed":
    case "plan_completed":
      return { kind: "performance", href: getPerformanceHref(peerId) };
    default:
      if (relatedUnit?.projectId) {
        return projectTarget(peerId, relatedUnit.projectId);
      }
      if (relatedUnit) {
        return {
          kind: "project",
          id: relatedUnit.id,
          href: resolveWorkUnitProjectHref(peerId, relatedUnit.id, workUnits),
        };
      }
      if (relatedDraft) {
        const projectId = findProjectIdForDraft(relatedDraft.id, input);
        if (projectId) return projectTarget(peerId, projectId);
        return {
          kind: "content",
          id: relatedDraft.id,
          href: getContentHref(peerId, relatedDraft.id),
        };
      }
      return { kind: "project", href: getProjectHref(peerId) };
  }
}

function activityFromDraft(
  draft: MarketingContentDraft,
  input: MarketingPeerDomainInput
): MarketingActivity {
  const type = draft.status === "published" ? "published" : "scheduled";
  const projectId = findProjectIdForDraft(draft.id, input);
  const project = projectId ? input.projects.find((p) => p.id === projectId) : undefined;
  return {
    id: `draft-act-${draft.id}`,
    type,
    typeLabel: ACTIVITY_TYPE_LABELS[type],
    title: project?.title ?? draft.title,
    summary: humanChannelLabel(draft),
    occurredAt: draft.generatedAt,
    timeLabel: formatRelativeTime(draft.generatedAt),
    channel: humanChannelLabel(draft),
    actionLabel: ACTIVITY_ACTION_LABELS[type],
    target: projectId
      ? projectTarget(input.peerId, projectId, type === "published" ? "performance" : "publishing")
      : {
          kind: "content",
          id: draft.id,
          href: getContentHref(input.peerId, draft.id),
        },
  };
}
function mapActivityType(
  activityType: ActivityFeedItem["activityType"]
): MarketingActivity["type"] {
  switch (activityType) {
    case "published":
      return "published";
    case "publication_prepared":
    case "publication_ready":
      return "scheduled";
    case "draft_generated":
      return "generated";
    case "draft_approved":
      return "approved";
    case "draft_rejected":
      return "completed";
    case "plan_completed":
    case "strategy_completed":
      return "completed";
    default:
      return "completed";
  }
}

function humanActivityTitle(
  item: ActivityFeedItem,
  draft: MarketingContentDraft | undefined,
  projectTitle?: string
): string {
  if (projectTitle && item.activityType !== "draft_generated") {
    return projectTitle;
  }
  switch (item.activityType) {
    case "published":
      return projectTitle ?? (draft ? draft.title : item.title);
    case "draft_approved":
      return projectTitle ?? (draft ? `Approved ${draft.title}` : item.title);
    case "draft_generated":
      return projectTitle ?? (draft ? `Generated ${draft.title}` : item.title);
    case "publication_ready":
      return projectTitle ?? (draft ? `Scheduled ${draft.title}` : item.title);
    default:
      return projectTitle ?? item.title;
  }
}

export function buildMarketingActivities(input: MarketingPeerDomainInput): MarketingActivity[] {
  const fromFeed = input.activityFeed
    .filter((item) => item.activityType !== "conversation" && item.activityType !== "focus_updated")
    .slice(0, 8)
    .map((item) => {
      const relatedDraft = input.drafts.find(
        (d) => d.title === item.relatedObject || d.planActivityReference === item.relatedObject
      );
      const relatedUnit = input.workUnits.find(
        (u) => u.title === item.relatedObject || u.planActivityReference === item.relatedObject
      );
      const projectId =
        relatedUnit?.projectId ??
        (relatedDraft ? findProjectIdForDraft(relatedDraft.id, input) : null);
      const project = projectId
        ? input.projects.find((p) => p.id === projectId)
        : input.projects.find((p) => p.title === item.relatedObject);
      const type = mapActivityType(item.activityType);
      return {
        id: item.id,
        type,
        typeLabel: ACTIVITY_TYPE_LABELS[type],
        title: humanActivityTitle(item, relatedDraft, project?.title),
        summary: item.description || (relatedDraft ? humanChannelLabel(relatedDraft) : undefined),
        occurredAt: item.timestamp,
        timeLabel: formatRelativeTime(item.timestamp),
        channel: relatedDraft ? humanChannelLabel(relatedDraft) : item.relatedObject,
        actionLabel: ACTIVITY_ACTION_LABELS[type],
        target: activityTarget(item, input),
      };
    });

  if (fromFeed.length > 0) return fromFeed;

  return input.drafts
    .filter((d) => d.status === "published" || d.status === "ready_to_publish")
    .slice(0, 6)
    .map((draft) => activityFromDraft(draft, input));
}

export function buildMarketingAutomationActivity(
  peerId: string,
  automationId: string,
  title: string,
  occurredAt: string
): MarketingActivity {
  return {
    id: `auto-${automationId}`,
    type: "completed",
    typeLabel: ACTIVITY_TYPE_LABELS.completed,
    title,
    occurredAt,
    timeLabel: formatRelativeTime(occurredAt),
    actionLabel: "View automation",
    target: {
      kind: "automation",
      id: automationId,
      href: getAutomationHref(peerId, automationId),
    },
  };
}
