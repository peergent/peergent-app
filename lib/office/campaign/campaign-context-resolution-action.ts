"use server";

import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { OrgContextError, requireAuthenticatedOrgContext } from "@/lib/intelligence/api/require-org-context";
import { fetchOrganizationPeerByIdServer } from "@/lib/peers/server-queries";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { submitCampaignContextResolutionServer } from "./campaign-context-resolution-bridge-server";
import type {
  CampaignContextResolutionInput,
  SubmitCampaignContextResolutionServerResult,
} from "./campaign-context-resolution-types";
import {
  emitContextBridgeDiagnostic,
  safeContextBridgeError,
} from "./context-bridge-diagnostics";

export type SubmitCampaignContextResolutionActionInput = {
  peerId: string;
  projectId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  resolution: CampaignContextResolutionInput;
  locale?: "nl" | "en";
};

export type SubmitCampaignContextResolutionActionResult =
  | SubmitCampaignContextResolutionServerResult
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "not_found"
        | "invalid_input"
        | "demo_not_supported"
        | "server_error";
    };

export async function submitCampaignContextResolutionAction(
  input: SubmitCampaignContextResolutionActionInput
): Promise<SubmitCampaignContextResolutionActionResult> {
  if (!input.peerId?.trim() || !input.projectId?.trim() || !input.project || !input.resolution) {
    return { ok: false, error: "invalid_input" };
  }
  if (input.project.id !== input.projectId) {
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

    if (input.domainInput.organizationId && input.domainInput.organizationId !== auth.organizationId) {
      return { ok: false, error: "forbidden" };
    }

    return await submitCampaignContextResolutionServer({
      peerId: input.peerId,
      projectId: input.projectId,
      project: input.project,
      domainInput: input.domainInput,
      resolution: input.resolution,
      organizationId: auth.organizationId,
      supabase: auth.supabase,
      peerRole: peer.role,
      locale: input.locale,
    });
  } catch (error) {
    if (error instanceof OrgContextError) {
      return { ok: false, error: error.code };
    }
    const safe = safeContextBridgeError(error);
    emitContextBridgeDiagnostic({
      event: "context_persistence_failed",
      organizationId: "unknown",
      projectId: input.projectId,
      errorCode: safe.errorCode,
      errorClass: safe.errorClass,
      contextKind: input.resolution.kind,
    });
    return { ok: false, error: "server_error" };
  }
}
