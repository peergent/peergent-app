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
};

/**
 * Policy gate — separates thinking from doing.
 * No execution in Sprint 1; returns whether an action proposal may proceed.
 */
export function evaluateBrainPolicy(input: BrainApprovalContext): BrainPolicyResult {
  const { executionMode, approvalPolicy, capabilityApprovalRequirement } = input;

  if (capabilityApprovalRequirement === "none") {
    return { decision: "allow", reason: "Capability does not require approval." };
  }

  if (executionMode === "manual" || approvalPolicy === "approval_required") {
    return { decision: "require_approval", reason: "Manual mode or approval policy requires review." };
  }

  if (executionMode === "semi_automatic" && capabilityApprovalRequirement === "before_publish") {
    return { decision: "require_approval", reason: "Semi-automatic mode requires approval before publish." };
  }

  if (executionMode === "fully_automatic" && approvalPolicy === "fully_automatic") {
    return { decision: "allow", reason: "Fully automatic execution permitted." };
  }

  return { decision: "require_approval", reason: "Default policy requires approval." };
}
