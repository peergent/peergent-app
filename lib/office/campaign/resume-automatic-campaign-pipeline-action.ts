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
import { detectAutomaticCampaignPipelineStall } from "@/lib/brain/project-runtime/automatic-campaign-pipeline-invariants";
import { getDefaultProjectEpisodeRepository } from "@/lib/brain/project-runtime/project-episode-repository";
import { usesProjectEngineLifecycleAuthority } from "./live-strategy-run-service";

export type ResumeAutomaticCampaignPipelineActionResult = {
  ok: boolean;
  resumed: boolean;
  episodeStatus?: string;
  currentState?: string;
  stallReason?: string;
  error?: string;
};

/** One-shot server recovery for stalled automatic campaign cognitive pipeline. */
export async function resumeAutomaticCampaignPipelineAction(input: {
  peerId: string;
  projectId: string;
  project: MarketingProject;
  locale?: string | null;
}): Promise<ResumeAutomaticCampaignPipelineActionResult> {
  if (isDemoPeer(input.peerId) || !usesProjectEngineLifecycleAuthority(input.project)) {
    return { ok: true, resumed: false };
  }

  try {
    const auth = await requireAuthenticatedOrgContext();
    const peer = await fetchOrganizationPeerByIdServer(
      auth.supabase,
      input.peerId,
      auth.organizationId
    );
    if (!peer) return { ok: false, resumed: false, error: "peer_not_found" };

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
      return { ok: true, resumed: false };
    }

    const stall = detectAutomaticCampaignPipelineStall({
      project: input.project,
      episode: result.episode,
    });

    return {
      ok: result.status !== "failed",
      resumed: true,
      episodeStatus: result.status,
      currentState: result.episode.snapshot.state,
      stallReason: stall?.reason,
    };
  } catch (error) {
    if (error instanceof OrgContextError) {
      return { ok: false, resumed: false, error: error.code };
    }
    return { ok: false, resumed: false, error: "execution_error" };
  }
}
