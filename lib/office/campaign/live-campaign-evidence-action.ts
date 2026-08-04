"use server";

import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { OrgContextError, requireAuthenticatedOrgContext } from "@/lib/intelligence/api/require-org-context";
import { fetchOrganizationPeerByIdServer } from "@/lib/peers/server-queries";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { markOfficeLlmTrace } from "@/lib/brain/integration/office-llm-trace";
import type { EvidenceBundle } from "@/lib/office/campaign/build-campaign-workflow-evidence";
import { buildLiveCampaignEvidenceServer } from "@/lib/office/campaign/live-campaign-evidence-server";

export type BuildLiveCampaignEvidenceActionInput = {
  peerId: string;
  projectId: string;
  stepId: CampaignWorkflowStepId;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
};

export type BuildLiveCampaignEvidenceActionResult =
  | { ok: true; bundle: EvidenceBundle | null }
  | { ok: false; error: "unauthorized" | "forbidden" | "not_found" | "invalid_input" | "demo_not_supported" };

function validateInput(input: BuildLiveCampaignEvidenceActionInput): string | null {
  if (!input.peerId?.trim()) return "peerId is required.";
  if (!input.projectId?.trim()) return "projectId is required.";
  if (!input.project) return "project is required.";
  if (input.project.id !== input.projectId) return "projectId mismatch.";
  return null;
}

/** Server boundary for live Brain evidence — registers LLM provider when enabled. */
export async function buildLiveCampaignEvidenceAction(
  input: BuildLiveCampaignEvidenceActionInput
): Promise<BuildLiveCampaignEvidenceActionResult> {
  markOfficeLlmTrace("OFFICE_ACTION_ENTER", { scope: "evidence", stepId: input.stepId });

  const validationError = validateInput(input);
  if (validationError) {
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

    const bundle = await buildLiveCampaignEvidenceServer(input);

    markOfficeLlmTrace("ACTION_RETURNED", {
      scope: "evidence",
      hasBundle: Boolean(bundle),
      provider: bundle?.devDiagnostics?.finalProvider ?? bundle?.devDiagnostics?.provider ?? null,
    });

    return { ok: true, bundle: bundle ? JSON.parse(JSON.stringify(bundle)) : null };
  } catch (error) {
    if (error instanceof OrgContextError) {
      return { ok: false, error: error.code };
    }
    throw error;
  }
}
