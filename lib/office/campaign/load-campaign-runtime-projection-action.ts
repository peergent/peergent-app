"use server";

import { OrgContextError, requireAuthenticatedOrgContext } from "@/lib/intelligence/api/require-org-context";
import { fetchOrganizationPeerByIdServer } from "@/lib/peers/server-queries";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { loadProjectEpisode } from "@/lib/brain/persistence/layer/supabase-sync";
import { getDefaultProjectEpisodeRepository } from "@/lib/brain/project-runtime/project-episode-repository";
import { emitOrchestrationDiagnostic } from "@/lib/brain/project-runtime/orchestration-diagnostics";
import {
  buildCampaignRuntimeProjectionFromEpisode,
  type CampaignRuntimeProjection,
} from "./campaign-runtime-projection";

export type LoadCampaignRuntimeProjectionResult =
  | { ok: true; projection: CampaignRuntimeProjection | null; versionMismatch?: boolean }
  | { ok: false; error: "unauthorized" | "forbidden" | "not_found" | "invalid_input" | "demo_not_supported" };

export async function loadCampaignRuntimeProjectionAction(input: {
  peerId: string;
  projectId: string;
  expectedVersion?: number;
}): Promise<LoadCampaignRuntimeProjectionResult> {
  if (!input.peerId?.trim() || !input.projectId?.trim()) {
    return { ok: false, error: "invalid_input" };
  }
  if (isDemoPeer(input.peerId)) {
    return { ok: false, error: "demo_not_supported" };
  }

  try {
    const auth = await requireAuthenticatedOrgContext();
    const peer = await fetchOrganizationPeerByIdServer(
      auth.supabase,
      input.peerId,
      auth.organizationId
    );
    if (!peer) {
      return { ok: false, error: "not_found" };
    }

    emitOrchestrationDiagnostic({
      event: "runtime_projection_refresh_requested",
      organizationId: auth.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      durableVersion: input.expectedVersion,
    });

    const l1Episode = getDefaultProjectEpisodeRepository().get({
      organizationId: auth.organizationId,
      projectId: input.projectId,
    });

    const episode =
      l1Episode ??
      (await loadProjectEpisode(auth.supabase, {
        organizationId: auth.organizationId,
        projectId: input.projectId,
      }));

    if (!episode) {
      emitOrchestrationDiagnostic({
        event: "runtime_projection_refresh_completed",
        organizationId: auth.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        reason: "episode_not_found",
      });
      return { ok: true, projection: null };
    }

    const projection = buildCampaignRuntimeProjectionFromEpisode(episode);
    const versionMismatch =
      input.expectedVersion !== undefined &&
      projection.durableVersion < input.expectedVersion;

    if (versionMismatch) {
      emitOrchestrationDiagnostic({
        event: "runtime_projection_version_mismatch",
        organizationId: auth.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        durableVersion: projection.durableVersion,
        reason: `expected>=${input.expectedVersion}`,
      });
    }

    emitOrchestrationDiagnostic({
      event: "runtime_projection_refresh_completed",
      organizationId: auth.organizationId,
      projectId: input.projectId,
      peerId: input.peerId,
      durableVersion: projection.durableVersion,
      snapshotState: projection.lifecycleState,
      episodeStatus: projection.episodeStatus,
    });

    return {
      ok: true,
      projection,
      versionMismatch: versionMismatch || undefined,
    };
  } catch (error) {
    if (error instanceof OrgContextError) {
      return { ok: false, error: error.code };
    }
    throw error;
  }
}
