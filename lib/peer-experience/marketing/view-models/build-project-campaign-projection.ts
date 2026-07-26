import { assembleCampaign } from "@/lib/campaign";
import type { Campaign, CampaignStatus } from "@/lib/campaign";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MarketingProject, MarketingProjectStatus } from "../projects/types";
import {
  buildProjectTimeline,
  deriveProjectProgress,
  deriveProjectStatus,
  workUnitsForProject,
} from "../projects/project-engine";
import type { MarketingCampaignViewModelSource } from "./marketing-campaign-types";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";
import { buildMarketingCampaignViewModelSourceFromDomainInput } from "./build-marketing-campaigns-view-model";

export function draftIdsForMarketingProject(
  projectId: string,
  workUnits: readonly WorkUnit[] | undefined
): string[] {
  const ids: string[] = [];
  for (const unit of workUnitsForProject(projectId, [...(workUnits ?? [])])) {
    if (unit.draftId) {
      ids.push(unit.draftId);
    }
  }
  return ids;
}

export function mapProjectStatusToCampaignStatus(
  status: MarketingProjectStatus
): CampaignStatus {
  switch (status) {
    case "archived":
      return "archived";
    case "completed":
      return "completed";
    case "waiting_for_review":
      return "ready";
    case "publishing":
    case "scheduled":
    case "monitoring_results":
      return "active";
    case "preparing":
      return "planning";
    default:
      return "planning";
  }
}

function audienceOneLiner(source: MarketingCampaignViewModelSource): string | undefined {
  const segment =
    source.strategy?.targetAudiences.find((a) => a.priority === "primary")?.segment ??
    source.strategy?.targetAudiences[0]?.segment;
  return segment?.trim() || undefined;
}

export function assembleCampaignForMarketingProject(
  project: MarketingProject,
  source: MarketingCampaignViewModelSource,
  options?: { scheduledDraftIds?: Set<string> }
): Campaign {
  const scheduled = options?.scheduledDraftIds ?? new Set<string>();
  const projectStatus = deriveProjectStatus(
    project,
    [...(source.workUnits ?? [])],
    [...(source.drafts ?? [])],
    scheduled
  );
  const progress = deriveProjectProgress(
    project,
    [...(source.workUnits ?? [])],
    projectStatus
  );
  const draftIds = draftIdsForMarketingProject(project.id, source.workUnits);
  const workforce = workforceAssignmentsForProject(project, source);
  const setup = project.campaignSetup;
  const targetAudience =
    setup?.targetAudience?.trim() ||
    audienceOneLiner(source) ||
    undefined;

  return assembleCampaign({
    organizationId: source.organizationId ?? "unknown-org",
    campaignId: project.id,
    name: project.title,
    description: setup?.description?.trim() || project.goal,
    strategy: source.strategy ?? undefined,
    plan: source.plan ?? undefined,
    assembledAt: project.updatedAt,
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
    status: mapProjectStatusToCampaignStatus(projectStatus),
    progress: {
      percentComplete: progress,
      summary: draftIds.length
        ? `${draftIds.length} deliverable(s) linked to this campaign.`
        : undefined,
    },
    generatedContentIds: draftIds,
    audience: targetAudience ? { targetAudience } : undefined,
    timeline:
      setup?.startDate || setup?.endDate
        ? {
            startDate: setup.startDate,
            endDate: setup.endDate,
          }
        : undefined,
    budget:
      setup?.budgetAmount !== undefined && setup.budgetAmount > 0
        ? {
            allocated: setup.budgetAmount,
            currency: setup.budgetCurrency ?? "USD",
          }
        : undefined,
    approvalMode: setup?.approvalMode,
    workforce,
    seedCanonicalWorkforce: false,
  });
}

function workforceAssignmentsForProject(
  project: MarketingProject,
  source: MarketingCampaignViewModelSource
) {
  if (!project.responsibilityId) {
    return [];
  }
  const responsibility = (source.responsibilities ?? []).find(
    (r) => r.id === project.responsibilityId
  );
  if (!responsibility) {
    return [];
  }
  return [
    {
      role: "campaign_planner" as const,
      displayName: responsibility.title,
      responsibility: responsibility.goal,
      status: responsibility.enabled ? ("assigned" as const) : ("idle" as const),
    },
  ];
}

export function enrichSourceWithProjectContentIds(
  source: MarketingCampaignViewModelSource,
  projectId: string
): MarketingCampaignViewModelSource {
  const draftIds = draftIdsForMarketingProject(projectId, source.workUnits);
  return {
    ...source,
    contentIdsByCampaignId: {
      ...source.contentIdsByCampaignId,
      [projectId]: draftIds,
    },
  };
}

export function buildMarketingCampaignDetailSourceFromDomainInput(
  input: MarketingPeerDomainInput,
  campaignId: string
): import("./marketing-campaign-types").MarketingCampaignDetailSource {
  const base = buildMarketingCampaignViewModelSourceFromDomainInput(input);
  return {
    ...enrichSourceWithProjectContentIds(base, campaignId),
    campaignId,
  };
}

export function projectActivitySummaryForCampaign(
  project: MarketingProject,
  workUnits: readonly WorkUnit[] | undefined
) {
  const timeline = buildProjectTimeline(project, [...(workUnits ?? [])]);
  return timeline.map((entry) => ({
    id: entry.id,
    label: entry.label,
    at: entry.at,
  }));
}

export function projectCampaignProgressKnown(
  project: MarketingProject,
  workUnits: readonly WorkUnit[] | undefined,
  progress: number
): boolean {
  return workUnitsForProject(project.id, [...(workUnits ?? [])]).length > 0 || progress > 0;
}
