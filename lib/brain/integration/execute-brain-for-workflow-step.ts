import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import { buildCampaignContext, isSeedCampaign } from "@/lib/office/campaign/campaign-context";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import type { BrainCapabilityId } from "../capabilities/registry";
import { resolveCapabilityExecutionOrder } from "../capabilities/capability-dependencies";
import type { DemoPerformanceMetric } from "../capabilities/execution-context";
import type { BrainRunResult } from "../runtime/run-result";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import { resolveOrganizationId } from "./resolve-company-intelligence";
import { createBrainRuntimeWithAssembly } from "./brain-runtime-factory";
import { resolveCompanyIntelligence } from "./resolve-company-intelligence";

/** Primary capability executed for each workflow step evidence panel. */
const PRIMARY_CAPABILITY_FOR_STEP: Partial<Record<CampaignWorkflowStepId, BrainCapabilityId>> = {
  business_analyzed: "company_understanding",
  website_analyzed: "website_understanding",
  competitors_analyzed: "competitor_understanding",
  strategy_determined: "strategy",
  channels_selected: "channel_planning",
  deliverables_created: "creative_generation",
  waiting_for_approval: "strategy",
  scheduled: "creative_generation",
  published: "creative_generation",
  optimizing: "optimization",
};

export type ExecuteBrainForWorkflowStepInput = {
  stepId: CampaignWorkflowStepId;
  peerId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  executionMode?: BrainRunRequestWithBudget["executionMode"];
  approvalPolicy?: BrainRunRequestWithBudget["approvalPolicy"];
  idempotencyKey?: string;
};

function resolveCampaignContext(input: ExecuteBrainForWorkflowStepInput) {
  const overlay = readDemoCampaignOverlay(input.domainInput);
  return (
    overlay.demoCampaignContexts?.[input.project.id] ??
    buildCampaignContext({ project: input.project, domainInput: input.domainInput })
  );
}

function demoPerformanceMetrics(projectId: string): readonly DemoPerformanceMetric[] {
  return [
    {
      id: "demo-linkedin-impressions",
      channel: "linkedin",
      label: "Impressions",
      value: 4200,
      unit: "count",
      window: "7d",
      provenanceRef: `demo:${projectId}:linkedin:impressions`,
    },
    {
      id: "demo-email-opens",
      channel: "email",
      label: "Open rate",
      value: 28,
      unit: "%",
      window: "7d",
      provenanceRef: `demo:${projectId}:email:opens`,
    },
  ];
}

function buildRuntimeForInput(input: ExecuteBrainForWorkflowStepInput) {
  return createBrainRuntimeWithAssembly((request) =>
    resolveCompanyIntelligence({
      peerId: input.peerId,
      organizationId: request.organizationId,
      project: input.project,
      domainInput: input.domainInput,
    })
  );
}

function buildBaseRequest(
  input: ExecuteBrainForWorkflowStepInput,
  capabilityId: BrainCapabilityId
): BrainRunRequestWithBudget {
  const campaignCtx = resolveCampaignContext(input);
  const isDemo = isDemoPeer(input.peerId);
  const includeDemoMetrics =
    capabilityId === "optimization" && isDemo && isSeedCampaign(input.project.id);

  return {
    organizationId: resolveOrganizationId(input.peerId),
    peerId: input.peerId,
    capabilityId,
    actorId: "campaign-workflow",
    campaignId: input.project.id,
    locale: input.locale,
    environment: isDemo ? "demo" : undefined,
    executionMode: input.executionMode ?? "semi_automatic",
    approvalPolicy: input.approvalPolicy ?? "approval_required",
    idempotencyKey: input.idempotencyKey,
    correlationId: `campaign-${input.project.id}-${input.stepId}-${capabilityId}`,
    campaignContext: campaignCtx,
    marketingUnderstanding: input.domainInput.understanding ?? null,
    performanceMetrics: includeDemoMetrics ? demoPerformanceMetrics(input.project.id) : undefined,
  };
}

function runWithDependenciesSync(
  runtime: ReturnType<typeof buildRuntimeForInput>,
  request: BrainRunRequestWithBudget
): BrainRunResult {
  const order = resolveCapabilityExecutionOrder(request.capabilityId);
  const upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> = {};

  for (const depId of order) {
    const depResult = runtime.executeRunSync({
      ...request,
      capabilityId: depId,
      correlationId: `${request.correlationId}-dep-${depId}`,
      upstreamOutputs,
    });
    if (depResult.output) upstreamOutputs[depId] = depResult.output;
  }

  return runtime.executeRunSync({
    ...request,
    upstreamOutputs,
    correlationId: `${request.correlationId}-final`,
  });
}

async function runWithDependenciesAsync(
  runtime: ReturnType<typeof buildRuntimeForInput>,
  request: BrainRunRequestWithBudget
): Promise<BrainRunResult> {
  const order = resolveCapabilityExecutionOrder(request.capabilityId);
  const upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> = {};

  for (const depId of order) {
    const depResult = await runtime.executeRun({
      ...request,
      capabilityId: depId,
      correlationId: `${request.correlationId}-dep-${depId}`,
      upstreamOutputs,
    });
    if (depResult.output) upstreamOutputs[depId] = depResult.output;
  }

  return runtime.executeRun({
    ...request,
    upstreamOutputs,
    correlationId: `${request.correlationId}-final`,
  });
}

/** Executes a workflow step capability through BrainRuntime (async). */
export async function executeBrainForWorkflowStep(
  input: ExecuteBrainForWorkflowStepInput
): Promise<BrainRunResult | null> {
  const capabilityId = PRIMARY_CAPABILITY_FOR_STEP[input.stepId];
  if (!capabilityId) return null;
  const runtime = buildRuntimeForInput(input);
  return runWithDependenciesAsync(runtime, buildBaseRequest(input, capabilityId));
}

/** Synchronous runtime execution for campaign evidence (demo provider). */
export function executeBrainForWorkflowStepSync(
  input: ExecuteBrainForWorkflowStepInput
): BrainRunResult | null {
  const capabilityId = PRIMARY_CAPABILITY_FOR_STEP[input.stepId];
  if (!capabilityId) return null;
  const runtime = buildRuntimeForInput(input);
  return runWithDependenciesSync(runtime, buildBaseRequest(input, capabilityId));
}

export function primaryCapabilityForWorkflowStep(
  stepId: CampaignWorkflowStepId
): BrainCapabilityId | null {
  return PRIMARY_CAPABILITY_FOR_STEP[stepId] ?? null;
}
