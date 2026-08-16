/** Execution modes aligned with Campaign workspace — policy contract only. */
export type BrainExecutionMode = "manual" | "semi_automatic" | "fully_automatic";

export type BrainPolicyDecision =
  | "allow"
  | "require_approval"
  | "block";

export type BrainApprovalContext = {
  executionMode: BrainExecutionMode;
  /** Responsibility approval policy from Working Agreement / Marketing autonomy. */
  approvalPolicy: "prepare_only" | "approval_required" | "fully_automatic";
  capabilityApprovalRequirement: import("../capabilities/registry").BrainApprovalRequirement;
};

export type BrainPolicyResult = {
  decision: BrainPolicyDecision;
  reason: string;
  reasonCode?: import("./campaign-approval-policy").BrainPolicyReasonCode;
};

/**
 * Legacy policy gate — retained for responsibility/working-agreement paths.
 * Campaign capabilities should use evaluateCampaignBrainPolicy() instead.
 */
export function evaluateBrainPolicy(input: BrainApprovalContext): BrainPolicyResult {
  const { executionMode, approvalPolicy, capabilityApprovalRequirement } = input;

  if (capabilityApprovalRequirement === "none") {
    return { decision: "allow", reason: "Capability does not require approval.", reasonCode: "capability_exempt" };
  }

  if (executionMode === "manual" || approvalPolicy === "approval_required") {
    return {
      decision: "require_approval",
      reason: "Manual mode or approval policy requires review.",
      reasonCode: "manual_mode",
    };
  }

  if (executionMode === "semi_automatic" && capabilityApprovalRequirement === "before_publish") {
    return {
      decision: "require_approval",
      reason: "Semi-automatic mode requires approval before publish.",
      reasonCode: "external_requires_approval",
    };
  }

  if (executionMode === "fully_automatic" && approvalPolicy === "fully_automatic") {
    return { decision: "allow", reason: "Fully automatic execution permitted.", reasonCode: "full_autonomy_external" };
  }

  return { decision: "require_approval", reason: "Default policy requires approval.", reasonCode: "default_require_approval" };
}

export {
  evaluateCampaignBrainPolicy,
  resolveCampaignBrainPolicy,
  requiresPublicationApproval,
  requiresGuidedCognitiveCheckpoint,
  shouldPauseRunForPolicy,
  executionModeForCampaignMode,
} from "./campaign-approval-policy";

export type {
  BrainPolicyReasonCode,
  CampaignBrainPolicyContext,
  ResolvedCampaignBrainPolicy,
} from "./campaign-approval-policy";

export {
  resolveCapabilityActionClass,
  classifyActionProposal,
  hasExternalActionProposals,
} from "./action-class";

export type { BrainActionClass } from "./action-class";

export { emitBrainPolicyDecisionDiagnostic } from "./policy-diagnostics";

export type { BrainPolicyDecisionDiagnostic } from "./policy-diagnostics";
