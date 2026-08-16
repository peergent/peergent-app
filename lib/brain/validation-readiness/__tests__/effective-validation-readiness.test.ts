import { describe, expect, it } from "vitest";
import { evaluateEffectiveValidationContextReadiness } from "../evaluate-validation-readiness";
import { evaluateReadinessGate } from "@/lib/brain/runtime/readiness-gate";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";

function episode(completed: string[]): ProjectEpisodeRecord {
  return {
    snapshot: {
      completedBrains: completed,
      pendingBrains: [],
      state: "validating",
      episodeId: "ep-1",
      organizationId: "org-1",
      projectId: "proj-1",
      peerId: "emma",
      retryCount: {},
    },
    artifacts: {
      organizationId: "org-1",
      projectId: "proj-1",
      episodeId: "ep-1",
      correlationId: "corr-1",
      memoryOutputRefs: [],
      performanceObservationIds: [],
      approvalIds: [],
      learningProposalIds: [],
      creativeOutputRef: "creative:org-1:proj-1:capability",
    },
    episodeStatus: "running",
    contextReady: true,
    sliceAvailability: {},
    approvalSatisfied: false,
    validationApprovalPending: false,
    memoryCheckpoint1Complete: false,
    memoryCheckpoint2Complete: false,
    performanceObservationsAvailable: false,
    approvalGrantedForExecution: false,
    contextGaps: [],
    executedBrainKeys: [],
    lastError: null,
    correlationId: "corr-1",
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    resolvedGraphs: {},
  } as ProjectEpisodeRecord;
}

describe("PX-52 effective validation readiness", () => {
  it("passes when creative brain completed and campaign brand context exists (production stall pattern)", () => {
    const project = createMarketingCampaignProject({
      peerId: "emma",
      ownerLabel: "Emma",
      name: "PX-52",
      goalLabel: "Leads",
      description: "Automatic campaign validation readiness.",
      primaryGoalId: "generate_leads",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      selectedChannels: ["linkedin"],
    });
    const campaignContext = buildCampaignContext({
      project,
      domainInput: { organizationId: "org-1" } as never,
    });

    const evaluation = evaluateEffectiveValidationContextReadiness({
      campaignContext,
      episode: episode([
        "company",
        "research",
        "reasoning",
        "marketing_intelligence",
        "strategy",
        "planning",
        "creative",
      ]),
      resolvedGraphs: {},
      upstreamCapabilityOutputs: {
        creative_generation: {
          capabilityId: "creative_generation",
          capabilityVersion: "1.0.0",
          generatedAt: new Date().toISOString(),
          findings: [{ id: "d1", label: "Deliverable", value: "planned", confidence: "medium", provenance: [] }],
          decisions: [],
          warnings: [],
          errors: [],
          actionProposals: [],
          decisionRecords: [],
          memoryCandidates: [],
        },
      },
    });

    expect(evaluation.ready).toBe(true);
    expect(evaluation.score).toBeGreaterThanOrEqual(50);
    expect(evaluation.criteria.find((c) => c.criterion === "creative_pipeline_output")?.satisfied).toBe(true);
  });

  it("blocks when creative pipeline evidence is genuinely absent", () => {
    const project = createMarketingCampaignProject({
      peerId: "emma",
      ownerLabel: "Emma",
      name: "PX-52 negative",
      goalLabel: "Leads",
      description: "Missing creative.",
      primaryGoalId: "generate_leads",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      selectedChannels: ["linkedin"],
    });
    const campaignContext = buildCampaignContext({ project, domainInput: { organizationId: "org-1" } as never });

    const evaluation = evaluateEffectiveValidationContextReadiness({
      campaignContext,
      episode: episode(["strategy", "planning"]),
      resolvedGraphs: {},
    });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.machineReasonCodes).toContain("missing_creative_pipeline_output");
  });

  it("readiness gate uses pipeline readiness instead of company profile average (score 30 pattern)", () => {
    const project = createMarketingCampaignProject({
      peerId: "emma",
      ownerLabel: "Emma",
      name: "PX-52 gate",
      goalLabel: "Leads",
      description: "Campaign with partial org profile.",
      primaryGoalId: "generate_leads",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      selectedChannels: ["linkedin"],
    });
    const campaignContext = buildCampaignContext({ project, domainInput: { organizationId: "org-1" } as never });

    const gate = evaluateReadinessGate({
      capabilityId: "validation",
      overallScore: 30,
      dimensionScores: {
        company_profile: 60,
        website: 0,
        brand: 50,
        business: 0,
        corrections: 0,
      },
      missingCriticalFields: [],
      assemblyState: "partial",
      campaignContext,
      validationReadinessEnrichment: {
        episode: episode(["strategy", "planning", "creative"]),
        resolvedGraphs: {},
        upstreamCapabilityOutputs: {},
      },
    });

    expect(gate.ok).toBe(true);
  });
});
