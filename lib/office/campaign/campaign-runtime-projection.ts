/**
 * PX-56 — canonical Office read model from durable Project Episode state.
 * When an episode exists, runtime progression derives from episode — not legacy client fields.
 */

import type {
  ApprovalCheckpointKind,
  ProjectBrainId,
  ProjectLifecycleState,
} from "@/lib/brain/project-engine/types";
import type { EpisodeStatus, ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";
import type { CampaignPrimaryAction } from "./campaign-orchestration-types";
import type { CampaignWorkflowStepId, CampaignWorkflowStepState } from "./workflow-types";

/** Serializable episode projection for Office UI (client-safe). */
export type CampaignRuntimeProjection = {
  source: "episode";
  projectId: string;
  durableVersion: number;
  episodeStatus: EpisodeStatus;
  lifecycleState: ProjectLifecycleState;
  completedBrains: readonly ProjectBrainId[];
  pendingBrains: readonly ProjectBrainId[];
  approvalCheckpoint: {
    kind: ApprovalCheckpointKind;
    satisfied: boolean;
    customerSummary: string;
  } | null;
  lastError: string | null;
  memoryCheckpoint1Complete: boolean;
  validationApprovalPending: boolean;
  approvalGrantedForExecution: boolean;
  executionHandoff: {
    packageId: string;
    packageVersion: string;
    phase: string;
    blockedChannels: readonly string[];
    blockedReason: string | null;
  } | null;
};

const WORKFLOW_STEP_ORDER: readonly CampaignWorkflowStepId[] = [
  "business_analyzed",
  "website_analyzed",
  "competitors_analyzed",
  "strategy_determined",
  "channels_selected",
  "deliverables_created",
  "waiting_for_approval",
  "scheduled",
  "published",
  "optimizing",
];

function isNl(locale?: string | null): boolean {
  return locale === "nl";
}

function completedSet(projection: CampaignRuntimeProjection): Set<ProjectBrainId> {
  return new Set(projection.completedBrains);
}

function researchComplete(completed: Set<ProjectBrainId>): boolean {
  return (
    completed.has("company") &&
    completed.has("research") &&
    completed.has("reasoning") &&
    completed.has("marketing_intelligence")
  );
}

export function buildCampaignRuntimeProjectionFromEpisode(
  episode: ProjectEpisodeRecord
): CampaignRuntimeProjection {
  const checkpoint = episode.snapshot.approvalCheckpoint;
  return {
    source: "episode",
    projectId: episode.snapshot.projectId,
    durableVersion: episode.durableVersion ?? 0,
    episodeStatus: episode.episodeStatus,
    lifecycleState: episode.snapshot.state,
    completedBrains: episode.snapshot.completedBrains,
    pendingBrains: episode.snapshot.pendingBrains,
    approvalCheckpoint: checkpoint
      ? {
          kind: checkpoint.kind,
          satisfied: checkpoint.satisfied,
          customerSummary: checkpoint.customerSummary,
        }
      : null,
    lastError: episode.lastError,
    memoryCheckpoint1Complete: episode.memoryCheckpoint1Complete,
    validationApprovalPending: episode.validationApprovalPending,
    approvalGrantedForExecution: episode.approvalGrantedForExecution,
    executionHandoff: episode.approvedExecutionHandoff
      ? {
          packageId: episode.approvedExecutionHandoff.packageId,
          packageVersion: episode.approvedExecutionHandoff.packageVersion,
          phase: episode.approvedExecutionHandoff.executionPhase ?? "approved",
          blockedChannels: episode.approvedExecutionHandoff.blockedChannels ?? [],
          blockedReason: episode.approvedExecutionHandoff.blockedReason ?? null,
        }
      : null,
  };
}

export function isEpisodeRuntimeAuthoritative(
  projection: CampaignRuntimeProjection | null | undefined
): projection is CampaignRuntimeProjection {
  return projection?.source === "episode";
}

/** Active workflow step derived from episode lifecycle + brain completion. */
export function resolveEpisodeActiveWorkflowStep(
  projection: CampaignRuntimeProjection
): CampaignWorkflowStepId | null {
  const { lifecycleState, episodeStatus } = projection;
  const completed = completedSet(projection);

  if (episodeStatus === "waiting_for_context" || lifecycleState === "failed") {
    if (episodeStatus === "waiting_for_context" && !completed.has("company")) {
      return "business_analyzed";
    }
    return null;
  }

  switch (lifecycleState) {
    case "created":
    case "collecting_context":
      return "business_analyzed";
    case "researching":
      return researchComplete(completed) ? "strategy_determined" : "competitors_analyzed";
    case "strategizing":
      return completed.has("strategy") ? "channels_selected" : "strategy_determined";
    case "planning":
      return completed.has("planning") ? "deliverables_created" : "channels_selected";
    case "generating":
      return completed.has("creative") ? "waiting_for_approval" : "deliverables_created";
    case "validating":
      return completed.has("validation") ? "waiting_for_approval" : "deliverables_created";
    case "waiting_for_approval":
      return "waiting_for_approval";
    case "ready_to_publish":
      return "scheduled";
    case "publishing":
      return "published";
    case "monitoring":
    case "learning":
      return "optimizing";
    case "complete":
      return null;
    default:
      return null;
  }
}

export function resolveEpisodeWorkflowStepState(
  stepId: CampaignWorkflowStepId,
  projection: CampaignRuntimeProjection
): CampaignWorkflowStepState {
  const active = resolveEpisodeActiveWorkflowStep(projection);
  const completed = completedSet(projection);
  const { lifecycleState, episodeStatus } = projection;

  if (active === stepId) return "active";

  const rank = (id: CampaignWorkflowStepId) => WORKFLOW_STEP_ORDER.indexOf(id);
  if (active != null && rank(stepId) < rank(active)) return "done";

  switch (stepId) {
    case "business_analyzed":
    case "website_analyzed":
    case "competitors_analyzed":
      if (researchComplete(completed)) return "done";
      if (lifecycleState === "created" || lifecycleState === "collecting_context") {
        return stepId === "business_analyzed" ? "active" : "upcoming";
      }
      if (lifecycleState === "researching") {
        if (completed.has("company") && stepId !== "competitors_analyzed") return "done";
        if (stepId === "competitors_analyzed") return "active";
        return stepId === "business_analyzed" ? "done" : "upcoming";
      }
      return researchComplete(completed) ? "done" : "upcoming";

    case "strategy_determined":
      if (completed.has("strategy")) return "done";
      return lifecycleState === "strategizing" ? "active" : "upcoming";

    case "channels_selected":
      if (completed.has("planning")) return "done";
      return lifecycleState === "planning" ? "active" : "upcoming";

    case "deliverables_created":
      if (completed.has("creative") && lifecycleState !== "validating") return "done";
      if (lifecycleState === "generating" || lifecycleState === "validating") return "active";
      return "upcoming";

    case "waiting_for_approval":
      if (
        lifecycleState === "waiting_for_approval" ||
        episodeStatus === "waiting_for_approval"
      ) {
        return "active";
      }
      if (
        ["ready_to_publish", "publishing", "monitoring", "learning", "complete"].includes(
          lifecycleState
        )
      ) {
        return "done";
      }
      return "upcoming";

    case "scheduled":
      if (["publishing", "monitoring", "learning", "complete"].includes(lifecycleState)) {
        return "done";
      }
      if (lifecycleState === "ready_to_publish") return "active";
      return "upcoming";

    case "published":
      if (["monitoring", "learning", "complete"].includes(lifecycleState)) return "done";
      if (lifecycleState === "publishing") return "active";
      return "upcoming";

    case "optimizing":
      if (lifecycleState === "complete") return "done";
      if (lifecycleState === "monitoring" || lifecycleState === "learning") return "active";
      return "upcoming";

    default:
      return "upcoming";
  }
}

export function resolveEpisodeStatusLabel(
  projection: CampaignRuntimeProjection,
  locale?: string | null
): string {
  const nl = isNl(locale);
  const active = resolveEpisodeActiveWorkflowStep(projection);
  const { lifecycleState, episodeStatus, approvalCheckpoint } = projection;

  if (episodeStatus === "waiting_for_approval" || lifecycleState === "waiting_for_approval") {
    return nl ? "Wacht op jouw goedkeuring" : "Waiting for your approval";
  }
  if (lifecycleState === "ready_to_publish") {
    if (projection.approvalGrantedForExecution && projection.executionHandoff?.phase === "blocked_integration") {
      const channels = projection.executionHandoff.blockedChannels.join(", ");
      return nl
        ? `Goedgekeurd — koppeling vereist${channels ? `: ${channels}` : ""}`
        : `Approved — connection required${channels ? `: ${channels}` : ""}`;
    }
    if (projection.approvalGrantedForExecution) {
      return nl ? "Goedgekeurd — publicatie wordt voorbereid" : "Approved — preparing publication";
    }
    return nl ? "Klaar om in te plannen" : "Ready to schedule";
  }
  if (lifecycleState === "publishing") {
    return nl ? "Wordt gepubliceerd" : "Publishing";
  }
  if (lifecycleState === "monitoring" || lifecycleState === "learning") {
    return nl ? "Wordt geoptimaliseerd" : "Optimizing";
  }
  if (lifecycleState === "complete") {
    return nl ? "Afgerond" : "Complete";
  }
  if (episodeStatus === "failed") {
    return nl ? "Actie vereist" : "Action required";
  }
  if (episodeStatus === "waiting_for_context") {
    return nl ? "Context wordt verzameld" : "Collecting context";
  }

  switch (active) {
    case "strategy_determined":
      return nl ? "Strategie wordt uitgewerkt" : "Strategy in progress";
    case "channels_selected":
      return nl ? "Planning wordt uitgewerkt" : "Planning in progress";
    case "deliverables_created":
      return lifecycleState === "validating"
        ? nl
          ? "Kwaliteit wordt gecontroleerd"
          : "Quality review in progress"
        : nl
          ? "Content wordt gemaakt"
          : "Creating content";
    case "waiting_for_approval":
      return nl ? "Wacht op jouw goedkeuring" : "Waiting for your approval";
    default:
      if (approvalCheckpoint && !approvalCheckpoint.satisfied) {
        return nl ? "Wacht op jouw goedkeuring" : "Waiting for your approval";
      }
      return nl ? "Campagne in uitvoering" : "Campaign in progress";
  }
}

export function resolveEpisodeNextStepCopy(
  projection: CampaignRuntimeProjection,
  locale?: string | null
): string {
  const nl = isNl(locale);
  const { lifecycleState, episodeStatus, approvalCheckpoint } = projection;

  if (episodeStatus === "waiting_for_approval" || lifecycleState === "waiting_for_approval") {
    const summary = approvalCheckpoint?.customerSummary;
    if (summary) return summary;
    return nl
      ? "Emma heeft het campagnepakket klaargezet — beoordeel en keur goed voor publicatie."
      : "Emma prepared the full campaign package — review and approve for publication.";
  }
  if (lifecycleState === "validating") {
    return nl
      ? "Emma controleert de campagnekwaliteit vóór goedkeuring."
      : "Emma is reviewing campaign quality before approval.";
  }
  if (lifecycleState === "generating") {
    return nl ? "Emma maakt campagnecontent." : "Emma is creating campaign content.";
  }
  if (lifecycleState === "planning") {
    return nl ? "Emma werkt het campagneplan uit." : "Emma is building the campaign plan.";
  }
  if (lifecycleState === "strategizing") {
    return nl ? "Emma werkt de strategie uit." : "Emma is developing the strategy.";
  }
  if (lifecycleState === "researching") {
    return nl ? "Emma onderzoekt je markt en concurrentie." : "Emma is researching your market and competition.";
  }
  if (episodeStatus === "waiting_for_context") {
    return nl
      ? "Emma heeft meer context nodig om verder te gaan."
      : "Emma needs more context before continuing.";
  }
  if (lifecycleState === "ready_to_publish") {
    if (projection.executionHandoff?.phase === "blocked_integration") {
      return nl
        ? "Campagne is goedgekeurd. Koppel de benodigde kanalen om publicatie te starten."
        : "Campaign is approved. Connect the required channels to start publication.";
    }
    if (projection.approvalGrantedForExecution) {
      return nl
        ? "Emma voert het goedgekeurde campagnepakket uit — zonder opnieuw content te genereren."
        : "Emma is executing the approved campaign package — without regenerating content.";
    }
    return nl
      ? "Campagne is goedgekeurd — plan publicatie wanneer je klaar bent."
      : "Campaign approved — schedule publication when you are ready.";
  }
  if (lifecycleState === "publishing") {
    return nl ? "Campagne wordt gepubliceerd." : "Campaign is being published.";
  }
  if (lifecycleState === "monitoring" || lifecycleState === "learning") {
    return nl ? "Emma optimaliseert campagneprestaties." : "Emma is optimizing campaign performance.";
  }
  return nl ? "Emma werkt aan je campagne." : "Emma is working on your campaign.";
}

export function resolveEpisodePrimaryAction(
  projection: CampaignRuntimeProjection,
  input: {
    locale?: string | null;
    pendingDeliverableCount?: number;
    pendingDraftId?: string;
    isCampaignScheduled?: boolean;
    isCampaignPublished?: boolean;
  } = {}
): CampaignPrimaryAction {
  const nl = isNl(input.locale);
  const { lifecycleState, episodeStatus, approvalCheckpoint } = projection;

  if (input.isCampaignPublished) {
    return {
      kind: "view_results",
      label: nl ? "Bekijk resultaten →" : "View results →",
      stepId: "optimizing",
    };
  }

  if (input.pendingDeliverableCount && input.pendingDeliverableCount > 0 && input.pendingDraftId) {
    return {
      kind: "review_deliverables",
      label: nl
        ? `Beoordeel ${input.pendingDeliverableCount} onderdeel${input.pendingDeliverableCount > 1 ? "en" : ""}`
        : `Review ${input.pendingDeliverableCount} deliverable${input.pendingDeliverableCount > 1 ? "s" : ""}`,
      stepId: "waiting_for_approval",
      draftId: input.pendingDraftId,
    };
  }

  if (episodeStatus === "waiting_for_approval" || lifecycleState === "waiting_for_approval") {
    const label =
      approvalCheckpoint?.kind === "campaign_approval" ||
      approvalCheckpoint?.kind === "publication_confirm"
        ? nl
          ? "Campagne beoordelen voor publicatie"
          : "Review campaign for publication"
        : nl
          ? "Beoordeel en keur goed"
          : "Review and approve";
    return {
      kind: "review_campaign",
      label,
      stepId: "waiting_for_approval",
    };
  }

  if (lifecycleState === "ready_to_publish" && !input.isCampaignScheduled) {
    if (projection.executionHandoff?.phase === "blocked_integration") {
      return {
        kind: "view_context",
        label: nl ? "Kanaal koppelen" : "Connect channel",
        stepId: "business_analyzed",
      };
    }
    if (projection.approvalGrantedForExecution) {
      return {
        kind: "strategy_working",
        label: nl ? "Publicatie wordt voorbereid…" : "Preparing publication…",
        strategyRunStatus: "running",
        strategyRunStageLabel: nl ? "Publicatie" : "Publication",
      };
    }
    return {
      kind: "schedule",
      label: nl ? "Campagne inplannen" : "Schedule campaign",
      stepId: "scheduled",
    };
  }

  if (input.isCampaignScheduled && !input.isCampaignPublished) {
    return {
      kind: "view_schedule",
      label: nl ? "Planning wijzigen" : "Edit schedule",
      stepId: "scheduled",
    };
  }

  if (episodeStatus === "waiting_for_context") {
    return {
      kind: "view_context",
      label: nl ? "Campagnecontext aanvullen" : "Complete campaign context",
      stepId: "business_analyzed",
    };
  }

  if (episodeStatus === "failed") {
    return {
      kind: "retry_strategy",
      label: nl ? "Opnieuw proberen" : "Try again",
      stepId: "strategy_determined",
      failureMessageSafe: projection.lastError ?? undefined,
    };
  }

  const active = resolveEpisodeActiveWorkflowStep(projection);
  if (active === "strategy_determined" || lifecycleState === "strategizing") {
    return {
      kind: "strategy_working",
      label: nl ? "Emma werkt aan je strategie…" : "Emma is working on your strategy…",
      strategyRunStatus: "running",
      strategyRunStageLabel: nl ? "Strategie" : "Strategy",
    };
  }
  if (active === "channels_selected" || lifecycleState === "planning") {
    return {
      kind: "strategy_working",
      label: nl ? "Emma werkt aan het campagneplan…" : "Emma is building the campaign plan…",
      strategyRunStatus: "running",
      strategyRunStageLabel: nl ? "Planning" : "Planning",
    };
  }
  if (active === "deliverables_created") {
    const stageLabel =
      lifecycleState === "validating"
        ? nl
          ? "Kwaliteitscontrole"
          : "Quality review"
        : nl
          ? "Contentcreatie"
          : "Content creation";
    return {
      kind: "strategy_working",
      label: nl ? `Emma werkt aan ${stageLabel.toLowerCase()}…` : `Emma is working on ${stageLabel.toLowerCase()}…`,
      strategyRunStatus: "running",
      strategyRunStageLabel: stageLabel,
    };
  }

  return {
    kind: "continue",
    label: nl ? "Ga verder" : "Continue",
  };
}

/** Bridge step for durable approval when episode is at campaign approval checkpoint. */
export function resolveEpisodeApprovalBridgeStepId(
  projection: CampaignRuntimeProjection | null | undefined,
  evidenceStepId: CampaignWorkflowStepId
): CampaignWorkflowStepId {
  if (!isEpisodeRuntimeAuthoritative(projection)) return evidenceStepId;
  if (
    (projection.lifecycleState === "waiting_for_approval" ||
      projection.episodeStatus === "waiting_for_approval") &&
    (projection.approvalCheckpoint?.kind === "campaign_approval" ||
      projection.approvalCheckpoint?.kind === "publication_confirm")
  ) {
    return "waiting_for_approval";
  }
  return evidenceStepId;
}

export function episodeAwaitingCampaignApproval(
  projection: CampaignRuntimeProjection | null | undefined
): boolean {
  if (!isEpisodeRuntimeAuthoritative(projection)) return false;
  return (
    (projection.lifecycleState === "waiting_for_approval" ||
      projection.episodeStatus === "waiting_for_approval") &&
    Boolean(projection.approvalCheckpoint) &&
    !projection.approvalCheckpoint!.satisfied
  );
}
