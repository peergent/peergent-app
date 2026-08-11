import { beforeEach, describe, expect, it } from "vitest";
import {
  buildExecutionHistory,
  classifyRollback,
  createFromBrainInputs,
  executionBrainContract,
  resetDefaultExecutionRepository,
  resetDefaultExecutionProviderRegistry,
  resetExecutionEventCounter,
  validateExecutionInput,
  lookupIdempotentExecution,
  getDefaultExecutionRepository,
  ExecutionLayer,
  createExecutionProviderRegistry,
} from "@/lib/brain/layers/execution";
import { linkedInStubAdapter } from "@/lib/brain/layers/execution/adapters/stub-adapters";
import {
  buildValidationGraph,
  resetDefaultValidationRepository,
} from "@/lib/brain/layers/validation";
import { buildCreativeGraph, resetDefaultCreativeRepository } from "@/lib/brain/layers/creative";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  executeCompanyUnderstanding,
  executeWebsiteUnderstanding,
  executeCompetitorUnderstanding,
  buildResearchGraph,
  buildReasoningGraph,
  buildMarketingIntelligenceGraph,
  buildStrategyGraph,
  buildDecisionsFromStrategyGraph,
  buildPlanningGraph,
  collectBrandGraph,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { resolveStrategySources } from "@/lib/brain/strategy/strategy-sources";

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
  selectedChannels: ["LinkedIn"] as const,
};

function pipelineExecutionInput() {
  clearDemoWebsiteSnapshots();
  seedPeergentDemoWebsiteSnapshotSync();
  const assembledAt = "2026-08-01T00:00:00.000Z";
  const profile = buildPeergentCompanyProfile("en", assembledAt);
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    url: "https://peergent.com",
  });
  const project = createMarketingCampaignProject(peergentInput);
  const campaignContext = buildCampaignContextFromCreateInput(project, peergentInput, "en");
  const assembly = assembleCompanyContextSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyProfile: profile,
    websiteSnapshot: website,
    campaignContext,
    locale: "en",
  });

  const companyOut = executeCompanyUnderstanding({ companySnapshot: assembly.companySnapshot, locale: "en" });
  const websiteOut = executeWebsiteUnderstanding({
    companySnapshot: assembly.companySnapshot,
    websiteSnapshot: website,
    locale: "en",
  });
  const competitorOut = executeCompetitorUnderstanding({
    companySnapshot: assembly.companySnapshot,
    locale: "en",
  });
  const upstreamOutputs = {
    company_understanding: companyOut,
    website_understanding: websiteOut,
    competitor_understanding: competitorOut,
  };

  const execCtx = buildCapabilityExecutionContext({
    assembly,
    request: {
      organizationId: PEERGENT_DEMO_ORG_ID,
      peerId: "demo",
      capabilityId: "strategy",
      actorId: "test",
      campaignContext,
      upstreamOutputs,
    },
    campaignContext,
    upstreamOutputs,
    locale: "en",
  });

  const researchGraph = buildResearchGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    upstreamOutputs: execCtx.upstreamOutputs,
  });
  const reasoningGraph = buildReasoningGraph({ researchGraph, campaignContext });
  const miGraph = buildMarketingIntelligenceGraph({
    reasoningGraph,
    researchGraph,
    campaignContext,
    locale: "en",
  });
  const sources = resolveStrategySources({
    ...execCtx,
    researchGraph,
    reasoningGraph,
    marketingIntelligenceGraph: miGraph,
  });
  const strategyGraph = buildStrategyGraph({
    sources,
    companySnapshot: execCtx.companySnapshot,
    campaignContext,
    locale: "en",
  });
  const decisions = buildDecisionsFromStrategyGraph({
    graph: strategyGraph,
    campaignContext,
    locale: "en",
  });
  const brandGraph = collectBrandGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    websiteSnapshot: website,
    upstreamOutputs: execCtx.upstreamOutputs,
  });
  const planningGraph = buildPlanningGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    campaignId: project.id,
    campaignContext,
    strategyGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
    locale: "en",
  });

  const creativeInput = {
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en" as const,
    campaignContext,
    strategyGraph,
    planningGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
  };

  const creativeGraph = buildCreativeGraph(creativeInput);
  const validationGraph = buildValidationGraph({ ...creativeInput, creativeGraph });

  return {
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    peerId: "demo",
    locale: "en" as const,
    campaignContext,
    creativeGraph,
    validationGraph,
    approvalGranted: true,
    idempotencyKey: "exec-test-key-1",
    correlationId: "corr-test-1",
  };
}

describe("Execution Brain", () => {
  beforeEach(() => {
    resetDefaultExecutionRepository();
    resetDefaultExecutionProviderRegistry();
    resetDefaultValidationRepository();
    resetDefaultCreativeRepository();
    resetExecutionEventCounter();
  });

  it("executes successfully with provider evidence", async () => {
    const input = pipelineExecutionInput();
    const output = await createFromBrainInputs(input);

    expect(output.outputRef).toMatch(/^execution:/);
    expect(output.structuredOutput.executionHistory).toBeDefined();
    expect(output.history.overallStatus).toBe("SUCCEEDED");
    expect(output.history.entries.length).toBeGreaterThan(0);

    for (const entry of output.history.entries) {
      if (entry.status === "SUCCEEDED") {
        expect(entry.receipts[0]?.externalId).toBeTruthy();
        expect(entry.receipts[0]?.providerTimestamp).toBeTruthy();
        expect(entry.receipts[0]?.provider).toBeTruthy();
      }
    }
  });

  it("blocks execution when validation is not READY", async () => {
    const input = pipelineExecutionInput();
    const blockedValidation = {
      ...input.validationGraph,
      report: {
        ...input.validationGraph.report,
        publicationReadiness: "BLOCKED" as const,
      },
    };

    const gate = validateExecutionInput({ ...input, validationGraph: blockedValidation });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.errorCode).toBe("validation_not_ready");

    await expect(
      buildExecutionHistory({ ...input, validationGraph: blockedValidation })
    ).rejects.toThrow(/validation_not_ready/);
  });

  it("blocks execution when approval is missing", async () => {
    const input = pipelineExecutionInput();
    const gate = validateExecutionInput({ ...input, approvalGranted: false });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.errorCode).toBe("approval_missing");
  });

  it("returns prior receipt on idempotent duplicate", async () => {
    const input = pipelineExecutionInput();
    const layer = new ExecutionLayer();

    const first = await layer.produceAndStore(input);
    const second = await layer.produceAndStore(input);

    expect(second.outputRef).toBe(first.outputRef);
    expect(second.history.createdAt).toBe(first.history.createdAt);

    const lookup = lookupIdempotentExecution(getDefaultExecutionRepository(), {
      organizationId: input.organizationId,
      idempotencyKey: input.idempotencyKey,
    });
    expect(lookup.duplicate).toBe(true);
    expect(lookup.priorReceipt).toBeTruthy();
  });

  it("classifies retryable provider failure", async () => {
    const input = pipelineExecutionInput();
    const deliverable = input.creativeGraph.deliverables[0]!;
    const withGoogle = {
      ...input,
      creativeGraph: {
        ...input.creativeGraph,
        deliverables: [{ ...deliverable, id: deliverable.id, channel: "Google Ads" }],
      },
      providerOverrides: { [deliverable.id]: "google_ads" as const },
    };

    const history = await buildExecutionHistory(withGoogle);
    expect(history.entries[0]?.status).toBe("RETRYABLE");
    expect(history.entries[0]?.failures[0]?.failureClass).toBe("RETRYABLE");
  });

  it("classifies permanent provider failure", async () => {
    const input = pipelineExecutionInput();
    const deliverable = input.creativeGraph.deliverables[0]!;
    const withCrm = {
      ...input,
      providerOverrides: { [deliverable.id]: "crm" as const },
    };

    const history = await buildExecutionHistory(withCrm);
    expect(history.entries[0]?.status).toBe("FAILED");
    expect(history.entries[0]?.failures[0]?.retryable).toBe(false);
  });

  it("supports partial success across providers", async () => {
    const input = pipelineExecutionInput();
    const d1 = input.creativeGraph.deliverables[0]!;
    const d2 = {
      ...d1,
      id: "del-email-partial",
      channel: "Email" as const,
    };

    const validationWithTwo = {
      ...input.validationGraph,
      report: {
        ...input.validationGraph.report,
        approvedDeliverables: [
          ...input.validationGraph.report.approvedDeliverables,
          {
            id: "val-dec-email",
            deliverableId: d2.id,
            deliverableType: d2.type,
            channel: d2.channel,
            approved: true,
            reason: "Approved for test.",
          },
        ],
      },
    };

    const partialInput = {
      ...input,
      creativeGraph: {
        ...input.creativeGraph,
        deliverables: [d1, d2],
      },
      validationGraph: validationWithTwo,
      providerOverrides: {
        [d1.id]: "linkedin" as const,
        [d2.id]: "crm" as const,
      },
    };

    const history = await buildExecutionHistory(partialInput);
    expect(history.overallStatus).toBe("PARTIALLY_SUCCEEDED");
    expect(history.entries.some((e) => e.status === "SUCCEEDED")).toBe(true);
    expect(history.entries.some((e) => e.status === "FAILED")).toBe(true);
  });

  it("requires provider evidence for success", async () => {
    const input = pipelineExecutionInput();
    const output = await createFromBrainInputs(input);
    for (const entry of output.history.entries) {
      if (entry.status === "SUCCEEDED") {
        expect(entry.receipts.length).toBeGreaterThan(0);
        expect(entry.receipts[0]?.externalId).toBeTruthy();
      }
    }
  });

  it("supports dry run without external side effects", async () => {
    const input = { ...pipelineExecutionInput(), dryRun: true };
    const output = await createFromBrainInputs(input);

    expect(output.history.dryRun).toBe(true);
    expect(output.history.overallStatus).toBe("SUCCEEDED");
    for (const entry of output.history.entries) {
      expect(entry.receipts[0]?.dryRun).toBe(true);
      expect(entry.receipts[0]?.externalUrl).toBeNull();
    }
  });

  it("classifies rollback support per adapter", async () => {
    const input = pipelineExecutionInput();
    const history = await buildExecutionHistory(input);
    const rollbacks = await classifyRollback({ history });
    expect(rollbacks.length).toBeGreaterThan(0);
    expect(rollbacks.every((r) => typeof r.supportsRollback === "boolean")).toBe(true);
  });

  it("generates immutable audit records", async () => {
    const input = pipelineExecutionInput();
    const output = await createFromBrainInputs(input);

    expect(output.history.auditRecords.length).toBe(output.history.entries.length);
    for (const audit of output.history.auditRecords) {
      expect(audit.id).toBeTruthy();
      expect(audit.validationRef).toMatch(/^validation:/);
      expect(audit.payloadRef).toMatch(/^payload:/);
      expect(audit.initiatedBy).toBeTruthy();
    }
  });

  it("never persists secrets in execution records", async () => {
    const input = pipelineExecutionInput();
    const output = await createFromBrainInputs(input);
    const serialized = JSON.stringify(output.history).toLowerCase();
    expect(serialized).not.toContain("oauth");
    expect(serialized).not.toContain("api_key");
    expect(serialized).not.toContain("password");
  });

  it("implements ProjectBrainContract", async () => {
    const input = pipelineExecutionInput();
    const context: BrainContextPackage = {
      organizationId: input.organizationId,
      peerId: "demo",
      projectId: input.projectId,
      episodeId: "ep-test",
      locale: "en",
      contextVersion: 1,
      slices: {
        business: true,
        brand: true,
        website: true,
        products: false,
        competitors: true,
        goals: true,
        campaign: true,
      },
      priorOutputs: [],
      priorDecisionIds: [],
      memoryRefs: [],
      assembledAt: new Date().toISOString(),
    };

    const result = await executionBrainContract.execute({
      brainId: "execution",
      context,
      payload: input,
      idempotencyKey: input.idempotencyKey,
      retryAttempt: 0,
    });

    expect(result.brainId).toBe("execution");
    expect(result.status).toBe("completed");
    expect(result.output?.capabilityIds).toContain("execution");
    expect(result.events.length).toBeGreaterThan(0);
  });

  it("registers in default project brain registry", () => {
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.execution?.id).toBe("execution");
    expect(registry.execution?.requiredContextSlices).toContain("campaign");
  });

  it("uses custom provider registry without core changes", async () => {
    const registry = createExecutionProviderRegistry([
      {
        adapter: linkedInStubAdapter,
        defaultHealth: "healthy",
        configRef: "config:linkedin:test",
      },
    ]);
    const layer = new ExecutionLayer(undefined, registry);
    const output = await layer.produceAndStore(pipelineExecutionInput());
    expect(output.history.entries[0]?.instruction.target.provider).toBe("linkedin");
  });
});
