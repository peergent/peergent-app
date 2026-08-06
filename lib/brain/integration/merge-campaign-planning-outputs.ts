import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  readCampaignBrainOutputs,
  type PersistedCampaignBrainCapabilityId,
} from "@/lib/office/campaign/campaign-brain-outputs";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { ensureCampaignPlanning } from "./ensure-campaign-planning";
import { resolveOrganizationId } from "./resolve-company-intelligence";

function minimalDomainInput(project: MarketingProject) {
  return {
    peerId: project.peerId,
    organizationId: undefined,
    userName: "",
    peerName: "",
    campaignTitle: project.title,
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits: [],
    projects: [],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

/** Auto-build or reuse campaign_planning when strategy exists — idempotent, no LLM. */
export function mergeCampaignOutputsWithPlanning(input: {
  project: MarketingProject;
  peerId: string;
  outputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  organizationId?: string;
  locale?: "nl" | "en";
}): Partial<Record<PersistedCampaignBrainCapabilityId, BrainStructuredOutput>> {
  const strategy =
    input.outputs.strategy ?? readCampaignBrainOutputs(input.project).strategy;
  if (!strategy) {
    return input.outputs as Partial<Record<PersistedCampaignBrainCapabilityId, BrainStructuredOutput>>;
  }

  const locale = input.locale === "nl" ? "nl" : "en";
  const campaignContext = buildCampaignContext({
    project: input.project,
    domainInput: minimalDomainInput(input.project),
    locale: input.locale,
  });

  const planningResult = ensureCampaignPlanning({
    project: input.project,
    campaignContext,
    strategyOutput: strategy,
    organizationId: resolveOrganizationId(input.peerId, input.organizationId),
    locale,
  });

  if (planningResult.status === "completed" && planningResult.output) {
    return {
      ...(input.outputs as Partial<Record<PersistedCampaignBrainCapabilityId, BrainStructuredOutput>>),
      campaign_planning: planningResult.output,
    };
  }

  return input.outputs as Partial<Record<PersistedCampaignBrainCapabilityId, BrainStructuredOutput>>;
}
