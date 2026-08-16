import type { BrainCapabilityId } from "../capabilities/registry";
import { getBrainCapability } from "../capabilities/registry";
import type { BrainActionProposal } from "../evidence/structured-output";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";
import {
  evaluateCampaignBrainPolicy,
  resolveCampaignBrainPolicy,
  shouldPauseRunForPolicy,
  type BrainPolicyResult,
} from "./approval-policy";
import { emitBrainPolicyDecisionDiagnostic } from "./policy-diagnostics";

export function resolvePolicyForBrainRun(input: {
  request: BrainRunRequestWithBudget;
  actionProposals?: readonly BrainActionProposal[];
}): BrainPolicyResult {
  const capabilityDef = getBrainCapability(input.request.capabilityId);
  const campaignApprovalMode =
    input.request.campaignApprovalMode ??
    input.request.campaignContext?.approvalMode ??
    "approval_before_publication";

  const resolved = resolveCampaignBrainPolicy({
    campaignApprovalMode,
    capabilityId: input.request.capabilityId,
  });

  const evaluated = evaluateCampaignBrainPolicy({
    campaignApprovalMode,
    capabilityId: input.request.capabilityId,
    actionProposals: input.actionProposals,
  });

  emitBrainPolicyDecisionDiagnostic({
    organizationId: input.request.organizationId,
    campaignId: input.request.campaignId,
    capabilityId: input.request.capabilityId,
    actionClass: resolved.actionClass,
    campaignApprovalMode,
    executionMode: resolved.executionMode,
    capabilityApprovalRequirement: capabilityDef.approvalRequirement,
    policyDecision: evaluated.decision,
    policyReasonCode: evaluated.reasonCode,
    willPause: evaluated.willPause,
    canAutoResume: evaluated.canAutoResume,
  });

  return {
    decision: evaluated.decision,
    reason: evaluated.reason,
    reasonCode: evaluated.reasonCode,
  };
}

export function resolveFinalRunStatus(input: {
  request: BrainRunRequestWithBudget;
  policy: BrainPolicyResult;
  output: { actionProposals: readonly BrainActionProposal[] } | null;
  readinessPartial: boolean;
}): "partial" | "completed" | "waiting_for_approval" | "blocked" {
  if (input.policy.decision === "block") return "blocked";
  if (!input.output) return input.readinessPartial ? "partial" : "completed";

  const campaignApprovalMode =
    input.request.campaignApprovalMode ??
    input.request.campaignContext?.approvalMode ??
    "approval_before_publication";

  if (
    shouldPauseRunForPolicy({
      policyDecision: input.policy.decision,
      actionProposals: input.output.actionProposals,
      capabilityId: input.request.capabilityId,
      campaignApprovalMode,
    })
  ) {
    return "waiting_for_approval";
  }

  return input.readinessPartial ? "partial" : "completed";
}
