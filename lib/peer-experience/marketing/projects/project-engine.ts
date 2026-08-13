import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { WorkLifecycleStage } from "@/lib/peer-workflow/work-lifecycle";
import type { MarketingProjectOrigin } from "../responsibilities/types";
import { MARKETING_CAMPAIGN_TYPE_LABELS, MARKETING_PROJECT_STATUS_LABELS } from "./types";
import type {
  MarketingCampaignType,
  MarketingProject,
  MarketingProjectCampaignSetup,
  MarketingProjectStatus,
  MarketingProjectTimelineEntry,
  CampaignSetupChannel,
} from "./types";

function projectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function inferCampaignType(
  channel: string,
  deliverableKind: string,
  rawRequest: string
): MarketingCampaignType {
  const haystack = `${channel} ${deliverableKind} ${rawRequest}`.toLowerCase();
  if (haystack.includes("instagram")) return "instagram_campaign";
  if (haystack.includes("linkedin")) return "linkedin_campaign";
  if (haystack.includes("newsletter") || haystack.includes("email")) return "newsletter";
  if (haystack.includes("seo")) return "seo_audit";
  if (haystack.includes("google ads") || haystack.includes("google_ads")) return "google_ads";
  if (haystack.includes("meta") || haystack.includes("facebook")) return "meta_campaign";
  if (haystack.includes("product launch")) return "product_launch";
  if (haystack.includes("brand awareness")) return "brand_awareness";
  if (haystack.includes("content series")) return "content_series";
  if (haystack.includes("website")) return "website_refresh";
  return "custom";
}

export type CreateMarketingProjectInput = {
  peerId: string;
  title: string;
  goal: string;
  channel: string;
  deliverableKind: string;
  rawRequest: string;
  ownerLabel: string;
  responsibilityId?: string | null;
  origin?: MarketingProjectOrigin;
};

export function createMarketingProject(input: CreateMarketingProjectInput): MarketingProject {
  const now = new Date().toISOString();
  return {
    id: projectId(),
    peerId: input.peerId,
    title: input.title,
    goal: input.goal,
    campaignType: inferCampaignType(input.channel, input.deliverableKind, input.rawRequest),
    createdAt: now,
    updatedAt: now,
    ownerLabel: input.ownerLabel,
    rawRequest: input.rawRequest,
    archivedAt: null,
    responsibilityId: input.responsibilityId ?? null,
    origin: input.origin ?? "manual_assignment",
  };
}

/**
 * Empty campaign/project from the Create Campaign wizard — no work units or content generation.
 * Delegated content work continues to use `createMarketingProject` with channel/deliverable inputs.
 */
export type CreateMarketingCampaignProjectInput = {
  peerId: string;
  ownerLabel: string;
  name: string;
  goalLabel: string;
  description: string;
  primaryGoalId: string;
  customGoalText?: string;
  targetAudience?: string;
  startDate?: string;
  endDate?: string;
  durationPreset?: import("@/lib/office/campaign/campaign-duration").CampaignDurationPreset;
  budgetAmount?: number;
  budgetCurrency?: string;
  approvalMode?: MarketingProjectCampaignSetup["approvalMode"];
  selectedChannels?: readonly CampaignSetupChannel[];
  selectedDeliverables?: readonly import("./types").CampaignSetupDeliverable[];
  setupMode?: MarketingProjectCampaignSetup["setupMode"];
  secondaryGoalIds?: readonly string[];
  priority?: MarketingProjectCampaignSetup["priority"];
  /** Optional stable id for server-side automatic bootstrap idempotency. */
  projectId?: string;
};

function campaignTypeFromPrimaryGoal(primaryGoalId: string): MarketingCampaignType {
  switch (primaryGoalId) {
    case "brand_awareness":
      return "brand_awareness";
    case "product_launch":
      return "product_launch";
    case "generate_leads":
      return "content_series";
    case "promote_offer":
      return "meta_campaign";
    case "recruit":
      return "linkedin_campaign";
    default:
      return "custom";
  }
}

export function createMarketingCampaignProject(
  input: CreateMarketingCampaignProjectInput
): MarketingProject {
  const setup: MarketingProjectCampaignSetup = {
    description: input.description.trim(),
    primaryGoalId: input.primaryGoalId,
    ...(input.customGoalText?.trim() ? { customGoalText: input.customGoalText.trim() } : {}),
    ...(input.targetAudience?.trim() ? { targetAudience: input.targetAudience.trim() } : {}),
    ...(input.startDate ? { startDate: input.startDate } : {}),
    ...(input.endDate ? { endDate: input.endDate } : {}),
    ...(input.durationPreset ? { durationPreset: input.durationPreset } : {}),
    ...(input.budgetAmount !== undefined && input.budgetAmount > 0
      ? { budgetAmount: input.budgetAmount, budgetCurrency: input.budgetCurrency ?? "USD" }
      : {}),
    ...(input.approvalMode ? { approvalMode: input.approvalMode } : {}),
    ...(input.selectedChannels?.length ? { selectedChannels: input.selectedChannels } : {}),
    ...(input.selectedDeliverables?.length
      ? { selectedDeliverables: input.selectedDeliverables }
      : {}),
    ...(input.setupMode ? { setupMode: input.setupMode } : {}),
    ...(input.secondaryGoalIds?.length ? { secondaryGoalIds: input.secondaryGoalIds } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
  };

  const base = createMarketingProject({
    peerId: input.peerId,
    title: input.name.trim(),
    goal: input.goalLabel.trim(),
    channel: "Campaign",
    deliverableKind: "generic",
    rawRequest: input.description.trim(),
    ownerLabel: input.ownerLabel,
    origin: "campaign_wizard",
  });

  return {
    ...base,
    ...(input.projectId ? { id: input.projectId } : {}),
    campaignType: campaignTypeFromPrimaryGoal(input.primaryGoalId),
    campaignSetup: setup,
  };
}

export function projectStatusLabel(status: MarketingProjectStatus): string {
  return MARKETING_PROJECT_STATUS_LABELS[status];
}

export function campaignTypeLabel(type: MarketingCampaignType): string {
  return MARKETING_CAMPAIGN_TYPE_LABELS[type];
}

function lifecycleToProjectStatus(
  stage: WorkLifecycleStage,
  opts: { paused: boolean; cancelled: boolean; hasScheduledPublish: boolean; isPublishing: boolean }
): MarketingProjectStatus {
  if (opts.cancelled) return "archived";
  if (opts.paused && stage === "review_ready") return "waiting_for_review";
  switch (stage) {
    case "requested":
    case "understanding":
    case "planning":
      return "planning";
    case "creating":
      return "preparing";
    case "review_ready":
      return "waiting_for_review";
    case "approved":
      return opts.hasScheduledPublish ? "scheduled" : "waiting_for_review";
    case "scheduled":
      return opts.isPublishing ? "publishing" : "scheduled";
    case "published":
      return "completed";
    case "monitoring":
    case "optimizing":
      return "monitoring_results";
    default:
      return "preparing";
  }
}

export function workUnitsForProject(
  projectId: string,
  workUnits: WorkUnit[]
): WorkUnit[] {
  return workUnits.filter((u) => u.projectId === projectId && !u.cancelled);
}

export function primaryWorkUnitForProject(
  projectId: string,
  workUnits: WorkUnit[]
): WorkUnit | null {
  const units = workUnitsForProject(projectId, workUnits);
  if (units.length === 0) return null;
  return units.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0]!;
}

export function deriveProjectStatus(
  project: MarketingProject,
  workUnits: WorkUnit[],
  drafts: MarketingContentDraft[],
  scheduledDraftIds: Set<string>
): MarketingProjectStatus {
  if (project.archivedAt) return "archived";

  const units = workUnitsForProject(project.id, workUnits);
  if (units.length === 0) return "planning";

  const allCancelled = units.every((u) => u.cancelled);
  if (allCancelled) return "archived";

  const activeUnits = units.filter((u) => !u.cancelled);
  const statuses = activeUnits.map((unit) => {
    const draft = unit.draftId ? drafts.find((d) => d.id === unit.draftId) : undefined;
    const hasScheduledPublish = Boolean(
      draft && (draft.status === "ready_to_publish" || scheduledDraftIds.has(draft.id))
    );
    const isPublishing = draft?.status === "ready_to_publish";
    return lifecycleToProjectStatus(unit.status, {
      paused: unit.paused,
      cancelled: unit.cancelled,
      hasScheduledPublish,
      isPublishing,
    });
  });

  const priority: MarketingProjectStatus[] = [
    "waiting_for_review",
    "publishing",
    "scheduled",
    "preparing",
    "planning",
    "monitoring_results",
    "completed",
    "archived",
  ];

  for (const status of priority) {
    if (statuses.includes(status)) return status;
  }

  return statuses[0] ?? "planning";
}

export function deriveProjectProgress(
  project: MarketingProject,
  workUnits: WorkUnit[],
  status: MarketingProjectStatus
): number {
  if (status === "completed" || status === "archived") return 100;
  if (status === "monitoring_results") return 95;

  const unit = primaryWorkUnitForProject(project.id, workUnits);
  if (!unit) return 5;

  const stageWeights: Partial<Record<WorkLifecycleStage, number>> = {
    requested: 8,
    understanding: 15,
    planning: 25,
    creating: 55,
    review_ready: 72,
    approved: 78,
    scheduled: 85,
    published: 100,
    monitoring: 95,
    optimizing: 98,
  };

  return Math.min(99, stageWeights[unit.status] ?? 20);
}

export function deriveProjectNextStep(
  status: MarketingProjectStatus,
  workUnits: WorkUnit[],
  projectId: string
): string | undefined {
  const unit = primaryWorkUnitForProject(projectId, workUnits);
  switch (status) {
    case "planning":
      return "Plan campaign approach";
    case "preparing":
      if (unit?.needsVisual) return "Generate visual assets";
      return unit?.status === "creating" ? "Generate content" : "Prepare deliverables";
    case "waiting_for_review":
      return "Review deliverable";
    case "scheduled":
      return "Publish at scheduled time";
    case "publishing":
      return "Publishing now";
    case "monitoring_results":
      return "Track performance";
    case "completed":
      return undefined;
    case "archived":
      return undefined;
    default:
      return undefined;
  }
}

const EVENT_NOTES: Partial<Record<string, string>> = {
  task_requested: "Project created",
  understanding_started: "Understanding your goal",
  planning_started: "Planning campaign",
  creation_started: "Creating content",
  review_ready: "Waiting for approval",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  monitoring_started: "Monitoring results",
  optimization_started: "Optimizing performance",
};

function formatTimelineTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildProjectTimeline(
  project: MarketingProject,
  workUnits: WorkUnit[]
): MarketingProjectTimelineEntry[] {
  const entries: MarketingProjectTimelineEntry[] = [
    {
      id: `${project.id}-created`,
      at: project.createdAt,
      timeLabel: formatTimelineTime(project.createdAt),
      label: "Project created",
      kind: "milestone",
    },
  ];

  for (const unit of workUnitsForProject(project.id, workUnits)) {
    for (const event of unit.eventLog) {
      entries.push({
        id: event.id,
        at: event.at,
        timeLabel: formatTimelineTime(event.at),
        label: EVENT_NOTES[event.event] ?? event.note,
        kind:
          event.event === "review_ready" || event.event === "approved"
            ? "review"
            : event.event === "published" || event.event === "scheduled"
              ? "publish"
              : event.event === "monitoring_started"
                ? "performance"
                : "work",
      });
    }
  }

  entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return entries;
}

export function findProjectForDraft(
  draftId: string,
  workUnits: WorkUnit[]
): string | null {
  const unit = workUnits.find((u) => u.draftId === draftId);
  return unit?.projectId ?? null;
}

export function findProjectForWorkUnit(
  workUnitId: string,
  workUnits: WorkUnit[]
): string | null {
  return workUnits.find((u) => u.id === workUnitId)?.projectId ?? null;
}
