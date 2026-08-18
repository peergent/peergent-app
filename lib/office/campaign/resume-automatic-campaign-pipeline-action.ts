"use server";

import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { OrgContextError, requireAuthenticatedOrgContext } from "@/lib/intelligence/api/require-org-context";
import { fetchOrganizationPeerByIdServer } from "@/lib/peers/server-queries";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { buildCampaignContext } from "./campaign-context";
import { buildDomainInputForStrategyRun } from "./live-strategy-run-execution";
import { prepareBrainServerPersistence } from "@/lib/brain/persistence/server/prepare-brain-server-persistence";
import { buildCampaignEpisodeServerExecutionContext } from "@/lib/brain/project-runtime/campaign-episode-server-context";
import { resumeAutomaticCampaignPipeline } from "@/lib/brain/project-runtime/automatic-campaign-pipeline";
import {
  detectAutomaticCampaignPipelineStall,
  isEpisodeAtHealthyRuntimeBoundary,
  shouldResumeAutomaticCampaignPipeline,
} from "@/lib/brain/project-runtime/automatic-campaign-pipeline-invariants";
import { getDefaultProjectEpisodeRepository } from "@/lib/brain/project-runtime/project-episode-repository";
import { emitOrchestrationDiagnostic } from "@/lib/brain/project-runtime/orchestration-diagnostics";
import {
  evaluateAutomaticPipelineRecoveryOnMount,
  usesProjectEngineLifecycleAuthority,
} from "./live-strategy-run-service";

export type ResumeAutomaticCampaignPipelineActionResult = {
  ok: boolean;
  resumed: boolean;
  episodeStatus?: string;
  currentState?: string;
  stallReason?: string;
  decisionReason?: string;
  error?: string;
};

function emitRecoveryDiagnostic(input: {
  event:
    | "automatic_pipeline_recovery_candidate"
    | "automatic_pipeline_recovery_triggered"
    | "automatic_pipeline_recovery_skipped"
    | "automatic_pipeline_recovery_failed"
    | "runtime_recovery_considered"
    | "runtime_recovery_skipped";
  organizationId: string;
  projectId: string;
  peerId: string;
  snapshotState?: string;
  stallReason?: string;
  decisionReason?: string;
  errorCode?: string;
}): void {
  emitOrchestrationDiagnostic({
    event: input.event,
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    snapshotState: input.snapshotState as never,
    stallReason: input.stallReason,
    decisionReason: input.decisionReason,
    errorCode: input.errorCode,
    reason: input.decisionReason ?? input.stallReason ?? input.errorCode,
  });
}

/** One-shot server recovery for stalled automatic campaign cognitive pipeline. */
export async function resumeAutomaticCampaignPipelineAction(input: {
  peerId: string;
  projectId: string;
  project: MarketingProject;
  locale?: string | null;
  mountDecisionReason?: string;
}): Promise<ResumeAutomaticCampaignPipelineActionResult> {
  const mountDecision = evaluateAutomaticPipelineRecoveryOnMount(input.project);

  if (isDemoPeer(input.peerId)) {
    return { ok: true, resumed: false, decisionReason: "demo_peer" };
  }

  if (!usesProjectEngineLifecycleAuthority(input.project)) {
    return { ok: true, resumed: false, decisionReason: "manual_setup" };
  }

  if (!mountDecision.eligible) {
    return { ok: true, resumed: false, decisionReason: mountDecision.decisionReason };
  }

  try {
    const auth = await requireAuthenticatedOrgContext();
    emitRecoveryDiagnostic({
      event: "runtime_recovery_considered",
      organizationId: auth.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      decisionReason: input.mountDecisionReason ?? mountDecision.decisionReason,
    });
    emitRecoveryDiagnostic({
      event: "automatic_pipeline_recovery_candidate",
      organizationId: auth.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      decisionReason: input.mountDecisionReason ?? mountDecision.decisionReason,
    });

    const peer = await fetchOrganizationPeerByIdServer(
      auth.supabase,
      input.peerId,
      auth.organizationId
    );
    if (!peer) {
      emitRecoveryDiagnostic({
        event: "automatic_pipeline_recovery_skipped",
        organizationId: auth.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        decisionReason: "peer_not_found",
      });
      return { ok: false, resumed: false, error: "peer_not_found", decisionReason: "peer_not_found" };
    }

    await prepareBrainServerPersistence({
      supabase: auth.supabase,
      organizationId: auth.organizationId,
      projectId: input.projectId,
    });

    const domainInput = buildDomainInputForStrategyRun({
      peerId: input.peerId,
      projectId: input.projectId,
      project: input.project,
      understanding: null,
      organizationId: auth.organizationId,
      supabase: auth.supabase,
      peerRole: peer.role,
      locale: input.locale,
    });

    const campaignContext = buildCampaignContext({
      project: input.project,
      domainInput,
      locale: input.locale,
      organizationId: auth.organizationId,
    });

    const episode =
      getDefaultProjectEpisodeRepository().get({
        organizationId: auth.organizationId,
        projectId: input.projectId,
      }) ?? null;

    if (!shouldResumeAutomaticCampaignPipeline({ project: input.project, episode })) {
      const stall = detectAutomaticCampaignPipelineStall({
        project: input.project,
        episode,
      });
      const healthyBoundary = episode ? isEpisodeAtHealthyRuntimeBoundary(episode) : false;
      emitRecoveryDiagnostic({
        event: "runtime_recovery_skipped",
        organizationId: auth.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        snapshotState: episode?.snapshot.state,
        stallReason: stall?.reason,
        decisionReason: healthyBoundary
          ? "healthy_runtime_boundary"
          : episode
            ? "no_stall_detected"
            : "episode_not_loaded",
      });
      emitRecoveryDiagnostic({
        event: "automatic_pipeline_recovery_skipped",
        organizationId: auth.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        snapshotState: episode?.snapshot.state,
        stallReason: stall?.reason,
        decisionReason: healthyBoundary
          ? "healthy_runtime_boundary"
          : episode
            ? "no_stall_detected"
            : "episode_not_loaded",
      });
      return {
        ok: true,
        resumed: false,
        currentState: episode?.snapshot.state,
        decisionReason: episode ? "no_stall_detected" : "episode_not_loaded",
      };
    }

    const stall = detectAutomaticCampaignPipelineStall({
      project: input.project,
      episode,
    })!;

    const contextPhase =
      episode?.snapshot.state === "validating" &&
      !episode.snapshot.completedBrains.includes("validation")
        ? "validation"
        : episode?.snapshot.state === "generating" &&
            !episode?.snapshot.completedBrains.includes("creative")
          ? "creative"
          : "planning";

    const serverContext = await buildCampaignEpisodeServerExecutionContext({
      supabase: auth.supabase,
      organizationId: auth.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      peerRole: peer.role,
      campaignContext,
      project: input.project,
      domainInput,
      locale: input.locale === "nl" ? "nl" : "en",
      contextPhase,
    });

    emitRecoveryDiagnostic({
      event: "automatic_pipeline_recovery_triggered",
      organizationId: auth.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      snapshotState: stall.currentState,
      stallReason: stall.reason,
      decisionReason: input.mountDecisionReason ?? mountDecision.decisionReason,
    });

    const result = await resumeAutomaticCampaignPipeline({
      supabase: auth.supabase,
      organizationId: auth.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      peerRole: peer.role,
      project: input.project,
      domainInput,
      serverContext,
      trigger: "pipeline_recovery",
    });

    if (!result) {
      emitRecoveryDiagnostic({
        event: "automatic_pipeline_recovery_skipped",
        organizationId: auth.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        snapshotState: episode?.snapshot.state,
        decisionReason: "resume_returned_null",
      });
      return { ok: true, resumed: false, decisionReason: "resume_returned_null" };
    }

    const postStall = detectAutomaticCampaignPipelineStall({
      project: input.project,
      episode: result.episode,
    });

    return {
      ok: result.status !== "failed",
      resumed: true,
      episodeStatus: result.status,
      currentState: result.episode.snapshot.state,
      stallReason: postStall?.reason,
      decisionReason: input.mountDecisionReason ?? mountDecision.decisionReason,
    };
  } catch (error) {
    if (error instanceof OrgContextError) {
      emitRecoveryDiagnostic({
        event: "automatic_pipeline_recovery_failed",
        organizationId: "unknown",
        projectId: input.projectId,
        peerId: input.peerId,
        errorCode: error.code,
        decisionReason: error.code,
      });
      return { ok: false, resumed: false, error: error.code, decisionReason: error.code };
    }
    emitRecoveryDiagnostic({
      event: "automatic_pipeline_recovery_failed",
      organizationId: "unknown",
      projectId: input.projectId,
      peerId: input.peerId,
      errorCode: "execution_error",
      decisionReason: "execution_error",
    });
    return { ok: false, resumed: false, error: "execution_error", decisionReason: "execution_error" };
  }
}
