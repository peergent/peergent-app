import type { MarketingContentItem } from "../domain/marketing-peer-types";
import { buildApprovalDeliverable } from "../approval/build-approval-deliverable";
import {
  getPerformanceHref,
  getProjectHref,
  getProjectReviewHref,
} from "../navigation/marketing-peer-links";
import { humanChannelLabel } from "../publish-preview-formatters";
import {
  buildProjectTimeline,
  campaignTypeLabel,
  deriveProjectNextStep,
  deriveProjectProgress,
  deriveProjectStatus,
  primaryWorkUnitForProject,
  projectStatusLabel,
  workUnitsForProject,
} from "../projects/project-engine";
import type { MarketingProjectTimelineEntry } from "../projects/types";
import { buildProjectExperience } from "../projects/build-project-experience";
import type { ProjectExperienceViewModel } from "../projects/project-experience-types";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";
import { buildContentPerformanceSummary } from "./build-content-performance-summary";

export type MarketingProjectDetailSection =
  | "overview"
  | "timeline"
  | "content"
  | "reviews"
  | "publishing"
  | "performance"
  | "activity"
  | "insights"
  | "files";

export type MarketingProjectDetailViewModel = {
  projectId: string;
  title: string;
  goal: string;
  statusLabel: string;
  progress: number;
  createdAt: string;
  ownerLabel: string;
  campaignTypeLabel: string;
  approvalStatus?: string;
  performanceSummary?: string;
  nextStep?: string;
  timeline: MarketingProjectTimelineEntry[];
  contentItems: MarketingContentItem[];
  reviewDeliverableIds: string[];
  sections: Array<{ id: MarketingProjectDetailSection; label: string }>;
  performanceHref: string;
  reviewHref?: string;
  experience: ProjectExperienceViewModel;
};

function scheduledDraftIds(input: MarketingPeerDomainInput): Set<string> {
  const ids = new Set<string>();
  for (const [draftId, overlay] of Object.entries(input.approvalOverlays ?? {})) {
    if (overlay?.publishing?.scheduledAt) ids.add(draftId);
  }
  return ids;
}

export function buildMarketingProjectDetailViewModel(
  input: MarketingPeerDomainInput & { projectId: string }
): MarketingProjectDetailViewModel | null {
  const project = input.projects.find((p) => p.id === input.projectId);
  if (!project) return null;

  const scheduled = scheduledDraftIds(input);
  const status = deriveProjectStatus(project, input.workUnits, input.drafts, scheduled);
  const progress = deriveProjectProgress(project, input.workUnits, status);
  const units = workUnitsForProject(project.id, input.workUnits);
  const primary = primaryWorkUnitForProject(project.id, input.workUnits);
  const draftIds = new Set(units.map((u) => u.draftId).filter(Boolean) as string[]);

  const contentItems: MarketingContentItem[] = input.drafts
    .filter((d) => draftIds.has(d.id))
    .map((draft) => {
      const overlay = input.approvalOverlays?.[draft.id];
      const deliverable = buildApprovalDeliverable({
        draft,
        workUnit: input.workUnits.find((u) => u.draftId === draft.id) ?? null,
        overlay,
        connections: input.connections,
        peerName: input.peerName,
      });
      const thumb = deliverable.media[0]?.thumbnailUrl ?? deliverable.media[0]?.url;

      return {
        id: draft.id,
        draftId: draft.id,
        title: draft.title,
        channel: humanChannelLabel(draft),
        contentType: draft.contentType,
        status:
          draft.status === "ready_for_review"
            ? "ready_for_review"
            : draft.status === "approved"
              ? "approved"
              : draft.status === "ready_to_publish"
                ? "scheduled"
                : draft.status === "published"
                  ? "published"
                  : "draft",
        publishedAt: draft.status === "published" ? draft.generatedAt : undefined,
        scheduledAt: overlay?.publishing?.scheduledAt,
        campaign: project.title,
        projectId: project.id,
        projectTitle: project.title,
        projectHref: getProjectHref(input.peerId, project.id),
        thumbnailUrl: thumb || undefined,
        performanceSummary:
          draft.status === "published"
            ? "View performance after channels sync"
            : undefined,
        href: getProjectHref(input.peerId, project.id, "content"),
        performanceHref: getPerformanceHref(input.peerId, {
          contentId: draft.id,
          channel: draft.channel ?? draft.contentType,
        }),
      };
    });

  const reviewDeliverableIds = contentItems
    .filter((item) => item.status === "ready_for_review")
    .map((item) => item.draftId);

  const performanceSummary =
    contentItems.some((c) => c.status === "published")
      ? buildContentPerformanceSummary(input, contentItems[0]!.draftId, true).emptyMessage
      : undefined;

  const reviewHref =
    reviewDeliverableIds[0]
      ? getProjectReviewHref(input.peerId, project.id, reviewDeliverableIds[0])
      : undefined;

  const experience = buildProjectExperience({
    ...input,
    project,
    reviewHref,
    performanceHref: getPerformanceHref(input.peerId, { campaignId: project.id }),
    contentItems: contentItems.map((c) => ({
      id: c.id,
      title: c.title,
      href: c.href,
      status: c.status,
    })),
  });

  return {
    projectId: project.id,
    title: project.title,
    goal: project.goal,
    statusLabel: projectStatusLabel(status),
    progress,
    createdAt: project.createdAt,
    ownerLabel: project.ownerLabel,
    campaignTypeLabel: campaignTypeLabel(project.campaignType),
    approvalStatus: reviewDeliverableIds.length > 0 ? "Approval required" : undefined,
    performanceSummary,
    nextStep: deriveProjectNextStep(status, input.workUnits, project.id),
    timeline: buildProjectTimeline(project, input.workUnits),
    contentItems,
    reviewDeliverableIds,
    sections: [
      { id: "overview", label: "Overview" },
      { id: "timeline", label: "Timeline" },
      { id: "content", label: "Generated Content" },
      { id: "reviews", label: "Reviews" },
      { id: "publishing", label: "Publishing" },
      { id: "performance", label: "Performance" },
      { id: "activity", label: "Activity" },
      { id: "insights", label: "Insights" },
      { id: "files", label: "Files" },
    ],
    performanceHref: getPerformanceHref(input.peerId, { campaignId: project.id }),
    reviewHref,
    experience,
  };
}

export function findProjectIdForDraft(
  draftId: string,
  input: MarketingPeerDomainInput
): string | null {
  const unit = input.workUnits.find((u) => u.draftId === draftId);
  return unit?.projectId ?? null;
}

export function findProjectIdForWorkUnit(
  workUnitId: string,
  input: MarketingPeerDomainInput
): string | null {
  return input.workUnits.find((u) => u.id === workUnitId)?.projectId ?? null;
}
