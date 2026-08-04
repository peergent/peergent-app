import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assembleCompanyContextSync,
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  clearDemoWebsiteSnapshots,
  createLlmBrainProvider,
  getBrainCapability,
  mapStrategyPayloadToBrainOutput,
  projectBrainContext,
  resetPromptContextCache,
} from "@/lib/brain";
import { mapChannelPlanningPayloadToBrainOutput } from "@/lib/brain/llm/channel-response-validator";
import {
  mapCreativeGenerationPayloadToBrainOutput,
  validateCreativeGenerationLlmPayload,
} from "@/lib/brain/llm/creative-generation-response-validator";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
import type { BrainLlmProvider } from "@/lib/brain/llm/provider";
import type { BrainLlmRequest } from "@/lib/brain/llm/types";
import { BrainLlmValidationError } from "@/lib/brain/llm/errors";
import { buildCreativeGenerationProjectedContext } from "@/lib/brain/prompts/projected-context";
import { presentBrainOutputForCampaign } from "@/lib/brain/presentation/campaign-evidence-adapter";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const peergentInput = {
  peerId: "demo" as const,
  ownerLabel: "Emma",
  name: "Peergent",
  goalLabel: "Demo requests",
  description: "More demo requests from SMB owners.",
  primaryGoalId: "generate_leads" as const,
  targetAudience: "SMB owners",
  setupMode: "automatic" as const,
  approvalMode: "approval_before_publication" as const,
};

function validStrategyPayload() {
  return {
    findings: [
      { id: "strategy-1", label: "Campaign objective", value: "Grow demo requests.", confidence: "medium" },
      { id: "strategy-2", label: "Core message", value: "AI colleagues for growing teams.", confidence: "medium" },
    ],
    decisions: [{ id: "dec-1", label: "Direction", rationale: "Focus on clarity.", confidence: "medium" }],
    recommendations: [{ id: "rec-1", label: "Next: channels", priority: "high" }],
    actionProposals: [{ id: "act-1", actionType: "approve_strategy", label: "Confirm", requiresApproval: true }],
    warnings: [],
  };
}

function validChannelPayload() {
  return {
    findings: [
      { id: "channel-linkedin", label: "Channel: linkedin", value: "Selected — strategy fit", confidence: "medium" },
      { id: "channel-email", label: "Channel: email", value: "Selected — nurture", confidence: "medium" },
    ],
    decisions: [{ id: "dec-1", label: "Mix", rationale: "LinkedIn + email.", confidence: "medium" }],
    recommendations: [{ id: "rec-1", label: "Priority linkedin", priority: "high" }],
    actionProposals: [{ id: "act-1", actionType: "approve_channels", label: "Confirm", requiresApproval: true }],
    warnings: [],
  };
}

function validCreativeGenerationPayload() {
  return {
    deliverables: [
      {
        id: "del-1",
        deliverableType: "linkedin_carousel",
        channel: "linkedin",
        purpose: "Build awareness among SMB owners",
        targetAudience: "SMB owners",
        objective: "Drive demo requests",
        messageAngle: "Clarity and proof over hype",
        keyPoints: ["AI workspace", "Human-like colleagues"],
        callToActionDirection: "Invite to book a demo",
        format: "Carousel — 5 slides",
        reviewStatus: "planned",
        rationale: "LinkedIn fits B2B audience from channel plan",
        dependencies: ["strategy core message"],
        assumptions: ["Audience active on LinkedIn"],
        provenance: "Approved strategy and channel plan",
      },
      {
        id: "del-2",
        deliverableType: "acquisition_email",
        channel: "email",
        purpose: "Nurture warm leads toward demo booking",
        targetAudience: "SMB owners",
        objective: "Convert interest to demo",
        messageAngle: "Practical outcomes first",
        keyPoints: ["Time savings", "Team clarity"],
        callToActionDirection: "Book a demo",
        format: "3-email sequence outline",
        reviewStatus: "planned",
        rationale: "Email supports nurture for selected channel",
        dependencies: ["LinkedIn awareness"],
        assumptions: ["List available later"],
        provenance: "Approved channel plan",
      },
    ],
    decisions: [{ id: "dec-1", label: "Lead with LinkedIn", rationale: "Primary B2B channel", confidence: "medium" }],
    recommendations: [{ id: "rec-1", label: "Start with carousel", priority: "high" }],
    actionProposals: [{ id: "act-1", actionType: "generate_content", label: "Generate planning", requiresApproval: true }],
    warnings: [],
  };
}

function strategyReadyCampaignContext(orgId: string) {
  const project = createMarketingCampaignProject(peergentInput);
  const base = buildCampaignContextFromCreateInput(project, peergentInput, "en");
  return {
    ...base,
    websiteUrl: "https://peergent.com",
    websiteSource: "supplied_by_customer" as const,
    websiteState: "available" as const,
    competitorsSkipped: true,
    competitorContextState: "skipped" as const,
    brandContext: {
      brandName: "Peergent",
      industry: "AI software",
      productsAndServices: ["AI marketing colleagues for SMB teams"],
      uniqueSellingPoints: ["Premium AI workspace with human-like colleagues"],
      targetAudience: "SMB owners",
    },
  };
}

function strategyAssembly(orgId: string) {
  const profile = buildPeergentCompanyProfile("en");
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: orgId,
    url: "https://peergent.com",
  });
  return assembleCompanyContextSync({
    organizationId: orgId,
    companyProfile: { ...profile, organizationId: orgId },
    websiteSnapshot: website,
    campaignContext: strategyReadyCampaignContext(orgId),
    marketingUnderstanding: null,
    corrections: [],
  });
}

function mockLlmProvider(
  handler: (request: BrainLlmRequest) => Promise<{ rawText: string; usage: ReturnType<typeof buildLlmUsage> }>
): BrainLlmProvider {
  return { id: "openai", complete: handler };
}

function upstreamOutputs(orgId: string) {
  const strategyOutput = mapStrategyPayloadToBrainOutput(validStrategyPayload(), {
    capabilityVersion: getBrainCapability("strategy").version,
    generatedAt: "2026-08-01T00:00:00.000Z",
    provenanceRef: `test:strategy:${orgId}`,
  });
  const channelOutput = mapChannelPlanningPayloadToBrainOutput(validChannelPayload(), {
    capabilityVersion: getBrainCapability("channel_planning").version,
    generatedAt: "2026-08-01T00:00:00.000Z",
    provenanceRef: `test:channels:${orgId}`,
  });
  return { strategy: strategyOutput, channel_planning: channelOutput };
}

describe("creative_generation LLM", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
    resetPromptContextCache();
    vi.unstubAllEnvs();
  });

  it("routes creative_generation through LLM when enabled", async () => {
    const assembly = strategyAssembly("org-creative-llm");
    const def = getBrainCapability("creative_generation");
    const projected = projectBrainContext({
      fullSnapshot: assembly.brainSnapshot,
      companySnapshot: assembly.companySnapshot,
      requiredSlices: def.requiredContext,
      optionalSlices: def.optionalContext,
    });
    const execCtx = buildCapabilityExecutionContext({
      assembly,
      request: {
        organizationId: assembly.companySnapshot.organizationId,
        peerId: "demo",
        capabilityId: "creative_generation",
        actorId: "test",
        campaignContext: strategyReadyCampaignContext("org-creative-llm"),
        locale: "en",
      },
      upstreamOutputs: upstreamOutputs("org-creative-llm"),
    });

    const llmCalls: string[] = [];
    const okProvider = mockLlmProvider(async (req) => {
      llmCalls.push(req.capabilityId);
      return {
        rawText: JSON.stringify(validCreativeGenerationPayload()),
        usage: buildLlmUsage({
          provider: "openai",
          model: "gpt-test",
          inputTokens: 240,
          outputTokens: 130,
          latencyMs: 18,
        }),
      };
    });

    const llm = createLlmBrainProvider({ useOpenAI: true, llmProvider: okProvider });
    const output = await llm.execute({
      context: {
        organizationId: assembly.companySnapshot.organizationId,
        peerId: "demo",
        capabilityId: "creative_generation",
        actorId: "test",
        environment: "live",
      },
      snapshot: projected.snapshot,
      capabilityId: "creative_generation",
      companySnapshot: assembly.companySnapshot,
      executionContext: execCtx,
      projection: projected.projection,
    });

    expect(llmCalls).toEqual(["creative_generation"]);
    expect(output.capabilityId).toBe("creative_generation");
    expect(output.findings.length).toBe(2);
    const usage = llm.consumeLastUsage();
    expect(usage?.providerId).toBe("llm");
    expect(usage?.fallbackReason).toBeUndefined();
    expect(usage?.inputTokens).toBe(240);
  });

  it("projected context contains approved strategy and channels", () => {
    const assembly = strategyAssembly("org-projection");
    const def = getBrainCapability("creative_generation");
    const projected = projectBrainContext({
      fullSnapshot: assembly.brainSnapshot,
      companySnapshot: assembly.companySnapshot,
      requiredSlices: def.requiredContext,
      optionalSlices: def.optionalContext,
    });
    const execCtx = buildCapabilityExecutionContext({
      assembly,
      request: {
        organizationId: assembly.companySnapshot.organizationId,
        peerId: "demo",
        capabilityId: "creative_generation",
        actorId: "test",
        campaignContext: strategyReadyCampaignContext("org-projection"),
        locale: "en",
      },
      upstreamOutputs: upstreamOutputs("org-projection"),
    });

    const ctx = buildCreativeGenerationProjectedContext({
      snapshot: projected.snapshot,
      companySnapshot: assembly.companySnapshot,
      executionContext: execCtx,
      projection: projected.projection,
    });

    expect(ctx.strategySummary).toMatch(/Campaign objective/);
    expect(ctx.approvedChannels).toMatch(/linkedin/i);
    expect(ctx.approvedChannels).toMatch(/email/i);
  });

  it("blocks when strategy upstream is missing", async () => {
    const assembly = strategyAssembly("org-no-strategy");
    const def = getBrainCapability("creative_generation");
    const projected = projectBrainContext({
      fullSnapshot: assembly.brainSnapshot,
      companySnapshot: assembly.companySnapshot,
      requiredSlices: def.requiredContext,
      optionalSlices: def.optionalContext,
    });
    const execCtx = buildCapabilityExecutionContext({
      assembly,
      request: {
        organizationId: assembly.companySnapshot.organizationId,
        peerId: "demo",
        capabilityId: "creative_generation",
        actorId: "test",
        campaignContext: strategyReadyCampaignContext("org-no-strategy"),
        locale: "en",
      },
      upstreamOutputs: { channel_planning: upstreamOutputs("org-no-strategy").channel_planning },
    });

    const llmCalls: string[] = [];
    const llm = createLlmBrainProvider({
      useOpenAI: true,
      llmProvider: mockLlmProvider(async (req) => {
        llmCalls.push(req.capabilityId);
        return {
          rawText: JSON.stringify(validCreativeGenerationPayload()),
          usage: buildLlmUsage({ provider: "openai", model: "gpt-test", inputTokens: 1, outputTokens: 1, latencyMs: 1 }),
        };
      }),
    });

    await llm.execute({
      context: {
        organizationId: assembly.companySnapshot.organizationId,
        peerId: "demo",
        capabilityId: "creative_generation",
        actorId: "test",
        environment: "live",
      },
      snapshot: projected.snapshot,
      capabilityId: "creative_generation",
      companySnapshot: assembly.companySnapshot,
      executionContext: execCtx,
      projection: projected.projection,
    });

    expect(llmCalls).toHaveLength(0);
    expect(llm.consumeLastUsage()?.fallbackReason).toBe("missing_strategy_output");
  });

  it("rejects publish-ready copy and unsupported numbers", () => {
    expect(() =>
      validateCreativeGenerationLlmPayload(
        {
          ...validCreativeGenerationPayload(),
          deliverables: [
            {
              ...validCreativeGenerationPayload().deliverables[0]!,
              messageAngle: "Subject: Buy now — 42% off today!",
            },
          ],
        },
        { approvedChannels: ["linkedin", "email"] }
      )
    ).toThrow(BrainLlmValidationError);

    expect(() =>
      validateCreativeGenerationLlmPayload(validCreativeGenerationPayload(), {
        approvedChannels: ["google_ads"],
      })
    ).toThrow(BrainLlmValidationError);
  });

  it("rejects duplicate deliverable purposes", () => {
    const payload = validCreativeGenerationPayload();
    payload.deliverables[1] = {
      ...payload.deliverables[1]!,
      purpose: payload.deliverables[0]!.purpose,
    };
    expect(() =>
      validateCreativeGenerationLlmPayload(payload, { approvedChannels: ["linkedin", "email"] })
    ).toThrow(BrainLlmValidationError);
  });

  it("maps valid output to structured deliverables", () => {
    const output = mapCreativeGenerationPayloadToBrainOutput(validCreativeGenerationPayload(), {
      capabilityVersion: "1.0.0",
      generatedAt: "2026-08-01T00:00:00.000Z",
      provenanceRef: "test",
    });
    expect(output.findings[0]?.value.startsWith("{")).toBe(true);
    expect(output.findings[0]?.label).toMatch(/LinkedIn carousel/i);
  });

  it("presents deliverables without internal pipe-delimited text", () => {
    const output = mapCreativeGenerationPayloadToBrainOutput(validCreativeGenerationPayload(), {
      capabilityVersion: "1.0.0",
      generatedAt: "2026-08-01T00:00:00.000Z",
      provenanceRef: "test",
    });
    const presented = presentBrainOutputForCampaign({
      output,
      title: "Deliverables",
      locale: "en",
    });
    const text = presented.sections.flatMap((s) => s.items).join("\n");
    expect(text).not.toMatch(/id: del-/);
    expect(text).not.toMatch(/\| type:/);
    expect(text).toMatch(/LinkedIn carousel plan/);
    expect(text).toMatch(/Why Emma recommends it/);
  });

  it("deliverables approval still advances to scheduling after LLM path", () => {
    const project: MarketingProject = {
      id: "deliverables-schedule",
      peerId: "emma",
      title: "Launch",
      goal: "Leads",
      campaignType: "product_launch",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      ownerLabel: "Pilot",
      rawRequest: "Grow leads",
      origin: "campaign_wizard",
      campaignSetup: {
        description: "Grow leads",
        primaryGoalId: "generate_leads",
        targetAudience: "SMB owners",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
        websiteUrl: "https://example.com",
        strategyGeneratedAt: "2026-08-02T00:00:00.000Z",
        campaignBrandContext: {
          brandName: "Example Co",
          industry: "B2B",
          productsAndServices: ["Platform"],
          uniqueSellingPoints: ["Clarity"],
          targetAudience: "SMB owners",
        },
        stepApprovals: {
          strategy_determined: "approved",
          channels_selected: "approved",
          deliverables_created: "approved",
        },
      },
    };
    const workflow = buildCampaignWorkflowViewModel({
      peerId: "emma",
      project,
      domainInput: { projects: [project], drafts: [], workUnits: [], understanding: null },
      locale: "en",
      isDemo: false,
    });
    expect(workflow.nextStepCta.action).toBe("schedule");
    expect(workflow.steps.find((s) => s.id === "scheduled")?.state).toBe("active");
  });
});
