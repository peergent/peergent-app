/**
 * PX-61 / PX-61B — unified durable context resolution bridge for automatic campaigns.
 */

import "server-only";

import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type {
  ProjectEpisodeRecord,
  SuppliedCampaignBrandContext,
  SuppliedCampaignCompetitorDecision,
  SuppliedCampaignWebsiteDecision,
} from "@/lib/brain/project-runtime/types";
import { createProjectEpisodeRunner } from "@/lib/brain/project-runtime/project-episode-runner";
import { createProductionBrainExecutionAdapter } from "@/lib/brain/project-runtime/production-brain-adapter";
import { getDefaultProjectEpisodeRepository } from "@/lib/brain/project-runtime/project-episode-repository";
import { prepareBrainServerPersistence } from "@/lib/brain/persistence/server/prepare-brain-server-persistence";
import { commitEpisodeCritical } from "@/lib/brain/project-runtime/episode-durable-persistence";
import { getActiveDurablePersistence } from "@/lib/brain/persistence/layer/active-durable-persistence";
import { buildCampaignContext } from "./campaign-context";
import { resolveDurableOrganizationNameServer } from "./resolve-organization-name-server";
import {
  mergeCampaignBrandContextIntoProject,
  mergeCampaignCompetitorSkipIntoProject,
  mergeCampaignCompetitorsIntoProject,
  mergeCampaignWebsiteSkipIntoProject,
  mergeCampaignWebsiteUrlIntoProject,
  normalizeCampaignWebsiteUrl,
  type LiveCampaignBrandContext,
} from "./live-campaign-context-store";
import {
  emitContextBridgeDiagnostic,
  safeContextBridgeError,
} from "./context-bridge-diagnostics";
import { buildCampaignRuntimeProjectionFromEpisode } from "./campaign-runtime-projection";
import type { CampaignRuntimeSyncPayload } from "./campaign-runtime-projection-sync";
import {
  normalizeCampaignCompanyContext,
  validateCampaignCompanyContext,
} from "./campaign-company-context-validation";
import type {
  CampaignContextResolutionInput,
  CampaignContextResolutionKind,
  CampaignContextResolutionValidationError,
  SubmitCampaignContextResolutionServerResult,
} from "./campaign-context-resolution-types";

const resolutionInFlightByKey = new Map<string, Promise<SubmitCampaignContextResolutionServerResult>>();

function resolutionInFlightKey(organizationId: string, projectId: string): string {
  return `${organizationId}:${projectId}`;
}

function buildRuntimeSyncFromEpisode(
  episode: ProjectEpisodeRecord,
  stopReason: import("@/lib/brain/project-runtime/episode-runner-stop-reasons").EpisodeRunnerStopReason | null | undefined
): CampaignRuntimeSyncPayload {
  return {
    runtimeProjection: buildCampaignRuntimeProjectionFromEpisode(episode),
    episodeStatus: episode.episodeStatus,
    lifecycleState: episode.snapshot.state,
    durableVersion: episode.durableVersion ?? 0,
    stopReason: stopReason ?? null,
    correlationId: episode.correlationId,
  };
}

export type SubmitCampaignContextResolutionServerInput = {
  peerId: string;
  projectId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  resolution: CampaignContextResolutionInput;
  organizationId: string;
  supabase: AppSupabaseClient;
  peerRole?: string;
  locale?: "nl" | "en";
};

export async function submitCampaignContextResolutionServer(
  input: SubmitCampaignContextResolutionServerInput
): Promise<SubmitCampaignContextResolutionServerResult> {
  const key = resolutionInFlightKey(input.organizationId, input.projectId);
  const inflight = resolutionInFlightByKey.get(key);
  if (inflight) {
    emitContextBridgeDiagnostic({
      event: "context_submission_requested",
      organizationId: input.organizationId,
      projectId: input.projectId,
      errorCode: "duplicate_invocation",
      contextKind: input.resolution.kind,
    });
    return inflight;
  }

  const promise = executeCampaignContextResolutionServer(input).finally(() => {
    resolutionInFlightByKey.delete(key);
  });
  resolutionInFlightByKey.set(key, promise);
  return promise;
}

export function resetContextBridgeInFlightForTests(): void {
  resolutionInFlightByKey.clear();
}

function validateResolution(
  resolution: CampaignContextResolutionInput,
  locale: "nl" | "en"
): CampaignContextResolutionValidationError | null {
  if (resolution.kind === "company") {
    const normalized = normalizeCampaignCompanyContext(resolution.brandContext);
    const validation = validateCampaignCompanyContext(normalized, locale === "nl");
    if (!validation.valid) {
      return { kind: "company", errors: validation };
    }
    return null;
  }
  if (resolution.kind === "website" && resolution.decision === "supplied") {
    if (!normalizeCampaignWebsiteUrl(resolution.url)) {
      return { kind: "website", error: "invalid_url" };
    }
    return null;
  }
  if (resolution.kind === "competitors" && resolution.decision === "supplied") {
    const hasName = resolution.competitors.some((c) => c.name?.trim());
    if (!hasName) return { kind: "competitors", error: "empty_list" };
    return null;
  }
  return null;
}

function mergeResolutionIntoProject(
  project: MarketingProject,
  resolution: CampaignContextResolutionInput
): MarketingProject | null {
  if (!project.campaignSetup) return null;

  if (resolution.kind === "company") {
    return mergeCampaignBrandContextIntoProject(
      project,
      normalizeCampaignCompanyContext(resolution.brandContext)
    );
  }
  if (resolution.kind === "website") {
    if (resolution.decision === "skipped") {
      return mergeCampaignWebsiteSkipIntoProject(project);
    }
    return mergeCampaignWebsiteUrlIntoProject(project, resolution.url);
  }
  if (resolution.kind === "competitors") {
    if (resolution.decision === "skipped") {
      return mergeCampaignCompetitorSkipIntoProject(project);
    }
    return mergeCampaignCompetitorsIntoProject(project, resolution.competitors);
  }
  return null;
}

function toEpisodeSuppliedPatch(
  resolution: CampaignContextResolutionInput
): Partial<Pick<ProjectEpisodeRecord, "suppliedCampaignBrandContext" | "suppliedCampaignWebsiteDecision" | "suppliedCampaignCompetitorDecision">> {
  const at = new Date().toISOString();

  if (resolution.kind === "company") {
    const normalized = normalizeCampaignCompanyContext(resolution.brandContext);
    const supplied: SuppliedCampaignBrandContext = {
      brandName: normalized.brandName,
      industry: normalized.industry,
      mission: normalized.mission,
      uniqueSellingPoints: normalized.uniqueSellingPoints,
      productsAndServices: normalized.productsAndServices,
      positioning: normalized.positioning,
      tone: normalized.tone,
      targetAudience: normalized.targetAudience,
      suppliedAt: at,
      source: "customer_supplied",
    };
    return { suppliedCampaignBrandContext: supplied };
  }

  if (resolution.kind === "website") {
    const supplied: SuppliedCampaignWebsiteDecision =
      resolution.decision === "skipped"
        ? { decision: "skipped", decidedAt: at, source: "customer_skipped" }
        : {
            decision: "supplied",
            websiteUrl: normalizeCampaignWebsiteUrl(resolution.url) ?? undefined,
            decidedAt: at,
            source: "customer_supplied",
          };
    return { suppliedCampaignWebsiteDecision: supplied };
  }

  const entries =
    resolution.decision === "supplied"
      ? resolution.competitors
          .map((c) => ({
            name: c.name.trim(),
            url: c.url?.trim() || undefined,
          }))
          .filter((c) => c.name.length > 0)
      : undefined;

  const supplied: SuppliedCampaignCompetitorDecision =
    resolution.decision === "skipped"
      ? { decision: "skipped", decidedAt: at, source: "customer_skipped" }
      : {
          decision: "supplied",
          competitors: entries,
          decidedAt: at,
          source: "customer_supplied",
        };
  return { suppliedCampaignCompetitorDecision: supplied };
}

async function executeCampaignContextResolutionServer(
  input: SubmitCampaignContextResolutionServerInput
): Promise<SubmitCampaignContextResolutionServerResult> {
  const locale = input.locale ?? "en";
  const kind = input.resolution.kind;

  emitContextBridgeDiagnostic({
    event: "context_submission_requested",
    organizationId: input.organizationId,
    projectId: input.projectId,
    contextKind: kind,
    decision: "decision" in input.resolution ? input.resolution.decision : "supplied",
  });

  const validationError = validateResolution(input.resolution, locale);
  if (validationError) {
    return { ok: false, error: "validation_failed", validation: validationError };
  }

  if (input.project.id !== input.projectId || !input.project.campaignSetup) {
    return { ok: false, error: "invalid_project" };
  }

  const updatedProject = mergeResolutionIntoProject(input.project, input.resolution);
  if (!updatedProject) {
    return { ok: false, error: "persist_failed" };
  }

  await prepareBrainServerPersistence({
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
  });

  const repo = getDefaultProjectEpisodeRepository();
  const episode = repo.get({
    organizationId: input.organizationId,
    projectId: input.projectId,
  });

  if (!episode) {
    emitContextBridgeDiagnostic({
      event: "context_bridge_resolved",
      organizationId: input.organizationId,
      projectId: input.projectId,
      errorCode: "episode_not_found",
      contextKind: kind,
    });
    return { ok: false, error: "episode_not_found" };
  }

  if (episode.episodeStatus !== "waiting_for_context") {
    emitContextBridgeDiagnostic({
      event: "context_episode_not_waiting",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episode.snapshot.episodeId,
      episodeStatus: episode.episodeStatus,
      snapshotState: episode.snapshot.state,
      contextKind: kind,
    });
    return { ok: false, error: "episode_not_waiting" };
  }

  const episodePatch = toEpisodeSuppliedPatch(input.resolution);
  const episodeWithContext: ProjectEpisodeRecord = {
    ...episode,
    ...episodePatch,
    lastError: null,
  };
  repo.save(episodeWithContext);

  const durable = getActiveDurablePersistence();
  if (durable) {
    try {
      await commitEpisodeCritical(episodeWithContext, durable);
    } catch (error) {
      const safe = safeContextBridgeError(error);
      emitContextBridgeDiagnostic({
        event: "context_persistence_failed",
        organizationId: input.organizationId,
        projectId: input.projectId,
        episodeId: episode.snapshot.episodeId,
        errorCode: safe.errorCode,
        errorClass: safe.errorClass,
        contextKind: kind,
      });
      return { ok: false, error: "context_persistence_failed" };
    }
  }

  emitContextBridgeDiagnostic({
    event: "context_persistence_completed",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: episode.snapshot.episodeId,
    episodeVersion: episode.durableVersion,
    contextKind: kind,
  });

  await resolveDurableOrganizationNameServer(input.supabase, input.organizationId);
  const campaignContext = buildCampaignContext({
    project: updatedProject,
    domainInput: input.domainInput,
    locale,
    organizationId: input.organizationId,
  });

  emitContextBridgeDiagnostic({
    event: "context_resume_requested",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: episode.snapshot.episodeId,
    contextKind: kind,
  });

  const adapter = createProductionBrainExecutionAdapter({
    peerId: input.peerId,
    project: updatedProject,
    domainInput: input.domainInput,
    workflowOptions: { requireRealContext: true },
  });
  const runner = createProjectEpisodeRunner(undefined, undefined, adapter);

  const resumeStartedMs = Date.now();
  emitContextBridgeDiagnostic({
    event: "context_resume_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: episode.snapshot.episodeId,
    contextKind: kind,
  });

  try {
    const runResult = await runner.resumeEpisode({
      organizationId: input.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      peerRole: input.peerRole,
      locale,
      useRealContext: true,
      supabase: input.supabase,
      campaignContext,
    });

    const finalEpisode =
      repo.get({
        organizationId: input.organizationId,
        projectId: input.projectId,
      }) ?? runResult.episode;
    const runtimeSync = buildRuntimeSyncFromEpisode(finalEpisode, runResult.stopReason);

    emitContextBridgeDiagnostic({
      event: "context_resume_completed",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episode.snapshot.episodeId,
      durationMs: Date.now() - resumeStartedMs,
      snapshotState: finalEpisode.snapshot.state,
      episodeStatus: finalEpisode.episodeStatus,
      stopReason: runResult.stopReason ?? undefined,
      contextKind: kind,
    });

    return {
      ok: true,
      project: updatedProject,
      episodeResumed: true,
      contextPersisted: true,
      resolutionKind: kind,
      runtimeSync,
    };
  } catch (error) {
    const safe = safeContextBridgeError(error);
    emitContextBridgeDiagnostic({
      event: "context_resume_failed",
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: episode.snapshot.episodeId,
      errorCode: safe.errorCode,
      errorClass: safe.errorClass,
      durationMs: Date.now() - resumeStartedMs,
      contextKind: kind,
    });

    return {
      ok: true,
      project: updatedProject,
      episodeResumed: false,
      contextPersisted: true,
      resolutionKind: kind,
      resumeError: safe.errorCode,
    };
  }
}

// PX-61 backward-compatible company-only entry point
export type SubmitLiveCampaignCompanyContextServerInput = Omit<
  SubmitCampaignContextResolutionServerInput,
  "resolution"
> & { context: LiveCampaignBrandContext };

export type SubmitLiveCampaignCompanyContextServerResult = SubmitCampaignContextResolutionServerResult;

export async function submitLiveCampaignCompanyContextServer(
  input: SubmitLiveCampaignCompanyContextServerInput
): Promise<SubmitLiveCampaignCompanyContextServerResult> {
  return submitCampaignContextResolutionServer({
    ...input,
    resolution: { kind: "company", decision: "supplied", brandContext: input.context },
  });
}

export type { CampaignContextResolutionKind };
