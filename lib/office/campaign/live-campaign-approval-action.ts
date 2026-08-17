"use server";

import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { DemoStepApprovalStatus } from "@/lib/office/demo/demo-workflow-simulation";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { OrgContextError, requireAuthenticatedOrgContext } from "@/lib/intelligence/api/require-org-context";
import { fetchOrganizationPeerByIdServer } from "@/lib/peers/server-queries";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import {
  submitLiveCampaignStepApprovalServer,
  type SubmitLiveCampaignStepApprovalServerResult,
} from "./live-campaign-approval-bridge-server";
import {
  emitApprovalBridgeDiagnostic,
  safeApprovalBridgeError,
} from "./approval-bridge-diagnostics";

export type SubmitLiveCampaignStepApprovalActionInput = {
  peerId: string;
  projectId: string;
  stepId: CampaignWorkflowStepId;
  status: DemoStepApprovalStatus;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: "nl" | "en";
};

export type SubmitLiveCampaignStepApprovalActionResult =
  | SubmitLiveCampaignStepApprovalServerResult
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

export async function submitLiveCampaignStepApprovalAction(
  input: SubmitLiveCampaignStepApprovalActionInput
): Promise<SubmitLiveCampaignStepApprovalActionResult> {
  if (!input.peerId?.trim() || !input.projectId?.trim() || !input.project) {
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

    return await submitLiveCampaignStepApprovalServer({
      ...input,
      organizationId: auth.organizationId,
      supabase: auth.supabase,
      actor: auth.userId,
      peerRole: peer.role,
    });
  } catch (error) {
    if (error instanceof OrgContextError) {
      return { ok: false, error: error.code };
    }
    const safe = safeApprovalBridgeError(error);
    emitApprovalBridgeDiagnostic({
      event: "approval_persistence_failed",
      organizationId: "unknown",
      projectId: input.projectId,
      bridgeStepId: input.stepId,
      errorCode: safe.errorCode,
      errorClass: safe.errorClass,
    });
    return { ok: false, error: "server_error" };
  }
}
