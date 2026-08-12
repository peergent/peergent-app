/**
 * ProjectEpisodeRunner — integrates Project Engine with registered Brain contracts.
 */

import { createDefaultProjectBrainRegistry } from "../integration/creative-brain-registry";
import {
  advanceProjectEpisode,
  assembleBrainContext,
  createApprovalCheckpoint,
  createProjectEngineSnapshot,
  evaluateProjectEpisode,
  researchPhaseComplete,
  resolveApprovalGate,
  withProjectState,
} from "../project-engine";
import type { BrainResult, ProjectBrainContract, ProjectBrainRegistry } from "../project-engine/brain-contract";
import type { BrainResultSummary, ProjectEngineInput, ProjectBrainId } from "../project-engine/types";
import { buildBrainPayload, buildPriorOutputs, contextGapsFromEvaluation } from "./brain-context-handoff";
import { resolveBrainOutputs } from "./brain-output-resolver";
import { createEmptyArtifacts, recordBrainOutputRef, brainOutputRefMap } from "./project-artifact-store";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";
import { appendRuntimeEvent, brainCompletedEventType } from "./project-event-stream";
import { learningProposalIds, proposalsFromLearningGraph } from "./learning-memory-handoff";
import { buildMarketingPeerFixture } from "./fixtures/marketing-peer-fixture";
import type {
  BrainHandoffContext,
  EpisodeObservability,
  EpisodeRunInput,
  EpisodeRunResult,
  EpisodeStatus,
  ProjectEpisodeRecord,
  ResumeEpisodeInput,
} from "./types";

const DEFAULT_MAX_STEPS = 60;

export class ProjectEpisodeRunner {
  constructor(private readonly registry: ProjectBrainRegistry = createDefaultProjectBrainRegistry()) {}

  startEpisode(input: EpisodeRunInput): ProjectEpisodeRecord {
    const fixture = buildMarketingPeerFixture(input.projectId.slice(-1));
    const correlationId = input.correlationId ?? `corr-${input.projectId}-${Date.now()}`;
    const snapshot = createProjectEngineSnapshot({
      projectId: input.projectId,
      peerId: input.peerId,
      organizationId: input.organizationId,
      episodeId: input.episodeId,
      locale: input.locale,
    });

    const episode: ProjectEpisodeRecord = {
      snapshot,
      artifacts: createEmptyArtifacts({
        organizationId: input.organizationId,
        projectId: input.projectId,
        episodeId: snapshot.episodeId,
        correlationId,
      }),
      episodeStatus: "running",
      contextReady: input.contextReady ?? true,
      sliceAvailability: input.sliceAvailability ?? fixture.sliceAvailability,
      approvalSatisfied: false,
      validationApprovalPending: false,
      memoryCheckpoint1Complete: false,
      memoryCheckpoint2Complete: false,
      performanceObservationsAvailable: false,
      approvalGrantedForExecution: false,
      contextGaps: [],
      executedBrainKeys: [],
      lastError: null,
      correlationId,
      startedAt: snapshot.startedAt,
      updatedAt: snapshot.updatedAt,
      completedAt: null,
      resolvedGraphs: {},
    };

    getDefaultProjectEpisodeRepository().save(episode);
    appendRuntimeEvent({ episode, type: "project_started", brainId: null });
    return episode;
  }

  async runUntilPause(input: EpisodeRunInput): Promise<EpisodeRunResult> {
    let episode =
      getDefaultProjectEpisodeRepository().get({
        organizationId: input.organizationId,
        projectId: input.projectId,
      }) ?? this.startEpisode(input);

    const maxSteps = input.maxSteps ?? DEFAULT_MAX_STEPS;
    const locale = input.locale ?? "en";
    const fixture = buildMarketingPeerFixture(input.projectId.slice(-1));

    for (let step = 0; step < maxSteps; step += 1) {
      if (episode.episodeStatus === "completed" || episode.episodeStatus === "failed") break;

      const evaluation = evaluateProjectEpisode(buildEngineInput(episode), {
        locale,
        sliceAvailability: episode.sliceAvailability,
        companyBrainComplete: episode.snapshot.completedBrains.includes("company"),
        memoryCheckpoint1Complete: episode.memoryCheckpoint1Complete,
        memoryCheckpoint2Complete: episode.memoryCheckpoint2Complete,
        performanceObservationsAvailable: episode.performanceObservationsAvailable,
        validationApprovalPending: episode.validationApprovalPending,
      });

      episode = { ...episode, snapshot: evaluation.snapshot };

      if (evaluation.action.kind === "idle") {
        episode = advanceIdlePhase(episode);
        continue;
      }

      if (evaluation.action.kind === "publish") {
        if (episode.snapshot.state === "waiting_for_approval" && episode.approvalSatisfied) {
          const advanced = advanceProjectEpisode(
            { ...buildEngineInput(episode), approvalSatisfied: true },
            { locale }
          );
          episode = { ...episode, snapshot: advanced.snapshot, approvalSatisfied: false };
          continue;
        }
        if (episode.snapshot.state === "ready_to_publish") {
          episode = {
            ...episode,
            snapshot: withProjectState(episode.snapshot, "publishing", new Date()),
          };
          continue;
        }
      }

      if (evaluation.blocked) {
        if (evaluation.action.kind === "collect_context") {
          return pauseEpisode(episode, "waiting_for_context", evaluation.action.reason, locale);
        }
        if (evaluation.action.kind === "wait") {
          appendRuntimeEvent({ episode, type: "waiting_for_approval", brainId: null });
          return pauseEpisode(episode, "waiting_for_approval", evaluation.action.reason, locale);
        }
        if (evaluation.action.kind === "monitor") {
          appendRuntimeEvent({ episode, type: "waiting_for_outcomes", brainId: null });
          return pauseEpisode(episode, "waiting_for_outcomes", evaluation.action.reason, locale);
        }
      }

      if (evaluation.action.kind === "complete") {
        episode = completeEpisode(episode);
        break;
      }

      if (evaluation.action.kind === "run_brain" || evaluation.action.kind === "learn") {
        const brainId = evaluation.action.brainId;
        if (!brainId) continue;

        const idempotencyKey = `${episode.correlationId}:${brainId}:${episode.snapshot.state}`;
        if (episode.executedBrainKeys.includes(idempotencyKey)) {
          episode = advanceIdlePhase(episode);
          continue;
        }

        const brainResult = await this.executeBrain({
          brainId,
          episode,
          fixture,
          locale,
          idempotencyKey,
        });

        episode = applyBrainExecution(episode, brainResult, locale, idempotencyKey);
        if (brainResult.status === "failed") {
          episode = { ...episode, episodeStatus: "failed", lastError: brainResult.errorCode };
          break;
        }
      }

      if (evaluation.action.kind === "retry" || evaluation.action.kind === "recover") {
        episode = { ...episode, episodeStatus: "failed", lastError: evaluation.action.reason };
        break;
      }
    }

    getDefaultProjectEpisodeRepository().save(episode);
    if (episode.episodeStatus === "running") {
      if (episode.snapshot.state === "monitoring" && !episode.performanceObservationsAvailable) {
        appendRuntimeEvent({ episode, type: "waiting_for_outcomes", brainId: null });
        return pauseEpisode(
          episode,
          "waiting_for_outcomes",
          "Awaiting performance observations",
          input.locale ?? "en"
        );
      }
      episode = { ...episode, episodeStatus: "failed", lastError: "max_steps_exceeded" };
      getDefaultProjectEpisodeRepository().save(episode);
    }
    return buildRunResult(episode, episode.lastError);
  }

  async resumeEpisode(input: ResumeEpisodeInput): Promise<EpisodeRunResult> {
    const episode = getDefaultProjectEpisodeRepository().get({
      organizationId: input.organizationId,
      projectId: input.projectId,
    });
    if (!episode) throw new Error(`Episode not found: ${input.projectId}`);

    let updated = episode;
    if (input.approvalSatisfied) {
      updated = { ...updated, approvalSatisfied: true, episodeStatus: "running" };
      appendRuntimeEvent({ episode: updated, type: "approval_received", brainId: null });
      const advanced = advanceProjectEpisode(
        { ...buildEngineInput(updated), approvalSatisfied: true },
        { locale: input.locale ?? "en" }
      );
      updated = { ...updated, snapshot: advanced.snapshot, approvalSatisfied: false };
    }

    if (input.performanceObservations?.length) {
      const { ingestPerformanceObservations } = await import("./performance-observation-service");
      updated = ingestPerformanceObservations({
        organizationId: input.organizationId,
        projectId: input.projectId,
        observations: input.performanceObservations,
      });
      appendRuntimeEvent({ episode: updated, type: "performance_observations_received", brainId: null });
    }

    getDefaultProjectEpisodeRepository().save({ ...updated, episodeStatus: "running" });
    return this.runUntilPause({
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: updated.snapshot.peerId,
      locale: input.locale,
      maxSteps: input.maxSteps,
    });
  }

  private async executeBrain(input: {
    brainId: ProjectBrainId;
    episode: ProjectEpisodeRecord;
    fixture: ReturnType<typeof buildMarketingPeerFixture>;
    locale: "nl" | "en";
    idempotencyKey: string;
  }): Promise<BrainResult<import("../project-engine/brain-contract").BrainOutput>> {
    const contract = this.registry[input.brainId] as ProjectBrainContract | undefined;
    if (!contract) {
      return {
        brainId: input.brainId,
        status: "failed",
        output: null,
        events: [],
        confidence: null,
        durationMs: 0,
        errorCode: "brain_not_registered",
        requiresApproval: false,
        approvalKind: null,
      };
    }

    const resolved = mergeResolvedGraphs(
      input.episode.resolvedGraphs,
      resolveBrainOutputs({
        organizationId: input.episode.snapshot.organizationId,
        projectId: input.episode.snapshot.projectId,
        artifacts: input.episode.artifacts,
      })
    );

    const priorOutputs = buildPriorOutputs(input.episode.artifacts);
    const memoryCheckpointPhase =
      input.brainId === "memory" && input.episode.snapshot.state === "learning"
        ? "checkpoint_2"
        : input.brainId === "memory" && input.episode.snapshot.state === "validating"
          ? "checkpoint_1"
          : null;

    const handoff: BrainHandoffContext = {
      organizationId: input.episode.snapshot.organizationId,
      projectId: input.episode.snapshot.projectId,
      episodeId: input.episode.snapshot.episodeId,
      locale: input.locale,
      correlationId: input.episode.correlationId,
      artifacts: input.episode.artifacts,
      priorOutputs,
      priorMemories: resolved.priorMemories,
      campaignContext: input.fixture.campaignContext,
      companySnapshot: input.fixture.companySnapshot,
      brandGraph: input.fixture.brandGraph,
      approvalGrantedForExecution: input.episode.approvalGrantedForExecution,
      performanceObservations: [...getDefaultProjectEpisodeRepository().getObservations(input.episode.snapshot.projectId)],
      memoryCheckpointPhase,
      learningProposalIds: input.episode.artifacts.learningProposalIds,
      learningProposals: input.episode.cachedLearningProposals ?? [],
    };

    const context = assembleBrainContext({
      snapshot: input.episode.snapshot,
      locale: input.locale,
      sliceAvailability: input.episode.sliceAvailability,
      priorOutputs,
    });

    const payload = buildBrainPayload(input.brainId, resolved, handoff);

    return contract.execute({
      brainId: input.brainId,
      context,
      payload,
      idempotencyKey: input.idempotencyKey,
      retryAttempt: input.episode.snapshot.retryCount[input.brainId] ?? 0,
    });
  }
}

function buildEngineInput(episode: ProjectEpisodeRecord): ProjectEngineInput {
  return {
    snapshot: episode.snapshot,
    contextReady: episode.contextReady,
    approvalSatisfied: episode.approvalSatisfied,
    monitoringComplete: episode.performanceObservationsAvailable,
    validationApprovalPending: episode.validationApprovalPending,
  };
}

function applyBrainExecution(
  episode: ProjectEpisodeRecord,
  result: BrainResult<import("../project-engine/brain-contract").BrainOutput>,
  locale: "nl" | "en",
  idempotencyKey: string
): ProjectEpisodeRecord {
  const summary: BrainResultSummary = {
    brainId: result.brainId,
    status: result.status,
    outputRef: result.output?.outputRef ?? null,
    confidence: result.confidence?.value ?? null,
    durationMs: result.durationMs,
    errorCode: result.errorCode,
    decisionIds: result.output?.decisionIds,
    requiresApproval: result.requiresApproval,
    approvalKind: result.approvalKind,
  };

  let memoryCheckpoint1Complete = episode.memoryCheckpoint1Complete;
  let memoryCheckpoint2Complete = episode.memoryCheckpoint2Complete;
  let validationApprovalPending = episode.validationApprovalPending;

  if (result.brainId === "validation" && result.status === "completed") {
    validationApprovalPending = result.requiresApproval ?? false;
  }
  if (result.brainId === "memory" && result.status === "completed") {
    if (episode.snapshot.state === "validating") memoryCheckpoint1Complete = true;
    if (episode.snapshot.state === "learning") memoryCheckpoint2Complete = true;
  }

  let artifacts = recordBrainOutputRef(episode.artifacts, result.brainId, result.output?.outputRef ?? null);
  let cachedLearningProposals = episode.cachedLearningProposals;
  if (result.brainId === "learning" && result.status === "completed") {
    const resolvedLearning = resolveBrainOutputs({
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      artifacts,
    });
    cachedLearningProposals = proposalsFromLearningGraph(resolvedLearning.learningBrainGraph);
    artifacts = {
      ...artifacts,
      learningProposalIds: learningProposalIds(resolvedLearning.learningBrainGraph),
    };
  }

  const advanced = advanceProjectEpisode(
    {
      ...buildEngineInput({
        ...episode,
        memoryCheckpoint1Complete,
        memoryCheckpoint2Complete,
        validationApprovalPending,
      }),
      lastBrainResult: summary,
      validationApprovalPending,
    },
    { locale }
  );

  appendRuntimeEvent({
    episode,
    type: brainCompletedEventType(result.brainId),
    brainId: result.brainId,
    outputRef: result.output?.outputRef,
  });

  if (result.brainId === "memory" && result.status === "completed") {
    appendRuntimeEvent({
      episode,
      type: memoryCheckpoint2Complete ? "memory_updated" : "memory_checkpoint_completed",
      brainId: "memory",
      outputRef: result.output?.outputRef,
    });
  }

  if (advanced.snapshot.state === "complete" && episode.snapshot.state !== "complete") {
    appendRuntimeEvent({
      episode: { ...episode, snapshot: advanced.snapshot },
      type: "project_completed",
      brainId: null,
    });
  }

  const resolved = mergeResolvedGraphs(
    episode.resolvedGraphs,
    resolveBrainOutputs({
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      artifacts,
    })
  );

  const updated: ProjectEpisodeRecord = {
    ...episode,
    snapshot: advanced.snapshot,
    artifacts,
    resolvedGraphs: resolved,
    memoryCheckpoint1Complete,
    memoryCheckpoint2Complete,
    validationApprovalPending,
    executedBrainKeys:
      result.status === "completed" || result.status === "waiting_approval"
        ? [...episode.executedBrainKeys, idempotencyKey]
        : episode.executedBrainKeys,
    episodeStatus: advanced.snapshot.state === "complete" ? "completed" : episode.episodeStatus,
    completedAt: advanced.snapshot.state === "complete" ? new Date().toISOString() : episode.completedAt,
    updatedAt: new Date().toISOString(),
    cachedLearningProposals,
    lastError: result.errorCode,
  };

  getDefaultProjectEpisodeRepository().save(updated);
  return updated;
}

function advanceIdlePhase(episode: ProjectEpisodeRecord): ProjectEpisodeRecord {
  let snapshot = episode.snapshot;
  const now = new Date();

  if (snapshot.state === "researching" && researchPhaseComplete(snapshot)) {
    snapshot = withProjectState(snapshot, "strategizing", now);
  }
  if (snapshot.state === "validating" && episode.memoryCheckpoint1Complete && episode.validationApprovalPending) {
    snapshot = withProjectState(snapshot, "waiting_for_approval", now);
    if (!snapshot.approvalCheckpoint) {
      snapshot = {
        ...snapshot,
        waitingReason: "approval_required",
        approvalCheckpoint: {
          id: `approval-campaign-${now.getTime()}`,
          kind: "campaign_approval",
          requiredAt: "validating",
          satisfied: false,
          satisfiedAt: null,
          unblocksState: "ready_to_publish",
          customerSummary: "Approve the full campaign package for publication.",
        },
      };
    }
  }
  if (snapshot.state === "validating" && episode.memoryCheckpoint1Complete && !episode.validationApprovalPending) {
    snapshot = withProjectState(snapshot, "ready_to_publish", now);
  }
  if (snapshot.state === "created" && episode.contextReady) {
    snapshot = withProjectState(snapshot, "collecting_context", now);
  }
  if (snapshot.state === "collecting_context" && episode.contextReady && snapshot.completedBrains.includes("company")) {
    snapshot = withProjectState(snapshot, "researching", now);
  }
  if (snapshot.state === "publishing" && snapshot.completedBrains.includes("execution")) {
    snapshot = withProjectState(snapshot, "monitoring", now);
  }

  const updated = { ...episode, snapshot, updatedAt: now.toISOString() };
  getDefaultProjectEpisodeRepository().save(updated);
  return updated;
}

function pauseEpisode(
  episode: ProjectEpisodeRecord,
  status: EpisodeStatus,
  reason: string,
  locale: "nl" | "en"
): EpisodeRunResult {
  const gaps = contextGapsFromEvaluation({
    blocked: true,
    actionKind: status === "waiting_for_context" ? "collect_context" : "wait",
    reason,
    brainId: episode.snapshot.activeBrain,
    slices: {
      business: episode.sliceAvailability.business ?? false,
      brand: episode.sliceAvailability.brand ?? false,
      website: episode.sliceAvailability.website ?? false,
      products: episode.sliceAvailability.products ?? false,
      competitors: episode.sliceAvailability.competitors ?? false,
      goals: episode.sliceAvailability.goals ?? false,
      campaign: episode.sliceAvailability.campaign ?? true,
    },
  });

  const now = new Date();
  let snapshot = episode.snapshot;
  if (
    status === "waiting_for_approval" &&
    (!snapshot.approvalCheckpoint || snapshot.approvalCheckpoint.satisfied)
  ) {
    const gateBrain =
      episode.validationApprovalPending && episode.memoryCheckpoint1Complete
        ? ("validation" as const)
        : snapshot.completedBrains.includes("creative") &&
            !snapshot.completedBrains.includes("validation")
          ? ("creative" as const)
          : snapshot.completedBrains.includes("planning") &&
              !snapshot.completedBrains.includes("creative")
            ? ("planning" as const)
            : snapshot.completedBrains.includes("strategy") &&
                !snapshot.completedBrains.includes("planning")
              ? ("strategy" as const)
              : null;
    const gate = gateBrain ? resolveApprovalGate(gateBrain) : null;
    if (gate) {
      snapshot = {
        ...snapshot,
        state: "waiting_for_approval",
        waitingReason: "approval_required",
        approvalCheckpoint: createApprovalCheckpoint(gate, locale === "nl", now),
      };
    }
  }

  const paused: ProjectEpisodeRecord = {
    ...episode,
    snapshot,
    episodeStatus: status,
    contextGaps: gaps,
    lastError: status === "waiting_for_approval" || status === "waiting_for_outcomes" ? null : reason,
    updatedAt: now.toISOString(),
  };
  getDefaultProjectEpisodeRepository().save(paused);
  return buildRunResult(paused, reason);
}

function completeEpisode(episode: ProjectEpisodeRecord): ProjectEpisodeRecord {
  const completed: ProjectEpisodeRecord = {
    ...episode,
    episodeStatus: "completed",
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    snapshot: { ...episode.snapshot, state: "complete", completedAt: new Date().toISOString() },
  };
  appendRuntimeEvent({ episode: completed, type: "project_completed", brainId: null });
  getDefaultProjectEpisodeRepository().save(completed);
  return completed;
}

function buildRunResult(episode: ProjectEpisodeRecord, reason: string | null): EpisodeRunResult {
  return {
    episode,
    status: episode.episodeStatus,
    missingContext: episode.contextGaps,
    reason,
    events: getDefaultProjectEpisodeRepository().listEvents(episode.snapshot.projectId),
    observability: buildObservability(episode),
  };
}

function buildObservability(episode: ProjectEpisodeRecord): EpisodeObservability {
  return {
    episodeId: episode.snapshot.episodeId,
    organizationId: episode.snapshot.organizationId,
    projectId: episode.snapshot.projectId,
    peerId: episode.snapshot.peerId,
    correlationId: episode.correlationId,
    currentProjectState: episode.snapshot.state,
    currentBrain: episode.snapshot.activeBrain,
    startedAt: episode.startedAt,
    updatedAt: episode.updatedAt,
    completedAt: episode.completedAt,
    brainOutputRefs: brainOutputRefMap(episode.artifacts),
    eventCount: getDefaultProjectEpisodeRepository().listEvents(episode.snapshot.projectId).length,
    approvalState:
      episode.snapshot.state === "waiting_for_approval"
        ? "pending"
        : episode.approvalGrantedForExecution
          ? "satisfied"
          : "none",
    observationState: episode.performanceObservationsAvailable
      ? "available"
      : episode.snapshot.state === "monitoring"
        ? "waiting"
        : "none",
    lastError: episode.lastError,
  };
}

export function createProjectEpisodeRunner(registry?: ProjectBrainRegistry): ProjectEpisodeRunner {
  return new ProjectEpisodeRunner(registry);
}

function mergeResolvedGraphs(
  cached: Partial<import("./types").ResolvedBrainOutputs>,
  fresh: import("./brain-output-resolver").ResolvedBrainOutputs
): import("./types").ResolvedBrainOutputs {
  return {
    companyGraph: fresh.companyGraph ?? cached.companyGraph ?? null,
    researchBrainGraph: fresh.researchBrainGraph ?? cached.researchBrainGraph ?? null,
    reasoningBrainGraph: fresh.reasoningBrainGraph ?? cached.reasoningBrainGraph ?? null,
    marketingIntelligenceBrainGraph:
      fresh.marketingIntelligenceBrainGraph ?? cached.marketingIntelligenceBrainGraph ?? null,
    strategyBrainGraph: fresh.strategyBrainGraph ?? cached.strategyBrainGraph ?? null,
    planningBrainGraph: fresh.planningBrainGraph ?? cached.planningBrainGraph ?? null,
    creativeGraph: fresh.creativeGraph ?? cached.creativeGraph ?? null,
    validationGraph: fresh.validationGraph ?? cached.validationGraph ?? null,
    memoryGraph: fresh.memoryGraph ?? cached.memoryGraph ?? null,
    executionHistory: fresh.executionHistory ?? cached.executionHistory ?? null,
    learningBrainGraph: fresh.learningBrainGraph ?? cached.learningBrainGraph ?? null,
    priorMemories: fresh.priorMemories.length > 0 ? fresh.priorMemories : cached.priorMemories ?? [],
  };
}
