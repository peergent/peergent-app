import "server-only";

import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { createBrainRepositoriesForServer } from "@/lib/brain/persistence/repository-factory-server";
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

  const repositories = createBrainRepositoriesForServer({
    environment: "live",
    peerId: input.peerId,
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
          { repositories }
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
        { repositories }
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
