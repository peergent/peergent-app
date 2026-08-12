import "server-only";

import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { createBrainRepositoriesForServer } from "@/lib/brain/persistence/repository-factory-server";
import { prepareBrainServerPersistence } from "@/lib/brain/persistence/server/prepare-brain-server-persistence";
import { prepareBrainServerContext } from "@/lib/brain/context-acquisition/server/prepare-brain-server-context";
import { assertLiveBrainServerContext } from "@/lib/brain/context-acquisition/server/context-acquisition-config";
import { buildCampaignContext } from "./campaign-context";
import { logBrainServerEnvResolved } from "@/lib/brain/config/brain-server-env";
import { markOfficeLlmTrace } from "@/lib/brain/integration/office-llm-trace";
import {
  buildCampaignStepEvidenceAsync,
  type EvidenceBundle,
} from "@/lib/office/campaign/build-campaign-workflow-evidence";
import { runWithBoundedTimeout } from "@/lib/office/campaign/strategy-run-timeout";
import { CREATIVE_GENERATION_SERVER_ACTION_TIMEOUT_MS } from "@/lib/brain/llm/creative-generation-llm-config";

export type BuildLiveCampaignEvidenceServerInput = {
  peerId: string;
  projectId: string;
  stepId: CampaignWorkflowStepId;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  organizationId: string;
  supabase?: AppSupabaseClient;
  peerRole?: string;
  locale?: string | null;
};

export async function buildLiveCampaignEvidenceServer(
  input: BuildLiveCampaignEvidenceServerInput
): Promise<EvidenceBundle | null> {
  const env = logBrainServerEnvResolved("buildLiveCampaignEvidenceServer");
  markOfficeLlmTrace("SERVER_ENV_RESOLVED", {
    featureFlagEnabled: env.featureFlagEnabled,
    apiKeyPresent: env.apiKeyPresent,
    model: env.resolvedModel,
  });

  assertLiveBrainServerContext({ peerId: input.peerId, supabase: input.supabase ?? null });

  if (input.supabase) {
    await prepareBrainServerPersistence({
      supabase: input.supabase,
      organizationId: input.organizationId,
      projectId: input.projectId,
    });
  }

  const campaignContext = buildCampaignContext({
    project: input.project,
    domainInput: input.domainInput,
    locale: input.locale,
  });

  const contextPrep = input.supabase
    ? await prepareBrainServerContext({
        supabase: input.supabase,
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId: input.peerId,
        peerRole: input.peerRole ?? "Marketing",
        campaignContext,
        locale: input.locale === "nl" ? "nl" : "en",
      })
    : null;

  const repositories = createBrainRepositoriesForServer({
    environment: "live",
    peerId: input.peerId,
    supabase: input.supabase ?? null,
  });
  markOfficeLlmTrace("PROVIDERS_CREATED", {
    providerIds: repositories.providers.map((provider) => provider.id).join(","),
    llmRegistered: repositories.providers.some((provider) => provider.id === "llm"),
  });

  const bundle = await (input.stepId === "deliverables_created"
    ? runWithBoundedTimeout(
        buildCampaignStepEvidenceAsync(
          {
            stepId: input.stepId,
            peerId: input.peerId,
            project: input.project,
            domainInput: input.domainInput,
            locale: input.locale,
          },
          { repositories, contextAssembly: contextPrep?.assembly, requireRealContext: Boolean(input.supabase) }
        ),
        CREATIVE_GENERATION_SERVER_ACTION_TIMEOUT_MS,
        "deliverables_server_action_timeout"
      )
    : buildCampaignStepEvidenceAsync(
        {
          stepId: input.stepId,
          peerId: input.peerId,
          project: input.project,
          domainInput: input.domainInput,
          locale: input.locale,
        },
        { repositories, contextAssembly: contextPrep?.assembly, requireRealContext: Boolean(input.supabase) }
      ));

  if (!bundle?.devDiagnostics) return bundle;

  return {
    ...bundle,
    devDiagnostics: {
      ...bundle.devDiagnostics,
      llmRegistered: repositories.providers.some((provider) => provider.id === "llm"),
      featureFlagEnabled: env.featureFlagEnabled,
      apiKeyPresent: env.apiKeyPresent,
    },
  };
}
