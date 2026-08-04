import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  createMarketingCampaignProject,
  type CreateMarketingCampaignProjectInput,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

/** Required string fields for createMarketingCampaignProject — update when contract changes. */
export const OPENAI_VERIFY_REQUIRED_CREATE_CAMPAIGN_FIELDS = [
  "peerId",
  "ownerLabel",
  "name",
  "goalLabel",
  "description",
  "primaryGoalId",
] as const satisfies readonly (keyof CreateMarketingCampaignProjectInput)[];

export function assertOpenAiVerifyCreateCampaignInput(
  input: CreateMarketingCampaignProjectInput
): void {
  for (const field of OPENAI_VERIFY_REQUIRED_CREATE_CAMPAIGN_FIELDS) {
    const value = input[field];
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(
        `[verify-openai-fixture] createMarketingCampaignProject input missing or empty required field "${field}". Update lib/brain/__tests__/verify-openai-fixture.ts when CreateMarketingCampaignProjectInput changes.`
      );
    }
  }
}

export function buildOpenAiVerifyCreateCampaignInput(): CreateMarketingCampaignProjectInput {
  const input = {
    peerId: "emma",
    ownerLabel: "QA Operator",
    name: "OpenAI verification campaign",
    goalLabel: "Generate qualified demo requests",
    description:
      "Manual OpenAI verification — synthetic QA campaign for provider path validation only.",
    primaryGoalId: "generate_leads",
    targetAudience: "Dutch SME decision-makers",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
  } satisfies CreateMarketingCampaignProjectInput;

  assertOpenAiVerifyCreateCampaignInput(input);
  return input;
}

function buildVerifyDomainInput(project: MarketingProject): MarketingPeerDomainInput {
  return {
    peerId: "emma",
    userName: "QA Operator",
    peerName: "Emma",
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
    projects: [project],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

export function buildOpenAiVerificationFixture(): {
  createInput: CreateMarketingCampaignProjectInput;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
} {
  const createInput = buildOpenAiVerifyCreateCampaignInput();
  const baseProject = createMarketingCampaignProject(createInput);
  const project: MarketingProject = {
    ...baseProject,
    campaignSetup: {
      ...baseProject.campaignSetup!,
      campaignBrandContext: {
        brandName: "OpenAI QA Brand",
        industry: "B2B software",
        productsAndServices: ["AI workforce platform"],
        uniqueSellingPoints: ["AI colleagues working alongside existing teams"],
        targetAudience: "Dutch SME decision-makers",
      },
      websiteUrl: "https://example-openai-qa-verify.test",
      websiteSkipped: false,
      competitorsSkipped: true,
    },
  };

  return {
    createInput,
    project,
    domainInput: buildVerifyDomainInput(project),
  };
}

export type OpenAiVerifySafeMetadata = {
  provider: string | undefined;
  model: string | undefined;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  latencyMs: number;
  validation: "output_present" | "missing";
  fallback: boolean;
};

export function printOpenAiVerifySafeMetadata(meta: OpenAiVerifySafeMetadata): void {
  console.info("[brain:verify-openai]", JSON.stringify(meta, null, 2));
}
