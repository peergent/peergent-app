import "server-only";

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { usesProjectEngineLifecycleAuthority } from "@/lib/office/campaign/live-strategy-run-service";
import { continueCampaignEpisode } from "./campaign-episode-continuation";
import {
  detectAutomaticCampaignPipelineStall,
  shouldResumeAutomaticCampaignPipeline,
} from "./automatic-campaign-pipeline-invariants";
import { getDefaultProjectEpisodeRepository } from "./project-episode-repository";
import { loadDurableProjectEpisode, hydrateEpisodeToL1 } from "./episode-durable-resume";
import { getActiveDurablePersistence } from "../persistence/layer/active-durable-persistence";
import { emitOrchestrationDiagnostic } from "./orchestration-diagnostics";
import type { CampaignEpisodeServerExecutionContext } from "./campaign-episode-server-context";
import type { CampaignEpisodeResult } from "./campaign-episode-controller";
import type { ProjectEpisodeRecord } from "./types";

export type ResumeAutomaticCampaignPipelineInput = {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId: string;
  peerId: string;
  peerRole: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  serverContext: CampaignEpisodeServerExecutionContext;
  trigger: "pipeline_recovery" | "post_strategy";
};

async function loadEpisodeForPipelineCheck(input: {
  organizationId: string;
  projectId: string;
}): Promise<ProjectEpisodeRecord | null> {
  const cached = getDefaultProjectEpisodeRepository().get(input);
  if (cached) return cached;

  const durable = getActiveDurablePersistence();
  if (!durable) return null;

  const loaded = await loadDurableProjectEpisode(durable, input);
  return loaded ? hydrateEpisodeToL1(loaded) : null;
}

/** Resume a stalled automatic campaign cognitive pipeline (planning → publication boundary). */
export async function resumeAutomaticCampaignPipeline(
  input: ResumeAutomaticCampaignPipelineInput
): Promise<CampaignEpisodeResult | null> {
  if (!usesProjectEngineLifecycleAuthority(input.project)) return null;
  if (!input.supabase) return null;

  const episode = await loadEpisodeForPipelineCheck({
    organizationId: input.organizationId,
    projectId: input.projectId,
  });

  if (!shouldResumeAutomaticCampaignPipeline({ project: input.project, episode })) {
    return null;
  }

  const stall = detectAutomaticCampaignPipelineStall({ project: input.project, episode })!;

  emitOrchestrationDiagnostic({
    event: "campaign_pipeline_recovery_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    episodeId: episode?.snapshot.episodeId,
    snapshotState: stall.currentState,
    episodeStatus: stall.episodeStatus,
    reason: stall.reason,
    correlationId: input.trigger,
  });

  const result = await continueCampaignEpisode({
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    peerRole: input.peerRole,
    campaignContext: input.serverContext.campaignContext,
    project: input.project,
    domainInput: input.domainInput,
    locale: input.serverContext.locale,
    trigger: "pipeline_recovery",
    serverContext: input.serverContext,
  });

  emitOrchestrationDiagnostic({
    event: "campaign_pipeline_recovery_completed",
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    episodeId: result.episode.snapshot.episodeId,
    episodeStatus: result.status,
    snapshotState: result.episode.snapshot.state,
    correlationId: input.trigger,
  });

  return result;
}

export { shouldResumeAutomaticCampaignPipeline, detectAutomaticCampaignPipelineStall };
