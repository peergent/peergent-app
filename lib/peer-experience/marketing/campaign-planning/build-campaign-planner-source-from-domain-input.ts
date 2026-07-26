import type { MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type {
  CampaignPlannerExplicitDeliverable,
  CampaignPlannerPlanActivitySummary,
  CampaignPlannerPlanSummary,
  CampaignPlannerResponsibilitySummary,
  CampaignPlannerScopeNote,
  CampaignPlannerSource,
  CampaignPlannerStrategySummary,
  CampaignPlannerWorkUnitSummary,
} from "@/lib/campaign/planner/types";
import type { ApprovalDeliverableOverlay } from "../approval/approval-overlay";
import type { MarketingProject } from "../projects/types";
import { workUnitsForProject } from "../projects/project-engine";
import type { MarketingResponsibility } from "../responsibilities/types";
import {
  assembleCampaignForMarketingProject,
  enrichSourceWithProjectContentIds,
} from "../view-models/build-project-campaign-projection";
import { buildMarketingCampaignViewModelSourceFromDomainInput } from "../view-models/build-marketing-campaigns-view-model";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import {
  CampaignPlanningArchivedProjectError,
  CampaignPlanningInvalidScopeError,
  CampaignPlanningMissingProjectError,
  CampaignPlanningProjectionError,
} from "./errors";

export type BuildCampaignPlannerSourceFromDomainInputArgs = {
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  assembledAt: string;
  version?: number;
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function resolveOrganizationId(input: MarketingPeerDomainInput, project: MarketingProject): string {
  const fromInput = input.organizationId?.trim();
  if (fromInput) return fromInput;
  const fromProject = project.peerId ? `org-${project.peerId}` : "";
  if (!fromProject) {
    throw new CampaignPlanningInvalidScopeError("organization scope could not be resolved.");
  }
  return fromProject;
}

function scheduledDraftIds(
  overlays: Record<string, ApprovalDeliverableOverlay> | undefined
): Set<string> {
  const ids = new Set<string>();
  for (const [draftId, overlay] of Object.entries(overlays ?? {})) {
    if (overlay?.publishing?.scheduledAt) ids.add(draftId);
  }
  return ids;
}

function findProject(
  input: MarketingPeerDomainInput,
  projectId: string
): MarketingProject {
  const project = input.projects.find((p) => p.id === projectId);
  if (!project) {
    throw new CampaignPlanningMissingProjectError(projectId);
  }
  if (project.archivedAt) {
    throw new CampaignPlanningArchivedProjectError(projectId);
  }
  if (project.peerId !== input.peerId) {
    throw new CampaignPlanningInvalidScopeError(
      "Project peerId does not match workspace peer scope."
    );
  }
  return project;
}

function linkedUnits(projectId: string, workUnits: WorkUnit[]): WorkUnit[] {
  return workUnitsForProject(projectId, workUnits);
}

/**
 * Peer-level strategy/plan are shared across projects until campaign-scoped intelligence exists.
 * We attach summaries only when the project plausibly consumes them, and always record uncertainty.
 */
function isStrategyPlanApplicable(project: MarketingProject, units: WorkUnit[]): boolean {
  if (units.length > 0) return true;
  if (project.origin === "campaign_wizard") return true;
  if (project.responsibilityId) return true;
  return project.origin === "responsibility" || project.origin === "manual_assignment";
}

function buildStrategySummary(
  strategy: MarketingStrategy | null,
  applicable: boolean,
  scopeNotes: CampaignPlannerScopeNote[]
): CampaignPlannerStrategySummary | undefined {
  if (!strategy || !applicable) return undefined;
  scopeNotes.push({
    id: "uncertainty-peer-strategy",
    kind: "uncertainty",
    message:
      "Marketing strategy is peer-level session data; linkage to this campaign is indicative, not exclusive.",
  });
  const audienceLabels = strategy.targetAudiences
    .map((a) => a.segment.trim())
    .filter(Boolean)
    .slice(0, 5);
  const channelLabels = strategy.socialMediaStrategy
    .map((s) => s.platform?.trim())
    .filter((c): c is string => Boolean(c))
    .slice(0, 8);
  return {
    summary: strategy.summary.trim(),
    confidence: strategy.confidence,
    ...(audienceLabels.length ? { audienceLabels } : {}),
    ...(channelLabels.length ? { channelLabels } : {}),
  };
}

function planActivityRefsFromUnits(units: WorkUnit[]): Set<string> {
  const refs = new Set<string>();
  for (const unit of units) {
    if (unit.planActivityReference?.trim()) {
      refs.add(normalizeKey(unit.planActivityReference));
    }
  }
  return refs;
}

function filterPlanActivitiesForProject(
  plan: MarketingPlan,
  units: WorkUnit[]
): CampaignPlannerPlanActivitySummary[] {
  const refs = planActivityRefsFromUnits(units);
  if (refs.size === 0) return [];

  const matched: CampaignPlannerPlanActivitySummary[] = [];
  for (const entry of plan.contentCalendar ?? []) {
    if (refs.has(normalizeKey(entry.title))) {
      matched.push({
        title: entry.title,
        contentType: entry.contentType,
        channel: entry.channel,
        scheduledWeek: entry.scheduledWeek,
        estimatedEffort: entry.estimatedEffort,
      });
    }
  }
  return matched;
}

function buildPlanSummary(
  plan: MarketingPlan | null,
  applicable: boolean,
  units: WorkUnit[],
  scopeNotes: CampaignPlannerScopeNote[]
): CampaignPlannerPlanSummary | undefined {
  if (!plan || !applicable) return undefined;

  scopeNotes.push({
    id: "uncertainty-peer-plan",
    kind: "uncertainty",
    message:
      "Marketing plan is peer-level session data; calendar activities are included only when linked via project Work Units.",
  });

  const linkedActivities = filterPlanActivitiesForProject(plan, units);
  if (units.length === 0) {
    scopeNotes.push({
      id: "gap-plan-activities-unlinked",
      kind: "gap",
      message:
        "No Work Units reference plan activities for this project — plan calendar entries were not attached as campaign deliverables.",
    });
  } else if (linkedActivities.length === 0 && (plan.contentCalendar?.length ?? 0) > 0) {
    scopeNotes.push({
      id: "gap-plan-no-matching-activities",
      kind: "gap",
      message:
        "Plan calendar exists but no activities match this project's Work Unit references.",
    });
  }

  const dependencies =
    linkedActivities.length > 0
      ? (plan.dependencies ?? [])
          .filter(
            (d) =>
              linkedActivities.some((a) => normalizeKey(a.title) === normalizeKey(d.dependent)) &&
              linkedActivities.some((a) => normalizeKey(a.title) === normalizeKey(d.dependsOn))
          )
          .map((d) => ({ dependent: d.dependent, dependsOn: d.dependsOn }))
      : [];

  return {
    summary: plan.summary.trim(),
    confidence: plan.confidence,
    ...(linkedActivities.length ? { contentCalendar: linkedActivities } : {}),
    ...(dependencies.length ? { dependencies } : {}),
  };
}

function buildExplicitDeliverablesFromUnits(units: WorkUnit[]): {
  deliverables: CampaignPlannerExplicitDeliverable[];
  channels: string[];
} {
  const deliverables: CampaignPlannerExplicitDeliverable[] = [];
  const channels = new Set<string>();

  for (const unit of units) {
    if (unit.cancelled) continue;
    channels.add(unit.channel);
    deliverables.push({
      channel: unit.channel,
      deliverableType: unit.deliverableKind,
      title: unit.title,
      ...(unit.planActivityReference
        ? { planActivityReference: unit.planActivityReference }
        : {}),
    });
  }

  return {
    deliverables,
    channels: [...channels],
  };
}

function workUnitBlockers(unit: WorkUnit): string[] {
  const blockers: string[] = [];
  if (unit.paused) blockers.push("Work is paused.");
  if (unit.cancelled) blockers.push("Work unit cancelled.");
  return blockers;
}

function mapWorkUnitSummaries(units: WorkUnit[]): CampaignPlannerWorkUnitSummary[] {
  return units.map((unit) => {
    const blockers = workUnitBlockers(unit);
    return {
      id: unit.id,
      projectId: unit.projectId,
      title: unit.title,
      channel: unit.channel,
      deliverableKind: unit.deliverableKind,
      planActivityReference: unit.planActivityReference,
      lifecycleStage: unit.status,
      cancelled: unit.cancelled,
      paused: unit.paused,
      draftId: unit.draftId,
      ...(blockers.length ? { blockers } : {}),
    };
  });
}

function mapResponsibilities(
  responsibilities: MarketingResponsibility[]
): CampaignPlannerResponsibilitySummary[] {
  return responsibilities.map((r) => ({
    id: r.id,
    category: r.category,
    enabled: r.enabled,
    approvalPolicy: r.approvalPolicy,
    autonomyLevel: r.autonomyLevel,
  }));
}

function campaignSetupScopeNotes(project: MarketingProject, notes: CampaignPlannerScopeNote[]): void {
  const setup = project.campaignSetup;
  if (!setup) return;
  notes.push({
    id: "evidence-campaign-setup",
    kind: "evidence",
    message: "Campaign wizard setup fields applied to campaign projection.",
  });
  if (setup.budgetAmount !== undefined && setup.budgetAmount > 0) {
    notes.push({
      id: "evidence-budget-constraint",
      kind: "evidence",
      message: "Budget amount present on campaign setup (planning constraint only).",
    });
  }
}

/**
 * Pure adapter: Marketing Workspace domain input → CampaignPlannerSource.
 * Does not mutate domainInput or call persistence / AI / Work Unit engines.
 */
export function buildCampaignPlannerSourceFromDomainInput(
  args: BuildCampaignPlannerSourceFromDomainInputArgs
): CampaignPlannerSource {
  const { projectId, domainInput, assembledAt, version } = args;
  const project = findProject(domainInput, projectId);
  const organizationId = resolveOrganizationId(domainInput, project);
  const scopeNotes: CampaignPlannerScopeNote[] = [];

  const vmSource = enrichSourceWithProjectContentIds(
    buildMarketingCampaignViewModelSourceFromDomainInput(domainInput),
    projectId
  );

  let campaign;
  try {
    campaign = assembleCampaignForMarketingProject(project, vmSource, {
      scheduledDraftIds: scheduledDraftIds(domainInput.approvalOverlays),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Campaign projection failed.";
    throw new CampaignPlanningProjectionError(message);
  }

  if (campaign.organizationId !== organizationId) {
    campaign = { ...campaign, organizationId };
  }

  const units = linkedUnits(projectId, domainInput.workUnits);
  const applicable = isStrategyPlanApplicable(project, units);

  if (project.origin === "manual_assignment" && units.length === 0) {
    scopeNotes.push({
      id: "evidence-manual-conservative",
      kind: "evidence",
      message:
        "Manual assignment without linked Work Units — strategy/plan omitted and deliverables left empty.",
    });
  }

  campaignSetupScopeNotes(project, scopeNotes);

  const strategySummary =
    project.origin === "manual_assignment" && units.length === 0
      ? undefined
      : buildStrategySummary(domainInput.strategy, applicable, scopeNotes);

  const planSummary =
    project.origin === "manual_assignment" && units.length === 0
      ? undefined
      : buildPlanSummary(domainInput.plan, applicable, units, scopeNotes);

  const { deliverables, channels } = buildExplicitDeliverablesFromUnits(units);

  if (deliverables.length === 0) {
    scopeNotes.push({
      id: "gap-no-explicit-deliverables",
      kind: "gap",
      message:
        "No explicit channels or deliverables — planner will not invent channel outputs.",
    });
  }

  const responsibilities = mapResponsibilities(
    domainInput.responsibilities.filter((r) => r.peerId === domainInput.peerId)
  );

  return {
    organizationId,
    peerId: domainInput.peerId,
    campaign,
    assembledAt,
    ...(version !== undefined ? { version } : {}),
    ...(strategySummary ? { strategySummary } : {}),
    ...(planSummary ? { planSummary } : {}),
    ...(responsibilities.length ? { responsibilities } : {}),
    ...(units.length ? { existingWorkUnits: mapWorkUnitSummaries(units) } : {}),
    ...(channels.length ? { explicitChannels: channels } : {}),
    ...(deliverables.length ? { explicitDeliverables: deliverables } : {}),
    ...(scopeNotes.length ? { scopeNotes: Object.freeze([...scopeNotes]) } : {}),
  };
}
