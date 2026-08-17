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
import { commitEpisodeCritical } from "./episode-durable-persistence";
import {
  assertEpisodeMatchesRunScope,
  hydrateEpisodeToL1,
  loadDurableProjectEpisode,
} from "./episode-durable-resume";
import { createEmptyArtifacts, recordBrainOutputRef, brainOutputRefMap } from "./project-artifact-store";
import { getActiveDurablePersistence } from "../persistence/layer/active-durable-persistence";
import type { DurablePersistencePort } from "../persistence/layer/durable-persistence-port";
import { emitPersistenceDiagnostic } from "../persistence/layer/persistence-diagnostics";
import { PersistenceConflictError } from "../persistence/server/persistence-config";
import { evaluateEpisodeApprovalPackageGate } from "../approval/episode-approval-gate";
import {
  markExecutionHandoffPhase,
  needsPostApprovalExecution,
} from "../approval/approved-execution-handoff";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";
import { appendRuntimeEvent, brainCompletedEventType } from "./project-event-stream";
import { learningProposalIds, proposalsFromLearningGraph } from "./learning-memory-handoff";
import { buildMarketingPeerFixture } from "./fixtures/marketing-peer-fixture";
import { acquireEpisodeContext, type EpisodeAcquiredContext } from "./acquire-episode-context";
import { assertProductionEpisodeRealContext } from "../context-acquisition/server/context-acquisition-config";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { requiresPublicationApproval } from "../policy/campaign-approval-policy";
import { emitOrchestrationDiagnostic, safeOrchestrationError } from "./orchestration-diagnostics";
import type { ProjectBrainExecutionAdapter } from "./types";
import type {
  BrainHandoffContext,
  EpisodeObservability,
  EpisodeRunInput,
  EpisodeRunResult,
  EpisodeStatus,
  ProjectEpisodeRecord,
  ResumeEpisodeInput,
} from "./types";
import {
  isLegitimateRunnerPause,
  MAX_STALE_LOOP_ITERATIONS,
  resolveEpisodeStepBudget,
  resolveEpisodeStepBudgetForEpisode,
  snapshotProgressSignature,
  type EpisodeLoopExit,
} from "./episode-step-budget";
import { evaluateEffectiveValidationContextReadiness } from "../validation-readiness";

export class ProjectEpisodeRunner {
  constructor(
    private readonly registry: ProjectBrainRegistry = createDefaultProjectBrainRegistry(),
    private readonly durablePort: DurablePersistencePort | null = getActiveDurablePersistence(),
    private readonly brainExecutionAdapter: ProjectBrainExecutionAdapter | null = null
  ) {}

  private async commitEpisode(
    episode: ProjectEpisodeRecord,
    options?: { syncBrainDocs?: boolean }
  ): Promise<ProjectEpisodeRecord> {
    if (!this.durablePort) {
      getDefaultProjectEpisodeRepository().save(episode);
      return episode;
    }
    return commitEpisodeCritical(episode, this.durablePort, options);
  }

  private isFirstCreateConflict(error: unknown): error is PersistenceConflictError {
    return (
      error instanceof PersistenceConflictError &&
      error.expectedVersion === 0 &&
      error.actualVersion >= 1
    );
  }

  private async reloadEpisodeAfterFirstCreateConflict(
    input: EpisodeRunInput,
    actualVersion: number
  ): Promise<ProjectEpisodeRecord> {
    if (!this.durablePort) {
      throw new PersistenceConflictError("Episode version conflict", 0, actualVersion);
    }
    const reloaded = await loadDurableProjectEpisode(this.durablePort, input);
    if (!reloaded) {
      throw new PersistenceConflictError("Episode version conflict", 0, actualVersion);
    }
    assertEpisodeMatchesRunScope(reloaded, input);
    emitOrchestrationDiagnostic({
      event: "episode_conflict_reload",
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      episodeId: reloaded.snapshot.episodeId,
      correlationId: reloaded.correlationId,
      durableVersion: reloaded.durableVersion,
      actualVersion,
    });
    emitPersistenceDiagnostic({
      event: "episode_version_conflict_reload_state",
      organizationId: reloaded.snapshot.organizationId,
      projectId: reloaded.snapshot.projectId,
      episodeId: reloaded.snapshot.episodeId,
      durableVersion: reloaded.durableVersion,
      newVersion: actualVersion,
      step: "conflict_reload",
      source: "conflict_reload",
    });
    return hydrateEpisodeToL1(reloaded);
  }

  private async resolveEpisodeForRun(input: EpisodeRunInput): Promise<ProjectEpisodeRecord> {
    emitOrchestrationDiagnostic({
      event: "runner_episode_lookup_started",
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      caller: "run_until_pause",
    });

    const cached = getDefaultProjectEpisodeRepository().get({
      organizationId: input.organizationId,
      projectId: input.projectId,
    });
    if (cached) {
      emitOrchestrationDiagnostic({
        event: "runner_episode_lookup_completed",
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        caller: "run_until_pause",
        found: true,
        source: "l1_cache",
        durableVersion: cached.durableVersion,
        episodeId: cached.snapshot.episodeId,
        correlationId: cached.correlationId,
      });
      return cached;
    }

    if (this.durablePort) {
      const durableEpisode = await loadDurableProjectEpisode(this.durablePort, input);
      if (durableEpisode) {
        assertEpisodeMatchesRunScope(durableEpisode, input);
        const hydrated = hydrateEpisodeToL1(durableEpisode);
        emitOrchestrationDiagnostic({
          event: "runner_episode_lookup_completed",
          organizationId: input.organizationId,
          projectId: input.projectId,
          peerId: input.peerId,
          caller: "run_until_pause",
          found: true,
          source: "durable",
          durableVersion: hydrated.durableVersion,
          episodeId: hydrated.snapshot.episodeId,
          correlationId: hydrated.correlationId,
        });
        return hydrated;
      }
    }

    emitOrchestrationDiagnostic({
      event: "runner_episode_lookup_completed",
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      caller: "run_until_pause",
      found: false,
      source: "none",
    });
    return this.startEpisode(input);
  }

  async startEpisode(input: EpisodeRunInput): Promise<ProjectEpisodeRecord> {
    if (process.env.NODE_ENV === "production" && !isDemoPeer(input.peerId)) {
      assertProductionEpisodeRealContext({
        peerId: input.peerId,
        useRealContext: input.useRealContext,
        supabase: input.supabase,
        campaignContext: input.campaignContext,
      });
    }

    const fixture = buildMarketingPeerFixture(input.projectId.slice(-1));
    const correlationId = input.correlationId ?? `corr-${input.projectId}-${Date.now()}`;
    const snapshot = createProjectEngineSnapshot({
      projectId: input.projectId,
      peerId: input.peerId,
      organizationId: input.organizationId,
      episodeId: input.episodeId,
      locale: input.locale,
    });

    let sliceAvailability = input.sliceAvailability ?? fixture.sliceAvailability;
    let contextReady = input.contextReady ?? true;
    let contextGaps: import("./types").ContextGap[] = [];

    if (input.useRealContext && input.supabase && input.campaignContext) {
      emitOrchestrationDiagnostic({
        event: "episode_start_context_acquire_call_started",
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        caller: "start_episode",
      });
      const acquired = await acquireEpisodeContext({
        supabase: input.supabase,
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        peerRole: input.peerRole ?? "Marketing",
        locale: input.locale,
        campaignContext: input.campaignContext,
      });
      emitOrchestrationDiagnostic({
        event: "episode_start_context_acquire_returned",
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        contextReady: acquired.contextReady,
        caller: "start_episode",
      });
      sliceAvailability = acquired.sliceAvailability;
      contextReady = acquired.contextReady;
      contextGaps = [...acquired.contextGaps];
    }

    const episode: ProjectEpisodeRecord = {
      snapshot,
      artifacts: createEmptyArtifacts({
        organizationId: input.organizationId,
        projectId: input.projectId,
        episodeId: snapshot.episodeId,
        correlationId,
      }),
      episodeStatus: "running",
      contextReady,
      sliceAvailability,
      approvalSatisfied: false,
      validationApprovalPending: false,
      memoryCheckpoint1Complete: false,
      memoryCheckpoint2Complete: false,
      performanceObservationsAvailable: false,
      approvalGrantedForExecution: false,
      campaignApprovalMode:
        input.campaignContext?.approvalMode ?? "approval_before_publication",
      contextGaps,
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
    emitOrchestrationDiagnostic({
      event: "episode_start_invoked",
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      episodeId: episode.snapshot.episodeId,
      correlationId: episode.correlationId,
      initialDurableVersion: episode.durableVersion ?? 0,
    });
    emitOrchestrationDiagnostic({
      event: "episode_start_commit_started",
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      episodeId: episode.snapshot.episodeId,
      episodeStatus: episode.episodeStatus,
    });
    try {
      const committed = await this.commitEpisode(episode, { syncBrainDocs: false });
      emitOrchestrationDiagnostic({
        event: "episode_start_commit_completed",
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        episodeId: committed.snapshot.episodeId,
        episodeStatus: committed.episodeStatus,
      });
      return committed;
    } catch (error) {
      if (this.isFirstCreateConflict(error)) {
        return this.reloadEpisodeAfterFirstCreateConflict(input, error.actualVersion);
      }
      throw error;
    }
  }

  async runUntilPause(input: EpisodeRunInput): Promise<EpisodeRunResult> {
    if (process.env.NODE_ENV === "production" && !isDemoPeer(input.peerId)) {
      assertProductionEpisodeRealContext({
        peerId: input.peerId,
        useRealContext: input.useRealContext,
        supabase: input.supabase,
        campaignContext: input.campaignContext,
      });
    }

    let episode = await this.resolveEpisodeForRun(input);

    const maxSteps =
      input.maxSteps ??
      resolveEpisodeStepBudgetForEpisode(episode, {
        campaignApprovalMode:
          input.campaignContext?.approvalMode ?? episode.campaignApprovalMode,
        targetBrain: input.target?.targetBrain ?? null,
      });
    const locale = input.locale ?? "en";
    const fixture = buildMarketingPeerFixture(input.projectId.slice(-1));

    let acquiredContext: EpisodeAcquiredContext | null = null;
    if (input.useRealContext && input.supabase && input.campaignContext) {
      emitOrchestrationDiagnostic({
        event: "episode_context_acquire_call_started",
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        episodeId: episode.snapshot.episodeId,
        episodeStatus: episode.episodeStatus,
        caller: "run_until_pause",
      });
      try {
        acquiredContext = await acquireEpisodeContext({
          supabase: input.supabase,
          organizationId: input.organizationId,
          projectId: input.projectId,
          peerId: input.peerId,
          peerRole: input.peerRole ?? "Marketing",
          locale,
          campaignContext: input.campaignContext,
        });
      } catch (error) {
        const safe = safeOrchestrationError(error);
        emitOrchestrationDiagnostic({
          event: "episode_context_acquire_failed",
          organizationId: input.organizationId,
          projectId: input.projectId,
          peerId: input.peerId,
          episodeId: episode.snapshot.episodeId,
          episodeStatus: episode.episodeStatus,
          caller: "run_until_pause",
          errorName: safe.errorName,
          errorCode: safe.errorCode,
          reason: safe.reason,
        });
        throw error;
      }
      episode = {
        ...episode,
        sliceAvailability: acquiredContext.sliceAvailability,
        contextReady: acquiredContext.contextReady,
        contextGaps: [...acquiredContext.contextGaps],
        campaignApprovalMode:
          input.campaignContext?.approvalMode ?? episode.campaignApprovalMode ?? "approval_before_publication",
      };

      emitOrchestrationDiagnostic({
        event: "episode_context_acquired",
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        episodeId: episode.snapshot.episodeId,
        episodeStatus: episode.episodeStatus,
        contextReady: acquiredContext.contextReady,
        contextGapCount: acquiredContext.contextGaps.length,
        blockingContextGapCount: acquiredContext.contextGaps.filter((gap) => gap.blocking).length,
        sliceAvailability: acquiredContext.sliceAvailability,
        maxSteps,
      });

      const blockingGaps = acquiredContext.contextGaps.filter((gap) => gap.blocking);
      if (!acquiredContext.contextReady || blockingGaps.length > 0) {
        emitOrchestrationDiagnostic({
          event: "context_gap_blocked",
          organizationId: input.organizationId,
          projectId: input.projectId,
          peerId: input.peerId,
          episodeId: episode.snapshot.episodeId,
          reason: "Required context missing",
        });
        appendRuntimeEvent({ episode, type: "context_gap_blocked", brainId: null });
        return pauseEpisode(
          episode,
          "waiting_for_context",
          "Required context missing",
          locale,
          this.durablePort
        );
      }
    }

    const contextHandoff = acquiredContext?.handoff ?? {
      companySnapshot: fixture.companySnapshot,
      brandGraph: fixture.brandGraph,
      campaignContext: fixture.campaignContext,
      priorMemories: [] as readonly import("../layers/memory/types").MemoryRecord[],
    };

    emitOrchestrationDiagnostic({
      event: "episode_loop_entering",
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      peerId: episode.snapshot.peerId,
      episodeId: episode.snapshot.episodeId,
      episodeStatus: episode.episodeStatus,
      snapshotState: episode.snapshot.state,
    });

    let loopExit: EpisodeLoopExit | null = null;
    let lastProgressSignature = snapshotProgressSignature(episode);
    let staleIterations = 0;

    for (let step = 0; step < maxSteps; step += 1) {
      if (episode.episodeStatus === "completed" || episode.episodeStatus === "failed") {
        loopExit = { kind: "already_terminal" };
        emitOrchestrationDiagnostic({
          event: "episode_loop_terminal_break",
          organizationId: episode.snapshot.organizationId,
          projectId: episode.snapshot.projectId,
          peerId: episode.snapshot.peerId,
          episodeId: episode.snapshot.episodeId,
          episodeStatus: episode.episodeStatus,
          snapshotState: episode.snapshot.state,
          step,
        });
        break;
      }

      const progressSignature = snapshotProgressSignature(episode);
      if (progressSignature === lastProgressSignature) {
        staleIterations += 1;
        if (staleIterations >= MAX_STALE_LOOP_ITERATIONS) {
          loopExit = { kind: "stale_loop" };
          emitOrchestrationDiagnostic({
            event: "episode_loop_stale_detected",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            step,
            staleIterations,
          });
          break;
        }
      } else {
        staleIterations = 0;
        lastProgressSignature = progressSignature;
      }

      emitOrchestrationDiagnostic({
        event: "project_engine_evaluation_started",
        organizationId: episode.snapshot.organizationId,
        projectId: episode.snapshot.projectId,
        peerId: episode.snapshot.peerId,
        episodeId: episode.snapshot.episodeId,
        step,
        episodeStatus: episode.episodeStatus,
        snapshotState: episode.snapshot.state,
        contextReady: episode.contextReady,
        sliceAvailability: episode.sliceAvailability,
      });

      const evaluation = evaluateProjectEpisode(buildEngineInput(episode), {
        locale,
        sliceAvailability: episode.sliceAvailability,
        companyBrainComplete: episode.snapshot.completedBrains.includes("company"),
        memoryCheckpoint1Complete: episode.memoryCheckpoint1Complete,
        memoryCheckpoint2Complete: episode.memoryCheckpoint2Complete,
        performanceObservationsAvailable: episode.performanceObservationsAvailable,
        validationApprovalPending: episode.validationApprovalPending,
      });

      emitOrchestrationDiagnostic({
        event: "project_engine_evaluated",
        organizationId: episode.snapshot.organizationId,
        projectId: episode.snapshot.projectId,
        peerId: episode.snapshot.peerId,
        episodeId: episode.snapshot.episodeId,
        actionKind: evaluation.action.kind,
        brainId: evaluation.action.brainId,
      });

      if (evaluation.blocked && evaluation.action.kind === "collect_context") {
        emitOrchestrationDiagnostic({
          event: "project_engine_context_blocked",
          organizationId: episode.snapshot.organizationId,
          projectId: episode.snapshot.projectId,
          peerId: episode.snapshot.peerId,
          episodeId: episode.snapshot.episodeId,
          step,
          reason: evaluation.action.reason,
          contextReady: episode.contextReady,
          sliceAvailability: episode.sliceAvailability,
        });
      }

      if (evaluation.action.kind !== "idle") {
        emitOrchestrationDiagnostic({
          event: "project_engine_action_selected",
          organizationId: episode.snapshot.organizationId,
          projectId: episode.snapshot.projectId,
          peerId: episode.snapshot.peerId,
          episodeId: episode.snapshot.episodeId,
          actionKind: evaluation.action.kind,
          brainId: evaluation.action.brainId,
        });
      }

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
          emitOrchestrationDiagnostic({
            event: "post_approval_execution_requested",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            snapshotState: episode.snapshot.state,
            packageId: episode.approvedExecutionHandoff?.packageId,
            packageVersion: episode.approvedExecutionHandoff?.packageVersion,
          });
          episode = {
            ...episode,
            snapshot: withProjectState(episode.snapshot, "publishing", new Date()),
          };
          continue;
        }
      }

      if (evaluation.blocked) {
        if (evaluation.action.kind === "collect_context") {
          return await pauseEpisode(episode, "waiting_for_context", evaluation.action.reason, locale, this.durablePort);
        }
        if (evaluation.action.kind === "wait") {
          appendRuntimeEvent({ episode, type: "waiting_for_approval", brainId: null });
          return await pauseEpisode(episode, "waiting_for_approval", evaluation.action.reason, locale, this.durablePort);
        }
        if (evaluation.action.kind === "monitor") {
          appendRuntimeEvent({ episode, type: "waiting_for_outcomes", brainId: null });
          return await pauseEpisode(episode, "waiting_for_outcomes", evaluation.action.reason, locale, this.durablePort);
        }
      }

      if (evaluation.action.kind === "complete") {
        episode = completeEpisode(episode);
        loopExit = { kind: "completed" };
        break;
      }

      if (evaluation.action.kind === "run_brain" || evaluation.action.kind === "learn") {
        const brainId = evaluation.action.brainId;
        if (!brainId) continue;

        if (brainId === "creative") {
          emitOrchestrationDiagnostic({
            event: "creative_start_requested",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            brainId: "creative",
            snapshotState: episode.snapshot.state,
          });
        }
        if (brainId === "validation") {
          const resolvedForReadiness = mergeResolvedGraphs(
            episode.resolvedGraphs,
            resolveBrainOutputs({
              organizationId: episode.snapshot.organizationId,
              projectId: episode.snapshot.projectId,
              artifacts: episode.artifacts,
              episodeResolvedGraphs: episode.resolvedGraphs,
            })
          );
          const readiness = evaluateEffectiveValidationContextReadiness({
            episode,
            resolvedGraphs: resolvedForReadiness,
            completedBrains: episode.snapshot.completedBrains,
            campaignContext: contextHandoff.campaignContext,
          });
          emitOrchestrationDiagnostic({
            event: "validation_start_requested",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            brainId: "validation",
            snapshotState: episode.snapshot.state,
            resolvedCreativeGraphPresent: Boolean(resolvedForReadiness.creativeGraph),
            validationReadinessScore: readiness.score,
            validationReadinessMinimum: readiness.minimum,
          });
        }

        const idempotencyKey =
          brainId === "execution" && episode.approvedExecutionHandoff?.packageId
            ? `${episode.correlationId}:execution:${episode.approvedExecutionHandoff.packageId}`
            : `${episode.correlationId}:${brainId}:${episode.snapshot.state}`;
        if (shouldSkipExecutedBrainKey(episode, brainId, idempotencyKey)) {
          emitOrchestrationDiagnostic({
            event: brainId === "validation" ? "validation_start_skipped" : "episode_loop_terminal_break",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            brainId,
            reason: "executed_brain_key_without_completion",
          });
          episode = advanceIdlePhase(episode);
          continue;
        }

        if (brainId === "execution") {
          emitOrchestrationDiagnostic({
            event: "post_approval_execution_started",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            brainId: "execution",
            snapshotState: episode.snapshot.state,
            packageId: episode.approvedExecutionHandoff?.packageId,
            packageVersion: episode.approvedExecutionHandoff?.packageVersion,
            idempotencyKeyPresent: Boolean(episode.approvedExecutionHandoff?.packageId),
          });
          episode = markExecutionHandoffPhase(episode, "executing");
        }

        const brainResult = await this.executeBrain({
          brainId,
          episode,
          contextHandoff,
          locale,
          idempotencyKey,
        });

        if (brainResult.status === "waiting_for_input") {
          const pauseReason =
            brainResult.readinessReasonCodes?.length
              ? brainResult.readinessReasonCodes.join("; ")
              : brainResult.errorCode ?? "readiness_insufficient";
          emitOrchestrationDiagnostic({
            event: "episode_runner_brain_waiting_for_context",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            brainId: brainResult.brainId,
            errorCode: brainResult.errorCode ?? undefined,
            readinessReasonCodes: brainResult.readinessReasonCodes,
            correlationId: episode.correlationId,
          });
          episode = {
            ...episode,
            snapshot: { ...episode.snapshot, activeBrain: brainId },
          };
          return await pauseEpisode(
            episode,
            "waiting_for_context",
            pauseReason,
            locale,
            this.durablePort
          );
        }

        episode = applyBrainExecution(episode, brainResult, locale, idempotencyKey);

        if (brainId === "execution") {
          if (brainResult.status === "failed" && brainResult.errorCode === "integration_not_connected") {
            emitOrchestrationDiagnostic({
              event: "post_approval_execution_blocked",
              organizationId: episode.snapshot.organizationId,
              projectId: episode.snapshot.projectId,
              peerId: episode.snapshot.peerId,
              episodeId: episode.snapshot.episodeId,
              brainId: "execution",
              errorCode: brainResult.errorCode,
              packageId: episode.approvedExecutionHandoff?.packageId,
              integrationReady: false,
            });
            episode = markExecutionHandoffPhase(episode, "blocked_integration", {
              blockedReason: brainResult.errorCode ?? "integration_not_connected",
            });
            episode = await this.commitEpisode(episode);
            return buildRunResult(episode, null);
          }
          if (brainResult.status === "completed") {
            emitOrchestrationDiagnostic({
              event: "post_approval_execution_completed",
              organizationId: episode.snapshot.organizationId,
              projectId: episode.snapshot.projectId,
              peerId: episode.snapshot.peerId,
              episodeId: episode.snapshot.episodeId,
              brainId: "execution",
              packageId: episode.approvedExecutionHandoff?.packageId,
              integrationReady: true,
            });
            episode = markExecutionHandoffPhase(episode, "completed");
          }
        }

        episode = await this.commitEpisode(episode);
        if (brainResult.status === "failed") {
          emitOrchestrationDiagnostic({
            event: "episode_runner_brain_failure_persisted",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            brainId: brainResult.brainId,
            errorCode: brainResult.errorCode ?? undefined,
            durableVersion: episode.durableVersion,
            snapshotState: episode.snapshot.state,
            correlationId: episode.correlationId,
          });
          episode = { ...episode, episodeStatus: "failed", lastError: brainResult.errorCode };
          loopExit = { kind: "brain_failed", errorCode: brainResult.errorCode };
          break;
        }

        if (
          input.target?.targetBrain &&
          episode.snapshot.completedBrains.includes(input.target.targetBrain)
        ) {
          emitOrchestrationDiagnostic({
            event: "episode_target_reached",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            brainId: input.target.targetBrain,
          });
          loopExit = { kind: "target_brain_reached", brainId: input.target.targetBrain };
          break;
        }
        if (
          input.target?.targetLifecycleState &&
          episode.snapshot.state === input.target.targetLifecycleState
        ) {
          emitOrchestrationDiagnostic({
            event: "episode_target_reached",
            organizationId: episode.snapshot.organizationId,
            projectId: episode.snapshot.projectId,
            peerId: episode.snapshot.peerId,
            episodeId: episode.snapshot.episodeId,
            reason: input.target.targetLifecycleState,
          });
          loopExit = {
            kind: "target_state_reached",
            state: input.target.targetLifecycleState,
          };
          break;
        }
      }

      if (evaluation.action.kind === "retry" || evaluation.action.kind === "recover") {
        episode = { ...episode, episodeStatus: "failed", lastError: evaluation.action.reason };
        loopExit = { kind: "brain_failed", errorCode: evaluation.action.reason };
        break;
      }
    }

    if (!loopExit) {
      loopExit = { kind: "max_steps_exceeded" };
    }

    episode = {
      ...episode,
      lastRunnerExitReason: loopExit.kind,
    };

    emitOrchestrationDiagnostic({
      event: "episode_loop_terminal_break",
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      peerId: episode.snapshot.peerId,
      episodeId: episode.snapshot.episodeId,
      reason: loopExit.kind,
      snapshotState: episode.snapshot.state,
      runnerExitReason: loopExit.kind,
    });

    episode = await this.commitEpisode(episode);
    if (episode.episodeStatus === "running") {
      if (isLegitimateRunnerPause(loopExit)) {
        return buildRunResult(episode, null);
      }
      if (episode.snapshot.state === "monitoring" && !episode.performanceObservationsAvailable) {
        appendRuntimeEvent({ episode, type: "waiting_for_outcomes", brainId: null });
        return await pauseEpisode(
          episode,
          "waiting_for_outcomes",
          "Awaiting performance observations",
          input.locale ?? "en",
          this.durablePort
        );
      }
      const lastError =
        loopExit.kind === "stale_loop" ? "stale_loop_detected" : "max_steps_exceeded";
      episode = { ...episode, episodeStatus: "failed", lastError };
      episode = await this.commitEpisode(episode);
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
      const clearedValidationApproval =
        advanced.snapshot.state === "ready_to_publish" ||
        advanced.snapshot.state === "publishing" ||
        advanced.snapshot.approvalCheckpoint?.satisfied === true;
      updated = {
        ...updated,
        snapshot: advanced.snapshot,
        approvalSatisfied: false,
        validationApprovalPending: clearedValidationApproval
          ? false
          : updated.validationApprovalPending,
        approvalGrantedForExecution:
          updated.approvalGrantedForExecution ||
          advanced.snapshot.state === "ready_to_publish" ||
          advanced.snapshot.state === "publishing" ||
          advanced.snapshot.state === "monitoring",
      };
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

    await this.commitEpisode({ ...updated, episodeStatus: "running" });

    if (needsPostApprovalExecution(updated)) {
      emitOrchestrationDiagnostic({
        event: "post_approval_execution_requested",
        organizationId: updated.snapshot.organizationId,
        projectId: updated.snapshot.projectId,
        peerId: updated.snapshot.peerId,
        episodeId: updated.snapshot.episodeId,
        snapshotState: updated.snapshot.state,
        packageId: updated.approvedExecutionHandoff?.packageId,
      });
    }

    return this.runUntilPause({
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: updated.snapshot.peerId,
      locale: input.locale,
      maxSteps:
        input.maxSteps ??
        resolveEpisodeStepBudgetForEpisode(updated, {
          campaignApprovalMode: updated.campaignApprovalMode,
        }),
    });
  }

  private async executeBrain(input: {
    brainId: ProjectBrainId;
    episode: ProjectEpisodeRecord;
    contextHandoff: {
      companySnapshot: import("../company/snapshot").CompanySnapshot;
      brandGraph: import("../layers/brand/types").BrandGraph | null;
      campaignContext: import("@/lib/office/campaign/campaign-context").CampaignContext;
      priorMemories: readonly import("../layers/memory/types").MemoryRecord[];
    };
    locale: "nl" | "en";
    idempotencyKey: string;
  }): Promise<BrainResult<import("../project-engine/brain-contract").BrainOutput>> {
    if (this.brainExecutionAdapter) {
      return this.brainExecutionAdapter.execute(input);
    }

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
        episodeResolvedGraphs: input.episode.resolvedGraphs,
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
      priorMemories:
        input.contextHandoff.priorMemories.length > 0
          ? input.contextHandoff.priorMemories
          : resolved.priorMemories,
      campaignContext: input.contextHandoff.campaignContext,
      companySnapshot: input.contextHandoff.companySnapshot,
      brandGraph: input.contextHandoff.brandGraph,
      approvalGrantedForExecution: input.episode.approvalGrantedForExecution,
      approvedExecutionHandoff: input.episode.approvedExecutionHandoff ?? null,
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
    campaignApprovalMode: episode.campaignApprovalMode ?? "approval_before_publication",
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
    readinessReasonCodes: result.readinessReasonCodes,
    decisionIds: result.output?.decisionIds,
    requiresApproval: result.requiresApproval,
    approvalKind: result.approvalKind,
  };

  let memoryCheckpoint1Complete = episode.memoryCheckpoint1Complete;
  let memoryCheckpoint2Complete = episode.memoryCheckpoint2Complete;
  let validationApprovalPending = episode.validationApprovalPending;

  if (result.brainId === "validation" && result.status === "completed") {
    validationApprovalPending = requiresPublicationApproval(
      episode.campaignApprovalMode ?? "approval_before_publication"
    );
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
      episodeResolvedGraphs: episode.resolvedGraphs,
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
      episodeResolvedGraphs: episode.resolvedGraphs,
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
    const gate = evaluateEpisodeApprovalPackageGate(episode);
    if (gate.allowed) {
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

async function pauseEpisode(
  episode: ProjectEpisodeRecord,
  status: EpisodeStatus,
  reason: string,
  locale: "nl" | "en",
  durablePort: DurablePersistencePort | null = null
): Promise<EpisodeRunResult> {
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
    const gate = gateBrain
      ? resolveApprovalGate(gateBrain, episode.campaignApprovalMode ?? "approval_before_publication")
      : null;
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
  if (durablePort) {
    await commitEpisodeCritical(paused, durablePort);
  } else {
    getDefaultProjectEpisodeRepository().save(paused);
  }
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

export function createProjectEpisodeRunner(
  registry?: ProjectBrainRegistry,
  durablePort?: DurablePersistencePort | null,
  brainExecutionAdapter?: ProjectBrainExecutionAdapter | null
): ProjectEpisodeRunner {
  return new ProjectEpisodeRunner(
    registry,
    durablePort ?? getActiveDurablePersistence(),
    brainExecutionAdapter ?? null
  );
}

function shouldSkipExecutedBrainKey(
  episode: ProjectEpisodeRecord,
  brainId: ProjectBrainId,
  idempotencyKey: string
): boolean {
  if (!episode.executedBrainKeys.includes(idempotencyKey)) return false;
  return episode.snapshot.completedBrains.includes(brainId);
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
