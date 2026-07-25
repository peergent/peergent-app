import type {
  MarketingProjectFilter,
  MarketingProjectItem,
} from "../domain/marketing-peer-types";
import {
  getProjectHref,
  getProjectReviewHref,
} from "../navigation/marketing-peer-links";
import { formatRelativeTime } from "../emma-narrative";
import {
  campaignTypeLabel,
  deriveProjectNextStep,
  deriveProjectProgress,
  deriveProjectStatus,
  primaryWorkUnitForProject,
  projectStatusLabel,
  workUnitsForProject,
} from "../projects/project-engine";
import type { MarketingProjectStatus } from "../projects/types";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

export type MarketingProjectsViewModel = {
  filter: MarketingProjectFilter;
  items: MarketingProjectItem[];
  emptyMessage: string;
};

function scheduledDraftIds(input: MarketingPeerDomainInput): Set<string> {
  const ids = new Set<string>();
  for (const [draftId, overlay] of Object.entries(input.approvalOverlays ?? {})) {
    if (overlay?.publishing?.scheduledAt) ids.add(draftId);
  }
  return ids;
}

function projectMatchesFilter(
  status: MarketingProjectStatus,
  filter: MarketingProjectFilter,
  paused: boolean
): boolean {
  switch (filter) {
    case "active":
      return !["completed", "archived", "monitoring_results"].includes(status) && !paused;
    case "upcoming":
      return status === "planning";
    case "waiting":
      return status === "waiting_for_review" || status === "scheduled" || paused;
    case "completed":
      return status === "completed" || status === "monitoring_results" || status === "archived";
    default:
      return true;
  }
}

function approvalStatusForProject(
  input: MarketingPeerDomainInput,
  projectId: string
): string | undefined {
  const units = workUnitsForProject(projectId, input.workUnits);
  const draftIds = units.map((u) => u.draftId).filter(Boolean) as string[];
  const pending = draftIds.some((id) => {
    const draft = input.drafts.find((d) => d.id === id);
    return draft?.status === "ready_for_review";
  });
  if (pending) return "Approval required";
  const approved = draftIds.some((id) => {
    const draft = input.drafts.find((d) => d.id === id);
    return draft?.status === "approved" || draft?.status === "ready_to_publish";
  });
  if (approved) return "Approved";
  return undefined;
}

export function buildMarketingProjectsViewModel(
  input: MarketingPeerDomainInput & { filter?: MarketingProjectFilter }
): MarketingProjectsViewModel {
  const filter = input.filter ?? "active";
  const scheduled = scheduledDraftIds(input);

  const items: MarketingProjectItem[] = input.projects
    .map((project) => {
      const status = deriveProjectStatus(
        project,
        input.workUnits,
        input.drafts,
        scheduled
      );
      const primary = primaryWorkUnitForProject(project.id, input.workUnits);
      const progress = deriveProjectProgress(project, input.workUnits, status);
      const reviewDraftId = primary?.draftId ?? undefined;
      const needsReview = status === "waiting_for_review" && reviewDraftId;

      return {
        project,
        status,
        progress,
        primary,
        needsReview,
        reviewDraftId,
      };
    })
    .filter(({ status, primary }) =>
      projectMatchesFilter(status, filter, Boolean(primary?.paused))
    )
    .map(({ project, status, progress, primary, needsReview, reviewDraftId }) => ({
      id: project.id,
      title: project.title,
      goal: project.goal,
      statusLabel: projectStatusLabel(status),
      progress,
      startedAt: project.createdAt,
      startedLabel: formatRelativeTime(project.createdAt),
      nextStep: deriveProjectNextStep(status, input.workUnits, project.id),
      campaignTypeLabel: campaignTypeLabel(project.campaignType),
      approvalStatus: approvalStatusForProject(input, project.id),
      href: getProjectHref(input.peerId, project.id),
      reviewHref:
        needsReview && reviewDraftId
          ? getProjectReviewHref(input.peerId, project.id, reviewDraftId)
          : undefined,
    }))
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

  const emptyMessages: Record<MarketingProjectFilter, string> = {
    active: `${input.peerName} has no active projects right now.`,
    upcoming: "No projects in planning.",
    waiting: "Nothing waiting on you.",
    completed: "Completed projects will appear here.",
  };

  return {
    filter,
    items,
    emptyMessage: emptyMessages[filter],
  };
}

export function projectFilters(): Array<{ id: MarketingProjectFilter; label: string }> {
  return [
    { id: "active", label: "Active" },
    { id: "upcoming", label: "Upcoming" },
    { id: "waiting", label: "Waiting" },
    { id: "completed", label: "Completed" },
  ];
}

/** @deprecated Use buildMarketingProjectsViewModel */
export { buildMarketingProjectsViewModel as buildMarketingWorkViewModel };
export { projectFilters as workFilters };
