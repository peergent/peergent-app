import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { ProjectBrainId } from "../project-engine/types";
import { primaryCapabilityForBrain } from "./brain-capability-map";
import { buildCampaignContext, isSeedCampaign } from "@/lib/office/campaign/campaign-context";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import type { BrainCapabilityId } from "../capabilities/registry";
import {
  getOptionalCapabilityDependencies,
  resolveCapabilityExecutionOrder,
} from "../capabilities/capability-dependencies";
import { STRATEGY_DEPENDENCY_TIMEOUT_MS } from "@/lib/office/campaign/strategy-run-types";
import { runWithBoundedTimeout } from "@/lib/office/campaign/strategy-run-timeout";
import type { DemoPerformanceMetric } from "../capabilities/execution-context";
import type { BrainRunResult } from "../runtime/run-result";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import { readCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";
import { getBrainCapability } from "../capabilities/registry";
import { resolveOrganizationId } from "./resolve-company-intelligence";
import { createBrainRuntimeWithAssembly } from "./brain-runtime-factory";
import type { BrainRepositoryBundle } from "../persistence/repository-factory";
import { resolveCompanyIntelligence } from "./resolve-company-intelligence";
import {
  brainCapabilityProgressLabel,
  brainFinalizeProgressLabel,
  brainReadyProgressLabel,
} from "./brain-run-progress";
import type { BrainEnvironment } from "../domain/environment";
import type { ContextAssemblyResult } from "../context/assembly-types";
import {
  ContextAcquisitionConfigurationError,
} from "../context-acquisition/server/context-acquisition-config";
import type { StrategyReadinessRequestEnrichment } from "../strategy-readiness";
import { createResearchLayer } from "../layers/research";
import type { ResearchGraph } from "../layers/research";
import { createReasoningLayer } from "../layers/reasoning";
import type { ReasoningGraph } from "../layers/reasoning";
import { createMarketingIntelligenceLayer } from "../layers/marketing-intelligence";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence";

/**
 * Sprint 7.5 demo policy (explicit — option A):
 * Demo peers always resolve environment "demo" → demo provider bundle → deterministic capabilities.
 * OpenAI is NOT used on /office/demo even when BRAIN_USE_OPENAI=true, because the provider
 * selector forces the demo provider in demo environment.
 * Live peers resolve environment "live" → LLM provider when BRAIN_USE_OPENAI=true.
 */

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

export type ExecuteBrainForWorkflowStepOptions = {
  onProgress?: (label: string) => void;
  /** Server-only bundle — registers LLM provider when env flag is enabled. */
  repositories?: BrainRepositoryBundle;
  /** Per-dependency execution cap — prevents optional deps from hanging the run. */
  dependencyTimeoutMs?: number;
  /** PX-49.1 — pre-acquired real context assembly for live production execution. */
  contextAssembly?: ContextAssemblyResult;
  /** When true, live execution must not fall back to sync demo intelligence resolution. */
  requireRealContext?: boolean;
  /** PX-50.3 observability-only — never used for execution decisions. */
  runtimeDiagnosticContext?: {
    episodeId?: string;
  };
  /** PX-50.11 — episode-resolved graphs for merged strategy readiness. */
  strategyReadinessEnrichment?: StrategyReadinessRequestEnrichment | null;
};

function resolveBrainEnvironment(peerId: string): BrainEnvironment {
  return isDemoPeer(peerId) ? "demo" : "live";
}

function buildRuntimeForInput(
  input: ExecuteBrainForWorkflowStepInput,
  options?: ExecuteBrainForWorkflowStepOptions
) {
  const environment = resolveBrainEnvironment(input.peerId);
  const isLive = environment === "live";

  let assembleContext: (
    request: BrainRunRequestWithBudget
  ) => Promise<ContextAssemblyResult> | ContextAssemblyResult;

  if (options?.contextAssembly) {
    const acquired = options.contextAssembly;
    assembleContext = () => acquired;
  } else if (isLive && options?.requireRealContext) {
    throw new ContextAcquisitionConfigurationError(
      "Live Brain execution requires pre-acquired real context assembly."
    );
  } else {
    assembleContext = (request) =>
      resolveCompanyIntelligence({
        peerId: input.peerId,
        organizationId: request.organizationId,
        project: input.project,
        domainInput: input.domainInput,
      });
  }

  return createBrainRuntimeWithAssembly(assembleContext, {
    peerId: input.peerId,
    environment,
    repositories: options?.repositories,
  });
}

function buildBaseRequest(
  input: ExecuteBrainForWorkflowStepInput,
  capabilityId: BrainCapabilityId,
  options?: ExecuteBrainForWorkflowStepOptions
): BrainRunRequestWithBudget {
  const campaignCtx = resolveCampaignContext(input);
  const isDemo = isDemoPeer(input.peerId);
  const includeDemoMetrics =
    capabilityId === "optimization" && isDemo && isSeedCampaign(input.project.id);

  return {
    organizationId: resolveOrganizationId(input.peerId, input.domainInput.organizationId),
    peerId: input.peerId,
    capabilityId,
    actorId: "campaign-workflow",
    campaignId: input.project.id,
    locale: input.locale,
    environment: isDemo ? "demo" : "live",
    executionMode: input.executionMode ?? "semi_automatic",
    approvalPolicy: input.approvalPolicy ?? "approval_required",
    idempotencyKey: input.idempotencyKey,
    correlationId: `campaign-${input.project.id}-${input.stepId}-${capabilityId}`,
    campaignContext: campaignCtx,
    marketingUnderstanding: input.domainInput.understanding ?? null,
    performanceMetrics: includeDemoMetrics ? demoPerformanceMetrics(input.project.id) : undefined,
    strategyReadinessEnrichment: options?.strategyReadinessEnrichment ?? null,
    runtimeDiagnosticEpisodeId: options?.runtimeDiagnosticContext?.episodeId,
  };
}

export type ExecuteBrainForWorkflowStepResult = {
  result: BrainRunResult;
  resolvedUpstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
};

function seedUpstreamOutputs(
  input: ExecuteBrainForWorkflowStepInput
): Partial<Record<BrainCapabilityId, BrainStructuredOutput>> {
  return readCampaignBrainOutputs(input.project);
}

function hasFreshSeededOutput(
  capabilityId: BrainCapabilityId,
  output: BrainStructuredOutput | undefined
): output is BrainStructuredOutput {
  if (!output) return false;
  return output.capabilityVersion === getBrainCapability(capabilityId).version;
}

function resolveResearchGraphForRun(
  input: ExecuteBrainForWorkflowStepInput,
  request: BrainRunRequestWithBudget,
  upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>,
  contextAssembly?: ContextAssemblyResult
): ResearchGraph | null {
  if (request.researchGraph) return request.researchGraph;
  if (Object.keys(upstreamOutputs).length === 0) return null;

  const assembly =
    contextAssembly ??
    resolveCompanyIntelligence({
      peerId: input.peerId,
      organizationId: request.organizationId,
      project: input.project,
      domainInput: input.domainInput,
      campaignContext: request.campaignContext,
    });

  return createResearchLayer().collectAndStore({
    companySnapshot: assembly.companySnapshot,
    campaignContext: request.campaignContext,
    upstreamOutputs,
    campaignId: request.campaignId,
    correlationId: request.correlationId,
  }).graph;
}

function resolveReasoningGraphForRun(
  researchGraph: ResearchGraph | null,
  request: BrainRunRequestWithBudget
): ReasoningGraph | null {
  if (request.reasoningGraph) return request.reasoningGraph;
  if (!researchGraph) return null;
  return createReasoningLayer().reasonAndStore({
    researchGraph,
    correlationId: request.correlationId,
  }).graph;
}

function resolveMarketingIntelligenceGraphForRun(
  reasoningGraph: ReasoningGraph | null,
  researchGraph: ResearchGraph | null,
  request: BrainRunRequestWithBudget
): MarketingIntelligenceGraph | null {
  if (request.marketingIntelligenceGraph) return request.marketingIntelligenceGraph;
  if (!reasoningGraph) return null;
  return createMarketingIntelligenceLayer().thinkAndStore({
    reasoningGraph,
    researchGraph,
    campaignContext: request.campaignContext,
    locale: request.locale === "nl" ? "nl" : "en",
    correlationId: request.correlationId,
  }).graph;
}

function runWithDependenciesSync(
  input: ExecuteBrainForWorkflowStepInput,
  runtime: ReturnType<typeof buildRuntimeForInput>,
  request: BrainRunRequestWithBudget,
  seededOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>,
  options?: ExecuteBrainForWorkflowStepOptions
): ExecuteBrainForWorkflowStepResult {
  const order = resolveCapabilityExecutionOrder(request.capabilityId);
  const upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> = {
    ...seededOutputs,
  };

  for (const depId of order) {
    if (hasFreshSeededOutput(depId, upstreamOutputs[depId])) continue;
    const depResult = runtime.executeRunSync({
      ...request,
      capabilityId: depId,
      correlationId: `${request.correlationId}-dep-${depId}`,
      upstreamOutputs,
    });
    if (depResult.output) upstreamOutputs[depId] = depResult.output;
  }

  const researchGraph = resolveResearchGraphForRun(
    input,
    request,
    upstreamOutputs,
    options?.contextAssembly
  );
  const reasoningGraph = resolveReasoningGraphForRun(researchGraph, request);
  const marketingIntelligenceGraph = resolveMarketingIntelligenceGraphForRun(
    reasoningGraph,
    researchGraph,
    request
  );

  const storedFinal = upstreamOutputs[request.capabilityId];
  const result = hasFreshSeededOutput(request.capabilityId, storedFinal)
    ? runtime.executeRunSync({
        ...request,
        upstreamOutputs,
        researchGraph,
        reasoningGraph,
        marketingIntelligenceGraph,
        reuseStoredOutput: storedFinal,
        correlationId: `${request.correlationId}-final-stored`,
      })
    : runtime.executeRunSync({
        ...request,
        upstreamOutputs,
        researchGraph,
        reasoningGraph,
        marketingIntelligenceGraph,
        correlationId: `${request.correlationId}-final`,
      });

  if (result.output) upstreamOutputs[request.capabilityId] = result.output;

  return { result, resolvedUpstreamOutputs: upstreamOutputs };
}

async function runWithDependenciesAsync(
  input: ExecuteBrainForWorkflowStepInput,
  runtime: ReturnType<typeof buildRuntimeForInput>,
  request: BrainRunRequestWithBudget,
  seededOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>,
  options?: ExecuteBrainForWorkflowStepOptions
): Promise<ExecuteBrainForWorkflowStepResult> {
  const order = resolveCapabilityExecutionOrder(request.capabilityId);
  const optionalDeps = new Set(
    getOptionalCapabilityDependencies(request.capabilityId)
  );
  const upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> = {
    ...seededOutputs,
  };
  const dependencyTimeoutMs = options?.dependencyTimeoutMs ?? STRATEGY_DEPENDENCY_TIMEOUT_MS;

  for (const depId of order) {
    if (hasFreshSeededOutput(depId, upstreamOutputs[depId])) {
      continue;
    }
    options?.onProgress?.(brainCapabilityProgressLabel(depId, request.locale));
    const depPromise = runtime.executeRun({
      ...request,
      capabilityId: depId,
      correlationId: `${request.correlationId}-dep-${depId}`,
      upstreamOutputs,
    });

    let depResult: BrainRunResult;
    try {
      depResult = await runWithBoundedTimeout(
        depPromise,
        dependencyTimeoutMs,
        optionalDeps.has(depId) ? "optional_dependency_timeout" : "dependency_timeout"
      );
    } catch (error) {
      if (optionalDeps.has(depId)) {
        continue;
      }
      throw error;
    }

    if (depResult.output) upstreamOutputs[depId] = depResult.output;
  }

  const researchGraph = resolveResearchGraphForRun(
    input,
    request,
    upstreamOutputs,
    options?.contextAssembly
  );
  const reasoningGraph = resolveReasoningGraphForRun(researchGraph, request);
  const marketingIntelligenceGraph = resolveMarketingIntelligenceGraphForRun(
    reasoningGraph,
    researchGraph,
    request
  );

  const storedFinal = upstreamOutputs[request.capabilityId];
  if (hasFreshSeededOutput(request.capabilityId, storedFinal)) {
    options?.onProgress?.(brainReadyProgressLabel(request.locale));
    const finalResult = await runtime.executeRun({
      ...request,
      upstreamOutputs,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph,
      reuseStoredOutput: storedFinal,
      correlationId: `${request.correlationId}-final-stored`,
    });
    if (finalResult.output) upstreamOutputs[request.capabilityId] = finalResult.output;
    return { result: finalResult, resolvedUpstreamOutputs: upstreamOutputs };
  }

  options?.onProgress?.(brainCapabilityProgressLabel(request.capabilityId, request.locale));
  const finalResult = await runtime.executeRun({
    ...request,
    upstreamOutputs,
    researchGraph,
    reasoningGraph,
    marketingIntelligenceGraph,
    correlationId: `${request.correlationId}-final`,
  });
  options?.onProgress?.(brainFinalizeProgressLabel(request.locale));
  options?.onProgress?.(brainReadyProgressLabel(request.locale));

  if (finalResult.output) upstreamOutputs[request.capabilityId] = finalResult.output;

  return { result: finalResult, resolvedUpstreamOutputs: upstreamOutputs };
}

/** Executes a workflow step capability through BrainRuntime (async). */
export async function executeBrainForWorkflowStep(
  input: ExecuteBrainForWorkflowStepInput,
  options?: ExecuteBrainForWorkflowStepOptions
): Promise<ExecuteBrainForWorkflowStepResult | null> {
  const capabilityId = PRIMARY_CAPABILITY_FOR_STEP[input.stepId];
  if (!capabilityId) return null;
  const runtime = buildRuntimeForInput(input, options);
  const seededOutputs = seedUpstreamOutputs(input);
  return runWithDependenciesAsync(
    input,
    runtime,
    buildBaseRequest(input, capabilityId, options),
    seededOutputs,
    options
  );
}

/** Synchronous runtime execution for campaign evidence (demo provider). */
export function executeBrainForWorkflowStepSync(
  input: ExecuteBrainForWorkflowStepInput
): ExecuteBrainForWorkflowStepResult | null {
  const capabilityId = PRIMARY_CAPABILITY_FOR_STEP[input.stepId];
  if (!capabilityId) return null;
  const runtime = buildRuntimeForInput(input);
  const seededOutputs = seedUpstreamOutputs(input);
  return runWithDependenciesSync(
    input,
    runtime,
    buildBaseRequest(input, capabilityId),
    seededOutputs
  );
}

export function primaryCapabilityForWorkflowStep(
  stepId: CampaignWorkflowStepId
): BrainCapabilityId | null {
  return PRIMARY_CAPABILITY_FOR_STEP[stepId] ?? null;
}

/** Workflow step used only for correlation/progress — not lifecycle authority. */
const WORKFLOW_STEP_FOR_BRAIN: Partial<Record<ProjectBrainId, CampaignWorkflowStepId>> = {
  company: "business_analyzed",
  research: "competitors_analyzed",
  reasoning: "business_analyzed",
  marketing_intelligence: "competitors_analyzed",
  strategy: "strategy_determined",
  planning: "channels_selected",
  creative: "deliverables_created",
  validation: "waiting_for_approval",
  execution: "published",
  learning: "optimizing",
};

export type ExecuteBrainForProjectBrainInput = {
  brainId: ProjectBrainId;
  peerId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  executionMode?: BrainRunRequestWithBudget["executionMode"];
  approvalPolicy?: BrainRunRequestWithBudget["approvalPolicy"];
  idempotencyKey?: string;
};

/**
 * PX-50 — execute a Project Engine-scheduled brain via BrainRuntime capabilities.
 * Adapter only — lifecycle authority remains Project Engine / ProjectEpisodeRunner.
 */
export async function executeBrainForProjectBrain(
  input: ExecuteBrainForProjectBrainInput,
  options?: ExecuteBrainForWorkflowStepOptions
): Promise<ExecuteBrainForWorkflowStepResult | null> {
  const capabilityId = primaryCapabilityForBrain(input.brainId);
  if (!capabilityId) return null;

  const stepId = WORKFLOW_STEP_FOR_BRAIN[input.brainId] ?? "strategy_determined";
  const workflowInput: ExecuteBrainForWorkflowStepInput = {
    stepId,
    peerId: input.peerId,
    project: input.project,
    domainInput: input.domainInput,
    locale: input.locale,
    executionMode: input.executionMode,
    approvalPolicy: input.approvalPolicy,
    idempotencyKey: input.idempotencyKey,
  };

  const runtime = buildRuntimeForInput(workflowInput, options);
  const seededOutputs = seedUpstreamOutputs(workflowInput);
  return runWithDependenciesAsync(
    workflowInput,
    runtime,
    {
      ...buildBaseRequest(workflowInput, capabilityId, options),
      runtimeDiagnosticBrainId: input.brainId,
      runtimeDiagnosticEpisodeId: options?.runtimeDiagnosticContext?.episodeId,
    },
    seededOutputs,
    options
  );
}
