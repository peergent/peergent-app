import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainRunResult } from "../runtime/run-result";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";
import { resolveCompanyIntelligence, resolveOrganizationId } from "./resolve-company-intelligence";
import { createBrainRuntimeWithAssembly } from "./brain-runtime-factory";

function capabilityForStep(stepId: CampaignWorkflowStepId): BrainCapabilityId | null {
  switch (stepId) {
    case "business_analyzed":
      return "company_understanding";
    case "website_analyzed":
      return "website_understanding";
    default:
      return null;
  }
}

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

function buildRequest(input: ExecuteBrainForWorkflowStepInput): BrainRunRequestWithBudget {
  return {
    organizationId: resolveOrganizationId(input.peerId),
    peerId: input.peerId,
    capabilityId: capabilityForStep(input.stepId)!,
    actorId: "campaign-workflow",
    campaignId: input.project.id,
    locale: input.locale,
    environment: input.peerId === "demo" ? "demo" : undefined,
    executionMode: input.executionMode ?? "semi_automatic",
    approvalPolicy: input.approvalPolicy ?? "approval_required",
    idempotencyKey: input.idempotencyKey,
    correlationId: `campaign-${input.project.id}-${input.stepId}`,
  };
}

/** Executes a workflow step capability through BrainRuntime (async). */
export async function executeBrainForWorkflowStep(
  input: ExecuteBrainForWorkflowStepInput
): Promise<BrainRunResult | null> {
  const capabilityId = capabilityForStep(input.stepId);
  if (!capabilityId) return null;
  const runtime = buildRuntimeForInput(input);
  return runtime.executeRun(buildRequest(input));
}

/** Synchronous runtime execution for campaign evidence (demo provider). */
export function executeBrainForWorkflowStepSync(
  input: ExecuteBrainForWorkflowStepInput
): BrainRunResult | null {
  const capabilityId = capabilityForStep(input.stepId);
  if (!capabilityId) return null;
  const runtime = buildRuntimeForInput(input);
  return runtime.executeRunSync(buildRequest(input));
}
