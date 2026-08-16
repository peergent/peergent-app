import "server-only";

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { BrainRepositoryBundle } from "../persistence/repository-factory";
import type { ContextAssemblyResult } from "../context/assembly-types";
import { createBrainRepositoriesForServer } from "../persistence/repository-factory-server";
import { prepareBrainServerContext } from "../context-acquisition/server/prepare-brain-server-context";
import type { ProjectBrainId } from "../project-engine/types";

/** Shared production execution context for strategy + continuation episode runs. */
export type CampaignEpisodeServerExecutionContext = {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId: string;
  peerId: string;
  peerRole: string;
  campaignContext: CampaignContext;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale: "nl" | "en";
  repositories: BrainRepositoryBundle;
  contextAssembly: ContextAssemblyResult;
};

export async function buildCampaignEpisodeServerExecutionContext(input: {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId: string;
  peerId: string;
  peerRole: string;
  campaignContext: CampaignContext;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: "nl" | "en";
  contextPhase?: ProjectBrainId | "project_start";
  existingRepositories?: BrainRepositoryBundle;
  existingContextAssembly?: ContextAssemblyResult;
}): Promise<CampaignEpisodeServerExecutionContext> {
  const locale = input.locale ?? "en";
  const repositories =
    input.existingRepositories ??
    createBrainRepositoriesForServer({
      environment: "live",
      peerId: input.peerId,
      supabase: input.supabase,
    });

  const contextAssembly =
    input.existingContextAssembly ??
    (
      await prepareBrainServerContext({
        supabase: input.supabase,
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        peerRole: input.peerRole,
        campaignContext: input.campaignContext,
        locale,
        phase: input.contextPhase ?? "project_start",
      })
    ).assembly;

  return {
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    peerRole: input.peerRole,
    campaignContext: input.campaignContext,
    project: input.project,
    domainInput: input.domainInput,
    locale,
    repositories,
    contextAssembly,
  };
}
