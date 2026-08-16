"use server";

import { OrgContextError, requireAuthenticatedOrgContext } from "@/lib/intelligence/api/require-org-context";
import { fetchOrganizationPeerByIdServer } from "@/lib/peers/server-queries";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { loadProjectEpisode } from "@/lib/brain/persistence/layer/supabase-sync";
import {
  buildCampaignRuntimeProjectionFromEpisode,
  type CampaignRuntimeProjection,
} from "./campaign-runtime-projection";

export type LoadCampaignRuntimeProjectionResult =
  | { ok: true; projection: CampaignRuntimeProjection | null }
  | { ok: false; error: "unauthorized" | "forbidden" | "not_found" | "invalid_input" | "demo_not_supported" };

export async function loadCampaignRuntimeProjectionAction(input: {
  peerId: string;
  projectId: string;
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

    const episode = await loadProjectEpisode(auth.supabase, {
      organizationId: auth.organizationId,
      projectId: input.projectId,
    });

    if (!episode) {
      return { ok: true, projection: null };
    }

    return {
      ok: true,
      projection: buildCampaignRuntimeProjectionFromEpisode(episode),
    };
  } catch (error) {
    if (error instanceof OrgContextError) {
      return { ok: false, error: error.code };
    }
    throw error;
  }
}
