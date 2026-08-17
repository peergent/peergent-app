"use server";

import { OrgContextError, requireAuthenticatedOrgContext } from "@/lib/intelligence/api/require-org-context";
import { fetchOrganizationPeerByIdServer } from "@/lib/peers/server-queries";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { loadProjectEpisode } from "@/lib/brain/persistence/layer/supabase-sync";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { materializeCampaignApprovalPackage } from "@/lib/brain/approval/materialize-campaign-approval-package";
import type { CampaignApprovalPackage } from "@/lib/brain/approval/campaign-approval-package-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

export type LoadCampaignApprovalPackageResult =
  | { ok: true; package: CampaignApprovalPackage | null }
  | { ok: false; error: "unauthorized" | "forbidden" | "not_found" | "invalid_input" | "demo_not_supported" };

export async function loadCampaignApprovalPackageAction(input: {
  peerId: string;
  projectId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: "nl" | "en";
}): Promise<LoadCampaignApprovalPackageResult> {
  if (!input.peerId?.trim() || !input.projectId?.trim() || !input.project) {
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
      return { ok: true, package: null };
    }

    const resolved = episode.resolvedGraphs ?? {};
    const campaignContext = buildCampaignContext({
      project: input.project,
      domainInput: input.domainInput,
      locale: input.locale,
      organizationId: auth.organizationId,
    });

    const pkg = materializeCampaignApprovalPackage({
      organizationId: auth.organizationId,
      projectId: input.projectId,
      campaignName: input.project.title,
      campaignContext,
      creativeGraph: resolved.creativeGraph ?? null,
      validationGraph: resolved.validationGraph ?? null,
      planningGraph: resolved.planningBrainGraph ?? null,
      strategyGraph: resolved.strategyBrainGraph ?? null,
      approvalMode: input.project.campaignSetup?.approvalMode,
      locale: input.locale,
    });

    return { ok: true, package: pkg };
  } catch (error) {
    if (error instanceof OrgContextError) {
      return { ok: false, error: error.code };
    }
    throw error;
  }
}
