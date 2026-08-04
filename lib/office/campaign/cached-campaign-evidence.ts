import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { isLiveBrainDeferredStep } from "@/lib/office/campaign/build-campaign-workflow-evidence";
import type { EvidenceBundle } from "@/lib/office/campaign/build-campaign-workflow-evidence-types";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  isStoredOutputCompatible,
  readCampaignBrainOutputs,
  type PersistedCampaignBrainCapabilityId,
} from "@/lib/office/campaign/campaign-brain-outputs";
import { primaryCapabilityForWorkflowStep } from "@/lib/brain/integration/execute-brain-for-workflow-step";
import { presentBrainOutputForCampaign } from "@/lib/brain/presentation/campaign-evidence-adapter";
import { dedupeEvidenceItems } from "@/lib/brain/presentation/dedupe-evidence-items";
import type { BrainDevDiagnostics } from "@/lib/brain/integration/brain-dev-diagnostics";
import { isBrainDevDiagnosticsEnabled } from "@/lib/brain/integration/brain-dev-diagnostics";

const STEP_TITLES: Partial<
  Record<CampaignWorkflowStepId, { nl: string; en: string; findingsNl: string; findingsEn: string }>
> = {
  strategy_determined: {
    nl: "Strategie",
    en: "Strategy",
    findingsNl: "Strategie",
    findingsEn: "Strategy",
  },
  channels_selected: {
    nl: "Kanalen",
    en: "Channels",
    findingsNl: "Kanaalplan",
    findingsEn: "Channel plan",
  },
  deliverables_created: {
    nl: "Deliverables",
    en: "Deliverables",
    findingsNl: "Geplande deliverables",
    findingsEn: "Planned deliverables",
  },
};

function isNl(locale?: string | null): boolean {
  return locale === "nl";
}

function cachedDevDiagnostics(): BrainDevDiagnostics {
  return {
    provider: "llm",
    model: "—",
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: 0,
    fallbackUsed: false,
    validationRetries: null,
    cacheHit: true,
    outputSource: "stored",
    requestStarted: false,
  };
}

/**
 * Build evidence instantly from session-persisted Brain outputs — no server/LLM round trip.
 * Canonical key: projectId + campaignContextVersion + capabilityId + capabilityVersion.
 */
export function tryBuildCachedCampaignEvidence(input: {
  stepId: CampaignWorkflowStepId;
  peerId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
}): EvidenceBundle | null {
  if (!isLiveBrainDeferredStep(input.peerId, input.stepId)) return null;

  const capabilityId = primaryCapabilityForWorkflowStep(input.stepId);
  if (!capabilityId) return null;

  const persistedId = capabilityId as PersistedCampaignBrainCapabilityId;
  if (persistedId !== "strategy" && persistedId !== "channel_planning" && persistedId !== "creative_generation") {
    return null;
  }

  const capabilityOutputs = readCampaignBrainOutputs(input.project);
  const output = capabilityOutputs[capabilityId];
  if (!output || !isStoredOutputCompatible(persistedId, output)) return null;

  const nl = isNl(input.locale);
  const titles = STEP_TITLES[input.stepId];
  const campaignContext = buildCampaignContext({
    project: input.project,
    domainInput: input.domainInput,
    locale: input.locale,
  });

  const presentation = presentBrainOutputForCampaign({
    title: nl ? (titles?.nl ?? "Analyse") : (titles?.en ?? "Analysis"),
    intro: nl
      ? input.stepId === "deliverables_created"
        ? "Dit zijn de deliverables die ik voor deze campagne voorstel."
        : undefined
      : input.stepId === "deliverables_created"
        ? "These are the deliverables I propose for this campaign."
        : undefined,
    output,
    locale: nl ? "nl" : "en",
    findingsSectionTitle: nl ? titles?.findingsNl : titles?.findingsEn,
    recommendationsSectionTitle: nl ? "Aanbevelingen" : "Recommendations",
    campaignContext: {
      usesExternalBrand: campaignContext.usesExternalBrand,
      accountOrganizationName: campaignContext.accountOrganizationName,
    },
  });

  const sections = presentation.sections.map((section) => ({
    ...section,
    items: dedupeEvidenceItems(section.items),
  }));

  return {
    title: presentation.title,
    intro: presentation.intro,
    sections,
    capabilityOutputs,
    devDiagnostics: isBrainDevDiagnosticsEnabled() ? cachedDevDiagnostics() : undefined,
  };
}
